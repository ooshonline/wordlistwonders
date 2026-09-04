// Pure, DOM-free clue suggestions for the crossword (F6).
//
// A fresh teacher-built list often has no clues, so the crossword falls back to
// the bare "<n> letters" placeholder and shows a "N words have no clue yet"
// warning. This helper fills *blanks* with a local, offline hint the teacher can
// then edit — no server, no AI, no network call.
//
// Rules (mirror C2's constraints):
//  - Never overwrite a clue the teacher already wrote — only blanks get a
//    suggestion (callers check, and `suggestClue` returns null for a filled clue).
//  - A suggested clue must never contain its own answer word.
//  - American spelling, warm and simple.

import type { Word } from '../types';

/** True when the word has a real, non-blank clue already. */
export function hasClue(w: Word): boolean {
  return !!(w.clue && w.clue.trim());
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * A local hint for a word with no clue, or `null` when nothing sensible can be
 * derived (blank word) or a clue already exists. The teacher edits it afterward.
 *
 *  - With a translation gloss → `Translation: "<gloss>" · <n> letters`
 *    (unless the gloss would give the answer away).
 *  - Otherwise → a first/last-letter + length hint, e.g.
 *    `Starts with "B", ends with "D" · 5 letters` (short words drop the "ends with").
 */
export function suggestClue(w: Word): string | null {
  if (hasClue(w)) return null; // never overwrite a real clue
  const text = (w.text || '').trim();
  if (!text) return null; // nothing to describe

  const n = text.length;
  const letters = `${n} letter${n === 1 ? '' : 's'}`;
  const answer = norm(text);

  // Prefer the teacher's translation gloss when it won't reveal the answer.
  const gloss = (w.gloss || '').trim();
  if (gloss) {
    const g = norm(gloss);
    if (g !== answer && !g.includes(answer)) {
      return `Translation: "${gloss}" · ${letters}`;
    }
  }

  // Fall back to a spelling hint. Uppercased so it reads clearly on the sheet.
  const first = text[0].toUpperCase();
  const last = text[n - 1].toUpperCase();
  if (n >= 3 && last !== first) {
    return `Starts with "${first}", ends with "${last}" · ${letters}`;
  }
  return `Starts with "${first}" · ${letters}`;
}

/**
 * Fill every blank clue in `words` with a suggestion, leaving existing clues
 * untouched. Returns the new array plus how many were filled (0 → nothing to do).
 */
export function fillMissingClues(words: Word[]): { words: Word[]; filled: number } {
  let filled = 0;
  const next = words.map((w) => {
    if (hasClue(w)) return w;
    const clue = suggestClue(w);
    if (!clue) return w;
    filled += 1;
    return { ...w, clue };
  });
  return { words: filled ? next : words, filled };
}
