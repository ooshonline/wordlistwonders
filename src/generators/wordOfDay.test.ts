import { describe, it, expect } from 'vitest';
import { buildWordOfDay, wordOfDayEligible } from './wordOfDay';
import type { Tier, Word } from '../types';

const w = (
  id: string,
  text: string,
  tier: Tier = 'normal',
  extra: Partial<Word> = {},
): Word => ({ id, text, tier, ...extra });

const list: Word[] = [
  w('1', 'apple', 'key', { clue: 'A round fruit.', gloss: 'la manzana' }),
  w('2', 'bread'),
  w('3', 'cheese', 'bonus', { clue: 'Made from milk.' }),
  w('4', '  pear  ', 'normal', { gloss: 'la pera' }),
];

describe('wordOfDayEligible', () => {
  it('keeps words with real text and drops blank ones', () => {
    const words = [w('1', 'apple'), w('2', '   '), w('3', ''), w('4', 'pear')];
    expect(wordOfDayEligible(words).map((x) => x.id)).toEqual(['1', '4']);
  });
});

describe('buildWordOfDay', () => {
  it('numbers cards 1..N in list order by default', () => {
    const data = buildWordOfDay(list);
    expect(data.total).toBe(4);
    expect(data.cards.map((c) => c.index)).toEqual([1, 2, 3, 4]);
    expect(data.cards.map((c) => c.word)).toEqual(['apple', 'bread', 'cheese', 'pear']);
  });

  it('trims the featured word', () => {
    const data = buildWordOfDay(list);
    expect(data.cards[3].word).toBe('pear');
  });

  it('includes clue and gloss only when present', () => {
    const data = buildWordOfDay(list);
    expect(data.cards[0].clue).toBe('A round fruit.');
    expect(data.cards[0].gloss).toBe('la manzana');
    // bread has neither
    expect(data.cards[1].clue).toBeUndefined();
    expect(data.cards[1].gloss).toBeUndefined();
    // cheese has a clue but no gloss
    expect(data.cards[2].clue).toBe('Made from milk.');
    expect(data.cards[2].gloss).toBeUndefined();
    // pear has a gloss but no clue
    expect(data.cards[3].clue).toBeUndefined();
    expect(data.cards[3].gloss).toBe('la pera');
  });

  it('treats whitespace-only clue/gloss as absent', () => {
    const data = buildWordOfDay([w('1', 'apple', 'normal', { clue: '   ', gloss: ' ' })]);
    expect(data.cards[0].clue).toBeUndefined();
    expect(data.cards[0].gloss).toBeUndefined();
  });

  it('derives the image slot key from the word id', () => {
    const data = buildWordOfDay(list);
    expect(data.cards[0].slotId).toBe('slot-1');
    expect(data.cards[2].slotId).toBe('slot-3');
  });

  it('carries the tier through', () => {
    const data = buildWordOfDay(list);
    expect(data.cards.map((c) => c.tier)).toEqual(['key', 'normal', 'bonus', 'normal']);
  });

  it('skips blank words but keeps the surviving cards contiguous', () => {
    const words = [w('1', 'apple'), w('2', '   '), w('3', 'cheese'), w('4', '')];
    const data = buildWordOfDay(words);
    expect(data.total).toBe(2);
    expect(data.cards.map((c) => c.word)).toEqual(['apple', 'cheese']);
    expect(data.cards.map((c) => c.index)).toEqual([1, 2]);
  });

  it('returns an empty set for an empty or all-blank list without throwing', () => {
    expect(buildWordOfDay([]).total).toBe(0);
    expect(buildWordOfDay([]).cards).toEqual([]);
    expect(buildWordOfDay([w('1', '  '), w('2', '')]).total).toBe(0);
  });

  it('keeps duplicate words (real-data-only, no dedupe)', () => {
    const words = [w('1', 'apple'), w('2', 'apple')];
    const data = buildWordOfDay(words);
    expect(data.total).toBe(2);
    expect(data.cards.map((c) => c.slotId)).toEqual(['slot-1', 'slot-2']);
  });

  it('preserves the full set (same members) when shuffled', () => {
    const data = buildWordOfDay(list, { shuffleOrder: true });
    expect(data.total).toBe(4);
    expect([...data.cards.map((c) => c.word)].sort()).toEqual(
      ['apple', 'bread', 'cheese', 'pear'].sort(),
    );
    // indices are always 1..N regardless of order
    expect(data.cards.map((c) => c.index)).toEqual([1, 2, 3, 4]);
  });
});
