// Pure "Guess the Word" logic (CX8 — a friendly, no-gallows hangman for the
// projector). No DOM, no side effects beyond Math.random (via shuffle), so it
// stays unit-testable. The class guesses letters for one hidden word at a time;
// blanks fill on a hit, a miss adds to a small counter, and the round ends when
// the word is solved or the misses run out.
//
// This is the pure logic slice. The store slice + projector component wire it
// up in later runs; kept off-live until the whole activity is finished.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

/** Misses the teacher can choose between; 6 matches classic hangman. */
export const GUESS_MISS_OPTIONS = [4, 6, 8, 10] as const;
export const GUESS_DEFAULT_MISSES = 6;

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export interface GuessCard {
  id: string;
  /** The word as the teacher typed it (trimmed, inner spaces collapsed). */
  text: string;
  /** Uppercase A–Z letters that must be found (deduped, in first-seen order). */
  letters: string[];
  slotId: string;
  tier: Tier;
  clue: string;
}

export interface GuessTile {
  /** The character as typed (keeps case for the reveal). */
  ch: string;
  /** False for spaces, hyphens, apostrophes… — those show from the start. */
  isLetter: boolean;
  /** Whether the class can see this character right now. */
  shown: boolean;
}

export interface GuessProgress {
  tiles: GuessTile[];
  hits: string[];
  misses: string[];
  solved: boolean;
  /** Out of misses before solving. */
  lost: boolean;
  /** Round over either way — the keyboard locks and the word is revealed. */
  over: boolean;
}

const tidy = (t: string | undefined) => (t || '').trim().replace(/\s+/g, ' ');
const isAZ = (ch: string) => /^[A-Z]$/i.test(ch);

/**
 * One card per usable word, in list order (or shuffled). Skips blanks, words
 * with no A–Z letter, and case-insensitive duplicates.
 */
export function buildGuessCards(words: Word[], opts: { shuffleOrder?: boolean } = {}): GuessCard[] {
  const seen = new Set<string>();
  const cards: GuessCard[] = [];
  for (const w of words) {
    const text = tidy(w.text);
    const k = text.toLowerCase();
    const letters = [...new Set(text.toUpperCase().split('').filter(isAZ))];
    if (!letters.length || seen.has(k)) continue;
    seen.add(k);
    cards.push({ id: w.id, text, letters, slotId: `slot-${w.id}`, tier: w.tier, clue: tidy(w.clue) });
  }
  return opts.shuffleOrder ? shuffle(cards) : cards;
}

/** Clamp a teacher-chosen miss limit to the offered range (bad input → default). */
export function clampMisses(n: number): number {
  if (!Number.isFinite(n)) return GUESS_DEFAULT_MISSES;
  return Math.min(10, Math.max(4, Math.round(n)));
}

/**
 * Where a round stands, given the letters guessed so far (any case, any order;
 * repeats and non-letters are ignored). Guesses after the round ended are
 * ignored too, so a stray key press can't flip a loss into a win.
 */
export function guessProgress(card: GuessCard, guessed: string[], maxMisses: number): GuessProgress {
  const limit = clampMisses(maxMisses);
  const target = new Set(card.letters);
  const hits: string[] = [];
  const misses: string[] = [];
  const done = () => card.letters.every((l) => hits.includes(l)) || misses.length >= limit;
  for (const raw of guessed) {
    const g = raw.toUpperCase();
    if (!isAZ(g) || hits.includes(g) || misses.includes(g)) continue;
    if (done()) break;
    (target.has(g) ? hits : misses).push(g);
  }
  const solved = card.letters.every((l) => hits.includes(l));
  const lost = !solved && misses.length >= limit;
  const over = solved || lost;
  const tiles = card.text.split('').map((ch) => {
    const letter = isAZ(ch);
    return { ch, isLetter: letter, shown: !letter || over || hits.includes(ch.toUpperCase()) };
  });
  return { tiles, hits, misses, solved, lost, over };
}

/** Keyboard key state for the on-screen A–Z: untried, hit, or miss. */
export function keyState(progress: GuessProgress, letter: string): 'idle' | 'hit' | 'miss' {
  const l = letter.toUpperCase();
  if (progress.hits.includes(l)) return 'hit';
  if (progress.misses.includes(l)) return 'miss';
  return 'idle';
}
