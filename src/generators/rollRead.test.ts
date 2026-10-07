import { describe, it, expect } from 'vitest';
import { buildRollRead, clampRollRows, rollEligible, ROLL_COLS, ROLL_DEFAULT_ROWS } from './rollRead';
import type { Tier, Word } from '../types';

const w = (id: string, text: string, tier: Tier = 'normal'): Word => ({ id, text, tier });
const list = (n: number) => Array.from({ length: n }, (_, i) => w(String(i + 1), 'word' + (i + 1)));

describe('rollEligible', () => {
  it('drops blanks and case-insensitive duplicates, keeping the first', () => {
    const words = [w('1', 'Cat'), w('2', ' '), w('3', 'cat'), w('4', 'dog'), w('5', 'ice  cream'), w('6', 'Ice Cream')];
    expect(rollEligible(words).map((x) => x.id)).toEqual(['1', '4', '5']);
  });
});

describe('clampRollRows', () => {
  it('snaps to the nearest offered row count', () => {
    expect(clampRollRows(4)).toBe(4);
    expect(clampRollRows(5.2)).toBe(6);
    expect(clampRollRows(7.5)).toBe(8);
    expect(clampRollRows(1)).toBe(4);
    expect(clampRollRows(99)).toBe(8);
  });
  it('handles NaN, missing, and infinities', () => {
    expect(clampRollRows(NaN)).toBe(ROLL_DEFAULT_ROWS);
    expect(clampRollRows(undefined)).toBe(ROLL_DEFAULT_ROWS);
    expect(clampRollRows(Infinity)).toBe(8);
    expect(clampRollRows(-Infinity)).toBe(4);
  });
});

describe('buildRollRead', () => {
  it('returns no grids for an empty list', () => {
    expect(buildRollRead([w('1', '  ')])).toEqual({ grids: [], total: 0, rows: ROLL_DEFAULT_ROWS });
  });

  it('fills every grid with rows × 6 cells', () => {
    const data = buildRollRead(list(10), { rows: 4 });
    expect(data.grids).toHaveLength(1);
    expect(data.grids[0].rows).toHaveLength(4);
    for (const row of data.grids[0].rows) expect(row).toHaveLength(ROLL_COLS);
  });

  it('keeps list order on the first pass when not shuffled', () => {
    const data = buildRollRead(list(8), { rows: 4 });
    const flat = data.grids[0].rows.flat().map((c) => c.text);
    expect(flat.slice(0, 6)).toEqual(['word1', 'word2', 'word3', 'word4', 'word5', 'word6']);
  });

  it('uses every word at least once and adds grids for long lists', () => {
    for (let trial = 0; trial < 20; trial++) {
      const data = buildRollRead(list(30), { rows: 4, shuffleOrder: trial % 2 === 0 });
      expect(data.grids).toHaveLength(2); // 30 words > 24 cells
      const used = new Set(data.grids.flatMap((g) => g.rows.flat().map((c) => c.text)));
      expect(used.size).toBe(30);
    }
  });

  it('never repeats a word in a row, or directly above, when the list allows it', () => {
    for (let trial = 0; trial < 50; trial++) {
      const data = buildRollRead(list(9), { rows: 8 });
      const rows = data.grids[0].rows;
      rows.forEach((row, r) => {
        expect(new Set(row.map((c) => c.text)).size).toBe(ROLL_COLS);
        if (r > 0) row.forEach((c, col) => expect(c.text).not.toBe(rows[r - 1][col].text));
      });
    }
  });

  it('still fills the grid when the list is shorter than a row', () => {
    const data = buildRollRead(list(2), { rows: 4 });
    expect(data.total).toBe(2);
    expect(data.grids[0].rows.flat()).toHaveLength(24);
  });

  it('carries the image slot key and tier', () => {
    const data = buildRollRead([w('a', 'sun', 'key')], { rows: 4 });
    expect(data.grids[0].rows[0][0]).toEqual({ text: 'sun', slotId: 'slot-a', tier: 'key' });
  });
});
