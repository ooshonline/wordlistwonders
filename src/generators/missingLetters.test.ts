import { describe, expect, it } from 'vitest';
import type { Word } from '../types';
import {
  buildMissingLetters,
  clampBlanks,
  lettersEligible,
  lettersLayout,
  itemBoxPx,
  lettersPages,
  pickHidden,
  LETTERS_DEFAULT_BLANKS,
  LETTERS_MAX_PER_PAGE,
} from './missingLetters';

const w = (id: string, text: string): Word => ({ id, text, tier: 'normal' });
const REPEAT = 200;

describe('lettersEligible', () => {
  it('drops blanks and one-letter words, keeps phrases', () => {
    const list = [w('a', 'apple'), w('b', '  '), w('c', 'I'), w('d', 'ice cream'), w('e', 'go')];
    expect(lettersEligible(list).map((x) => x.id)).toEqual(['a', 'd', 'e']);
  });
});

describe('clampBlanks', () => {
  it('clamps to 1–3 and defaults bad input', () => {
    expect(clampBlanks(0)).toBe(1);
    expect(clampBlanks(9)).toBe(3);
    expect(clampBlanks(2.7)).toBe(2);
    expect(clampBlanks(NaN)).toBe(LETTERS_DEFAULT_BLANKS);
    expect(clampBlanks(undefined)).toBe(LETTERS_DEFAULT_BLANKS);
  });
});

describe('pickHidden', () => {
  it('hides exactly the requested count when the word is long enough', () => {
    for (let i = 0; i < REPEAT; i++) expect(pickHidden('elephant', 3, 'any').size).toBe(3);
  });
  it('always leaves at least one letter visible', () => {
    for (let i = 0; i < REPEAT; i++) {
      expect(pickHidden('go', 3, 'any').size).toBe(1);
      expect(pickHidden('cat', 3, 'any').size).toBe(2);
    }
  });
  it('keeps the first letter when it can', () => {
    for (let i = 0; i < REPEAT; i++) expect(pickHidden('banana', 3, 'any').has(0)).toBe(false);
  });
  it('vowels mode only hides vowels', () => {
    for (let i = 0; i < REPEAT; i++) {
      const chars = [...'pencil'];
      for (const k of pickHidden('pencil', 3, 'vowels')) expect('aeiou').toContain(chars[k]);
    }
  });
  it('vowels mode with one vowel hides just that vowel', () => {
    expect([...pickHidden('dog', 3, 'vowels')]).toEqual([1]);
  });
  it('vowels mode can hide a first-letter vowel when it is the only option', () => {
    expect([...pickHidden('egg', 2, 'vowels')]).toEqual([0]);
  });
  it('a word with no vowels falls back to any letter', () => {
    for (let i = 0; i < REPEAT; i++) expect(pickHidden('gym', 1, 'vowels').size).toBe(1);
  });
  it('never hides spaces or hyphens', () => {
    for (let i = 0; i < REPEAT; i++) {
      for (const k of pickHidden('ice-cream cone', 3, 'any')) expect(/\p{L}/u.test([...'ice-cream cone'][k])).toBe(true);
    }
  });
});

describe('buildMissingLetters', () => {
  const list = [w('a', 'Apple'), w('b', 'x'), w('c', 'ice  cream'), w('d', 'dog')];

  it('numbers eligible words in list order, lowercased cells, normalized answers', () => {
    const d = buildMissingLetters(list, { blanks: 2 });
    expect(d.total).toBe(3);
    expect(d.items.map((it) => it.num)).toEqual([1, 2, 3]);
    expect(d.items.map((it) => it.answer)).toEqual(['Apple', 'ice cream', 'dog']);
    expect(d.items[0].cells.map((c) => c.ch).join('')).toBe('apple');
    expect(d.items[1].cells[3]).toEqual({ ch: ' ', hidden: false, isLetter: false });
    expect(d.items[0].slotId).toBe('slot-a');
  });

  it('each item hides the right number of letters', () => {
    const d = buildMissingLetters(list, { blanks: 2 });
    expect(d.items.map((it) => it.cells.filter((c) => c.hidden).length)).toEqual([2, 2, 2]);
  });

  it('shuffle keeps every word exactly once', () => {
    const d = buildMissingLetters(list, { shuffleOrder: true });
    expect(d.items.map((it) => it.answer).sort()).toEqual(['Apple', 'dog', 'ice cream']);
  });

  it('pages split by perPage and clamp it', () => {
    const many = Array.from({ length: 25 }, (_, i) => w('w' + i, 'word' + i));
    const d = buildMissingLetters(many, { perPage: 99 });
    expect(d.perPage).toBe(LETTERS_MAX_PER_PAGE);
    expect(lettersPages(d).map((p) => p.length)).toEqual([12, 12, 1]);
  });

  it('an empty list gives an empty sheet', () => {
    const d = buildMissingLetters([]);
    expect(d.total).toBe(0);
    expect(lettersPages(d)).toEqual([]);
  });
});

describe('lettersLayout', () => {
  it('uses two columns for short words', () => {
    expect(lettersLayout(5, 10, false)).toMatchObject({ cols: 2, boxPx: 40, picPx: 0 });
  });
  it('falls back to one column for long phrases', () => {
    const l = lettersLayout(14, 10, false);
    expect(l.cols).toBe(1);
    expect(l.boxPx).toBeGreaterThanOrEqual(32);
  });
  it('rows always fit the body height', () => {
    for (const pictures of [false, true])
      for (let cells = 2; cells <= 24; cells++)
        for (let count = 1; count <= 12; count++) {
          const l = lettersLayout(cells, count, pictures);
          const rows = Math.ceil(count / l.cols);
          expect(l.rowPx).toBeGreaterThanOrEqual(Math.max(l.boxPx, l.picPx));
          expect(rows * (l.rowPx + 14)).toBeLessThanOrEqual(600);
          const colW = l.cols === 2 ? 336 : 712;
          const box = itemBoxPx(cells, l);
          const used = 34 + (l.picPx ? l.picPx + 10 : 0) + cells * (box + 4) - 4;
          if (box > 12) expect(used).toBeLessThanOrEqual(colW);
        }
  });
});

describe('itemBoxPx', () => {
  it('short words keep the full box size; long phrases shrink to fit', () => {
    const l = lettersLayout(29, 12, true);
    expect(itemBoxPx(3, l)).toBe(l.boxPx);
    const big = itemBoxPx(29, l);
    expect(big).toBeLessThan(l.boxPx);
    expect(34 + l.picPx + 10 + 29 * (big + 4) - 4).toBeLessThanOrEqual(712);
  });
});
