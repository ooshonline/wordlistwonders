import { describe, it, expect } from 'vitest';
import {
  buildSpellingTest,
  spellingEligible,
  spellingPages,
  SPELLING_MAX_PER_PAGE,
  SPELLING_DEFAULT_PER_PAGE,
} from './spellingTest';
import type { Tier, Word } from '../types';

const w = (id: string, text: string, tier: Tier = 'normal'): Word => ({ id, text, tier });

const list: Word[] = [
  w('1', 'apple', 'key'),
  w('2', 'bread'),
  w('3', 'cheese', 'bonus'),
  w('4', 'grape'),
];

describe('spellingEligible', () => {
  it('keeps words with real text and drops blank ones', () => {
    const words = [w('1', 'apple'), w('2', '   '), w('3', ''), w('4', 'pear')];
    expect(spellingEligible(words).map((x) => x.id)).toEqual(['1', '4']);
  });
});

describe('buildSpellingTest', () => {
  it('numbers items 1..N in list order by default', () => {
    const data = buildSpellingTest(list);
    expect(data.total).toBe(4);
    expect(data.items.map((i) => i.num)).toEqual([1, 2, 3, 4]);
    expect(data.items.map((i) => i.answer)).toEqual(['apple', 'bread', 'cheese', 'grape']);
    expect(data.prompt).toBe('readAloud');
  });

  it('carries the image-slot key and tier for each item', () => {
    const data = buildSpellingTest(list);
    expect(data.items[0].slotId).toBe('slot-1');
    expect(data.items[0].tier).toBe('key');
    expect(data.items[2].tier).toBe('bonus');
  });

  it('trims surrounding whitespace from the answer', () => {
    const data = buildSpellingTest([w('1', '  apple  ')]);
    expect(data.items[0].answer).toBe('apple');
  });

  it('skips blank-text words but still numbers contiguously', () => {
    const words = [w('1', 'apple'), w('2', '  '), w('3', 'pear')];
    const data = buildSpellingTest(words);
    expect(data.total).toBe(2);
    expect(data.items.map((i) => i.num)).toEqual([1, 2]);
    expect(data.items.map((i) => i.answer)).toEqual(['apple', 'pear']);
  });

  it('keeps duplicate words as separate numbered items (real-data-only)', () => {
    const data = buildSpellingTest([w('1', 'cat'), w('2', 'cat')]);
    expect(data.total).toBe(2);
    expect(data.items.map((i) => i.slotId)).toEqual(['slot-1', 'slot-2']);
  });

  it('returns an empty test for an empty list instead of throwing', () => {
    const data = buildSpellingTest([]);
    expect(data.total).toBe(0);
    expect(data.items).toEqual([]);
    expect(spellingPages(data)).toEqual([]);
  });

  it('accepts the image prompt mode', () => {
    expect(buildSpellingTest(list, { prompt: 'image' }).prompt).toBe('image');
  });

  it('shuffles order when asked but preserves the full set and renumbers 1..N', () => {
    const data = buildSpellingTest(list, { shuffleOrder: true });
    expect(data.total).toBe(4);
    expect(data.items.map((i) => i.num)).toEqual([1, 2, 3, 4]);
    expect(new Set(data.items.map((i) => i.answer))).toEqual(
      new Set(['apple', 'bread', 'cheese', 'grape']),
    );
  });

  it('clamps perPage: <1 and non-finite fall back to the default, huge values cap', () => {
    expect(buildSpellingTest(list, { perPage: 0 }).perPage).toBe(SPELLING_DEFAULT_PER_PAGE);
    expect(buildSpellingTest(list, { perPage: -5 }).perPage).toBe(SPELLING_DEFAULT_PER_PAGE);
    expect(buildSpellingTest(list, { perPage: 999 }).perPage).toBe(SPELLING_MAX_PER_PAGE);
    expect(buildSpellingTest(list, { perPage: 8 }).perPage).toBe(8);
  });

  it('floors a fractional perPage', () => {
    expect(buildSpellingTest(list, { perPage: 6.9 }).perPage).toBe(6);
  });
});

describe('spellingPages', () => {
  it('splits items into pages of perPage in order', () => {
    const many = Array.from({ length: 23 }, (_, i) => w(String(i), 'w' + i));
    const data = buildSpellingTest(many, { perPage: 10 });
    const pages = spellingPages(data);
    expect(pages.map((p) => p.length)).toEqual([10, 10, 3]);
    // Numbers stay globally sequential across pages.
    expect(pages[1][0].num).toBe(11);
    expect(pages[2][2].num).toBe(23);
  });

  it('yields a single page when everything fits', () => {
    const data = buildSpellingTest(list, { perPage: 10 });
    expect(spellingPages(data)).toHaveLength(1);
  });
});
