import { describe, expect, it } from 'vitest';
import { searchCellPx } from './searchLayout';

describe('searchCellPx', () => {
  it('keeps the full 46px cells for a short title and a normal bank', () => {
    expect(searchCellPx(12, 15, 30)).toBe(46);
  });

  it('caps cells by width on wide grids', () => {
    expect(searchCellPx(16, 0, 30)).toBe(43);
  });

  it('shrinks cells when a long title wraps (B9: Food list + credit line)', () => {
    const title = 'Everyday Food & Drink (CEFR A1–A2) — Word Search (Answer Key)';
    expect(searchCellPx(12, 17, title.length)).toBeLessThan(46);
  });

  it('shrinks cells for a long word bank', () => {
    expect(searchCellPx(15, 40, 30)).toBeLessThan(searchCellPx(15, 12, 30));
  });

  it('never goes below the minimum and survives odd input', () => {
    expect(searchCellPx(30, 200, 200)).toBe(16);
    expect(searchCellPx(0, 0)).toBe(46);
  });
});
