// Pure "missing letters" generator (CX18). No DOM, no side effects beyond
// Math.random (via shuffle), so it stays unit-testable. Each word is printed
// as a row of letter boxes with 1–3 boxes left empty (apple → a p _ l _);
// the student fills the gaps. The same items with every box filled make the
// answer key.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

/** How many letters to hide per word (the sheet offers 1, 2 or 3). */
export const LETTERS_MIN_BLANKS = 1;
export const LETTERS_MAX_BLANKS = 3;
export const LETTERS_DEFAULT_BLANKS = 2;
/** Upper bound on numbered items per printed page. */
export const LETTERS_MAX_PER_PAGE = 12;
export const LETTERS_DEFAULT_PER_PAGE = 10;

/** Which letters may be hidden: any letter, or vowels only (a e i o u). */
export type LettersMode = 'any' | 'vowels';

export interface LetterCell {
  /** The character (lowercase letters; spaces / hyphens kept as typed). */
  ch: string;
  /** True for a letter box the student fills in. */
  hidden: boolean;
  /** False for spaces, hyphens, apostrophes: printed as-is, no box. */
  isLetter: boolean;
}

export interface LettersItem {
  /** 1-based question number as printed on the sheet. */
  num: number;
  cells: LetterCell[];
  /** The full word — for the word bank and the answer key. */
  answer: string;
  /** Image-slot key (`slot-<id>`) for an optional picture cue. */
  slotId: string;
  tier: Tier;
}

export interface MissingLettersData {
  items: LettersItem[];
  total: number;
  /** Numbered items per page, clamped to [1, LETTERS_MAX_PER_PAGE]. */
  perPage: number;
}

export interface LettersOptions {
  /** Letters to hide per word (clamped 1–3). */
  blanks?: number;
  mode?: LettersMode;
  /** Items per page (clamped). */
  perPage?: number;
  /** Randomize question order (default false — keep the teacher's list order). */
  shuffleOrder?: boolean;
}

const isLetter = (ch: string) => /\p{L}/u.test(ch);
const isVowel = (ch: string) => /[aeiou]/i.test(ch);
const norm = (text: string) => (text || '').trim().replace(/\s+/g, ' ');

/** A word needs at least two letters, so one can stay visible as a cue. */
export function lettersEligible(words: Word[]): Word[] {
  return words.filter((w) => [...norm(w.text)].filter(isLetter).length >= 2);
}

export function clampBlanks(n: number | undefined): number {
  if (n === undefined || !Number.isFinite(n)) return LETTERS_DEFAULT_BLANKS;
  return Math.max(LETTERS_MIN_BLANKS, Math.min(LETTERS_MAX_BLANKS, Math.floor(n)));
}

function clampPerPage(n: number | undefined): number {
  if (!n || !Number.isFinite(n) || n < 1) return LETTERS_DEFAULT_PER_PAGE;
  return Math.min(LETTERS_MAX_PER_PAGE, Math.floor(n));
}

/**
 * Pick which letter positions to hide in one word.
 * - Never hides every letter: at least one letter always stays visible.
 * - Keeps the first letter visible whenever another letter can be hidden
 *   instead (the first sound is the strongest cue for young readers).
 * - Vowels mode hides only vowels; a word with no vowels ("myth", "gym")
 *   falls back to any letter so it still has a gap to fill.
 */
export function pickHidden(text: string, blanks: number, mode: LettersMode): Set<number> {
  const chars = [...norm(text).toLowerCase()];
  const letterIdx = chars.map((c, i) => (isLetter(c) ? i : -1)).filter((i) => i >= 0);
  const cap = Math.min(clampBlanks(blanks), letterIdx.length - 1);
  if (cap < 1) return new Set();

  let pool = mode === 'vowels' ? letterIdx.filter((i) => isVowel(chars[i])) : letterIdx;
  if (pool.length === 0) pool = letterIdx;
  // Prefer non-first letters; only dip into the first letter if we must.
  const first = letterIdx[0];
  const rest = shuffle(pool.filter((i) => i !== first));
  const ordered = pool.includes(first) ? [...rest, first] : rest;
  // Leave at least one letter visible across the whole word.
  return new Set(ordered.slice(0, cap));
}

/**
 * Build the numbered missing-letters sheet. Words with fewer than two letters
 * are skipped; the rest are numbered 1..N in list order (or shuffled). An empty
 * list yields an empty sheet (total 0) rather than throwing.
 */
export function buildMissingLetters(words: Word[], options: LettersOptions = {}): MissingLettersData {
  const perPage = clampPerPage(options.perPage);
  const blanks = clampBlanks(options.blanks);
  const mode = options.mode ?? 'any';
  const eligible = lettersEligible(words);
  const ordered = options.shuffleOrder ? shuffle(eligible) : eligible;

  const items: LettersItem[] = ordered.map((w, i) => {
    const answer = norm(w.text);
    const hidden = pickHidden(answer, blanks, mode);
    const cells = [...answer.toLowerCase()].map((ch, k) => ({ ch, hidden: hidden.has(k), isLetter: isLetter(ch) }));
    return { num: i + 1, cells, answer, slotId: 'slot-' + w.id, tier: w.tier };
  });

  return { items, total: items.length, perPage };
}

/** Split the numbered items into pages of `data.perPage`, in order. */
export function lettersPages(data: MissingLettersData): LettersItem[][] {
  const pages: LettersItem[][] = [];
  for (let i = 0; i < data.items.length; i += data.perPage) pages.push(data.items.slice(i, i + data.perPage));
  return pages;
}

/** Printable width of a sheet body in CSS px (US Letter 816 − 2 × 52 margin). */
const BODY_W = 712;
/** Height the item grid may use: the page minus header, name line, instruction,
 *  word bank and credit line (measured on a wrapped two-line title). */
const BODY_H = 600;
const COL_GAP = 40;
const ROW_GAP = 14;
const NUM_W = 34; // "12." + its gap
const PIC_GAP = 10;
const BOX_GAP = 4;
const BOX_MAX = 40;
const BOX_MIN_TWO_COL = 32; // below this, one wide column is easier to write in
const PIC_MAX = 72;
/** Tallest row slot: rows spread out to fill the page, but not too far apart. */
const ROW_MAX = 84;

export interface LettersLayout {
  cols: 1 | 2;
  /** Largest letter box any row may use (set by the row height). */
  boxPx: number;
  /** Picture cue size (0 when pictures are off). */
  picPx: number;
  /** Height of each row slot (rows spread out to use the page). */
  rowPx: number;
}

/**
 * Size one page's grid so every row fits the sheet: two columns when the
 * longest word still gets comfortable boxes, otherwise one wide column. Box
 * and picture sizes shrink with the row height so a full page never spills
 * onto a second printed sheet.
 */
export function lettersLayout(maxCells: number, count: number, pictures: boolean): LettersLayout {
  const cells = Math.max(1, maxCells);
  const fit = (cols: 1 | 2): LettersLayout => {
    const rows = Math.max(1, Math.ceil(count / cols));
    const rowH = Math.floor(BODY_H / rows) - ROW_GAP;
    const picPx = pictures ? Math.max(0, Math.min(PIC_MAX, rowH)) : 0;
    const boxPx = Math.max(12, Math.min(BOX_MAX, rowH));
    return { cols, boxPx, picPx, rowPx: Math.max(boxPx, picPx, Math.min(ROW_MAX, rowH)) };
  };
  // Two columns only when even the longest word keeps comfortable boxes.
  const two = fit(2);
  return itemBoxPx(cells, two) >= BOX_MIN_TWO_COL ? two : fit(1);
}

/**
 * Box size for one row: as big as the page's row height allows, shrunk only
 * as far as THIS word needs to fit its column. So one long phrase gets smaller
 * boxes without shrinking every short word on the page.
 */
export function itemBoxPx(cells: number, layout: LettersLayout): number {
  const colW = layout.cols === 2 ? (BODY_W - COL_GAP) / 2 : BODY_W;
  const avail = colW - NUM_W - (layout.picPx ? layout.picPx + PIC_GAP : 0);
  const widthFit = Math.floor((avail + BOX_GAP) / Math.max(1, cells) - BOX_GAP);
  return Math.max(12, Math.min(layout.boxPx, widthFit));
}
