import { describe, it, expect } from 'vitest';
import {
  alphaCompare,
  alphaEligible,
  buildAlphaOrder,
  groupSizes,
  ALPHA_DEFAULT_GROUP,
  ALPHA_MAX_GROUP,
  ALPHA_MIN_GROUP,
} from './alphaOrder';
import type { Tier, Word } from '../types';

const w = (id: string, text: string, tier: Tier = 'normal'): Word => ({ id, text, tier });
const texts = (items: { text: string }[]) => items.map((it) => it.text);

const fruit: Word[] = ['pear', 'apple', 'grape', 'banana', 'cherry', 'mango', 'kiwi', 'lemon', 'fig', 'date', 'orange'].map(
  (t, i) => w(String(i + 1), t),
);

describe('alphaCompare', () => {
  it('ignores case', () => {
    expect(alphaCompare('Apple', 'apple')).toBe(0);
    expect(alphaCompare('Banana', 'apple')).toBeGreaterThan(0);
  });
});

describe('alphaEligible', () => {
  it('drops blanks and case-insensitive duplicates, keeping the first', () => {
    const words = [w('1', 'Cat'), w('2', '  '), w('3', 'cat'), w('4', 'dog'), w('5', 'ice  cream'), w('6', 'Ice Cream')];
    expect(alphaEligible(words).map((x) => x.id)).toEqual(['1', '4', '5']);
  });
});

describe('groupSizes', () => {
  it('splits evenly without a lonely leftover', () => {
    expect(groupSizes(11, 5)).toEqual([4, 4, 3]);
    expect(groupSizes(10, 5)).toEqual([5, 5]);
    expect(groupSizes(6, 5)).toEqual([3, 3]);
  });
  it('never exceeds the target size and always sums to n', () => {
    for (let n = 1; n <= 40; n++) {
      for (let size = ALPHA_MIN_GROUP; size <= ALPHA_MAX_GROUP; size++) {
        const sizes = groupSizes(n, size);
        expect(sizes.reduce((a, b) => a + b, 0)).toBe(n);
        expect(Math.max(...sizes)).toBeLessThanOrEqual(size);
      }
    }
  });
  it('handles an empty list', () => {
    expect(groupSizes(0, 5)).toEqual([]);
  });
});

describe('buildAlphaOrder', () => {
  it('groups in list order by default, sorted key per group', () => {
    const data = buildAlphaOrder(fruit, { groupSize: 5 });
    expect(data.total).toBe(11);
    expect(data.groups.map((g) => g.sorted.length)).toEqual([4, 4, 3]);
    expect(texts(data.groups[0].sorted)).toEqual(['apple', 'banana', 'grape', 'pear']);
    expect(data.groups.map((g) => g.num)).toEqual([1, 2, 3]);
  });

  it('jumbled order holds the same words and is never already sorted', () => {
    for (let run = 0; run < 50; run++) {
      const data = buildAlphaOrder(fruit, { groupSize: 4, shuffleGroups: true });
      for (const g of data.groups) {
        expect([...texts(g.jumbled)].sort(alphaCompare)).toEqual(texts(g.sorted));
        const isSorted = texts(g.jumbled).every((t, i, a) => i === 0 || alphaCompare(a[i - 1], t) <= 0);
        expect(isSorted).toBe(false);
      }
    }
  });

  it('shuffleGroups still uses every word exactly once', () => {
    const data = buildAlphaOrder(fruit, { shuffleGroups: true });
    const all = data.groups.flatMap((g) => texts(g.sorted)).sort();
    expect(all).toEqual(fruit.map((x) => x.text).sort());
  });

  it('clamps the group size', () => {
    expect(buildAlphaOrder(fruit, { groupSize: 1 }).groupSize).toBe(ALPHA_MIN_GROUP);
    expect(buildAlphaOrder(fruit, { groupSize: 99 }).groupSize).toBe(ALPHA_MAX_GROUP);
    expect(buildAlphaOrder(fruit, { groupSize: NaN }).groupSize).toBe(ALPHA_DEFAULT_GROUP);
    expect(buildAlphaOrder(fruit).groupSize).toBe(ALPHA_DEFAULT_GROUP);
  });

  it('keeps slot ids and tiers, and normalizes spacing', () => {
    const data = buildAlphaOrder([w('a', '  ice   cream ', 'key'), w('b', 'bread', 'bonus')]);
    expect(data.groups[0].sorted).toEqual([
      { text: 'bread', slotId: 'slot-b', tier: 'bonus' },
      { text: 'ice cream', slotId: 'slot-a', tier: 'key' },
    ]);
  });

  it('returns an empty sheet for an empty or blank list', () => {
    expect(buildAlphaOrder([])).toEqual({ groups: [], total: 0, groupSize: ALPHA_DEFAULT_GROUP });
    expect(buildAlphaOrder([w('1', ' ')]).groups).toEqual([]);
  });

  it('a single word makes one group that is trivially "sorted"', () => {
    const data = buildAlphaOrder([w('1', 'sun')]);
    expect(data.groups).toHaveLength(1);
    expect(texts(data.groups[0].jumbled)).toEqual(['sun']);
  });
});
