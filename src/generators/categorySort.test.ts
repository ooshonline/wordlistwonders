import { describe, it, expect } from 'vitest';
import {
  buildCategorySort,
  buildBuckets,
  categorySortEligible,
  clampBucketCount,
  defaultBucketLabel,
  unassignedChips,
  bucketCounts,
  isAllSorted,
  CATEGORY_MIN_BUCKETS,
  CATEGORY_MAX_BUCKETS,
  type SortAssignments,
} from './categorySort';
import type { Tier, Word } from '../types';

const w = (
  id: string,
  text: string,
  tier: Tier = 'normal',
  extra: Partial<Word> = {},
): Word => ({ id, text, tier, ...extra });

const list: Word[] = [
  w('1', 'apple', 'key'),
  w('2', 'bread'),
  w('3', '  pear  ', 'bonus'),
  w('4', 'milk'),
];

describe('clampBucketCount', () => {
  it('keeps values within [2, 4]', () => {
    expect(clampBucketCount(2)).toBe(2);
    expect(clampBucketCount(4)).toBe(4);
    expect(clampBucketCount(3)).toBe(3);
  });
  it('clamps out-of-range and floors fractions', () => {
    expect(clampBucketCount(1)).toBe(CATEGORY_MIN_BUCKETS);
    expect(clampBucketCount(0)).toBe(CATEGORY_MIN_BUCKETS);
    expect(clampBucketCount(9)).toBe(CATEGORY_MAX_BUCKETS);
    expect(clampBucketCount(3.9)).toBe(3);
  });
  it('falls back to the minimum for non-finite input', () => {
    expect(clampBucketCount(NaN)).toBe(CATEGORY_MIN_BUCKETS);
    expect(clampBucketCount(Infinity)).toBe(CATEGORY_MAX_BUCKETS);
  });
});

describe('defaultBucketLabel', () => {
  it('is 1-based and teacher-friendly', () => {
    expect(defaultBucketLabel(0)).toBe('Group 1');
    expect(defaultBucketLabel(3)).toBe('Group 4');
  });
});

describe('categorySortEligible', () => {
  it('keeps words with real text and drops blank ones', () => {
    const words = [w('1', 'apple'), w('2', '   '), w('3', ''), w('4', 'pear')];
    expect(categorySortEligible(words).map((x) => x.id)).toEqual(['1', '4']);
  });
});

describe('buildBuckets', () => {
  it('makes N buckets with stable ids and default labels', () => {
    const b = buildBuckets(3);
    expect(b.map((x) => x.id)).toEqual(['bucket-0', 'bucket-1', 'bucket-2']);
    expect(b.map((x) => x.label)).toEqual(['Group 1', 'Group 2', 'Group 3']);
  });
  it('uses teacher labels when present, trimmed, else the default', () => {
    const b = buildBuckets(3, ['Fruit', '  ', 'Drinks']);
    expect(b.map((x) => x.label)).toEqual(['Fruit', 'Group 2', 'Drinks']);
  });
  it('clamps the bucket count to [2, 4]', () => {
    expect(buildBuckets(1)).toHaveLength(2);
    expect(buildBuckets(99)).toHaveLength(4);
  });
});

describe('buildCategorySort', () => {
  it('makes a chip per eligible word in list order, trimmed', () => {
    const data = buildCategorySort(list);
    expect(data.total).toBe(4);
    expect(data.chips.map((c) => c.text)).toEqual(['apple', 'bread', 'pear', 'milk']);
    expect(data.chips[2].text).toBe('pear');
  });
  it('sets slotId and carries the tier', () => {
    const data = buildCategorySort(list);
    expect(data.chips[0].slotId).toBe('slot-1');
    expect(data.chips[0].tier).toBe('key');
    expect(data.chips[2].tier).toBe('bonus');
  });
  it('defaults to two buckets', () => {
    const data = buildCategorySort(list);
    expect(data.buckets).toHaveLength(2);
  });
  it('honors bucketCount and labels', () => {
    const data = buildCategorySort(list, { bucketCount: 3, labels: ['Fruit', 'Drinks'] });
    expect(data.buckets.map((b) => b.label)).toEqual(['Fruit', 'Drinks', 'Group 3']);
  });
  it('keeps the same chips (by id) when shuffled', () => {
    const data = buildCategorySort(list, { shuffleOrder: true });
    expect([...data.chips.map((c) => c.id)].sort()).toEqual(['1', '2', '3', '4']);
  });
  it('returns an empty board for an empty or all-blank list without throwing', () => {
    expect(buildCategorySort([]).total).toBe(0);
    expect(buildCategorySort([w('1', '  '), w('2', '')]).chips).toEqual([]);
    // buckets still exist so the empty-state UI can render headings
    expect(buildCategorySort([]).buckets).toHaveLength(2);
  });
});

describe('sort-state helpers', () => {
  const { chips } = buildCategorySort(list); // ids 1,2,3,4
  const partial: SortAssignments = { '1': 'bucket-0', '3': 'bucket-1' };

  it('unassignedChips lists only unplaced chips, in deck order', () => {
    expect(unassignedChips(chips, partial).map((c) => c.id)).toEqual(['2', '4']);
  });
  it('treats null / empty-string / missing as unplaced', () => {
    const a: SortAssignments = { '1': 'bucket-0', '2': null, '3': '', '4': undefined };
    expect(unassignedChips(chips, a).map((c) => c.id)).toEqual(['2', '3', '4']);
  });
  it('bucketCounts tallies placed chips per bucket', () => {
    const a: SortAssignments = { '1': 'bucket-0', '2': 'bucket-0', '3': 'bucket-1' };
    expect(bucketCounts(chips, a)).toEqual({ 'bucket-0': 2, 'bucket-1': 1 });
  });
  it('isAllSorted is true only when every chip is placed', () => {
    expect(isAllSorted(chips, partial)).toBe(false);
    const full: SortAssignments = { '1': 'bucket-0', '2': 'bucket-1', '3': 'bucket-0', '4': 'bucket-1' };
    expect(isAllSorted(chips, full)).toBe(true);
  });
  it('isAllSorted is false for an empty board (nothing to sort)', () => {
    expect(isAllSorted([], {})).toBe(false);
  });
});
