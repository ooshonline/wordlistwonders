import { describe, expect, it } from 'vitest';
import type { Tier, Word } from '../types';
import { moveWordBy, moveWordTo, sameOrder, sortAZ, sortByTier } from './wordOrder';

const w = (id: string, text: string, tier: Tier = 'normal'): Word => ({ id, text, tier });
const ids = (list: Word[]) => list.map((x) => x.id).join(',');

const list = [w('a', 'cherry'), w('b', 'Apple', 'bonus'), w('c', 'banana', 'key'), w('d', 'apple', 'key')];

describe('moveWordBy', () => {
  it('moves a word up and down one place', () => {
    expect(ids(moveWordBy(list, 'c', -1))).toBe('a,c,b,d');
    expect(ids(moveWordBy(list, 'a', 1))).toBe('b,a,c,d');
  });
  it('clamps at the ends', () => {
    expect(ids(moveWordBy(list, 'a', -1))).toBe('a,b,c,d');
    expect(ids(moveWordBy(list, 'd', 5))).toBe('a,b,c,d');
  });
  it('ignores unknown ids and never mutates the input', () => {
    const before = ids(list);
    expect(ids(moveWordBy(list, 'zz', 1))).toBe(before);
    moveWordBy(list, 'a', 2);
    expect(ids(list)).toBe(before);
  });
});

describe('moveWordTo', () => {
  it('drops a word onto another word’s place (down and up)', () => {
    expect(ids(moveWordTo(list, 'a', 'c'))).toBe('b,c,a,d');
    expect(ids(moveWordTo(list, 'd', 'a'))).toBe('d,a,b,c');
  });
  it('dropping on itself or an unknown id keeps the order', () => {
    expect(ids(moveWordTo(list, 'b', 'b'))).toBe('a,b,c,d');
    expect(ids(moveWordTo(list, 'b', 'nope'))).toBe('a,b,c,d');
  });
});

describe('sortAZ', () => {
  it('sorts case-insensitively and keeps ties stable', () => {
    expect(ids(sortAZ(list))).toBe('b,d,c,a');
  });
  it('puts blank words last', () => {
    const withBlank = [w('x', '  '), w('y', 'zebra'), w('z', 'ant')];
    expect(ids(sortAZ(withBlank))).toBe('z,y,x');
  });
});

describe('sortByTier', () => {
  it('orders key → normal → bonus, stable within a tier', () => {
    expect(ids(sortByTier(list))).toBe('c,d,a,b');
  });
  it('A–Z then tier gives A–Z inside each tier', () => {
    expect(ids(sortByTier(sortAZ(list)))).toBe('d,c,a,b');
  });
});

describe('sameOrder', () => {
  it('compares by id order', () => {
    expect(sameOrder(list, list.slice())).toBe(true);
    expect(sameOrder(list, sortAZ(list))).toBe(false);
    expect(sameOrder(list, list.slice(1))).toBe(false);
  });
});
