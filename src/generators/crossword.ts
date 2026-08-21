// Pure crossword generator. No DOM. Ported from the prototype's
// buildCrossword. The two random tiebreaks (longest-first sort tiebreak and
// the equal-crossing-score coin flip) are what make Shuffle meaningful.

import type { Word } from '../types';
import { cleanWord } from './random';

export interface CrosswordCell {
  letter: string | null;
  num: number | null;
}

export interface CrosswordClue {
  num: number;
  clue: string;
  word: string;
}

export interface Crossword {
  rows: number;
  cols: number;
  cells: CrosswordCell[];
  across: CrosswordClue[];
  down: CrosswordClue[];
  unplaced: string[];
}

interface Placed {
  word: string;
  clue: string;
  r: number;
  c: number;
  horiz: boolean;
  num?: number;
}

export function buildCrossword(words: Word[]): Crossword {
  const entries: { word: string; clue: string }[] = [];
  const seen: Record<string, boolean> = {};
  words.forEach((w) => {
    const t = cleanWord(w.text);
    if (t.length > 1 && !seen[t]) {
      seen[t] = true;
      entries.push({ word: t, clue: (w.clue || '').trim() });
    }
  });
  // Longest-first, random tiebreak among equal lengths.
  entries.sort((a, b) => b.word.length - a.word.length || Math.random() - 0.5);

  const map: Record<string, string> = {};
  const placed: Placed[] = [];
  const unplaced: string[] = [];
  const key = (r: number, c: number) => r + ',' + c;

  const canPlace = (word: string, r: number, c: number, horiz: boolean): number => {
    // Reject a placement that would abut another word head-to-tail.
    if (map[horiz ? key(r, c - 1) : key(r - 1, c)]) return -1;
    if (map[horiz ? key(r, c + word.length) : key(r + word.length, c)]) return -1;
    let touches = 0;
    for (let i = 0; i < word.length; i++) {
      const rr = horiz ? r : r + i;
      const cc = horiz ? c + i : c;
      const cur = map[key(rr, cc)];
      if (cur) {
        if (cur !== word[i]) return -1;
        touches++;
      } else if (
        horiz
          ? map[key(rr - 1, cc)] || map[key(rr + 1, cc)]
          : map[key(rr, cc - 1)] || map[key(rr, cc + 1)]
      ) {
        // A non-crossing cell adjacent to an existing letter -> reject.
        return -1;
      }
    }
    return touches;
  };

  const put = (e: { word: string; clue: string }, r: number, c: number, horiz: boolean) => {
    for (let i = 0; i < e.word.length; i++) {
      map[key(horiz ? r : r + i, horiz ? c + i : c)] = e.word[i];
    }
    placed.push({ word: e.word, clue: e.clue, r, c, horiz });
  };

  entries.forEach((e, idx) => {
    if (!idx) {
      put(e, 0, 0, true);
      return;
    }
    let best: { r: number; c: number; horiz: boolean; t: number } | null = null;
    placed.forEach((p) => {
      for (let i = 0; i < p.word.length; i++) {
        for (let j = 0; j < e.word.length; j++) {
          if (p.word[i] !== e.word[j]) continue;
          const horiz = !p.horiz;
          const r = p.horiz ? p.r - j : p.r + i;
          const c = p.horiz ? p.c + i : p.c - j;
          const t = canPlace(e.word, r, c, horiz);
          // Most crossings wins; coin-flip tiebreak between equal scores.
          if (t > 0 && (!best || t > best.t || (t === best.t && Math.random() < 0.5))) {
            best = { r, c, horiz, t };
          }
        }
      }
    });
    // `best` is assigned inside the nested forEach above, which TS control-flow
    // doesn't track — cast back to the known shape at the use site.
    const chosen = best as { r: number; c: number; horiz: boolean; t: number } | null;
    if (chosen) put(e, chosen.r, chosen.c, chosen.horiz);
    else unplaced.push(e.word);
  });

  if (!placed.length) {
    return { rows: 0, cols: 0, cells: [], across: [], down: [], unplaced };
  }

  // Crop to the bounding box.
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;
  Object.keys(map).forEach((k) => {
    const parts = k.split(',');
    const r = +parts[0];
    const c = +parts[1];
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minC = Math.min(minC, c);
    maxC = Math.max(maxC, c);
  });
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  const norm = placed
    .map((p) => ({ ...p, r: p.r - minR, c: p.c - minC }))
    .sort((a, b) => a.r - b.r || a.c - b.c);

  // Number cells in reading order; a shared across/down origin gets one number.
  let num = 0;
  const numAt: Record<string, number> = {};
  norm.forEach((p) => {
    const k = p.r + ',' + p.c;
    if (!numAt[k]) numAt[k] = ++num;
    p.num = numAt[k];
  });

  const cells: CrosswordCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        letter: map[key(r + minR, c + minC)] || null,
        num: numAt[r + ',' + c] || null,
      });
    }
  }

  const clueText = (p: Placed) => p.clue || p.word.length + ' letters';
  return {
    rows,
    cols,
    cells,
    unplaced,
    across: norm
      .filter((p) => p.horiz)
      .sort((a, b) => (a.num as number) - (b.num as number))
      .map((p) => ({ num: p.num as number, clue: clueText(p), word: p.word })),
    down: norm
      .filter((p) => !p.horiz)
      .sort((a, b) => (a.num as number) - (b.num as number))
      .map((p) => ({ num: p.num as number, clue: clueText(p), word: p.word })),
  };
}
