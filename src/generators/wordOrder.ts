// Pure word-list ordering helpers for the Editor (F4): move one word up/down,
// drag one word onto another's spot, sort A–Z, sort by tier. No DOM, no side
// effects — every function returns a NEW array and never mutates its input, so
// the store can keep an undo snapshot of the old order.

import type { Tier, Word } from '../types';
import { alphaCompare } from './alphaOrder';

/** Tier order used by "Sort by tier": key words first, bonus words last. */
const TIER_RANK: Record<Tier, number> = { key: 0, normal: 1, bonus: 2 };

/**
 * Move the word with `id` by `delta` places (-1 = up, +1 = down), clamped to
 * the ends of the list. Unknown id or a no-op move returns the same order.
 */
export function moveWordBy(words: Word[], id: string, delta: number): Word[] {
  const from = words.findIndex((w) => w.id === id);
  if (from < 0) return words.slice();
  const to = Math.max(0, Math.min(words.length - 1, from + Math.trunc(delta || 0)));
  return moveIndex(words, from, to);
}

/**
 * Drag-and-drop: put the word `id` where `targetId` currently sits (the target
 * and everything between shift one place toward the gap). Unknown ids, or
 * dropping a word on itself, return the same order.
 */
export function moveWordTo(words: Word[], id: string, targetId: string): Word[] {
  const from = words.findIndex((w) => w.id === id);
  const to = words.findIndex((w) => w.id === targetId);
  if (from < 0 || to < 0) return words.slice();
  return moveIndex(words, from, to);
}

function moveIndex(words: Word[], from: number, to: number): Word[] {
  const next = words.slice();
  if (from === to) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** True when the word's text is empty or whitespace only. */
const isBlank = (w: Word) => !(w.text || '').trim();

/**
 * A–Z by word text (case- and accent-insensitive). Blank words go to the end
 * so they don't pile up at the top; ties keep their current order (stable).
 */
export function sortAZ(words: Word[]): Word[] {
  return words
    .map((w, i) => ({ w, i }))
    .sort((a, b) => {
      const blank = Number(isBlank(a.w)) - Number(isBlank(b.w));
      if (blank) return blank;
      return alphaCompare((a.w.text || '').trim(), (b.w.text || '').trim()) || a.i - b.i;
    })
    .map(({ w }) => w);
}

/**
 * Key → Normal → Bonus. Within a tier the current order is kept (stable), so a
 * teacher can sort A–Z first and then by tier to get A–Z inside each tier.
 */
export function sortByTier(words: Word[]): Word[] {
  return words
    .map((w, i) => ({ w, i }))
    .sort((a, b) => (TIER_RANK[a.w.tier] ?? 1) - (TIER_RANK[b.w.tier] ?? 1) || a.i - b.i)
    .map(({ w }) => w);
}

/** True when two lists hold the same words in the same order (by id). */
export function sameOrder(a: Word[], b: Word[]): boolean {
  return a.length === b.length && a.every((w, i) => w.id === b[i].id);
}
