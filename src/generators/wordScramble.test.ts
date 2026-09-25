import { describe, it, expect } from 'vitest';
import {
  buildWordScramble,
  scrambleEligible,
  scramblePages,
  scrambleWord,
  SCRAMBLE_MAX_PER_PAGE,
  SCRAMBLE_DEFAULT_PER_PAGE,
} from './wordScramble';
import type { Tier, Word } from '../types';

const w = (id: string, text: string, tier: Tier = 'normal'): Word => ({ id, text, tier });

/** Same multiset of letters, ignoring case. */
const sameLetters = (a: string, b: string) =>
  [...a.toLowerCase()].sort().join('') === [...b.toLowerCase()].sort().join('');

const list: Word[] = [
  w('1', 'apple', 'key'),
  w('2', 'bread'),
  w('3', 'cheese', 'bonus'),
  w('4', 'grape'),
];

describe('scrambleEligible', () => {
  it('drops blank, one-letter and single-repeated-letter words', () => {
    const words = [w('1', 'apple'), w('2', '  '), w('3', 'a'), w('4', 'zzz'), w('5', 'I'), w('6', 'go')];
    expect(scrambleEligible(words).map((x) => x.id)).toEqual(['1', '6']);
  });

  it('keeps a phrase when at least one part can be scrambled', () => {
    expect(scrambleEligible([w('1', 'a cat'), w('2', 'a a')]).map((x) => x.id)).toEqual(['1']);
  });
});

describe('scrambleWord', () => {
  it('never returns the word itself and keeps the same letters', () => {
    for (const word of ['go', 'apple', 'banana', 'noon', 'abab', 'Tomato']) {
      for (let i = 0; i < 50; i++) {
        const s = scrambleWord(word);
        expect(s).not.toBe(word.toLowerCase());
        expect(sameLetters(s, word)).toBe(true);
      }
    }
  });

  it('outputs lowercase so a capital letter never gives the answer away', () => {
    const s = scrambleWord('Tokyo');
    expect(s).toBe(s.toLowerCase());
  });

  it('scrambles each part of a phrase separately and keeps the spacing', () => {
    for (let i = 0; i < 30; i++) {
      const s = scrambleWord('ice   cream');
      const [a, b] = s.split(' ');
      expect(s.split(' ')).toHaveLength(2);
      expect(sameLetters(a, 'ice')).toBe(true);
      expect(sameLetters(b, 'cream')).toBe(true);
      expect(s).not.toBe('ice cream');
    }
  });

  it('leaves hyphens and apostrophes where they are', () => {
    for (let i = 0; i < 30; i++) {
      const s = scrambleWord("t-shirt");
      expect(s[1]).toBe('-');
      expect(sameLetters(s.replace('-', ''), 'tshirt')).toBe(true);
    }
    expect(scrambleWord("don't").indexOf("'")).toBe(3);
  });

  it('handles non-English letters', () => {
    const s = scrambleWord('café');
    expect(s).not.toBe('café');
    expect(sameLetters(s, 'café')).toBe(true);
  });
});

describe('buildWordScramble', () => {
  it('numbers items 1..N in list order by default', () => {
    const data = buildWordScramble(list);
    expect(data.total).toBe(4);
    expect(data.items.map((i) => i.num)).toEqual([1, 2, 3, 4]);
    expect(data.items.map((i) => i.answer)).toEqual(['apple', 'bread', 'cheese', 'grape']);
  });

  it('carries the first-letter hint, image-slot key and tier', () => {
    const data = buildWordScramble(list);
    expect(data.items[0].firstLetter).toBe('a');
    expect(data.items[0].slotId).toBe('slot-1');
    expect(data.items[0].tier).toBe('key');
    expect(data.items[2].tier).toBe('bonus');
  });

  it('every scramble differs from its answer', () => {
    const data = buildWordScramble(list);
    for (const it of data.items) {
      expect(it.scrambled).not.toBe(it.answer.toLowerCase());
      expect(sameLetters(it.scrambled, it.answer)).toBe(true);
    }
  });

  it('builds an alphabetized word bank of the answers', () => {
    const data = buildWordScramble([w('1', 'grape'), w('2', 'Apple'), w('3', 'bread')], { shuffleOrder: true });
    expect(data.wordBank).toEqual(['Apple', 'bread', 'grape']);
  });

  it('skips unscrambleable words and tidies phrase spacing', () => {
    const data = buildWordScramble([w('1', 'a'), w('2', '  ice  cream '), w('3', '')]);
    expect(data.total).toBe(1);
    expect(data.items[0].answer).toBe('ice cream');
    expect(data.items[0].num).toBe(1);
  });

  it('shuffleOrder keeps every word exactly once', () => {
    const data = buildWordScramble(list, { shuffleOrder: true });
    expect(data.items.map((i) => i.answer).sort()).toEqual(['apple', 'bread', 'cheese', 'grape']);
    expect(data.items.map((i) => i.num)).toEqual([1, 2, 3, 4]);
  });

  it('clamps perPage and falls back to the default', () => {
    expect(buildWordScramble(list).perPage).toBe(SCRAMBLE_DEFAULT_PER_PAGE);
    expect(buildWordScramble(list, { perPage: 999 }).perPage).toBe(SCRAMBLE_MAX_PER_PAGE);
    expect(buildWordScramble(list, { perPage: 0 }).perPage).toBe(SCRAMBLE_DEFAULT_PER_PAGE);
    expect(buildWordScramble(list, { perPage: NaN }).perPage).toBe(SCRAMBLE_DEFAULT_PER_PAGE);
    expect(buildWordScramble(list, { perPage: 3.7 }).perPage).toBe(3);
  });

  it('returns an empty sheet for an empty list', () => {
    const data = buildWordScramble([]);
    expect(data).toMatchObject({ total: 0, items: [], wordBank: [] });
    expect(scramblePages(data)).toEqual([]);
  });
});

describe('scramblePages', () => {
  it('splits items into pages of perPage', () => {
    const many = Array.from({ length: 23 }, (_, i) => w(String(i), 'word' + i));
    const pages = scramblePages(buildWordScramble(many, { perPage: 10 }));
    expect(pages.map((p) => p.length)).toEqual([10, 10, 3]);
    expect(pages[2][0].num).toBe(21);
  });
});
