// Pure "Word of the Day" generator. No DOM, no side effects beyond Math.random
// (via shuffle), so it stays unit-testable. Turns a word list into a calm,
// single-word focus sequence for the projector: one word at a time, big, with
// its picture, meaning (clue) and translation (gloss) shown together, and
// next/prev to step through the set.
//
// This is the pure logic slice of the Word of the Day projector activity (CX4);
// the React component + toolbar/router wiring land in a later slice. Kept
// off-live until then.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

export interface WordOfDayCard {
  /** 1-based position as shown on the projector. */
  index: number;
  /** The word in focus. */
  word: string;
  /** Meaning: the word's clue, if it has one. */
  clue?: string;
  /** Translation: the word's gloss, if it has one. */
  gloss?: string;
  /** Image-slot key (`slot-<id>`) for the big picture. */
  slotId: string;
  tier: Tier;
}

export interface WordOfDayData {
  /** Cards in presentation order (index 1..total). */
  cards: WordOfDayCard[];
  total: number;
}

export interface WordOfDayOptions {
  /** Randomize word order (default false — keep the teacher's list order). */
  shuffleOrder?: boolean;
}

/** A word can be featured only if it has a real (non-blank) word. */
export function wordOfDayEligible(words: Word[]): Word[] {
  return words.filter((w) => (w.text || '').trim().length > 0);
}

/**
 * Build the Word of the Day sequence. Blank-text words are skipped; the rest are
 * numbered 1..N in list order (or shuffled). Meaning (clue) and translation
 * (gloss) are optional and only included when present. Empty/degenerate lists
 * yield an empty set (total 0) rather than throwing.
 */
export function buildWordOfDay(words: Word[], options: WordOfDayOptions = {}): WordOfDayData {
  const eligible = wordOfDayEligible(words);
  const ordered = options.shuffleOrder ? shuffle(eligible) : eligible;

  const cards: WordOfDayCard[] = ordered.map((w, i) => {
    const clue = (w.clue || '').trim();
    const gloss = (w.gloss || '').trim();
    return {
      index: i + 1,
      word: w.text.trim(),
      clue: clue || undefined,
      gloss: gloss || undefined,
      slotId: 'slot-' + w.id,
      tier: w.tier,
    };
  });

  return { cards, total: cards.length };
}
