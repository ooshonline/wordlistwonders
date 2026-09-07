// Pure spelling-test generator. No DOM, no side effects beyond Math.random
// (via shuffle), so it stays unit-testable. Turns a word list into a numbered
// spelling worksheet: each word becomes one numbered blank the student writes
// on, and the same list filled in makes the answer key. Two prompt modes —
// the teacher reads each word aloud, or the student spells from its picture.
//
// This is the pure logic slice of the Spelling Test print worksheet (CX3); the
// sheet page view-models + renderer wire it into the print pipeline in a later
// slice. Kept off-live until then.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

export type SpellingPrompt = 'readAloud' | 'image';

/** Upper bound on numbered lines per printed page (keeps a page legible). */
export const SPELLING_MAX_PER_PAGE = 30;
/** Default lines per page when the caller doesn't specify. */
export const SPELLING_DEFAULT_PER_PAGE = 10;

export interface SpellingItem {
  /** 1-based question number as printed on the sheet. */
  num: number;
  /** The word to spell — hidden on the test, shown on the answer key. */
  answer: string;
  /** Image-slot key (`slot-<id>`) for the picture-prompt mode. */
  slotId: string;
  tier: Tier;
}

export interface SpellingTestData {
  /** Numbered items in presentation order (1..total). */
  items: SpellingItem[];
  total: number;
  prompt: SpellingPrompt;
  /** Numbered lines per page, clamped to [1, SPELLING_MAX_PER_PAGE]. */
  perPage: number;
}

export interface SpellingOptions {
  /** How the word is presented: read aloud (default) or as its picture. */
  prompt?: SpellingPrompt;
  /** Lines per page (clamped). Defaults to SPELLING_DEFAULT_PER_PAGE. */
  perPage?: number;
  /** Randomize question order (default false — keep the teacher's list order). */
  shuffleOrder?: boolean;
}

/** A word can carry a spelling item only if it has a real (non-blank) answer. */
export function spellingEligible(words: Word[]): Word[] {
  return words.filter((w) => (w.text || '').trim().length > 0);
}

function clampPerPage(n: number | undefined): number {
  if (!n || !Number.isFinite(n) || n < 1) return SPELLING_DEFAULT_PER_PAGE;
  return Math.min(SPELLING_MAX_PER_PAGE, Math.floor(n));
}

/**
 * Build the numbered spelling test. Blank-text words are skipped; the rest are
 * numbered 1..N in list order (or shuffled). Empty/degenerate lists yield an
 * empty test (total 0) rather than throwing.
 */
export function buildSpellingTest(words: Word[], options: SpellingOptions = {}): SpellingTestData {
  const prompt: SpellingPrompt = options.prompt === 'image' ? 'image' : 'readAloud';
  const perPage = clampPerPage(options.perPage);

  const eligible = spellingEligible(words);
  const ordered = options.shuffleOrder ? shuffle(eligible) : eligible;

  const items: SpellingItem[] = ordered.map((w, i) => ({
    num: i + 1,
    answer: w.text.trim(),
    slotId: 'slot-' + w.id,
    tier: w.tier,
  }));

  return { items, total: items.length, prompt, perPage };
}

/** Split the numbered items into pages of `data.perPage`, in order. */
export function spellingPages(data: SpellingTestData): SpellingItem[][] {
  const pages: SpellingItem[][] = [];
  for (let i = 0; i < data.items.length; i += data.perPage) {
    pages.push(data.items.slice(i, i + data.perPage));
  }
  return pages;
}
