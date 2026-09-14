// Pure sentence-builder generator. No DOM, no side effects beyond Math.random
// (via shuffle), so it stays unit-testable. Turns a word list into a set of
// spoken/written sentence-building prompts for the projector: one word at a
// time, a prompt telling the class what to do with it, and optional scaffolds
// (the word's clue as a meaning hint, its translation gloss, and its picture).
//
// This is the pure logic slice of the Sentence Builder projector activity
// (CX2); the React component + toolbar/router wiring land in a later slice.
// Kept off-live until then.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

export type SentenceMode = 'mixed' | 'simple';

/** Placeholder replaced by the target word inside every prompt template. */
const WORD_TOKEN = '{word}';

/** The plain prompt used in `simple` mode (and as the mixed pool's opener). */
export const SENTENCE_BASE_PROMPT = 'Use "{word}" in a sentence.';

/**
 * Varied classroom sentence-building prompts used in `mixed` mode, cycled in
 * order so a class gets different tasks as they step through the set. Every
 * template must contain the {word} token (asserted in the unit tests).
 */
export const SENTENCE_PROMPTS: string[] = [
  SENTENCE_BASE_PROMPT,
  'Ask a question using "{word}".',
  'Make a sentence with "{word}" and the word "because".',
  'Describe something using "{word}".',
  'Use "{word}" to tell the class about your day.',
  'Make a sentence with "{word}" that has more than six words.',
];

export interface SentenceCard {
  /** 1-based position as shown on the projector. */
  index: number;
  /** The target vocabulary word. */
  word: string;
  /** The prompt for the class, with the word already substituted in. */
  prompt: string;
  /** Meaning scaffold: the word's clue, if it has one. */
  hint?: string;
  /** Translation scaffold: the word's gloss, if it has one. */
  gloss?: string;
  /** Image-slot key (`slot-<id>`) for an optional picture cue. */
  slotId: string;
  tier: Tier;
}

export interface SentenceBuilderData {
  /** Cards in presentation order (index 1..total). */
  cards: SentenceCard[];
  total: number;
  mode: SentenceMode;
}

export interface SentenceOptions {
  /** `mixed` (default) cycles the varied prompt pool; `simple` uses one prompt. */
  mode?: SentenceMode;
  /** Randomize word order (default false — keep the teacher's list order). */
  shuffleOrder?: boolean;
}

/** A word can carry a sentence card only if it has a real (non-blank) word. */
export function sentenceEligible(words: Word[]): Word[] {
  return words.filter((w) => (w.text || '').trim().length > 0);
}

/** Substitute the word into every {word} slot of a prompt template. */
export function fillPrompt(template: string, word: string): string {
  return template.split(WORD_TOKEN).join(word);
}

/**
 * Build the sentence-building card set. Blank-text words are skipped; the rest
 * are numbered 1..N in list order (or shuffled). In `mixed` mode each card
 * draws the next prompt from SENTENCE_PROMPTS (wrapping around); in `simple`
 * mode every card uses SENTENCE_BASE_PROMPT. Empty/degenerate lists yield an
 * empty set (total 0) rather than throwing.
 */
export function buildSentenceSet(words: Word[], options: SentenceOptions = {}): SentenceBuilderData {
  const mode: SentenceMode = options.mode === 'simple' ? 'simple' : 'mixed';

  const eligible = sentenceEligible(words);
  const ordered = options.shuffleOrder ? shuffle(eligible) : eligible;

  const cards: SentenceCard[] = ordered.map((w, i) => {
    const text = w.text.trim();
    const template = mode === 'simple' ? SENTENCE_BASE_PROMPT : SENTENCE_PROMPTS[i % SENTENCE_PROMPTS.length];
    const hint = (w.clue || '').trim();
    const gloss = (w.gloss || '').trim();
    return {
      index: i + 1,
      word: text,
      prompt: fillPrompt(template, text),
      hint: hint || undefined,
      gloss: gloss || undefined,
      slotId: 'slot-' + w.id,
      tier: w.tier,
    };
  });

  return { cards, total: cards.length, mode };
}
