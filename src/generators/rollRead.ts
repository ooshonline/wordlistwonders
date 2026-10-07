// Pure "Roll & Read" generator. No DOM, no side effects beyond Math.random (via
// shuffle), so it stays unit-testable.
//
// A Roll & Read sheet is a 6-column grid — one column per face of a die. The
// student rolls, finds that column, and reads the next word in it (coloring its
// circle). Words repeat across the grid for fluency practice. Every eligible
// word appears at least once; if the list is longer than one grid, more pages
// are added so nothing is dropped.

import type { Tier, Word } from '../types';
import { shuffle } from './random';

/** One column per face of a standard die. */
export const ROLL_COLS = 6;
/** Rows per grid the worksheet offers (each row = one more read per column). */
export const ROLL_ROW_CHOICES = [4, 6, 8] as const;
export const ROLL_DEFAULT_ROWS = 6;

export interface RollCell {
  /** The word as the teacher typed it (trimmed, inner spaces collapsed). */
  text: string;
  /** Image-slot key (`slot-<id>`) for an optional picture cue. */
  slotId: string;
  tier: Tier;
}

export interface RollGrid {
  /** `rows` arrays of exactly ROLL_COLS cells. */
  rows: RollCell[][];
}

export interface RollReadData {
  grids: RollGrid[];
  /** Distinct words used (after blanks + duplicates are dropped). */
  total: number;
  rows: number;
}

export interface RollOptions {
  /** Rows per grid; snapped to the nearest ROLL_ROW_CHOICES value. */
  rows?: number;
  /** Mix the first pass of words (default false — the first time through, the
   *  words fill the grid in list order; repeats are always mixed). */
  shuffleOrder?: boolean;
}

const norm = (text: string) => (text || '').trim().replace(/\s+/g, ' ');

/** Words usable on the sheet: blanks dropped, case-insensitive duplicates
 *  collapsed to their first occurrence. */
export function rollEligible(words: Word[]): Word[] {
  const seen = new Set<string>();
  return words.filter((w) => {
    const key = norm(w.text).toLocaleLowerCase('en');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Snap any number to the nearest offered row count (NaN / missing → default). */
export function clampRollRows(n: number | undefined): number {
  if (n === undefined || !Number.isFinite(n)) {
    if (n === Infinity) return ROLL_ROW_CHOICES[ROLL_ROW_CHOICES.length - 1];
    if (n === -Infinity) return ROLL_ROW_CHOICES[0];
    return ROLL_DEFAULT_ROWS;
  }
  let best: number = ROLL_ROW_CHOICES[0];
  for (const c of ROLL_ROW_CHOICES) if (Math.abs(c - n) < Math.abs(best - n)) best = c;
  return best;
}

/**
 * Build the Roll & Read grids.
 *
 * Fill order is row by row. The first pass places every word once (list
 * order, or mixed when `shuffleOrder`). Remaining cells are repeats: each one
 * takes the least-used word that isn't already in the current row or directly
 * above in the same column (random among ties), so the grid stays varied and
 * rows don't repeat a word whenever the list is long enough to avoid it.
 */
export function buildRollRead(words: Word[], opts: RollOptions = {}): RollReadData {
  const rows = clampRollRows(opts.rows);
  const items: RollCell[] = rollEligible(words).map((w) => ({
    text: norm(w.text),
    slotId: 'slot-' + w.id,
    tier: w.tier,
  }));
  if (items.length === 0) return { grids: [], total: 0, rows };

  const gridCount = Math.ceil(items.length / (rows * ROLL_COLS));
  const firstPass = opts.shuffleOrder ? shuffle(items) : items.slice();
  const uses = new Map<string, number>();
  let next = 0;

  const pick = (row: RollCell[], above: string | null): RollCell => {
    let cell: RollCell;
    if (next < firstPass.length) {
      cell = firstPass[next++];
    } else {
      const fits = items.filter((it) => it.text !== above && !row.some((x) => x.text === it.text));
      const pool = shuffle(fits.length ? fits : items);
      cell = pool.reduce((best, it) => ((uses.get(it.text) ?? 0) < (uses.get(best.text) ?? 0) ? it : best));
    }
    uses.set(cell.text, (uses.get(cell.text) ?? 0) + 1);
    return cell;
  };

  const grids: RollGrid[] = [];
  for (let g = 0; g < gridCount; g++) {
    const gridRows: RollCell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: RollCell[] = [];
      for (let c = 0; c < ROLL_COLS; c++) row.push(pick(row, r > 0 ? gridRows[r - 1][c].text : null));
      gridRows.push(row);
    }
    grids.push({ rows: gridRows });
  }
  return { grids, total: items.length, rows };
}
