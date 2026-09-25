// Pure word-scramble generator. No DOM, no side effects beyond Math.random
// (via shuffle), so it stays unit-testable. Turns a word list into a numbered
// "unscramble the word" worksheet: each word's letters are jumbled
// (apple → lpape), with an optional first-letter hint and a word bank; the same
// list unscrambled makes the answer key.
//
// This is the pure logic slice of the Word Scramble print worksheet (CX7); the
// sheet page view-models + renderer wire it into the print pipeline in a later
// slice. Kept off-live until then.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

/** Upper bound on numbered items per printed page (keeps a page legible). */
export const SCRAMBLE_MAX_PER_PAGE = 20;
/** Default items per page when the caller doesn't specify. */
export const SCRAMBLE_DEFAULT_PER_PAGE = 10;
/** Random shuffles tried before falling back to a guaranteed rotation. */
const SCRAMBLE_TRIES = 12;

export interface ScrambleItem {
  /** 1-based question number as printed on the sheet. */
  num: number;
  /** The jumbled letters shown to the student (lowercase). */
  scrambled: string;
  /** The real word — hidden on the sheet, shown on the answer key. */
  answer: string;
  /** First letter of the answer, for the optional hint. */
  firstLetter: string;
  /** Image-slot key (`slot-<id>`) for an optional picture cue. */
  slotId: string;
  tier: Tier;
}

export interface WordScrambleData {
  /** Numbered items in presentation order (1..total). */
  items: ScrambleItem[];
  total: number;
  /** The answers, alphabetized, for the optional word bank. */
  wordBank: string[];
  /** Numbered items per page, clamped to [1, SCRAMBLE_MAX_PER_PAGE]. */
  perPage: number;
}

export interface ScrambleOptions {
  /** Items per page (clamped). Defaults to SCRAMBLE_DEFAULT_PER_PAGE. */
  perPage?: number;
  /** Randomize question order (default false — keep the teacher's list order). */
  shuffleOrder?: boolean;
}

const isLetter = (ch: string) => /\p{L}/u.test(ch);

/** A chunk can be scrambled only if it has at least two *different* letters. */
function canScrambleChunk(chunk: string): boolean {
  return new Set([...chunk].filter(isLetter).map((c) => c.toLowerCase())).size >= 2;
}

/**
 * A word is scrambleable when at least one of its space-separated parts has two
 * or more different letters — so "a", "I" and "zzz" are skipped (their
 * "scramble" would just be the word), but "ice cream" is fine.
 */
export function scrambleEligible(words: Word[]): Word[] {
  return words.filter((w) => (w.text || '').trim().split(/\s+/).some(canScrambleChunk));
}

/**
 * Jumble the letters of one chunk (no spaces). Non-letters (hyphens,
 * apostrophes) stay in place; only the letters move. Guaranteed to differ from
 * the original (case-insensitive) whenever the chunk has two different letters:
 * a few random tries, then a one-step rotation, which always differs for a
 * non-constant sequence.
 */
function scrambleChunk(chunk: string): string {
  const lower = chunk.toLowerCase();
  if (!canScrambleChunk(lower)) return lower;
  const chars = [...lower];
  const slots = chars.map((c, i) => (isLetter(c) ? i : -1)).filter((i) => i >= 0);
  const letters = slots.map((i) => chars[i]);
  const place = (order: string[]) => {
    const out = chars.slice();
    slots.forEach((slot, k) => (out[slot] = order[k]));
    return out.join('');
  };
  for (let t = 0; t < SCRAMBLE_TRIES; t++) {
    const candidate = place(shuffle(letters));
    if (candidate !== lower) return candidate;
  }
  return place([...letters.slice(1), letters[0]]);
}

/**
 * Scramble a whole word or phrase. Each space-separated part is jumbled on its
 * own (so "ice cream" → "cie amerc", not one long letter soup), and runs of
 * whitespace collapse to single spaces.
 */
export function scrambleWord(text: string): string {
  return text.trim().split(/\s+/).map(scrambleChunk).join(' ');
}

function clampPerPage(n: number | undefined): number {
  if (!n || !Number.isFinite(n) || n < 1) return SCRAMBLE_DEFAULT_PER_PAGE;
  return Math.min(SCRAMBLE_MAX_PER_PAGE, Math.floor(n));
}

/**
 * Build the numbered word-scramble sheet. Words that can't be scrambled (blank,
 * one letter, or all the same letter) are skipped; the rest are numbered 1..N
 * in list order (or shuffled). Empty/degenerate lists yield an empty sheet
 * (total 0) rather than throwing.
 */
export function buildWordScramble(words: Word[], options: ScrambleOptions = {}): WordScrambleData {
  const perPage = clampPerPage(options.perPage);
  const eligible = scrambleEligible(words);
  const ordered = options.shuffleOrder ? shuffle(eligible) : eligible;

  const items: ScrambleItem[] = ordered.map((w, i) => {
    const answer = w.text.trim().replace(/\s+/g, ' ');
    return {
      num: i + 1,
      scrambled: scrambleWord(answer),
      answer,
      firstLetter: [...answer][0] ?? '',
      slotId: 'slot-' + w.id,
      tier: w.tier,
    };
  });

  const wordBank = items
    .map((it) => it.answer)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  return { items, total: items.length, wordBank, perPage };
}

/** Split the numbered items into pages of `data.perPage`, in order. */
export function scramblePages(data: WordScrambleData): ScrambleItem[][] {
  const pages: ScrambleItem[][] = [];
  for (let i = 0; i < data.items.length; i += data.perPage) {
    pages.push(data.items.slice(i, i + data.perPage));
  }
  return pages;
}
