import { describe, it, expect } from 'vitest';
import {
  buildMatchDeck,
  matchEligible,
  matchGridDims,
  MATCH_MAX_PAIRS,
} from './matching';
import type { Word } from '../types';

const words = (n: number, withClue = true): Word[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `w${i}`,
    text: `word${i}`,
    tier: 'normal' as const,
    clue: withClue ? `clue for ${i}` : '',
  }));

describe('matchGridDims', () => {
  it('is empty for no cards', () => {
    expect(matchGridDims(0)).toEqual({ cols: 0, rows: 0 });
  });
  it('keeps a square-ish grid within 2..6 columns that covers every card', () => {
    for (const total of [2, 4, 6, 8, 12, 16, 20]) {
      const { cols, rows } = matchGridDims(total);
      expect(cols).toBeGreaterThanOrEqual(2);
      expect(cols).toBeLessThanOrEqual(6);
      expect(cols * rows).toBeGreaterThanOrEqual(total);
    }
  });
});

describe('matchEligible', () => {
  it('clue mode drops words without a clue', () => {
    const list = [...words(3, true), ...words(2, false).map((w) => ({ ...w, id: 'x' + w.id }))];
    expect(matchEligible(list, 'clue')).toHaveLength(3);
    expect(matchEligible(list, 'image')).toHaveLength(5);
  });
});

describe('buildMatchDeck', () => {
  it('emits two cards per chosen word — one word face, one match face', () => {
    const deck = buildMatchDeck(words(6), 'image');
    expect(deck.pairs).toBe(6);
    expect(deck.cards).toHaveLength(12);
    expect(deck.cards.filter((c) => c.face === 'word')).toHaveLength(6);
    expect(deck.cards.filter((c) => c.face === 'match')).toHaveLength(6);
  });

  it('every pairId appears exactly twice (a solvable board)', () => {
    const deck = buildMatchDeck(words(8), 'clue');
    const counts = new Map<string, number>();
    deck.cards.forEach((c) => counts.set(c.pairId, (counts.get(c.pairId) || 0) + 1));
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
  });

  it('caps the board at MATCH_MAX_PAIRS', () => {
    const deck = buildMatchDeck(words(30), 'image');
    expect(deck.pairs).toBe(MATCH_MAX_PAIRS);
    expect(deck.cards).toHaveLength(MATCH_MAX_PAIRS * 2);
  });

  it('honors a smaller maxPairs request', () => {
    const deck = buildMatchDeck(words(30), 'image', 4);
    expect(deck.pairs).toBe(4);
    expect(deck.cards).toHaveLength(8);
  });

  it('clue match cards carry the clue text; image match cards carry none', () => {
    const clueDeck = buildMatchDeck(words(3), 'clue');
    clueDeck.cards
      .filter((c) => c.face === 'match')
      .forEach((c) => expect(c.text.length).toBeGreaterThan(0));
    const imageDeck = buildMatchDeck(words(3), 'image');
    imageDeck.cards
      .filter((c) => c.face === 'match')
      .forEach((c) => expect(c.text).toBe(''));
  });

  it('degrades gracefully with no eligible words', () => {
    const deck = buildMatchDeck(words(3, false), 'clue');
    expect(deck.pairs).toBe(0);
    expect(deck.cards).toHaveLength(0);
    expect(deck).toMatchObject({ cols: 0, rows: 0 });
  });
});
