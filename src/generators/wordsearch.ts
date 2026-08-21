// Pure word-search generator. No DOM. Ported from the prototype's
// buildWordSearch.

import type { Word } from '../types';
import { cleanWord } from './random';

export interface WordSearchCell {
  ch: string;
  inWord: boolean;
}

export interface WordSearch {
  size: number;
  cells: WordSearchCell[];
  bank: string[];
  unplaced: string[];
}

export function buildWordSearch(
  words: Word[],
  size: number,
  diagonals: boolean,
  backwards: boolean,
): WordSearch {
  // Dedupe, drop 1-letter words, sort longest-first (better packing).
  const uniq: string[] = [];
  words.forEach((w) => {
    const t = cleanWord(w.text);
    if (t.length > 1 && uniq.indexOf(t) === -1) uniq.push(t);
  });
  uniq.sort((a, b) => b.length - a.length);

  let dirs: [number, number][] = [
    [1, 0],
    [0, 1],
  ];
  if (diagonals) dirs = dirs.concat([[1, 1], [1, -1]]);
  if (backwards) dirs = dirs.concat(dirs.map((d) => [-d[0], -d[1]] as [number, number]));

  const grid: (string | null)[][] = [];
  for (let r = 0; r < size; r++) grid.push(new Array(size).fill(null));

  const placed: { word: string; cellIdx: number[] }[] = [];
  const unplaced: string[] = [];

  uniq.forEach((word) => {
    if (word.length > size) {
      unplaced.push(word);
      return;
    }
    let done = false;
    for (let a = 0; a < 500 && !done; a++) {
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      const er = r + d[1] * (word.length - 1);
      const ec = c + d[0] * (word.length - 1);
      if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
      // Valid if every overlapping cell is empty or already the same letter.
      let ok = true;
      for (let i = 0; i < word.length && ok; i++) {
        const cur = grid[r + d[1] * i][c + d[0] * i];
        if (cur && cur !== word[i]) ok = false;
      }
      if (!ok) continue;
      const cellIdx: number[] = [];
      for (let i = 0; i < word.length; i++) {
        const rr = r + d[1] * i;
        const cc = c + d[0] * i;
        grid[rr][cc] = word[i];
        cellIdx.push(rr * size + cc);
      }
      placed.push({ word, cellIdx });
      done = true;
    }
    if (!done) unplaced.push(word);
  });

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const inWord: Record<number, boolean> = {};
  placed.forEach((p) => p.cellIdx.forEach((i) => (inWord[i] = true)));

  const cells: WordSearchCell[] = [];
  for (let i = 0; i < size * size; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    cells.push({
      ch: grid[r][c] || alphabet[Math.floor(Math.random() * 26)],
      inWord: !!inWord[i],
    });
  }

  return { size, cells, bank: placed.map((p) => p.word).sort(), unplaced };
}
