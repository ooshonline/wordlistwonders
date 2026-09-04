// Pure matching / memory-game generator. No DOM, no side effects (aside from
// Math.random via shuffle) so it stays unit-testable like the other generators.
//
// Each chosen word contributes TWO cards that form one pair: a WORD face and a
// MATCH face (the word's image, or its clue). The deck is shuffled so the two
// halves land apart on the board. The projector component flips two cards and
// checks whether their `pairId` matches.

import type { Word } from '../types';
import { shuffle } from './random';

export type MatchMode = 'image' | 'clue';

export interface MatchCard {
  /** Word id shared by the two cards of a pair (the match key). */
  pairId: string;
  /** Which half of the pair this card shows. */
  face: 'word' | 'match';
  /** Text to render — the word text, or the clue for a clue match ('' for image). */
  text: string;
  /** Owning word id; the image face reads the `slot-<wordId>` image slot. */
  wordId: string;
}

export interface MatchDeck {
  /** How many pairs actually made it onto the board. */
  pairs: number;
  cols: number;
  rows: number;
  cards: MatchCard[];
}

export const MATCH_MIN_PAIRS = 2;
/** 10 pairs = 20 cards — a full board that still reads on a projector. */
export const MATCH_MAX_PAIRS = 10;

/** Columns/rows for a card count: as square as possible, biased slightly wider,
 *  never fewer than 2 or more than 6 columns so cards stay large on screen. */
export function matchGridDims(total: number): { cols: number; rows: number } {
  if (total <= 0) return { cols: 0, rows: 0 };
  const cols = Math.min(6, Math.max(2, Math.round(Math.sqrt(total))));
  const rows = Math.ceil(total / cols);
  return { cols, rows };
}

/** Words eligible to form a pair in the given mode. Clue mode needs a non-empty
 *  clue; image mode just needs a word (the image slot may be filled later). */
export function matchEligible(words: Word[], mode: MatchMode): Word[] {
  if (mode === 'clue') return words.filter((w) => (w.clue || '').trim().length > 0);
  return words.filter((w) => (w.text || '').trim().length > 0);
}

/** Build a shuffled memory deck from up to `maxPairs` eligible words. Returns an
 *  empty deck (cols/rows 0) when no words qualify, so callers can show guidance. */
export function buildMatchDeck(
  words: Word[],
  mode: MatchMode,
  maxPairs: number = MATCH_MAX_PAIRS,
): MatchDeck {
  const cap = Math.max(1, Math.min(MATCH_MAX_PAIRS, maxPairs));
  const chosen = shuffle(matchEligible(words, mode)).slice(0, cap);

  const cards: MatchCard[] = [];
  for (const w of chosen) {
    cards.push({ pairId: w.id, face: 'word', text: w.text, wordId: w.id });
    cards.push({
      pairId: w.id,
      face: 'match',
      text: mode === 'clue' ? (w.clue || '').trim() : '',
      wordId: w.id,
    });
  }

  const deck = shuffle(cards);
  const { cols, rows } = matchGridDims(deck.length);
  return { pairs: chosen.length, cols, rows, cards: deck };
}
