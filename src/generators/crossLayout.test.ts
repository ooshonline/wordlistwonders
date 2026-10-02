import { describe, expect, it } from 'vitest';
import { clueBlockHeight, crossLayout } from './crossLayout';

const clues = (n: number, len = 20) => Array.from({ length: n }, () => ({ clue: 'x'.repeat(len) }));

describe('crossLayout', () => {
  it('keeps the width-based size for a small, square grid', () => {
    expect(crossLayout(10, 10, clues(5), clues(5))).toEqual({ cellPx: 34, side: false });
  });

  it('shrinks cells for a tall, wide grid so grid + clues fit the page', () => {
    const { cellPx, side } = crossLayout(21, 18, clues(6), clues(6));
    expect(side).toBe(false);
    expect(cellPx).toBeLessThan(30);
    expect(21 * cellPx + 28 + clueBlockHeight(clues(6), 342)).toBeLessThanOrEqual(779);
  });

  it('prefers clues beside a tall grid when that allows bigger cells', () => {
    const { cellPx, side } = crossLayout(21, 14, clues(6), clues(6));
    expect(side).toBe(true);
    expect(cellPx).toBeGreaterThan(26);
  });

  it('moves clues beside a tall, narrow grid with many clues', () => {
    const a = clues(11, 40);
    const d = clues(10, 40);
    const { cellPx, side } = crossLayout(27, 11, a, d);
    expect(side).toBe(true);
    expect(cellPx).toBeGreaterThanOrEqual(16);
    expect(27 * cellPx).toBeLessThanOrEqual(779);
    const clueW = 712 - 28 - 11 * cellPx;
    expect(clueBlockHeight(a, clueW) + 16 + clueBlockHeight(d, clueW)).toBeLessThanOrEqual(779);
  });

  it('reserves room when a long title wraps to two lines', () => {
    const short = crossLayout(25, 11, clues(6, 30), clues(6, 30), 30);
    const long = crossLayout(25, 11, clues(6, 30), clues(6, 30), 70);
    expect(long.cellPx).toBeLessThan(short.cellPx);
    expect(25 * long.cellPx).toBeLessThanOrEqual(779 - 41);
  });

  it('never goes below the 16px floor', () => {
    expect(crossLayout(60, 30, clues(30, 80), clues(30, 80)).cellPx).toBe(16);
  });

  it('handles an empty grid', () => {
    expect(crossLayout(0, 0, [], [])).toEqual({ cellPx: 34, side: false });
  });
});
