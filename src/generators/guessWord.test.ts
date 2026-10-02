import { describe, expect, it } from 'vitest';
import { buildGuessCards, clampMisses, guessProgress, keyState, GUESS_DEFAULT_MISSES } from './guessWord';
import type { Word } from '../types';

const mk = (texts: string[]): Word[] => texts.map((text, i) => ({ id: `w${i}`, text, tier: 'normal' as const }));

describe('buildGuessCards', () => {
  it('keeps list order and dedupes letters per word', () => {
    const cards = buildGuessCards(mk(['apple', 'Bread']));
    expect(cards.map((c) => c.text)).toEqual(['apple', 'Bread']);
    expect(cards[0].letters).toEqual(['A', 'P', 'L', 'E']);
    expect(cards[0].slotId).toBe('slot-w0');
  });

  it('skips blanks, letterless words, and case-insensitive duplicates', () => {
    const cards = buildGuessCards(mk(['  ', '123', 'Rice', 'rice', 'ice  cream']));
    expect(cards.map((c) => c.text)).toEqual(['Rice', 'ice cream']);
  });

  it('shuffle keeps the same cards', () => {
    const words = mk(['a', 'bb', 'cc', 'dd', 'ee']);
    const cards = buildGuessCards(words, { shuffleOrder: true });
    expect(cards.map((c) => c.text).sort()).toEqual(['a', 'bb', 'cc', 'dd', 'ee']);
  });
});

describe('clampMisses', () => {
  it('clamps to 4–10 and defaults bad input', () => {
    expect(clampMisses(2)).toBe(4);
    expect(clampMisses(99)).toBe(10);
    expect(clampMisses(NaN)).toBe(GUESS_DEFAULT_MISSES);
    expect(clampMisses(Infinity)).toBe(GUESS_DEFAULT_MISSES);
  });
});

describe('guessProgress', () => {
  const [card] = buildGuessCards(mk(['Ice-cream']));

  it('starts with letters hidden and punctuation shown', () => {
    const p = guessProgress(card, [], 6);
    expect(p.tiles.filter((t) => t.shown).map((t) => t.ch)).toEqual(['-']);
    expect(p.over).toBe(false);
  });

  it('reveals every copy of a hit, any case', () => {
    const p = guessProgress(card, ['c'], 6);
    expect(p.tiles.filter((t) => t.shown).map((t) => t.ch)).toEqual(['c', '-', 'c']);
    expect(p.hits).toEqual(['C']);
  });

  it('ignores repeats and non-letters', () => {
    const p = guessProgress(card, ['z', 'Z', '1', ' ', 'z'], 6);
    expect(p.misses).toEqual(['Z']);
  });

  it('solves when every letter is found and shows the whole word', () => {
    const p = guessProgress(card, ['i', 'c', 'e', 'r', 'a', 'm'], 6);
    expect(p.solved).toBe(true);
    expect(p.lost).toBe(false);
    expect(p.tiles.every((t) => t.shown)).toBe(true);
  });

  it('loses at the miss limit and reveals the word', () => {
    const p = guessProgress(card, ['b', 'd', 'f', 'g'], 4);
    expect(p.lost).toBe(true);
    expect(p.over).toBe(true);
    expect(p.tiles.every((t) => t.shown)).toBe(true);
  });

  it('ignores guesses after the round is over', () => {
    const p = guessProgress(card, ['b', 'd', 'f', 'g', 'i', 'c', 'e', 'r', 'a', 'm'], 4);
    expect(p.lost).toBe(true);
    expect(p.hits).toEqual([]);
  });

  it('reports key states for the on-screen keyboard', () => {
    const p = guessProgress(card, ['c', 'z'], 6);
    expect(keyState(p, 'c')).toBe('hit');
    expect(keyState(p, 'Z')).toBe('miss');
    expect(keyState(p, 'q')).toBe('idle');
  });
});
