// Pure "ABC order" generator. No DOM, no side effects beyond Math.random (via
// shuffle), so it stays unit-testable. Splits a word list into small groups;
// each group is printed jumbled with numbered blank lines, and the student
// rewrites the words in alphabetical order. The same groups sorted make the
// answer key.
//
// This is the pure logic slice of the Alphabetical Order print worksheet (CX9);
// the sheet page view-models + renderer wire it into the print pipeline in a
// later slice. Kept off-live until then.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

/** Smallest / largest group the worksheet offers. Two words is too easy to be
 *  a task; ten lines is about as many as young writers manage in one block. */
export const ALPHA_MIN_GROUP = 3;
export const ALPHA_MAX_GROUP = 10;
export const ALPHA_DEFAULT_GROUP = 5;
/** Random shuffles tried before falling back to a guaranteed rotation. */
const ALPHA_TRIES = 12;

export interface AlphaItem {
  /** The word as the teacher typed it (trimmed, inner spaces collapsed). */
  text: string;
  /** Image-slot key (`slot-<id>`) for an optional picture cue. */
  slotId: string;
  tier: Tier;
}

export interface AlphaGroup {
  /** 1-based group number as printed on the sheet ("Set 1"). */
  num: number;
  /** The group's words in the jumbled order shown to the student. */
  jumbled: AlphaItem[];
  /** The same words in ABC order — the answer key. */
  sorted: AlphaItem[];
}

export interface AlphaOrderData {
  groups: AlphaGroup[];
  /** Words used across all groups (after blanks + duplicates are dropped). */
  total: number;
  /** Target words per group, clamped to [ALPHA_MIN_GROUP, ALPHA_MAX_GROUP]. */
  groupSize: number;
}

export interface AlphaOptions {
  /** Target words per group (clamped). Defaults to ALPHA_DEFAULT_GROUP. */
  groupSize?: number;
  /** Mix the whole list before grouping (default false — keep list order, so
   *  each group holds neighboring words from the teacher's list). */
  shuffleGroups?: boolean;
}

const norm = (text: string) => (text || '').trim().replace(/\s+/g, ' ');

/** Case- and accent-insensitive ABC comparison ("Apple" ≈ "apple"). */
export function alphaCompare(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base' });
}

/**
 * Words usable on the sheet: blanks dropped, and case-insensitive duplicates
 * collapsed to their first occurrence (two identical words have no "right"
 * order, which would confuse the answer key).
 */
export function alphaEligible(words: Word[]): Word[] {
  const seen = new Set<string>();
  return words.filter((w) => {
    const key = norm(w.text).toLocaleLowerCase('en');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clampGroup(n: number | undefined): number {
  if (!n || !Number.isFinite(n)) return ALPHA_DEFAULT_GROUP;
  return Math.max(ALPHA_MIN_GROUP, Math.min(ALPHA_MAX_GROUP, Math.floor(n)));
}

/**
 * Split `n` words into near-equal group sizes, none larger than `size`, so the
 * last group is never a lonely leftover (11 words at size 5 → 4/4/3, not
 * 5/5/1). A list shorter than the minimum still makes one small group.
 */
export function groupSizes(n: number, size: number): number[] {
  if (n <= 0) return [];
  const count = Math.ceil(n / size);
  const base = Math.floor(n / count);
  const extra = n % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

/** True when the items already read in ABC order (so it's no puzzle). */
function isSorted(items: AlphaItem[]): boolean {
  return items.every((it, i) => i === 0 || alphaCompare(items[i - 1].text, it.text) <= 0);
}

/**
 * Jumble a group so it is NOT already in ABC order (whenever that's possible —
 * i.e. at least two different words). A few random tries, then a one-step
 * rotation of the sorted list, which puts the last word first and so is never
 * sorted for distinct words.
 */
function jumble(sorted: AlphaItem[]): AlphaItem[] {
  if (sorted.length < 2) return sorted.slice();
  for (let t = 0; t < ALPHA_TRIES; t++) {
    const candidate = shuffle(sorted);
    if (!isSorted(candidate)) return candidate;
  }
  return [sorted[sorted.length - 1], ...sorted.slice(0, -1)];
}

/**
 * Build the ABC-order sheet: eligible words are split into near-equal groups
 * (list order, or mixed first), each group sorted for the key and jumbled for
 * the student. Empty lists yield no groups (total 0) rather than throwing.
 */
export function buildAlphaOrder(words: Word[], options: AlphaOptions = {}): AlphaOrderData {
  const groupSize = clampGroup(options.groupSize);
  const eligible = alphaEligible(words);
  const ordered = options.shuffleGroups ? shuffle(eligible) : eligible;
  const items: AlphaItem[] = ordered.map((w) => ({ text: norm(w.text), slotId: 'slot-' + w.id, tier: w.tier }));

  const groups: AlphaGroup[] = [];
  let at = 0;
  groupSizes(items.length, groupSize).forEach((len, i) => {
    // Array.prototype.sort is stable, so ties keep list order.
    const sorted = items.slice(at, at + len).sort((a, b) => alphaCompare(a.text, b.text));
    groups.push({ num: i + 1, jumbled: jumble(sorted), sorted });
    at += len;
  });

  return { groups, total: items.length, groupSize };
}
