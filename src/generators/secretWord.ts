// Pure "Secret Word" generator (CX10). No DOM, no side effects beyond
// Math.random (via shuffle), so it stays unit-testable. A charades-style
// projector game: one student secretly sees the word, then acts it out, draws
// it, or describes it (without saying it) while the class guesses.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

export type SecretMode = 'act' | 'draw' | 'describe';

export interface SecretModeInfo {
  id: SecretMode;
  label: string;
  emoji: string;
  /** One short instruction line shown on the projector. */
  instruction: string;
}

export const SECRET_MODES: SecretModeInfo[] = [
  { id: 'act', label: 'Act it', emoji: '🎭', instruction: 'Act out the word. No talking!' },
  { id: 'draw', label: 'Draw it', emoji: '✏️', instruction: 'Draw the word. No letters or numbers!' },
  { id: 'describe', label: 'Describe it', emoji: '💬', instruction: 'Describe the word, but don’t say it!' },
];

export function secretModeInfo(mode: SecretMode): SecretModeInfo {
  return SECRET_MODES.find((m) => m.id === mode) || SECRET_MODES[0];
}

export interface SecretCard {
  /** 1-based position as shown on the projector. */
  index: number;
  word: string;
  /** The word's clue, if it has one — a helper for "Describe it". */
  clue?: string;
  /** Image-slot key (`slot-<id>`) for the picture. */
  slotId: string;
  tier: Tier;
}

export interface SecretOptions {
  /** Randomize word order (default false — keep the teacher's list order). */
  shuffleOrder?: boolean;
}

/** Round timer choices in seconds; 0 means "no timer". */
export const SECRET_TIMER_CHOICES = [0, 30, 60, 90];
export const SECRET_DEFAULT_SECONDS = 60;

/** Snap any value to the nearest allowed timer choice (bad input → default). */
export function clampSecretSeconds(n: number): number {
  if (!Number.isFinite(n)) return SECRET_DEFAULT_SECONDS;
  let best = SECRET_TIMER_CHOICES[0];
  for (const c of SECRET_TIMER_CHOICES) if (Math.abs(c - n) < Math.abs(best - n)) best = c;
  return best;
}

/**
 * Build the Secret Word card sequence. Blank words and case-insensitive
 * duplicates are skipped (a repeat would be a give-away); the rest are numbered
 * 1..N in list order (or shuffled). Empty lists yield no cards.
 */
export function buildSecretCards(words: Word[], options: SecretOptions = {}): SecretCard[] {
  const seen = new Set<string>();
  const eligible = words.filter((w) => {
    const key = (w.text || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const ordered = options.shuffleOrder ? shuffle(eligible) : eligible;
  return ordered.map((w, i) => {
    const clue = (w.clue || '').trim();
    return { index: i + 1, word: w.text.trim(), clue: clue || undefined, slotId: 'slot-' + w.id, tier: w.tier };
  });
}
