// Pure "Category Sort" generator. No DOM, no side effects beyond Math.random
// (via shuffle), so it stays unit-testable. Turns a word list into a set of
// draggable word chips plus a small number of teacher-named buckets, and offers
// pure helpers for the sort state (what's unassigned, per-bucket counts, and
// whether everything has been placed).
//
// This is the pure logic slice of the Category Sort projector activity (CX5);
// the React drag component, the store slice (bucket labels persist per set), and
// the toolbar/router wiring land in later slices. Kept off-live until then.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

export interface SortChip {
  /** Word id — also the drag key and image-slot base. */
  id: string;
  /** The word shown on the chip. */
  text: string;
  /** Image-slot key (`slot-<id>`) for an optional picture cue. */
  slotId: string;
  tier: Tier;
}

export interface SortBucket {
  /** Stable id (`bucket-0`..`bucket-3`) — the assignment target. */
  id: string;
  /** Teacher-editable heading; falls back to a friendly default. */
  label: string;
}

export interface CategorySortData {
  /** Word chips in presentation order (list order, or shuffled). */
  chips: SortChip[];
  /** The buckets words are sorted into (2..4). */
  buckets: SortBucket[];
  total: number;
}

/** Maps a chip id to the bucket id it sits in (unset/null/'' = unplaced). */
export type SortAssignments = Record<string, string | null | undefined>;

export interface CategorySortOptions {
  /** Randomize chip order (default false — keep the teacher's list order). */
  shuffleOrder?: boolean;
  /** How many buckets to offer; clamped to [2, 4] (default 2). */
  bucketCount?: number;
  /** Teacher-defined bucket labels by index; blanks fall back to the default. */
  labels?: (string | undefined)[];
}

export const CATEGORY_MIN_BUCKETS = 2;
export const CATEGORY_MAX_BUCKETS = 4;

/** Keep the bucket count sane: an integer in [2, 4]. NaN falls back to the
 *  minimum; ±Infinity clamps to the range like any other out-of-range value. */
export function clampBucketCount(n: number): number {
  if (Number.isNaN(n)) return CATEGORY_MIN_BUCKETS;
  return Math.max(CATEGORY_MIN_BUCKETS, Math.min(CATEGORY_MAX_BUCKETS, Math.floor(n)));
}

/** Friendly default heading for an unnamed bucket (1-based for teachers). */
export function defaultBucketLabel(index: number): string {
  return `Group ${index + 1}`;
}

/** A word can be sorted only if it has real (non-blank) text. */
export function categorySortEligible(words: Word[]): Word[] {
  return words.filter((w) => (w.text || '').trim().length > 0);
}

/**
 * Build the bucket list. `bucketCount` is clamped to [2, 4]; each bucket takes
 * the matching teacher label when present (trimmed), else a "Group N" default.
 */
export function buildBuckets(bucketCount: number, labels: (string | undefined)[] = []): SortBucket[] {
  const count = clampBucketCount(bucketCount);
  const buckets: SortBucket[] = [];
  for (let i = 0; i < count; i++) {
    const label = (labels[i] || '').trim();
    buckets.push({ id: 'bucket-' + i, label: label || defaultBucketLabel(i) });
  }
  return buckets;
}

/**
 * Build the Category Sort board. Blank-text words are skipped; the rest become
 * chips in list order (or shuffled). Empty/degenerate lists yield an empty chip
 * set (total 0) rather than throwing — the component shows guidance in that case.
 */
export function buildCategorySort(words: Word[], options: CategorySortOptions = {}): CategorySortData {
  const eligible = categorySortEligible(words);
  const ordered = options.shuffleOrder ? shuffle(eligible) : eligible;

  const chips: SortChip[] = ordered.map((w) => ({
    id: w.id,
    text: w.text.trim(),
    slotId: 'slot-' + w.id,
    tier: w.tier,
  }));

  const buckets = buildBuckets(options.bucketCount ?? CATEGORY_MIN_BUCKETS, options.labels);
  return { chips, buckets, total: chips.length };
}

/** True when a chip has been placed into some bucket. */
function isPlaced(assignments: SortAssignments, chipId: string): boolean {
  const b = assignments[chipId];
  return typeof b === 'string' && b.length > 0;
}

/** Chips not yet placed in any bucket, kept in deck order. */
export function unassignedChips(chips: SortChip[], assignments: SortAssignments): SortChip[] {
  return chips.filter((c) => !isPlaced(assignments, c.id));
}

/** How many chips sit in each bucket id (only non-empty buckets appear). */
export function bucketCounts(chips: SortChip[], assignments: SortAssignments): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of chips) {
    const b = assignments[c.id];
    if (typeof b === 'string' && b.length > 0) counts[b] = (counts[b] || 0) + 1;
  }
  return counts;
}

/**
 * True when every chip has been placed into a bucket. An empty board is never
 * "all sorted" (there is nothing to sort), so the component won't flash a
 * completion state on an empty set.
 */
export function isAllSorted(chips: SortChip[], assignments: SortAssignments): boolean {
  if (chips.length === 0) return false;
  return chips.every((c) => isPlaced(assignments, c.id));
}
