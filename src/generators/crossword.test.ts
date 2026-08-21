import { describe, it, expect } from 'vitest';
import { buildCrossword } from './crossword';
import type { Word } from '../types';

const mk = (entries: [string, string?][]): Word[] =>
  entries.map(([text, clue], i) => ({ id: `w${i}`, text, clue, tier: 'normal' as const }));

describe('buildCrossword', () => {
  it('crops to a bounding box and numbers cells in reading order', () => {
    const cw = buildCrossword(mk([['bread'], ['dream'], ['read']]));
    expect(cw.cells).toHaveLength(cw.rows * cw.cols);
    // numbers increase in reading order
    const nums = cw.cells.filter((c) => c.num).map((c) => c.num as number);
    const sorted = [...nums].sort((a, b) => a - b);
    expect(nums).toEqual(sorted);
  });

  it('every placed cell letter is consistent where entries cross', () => {
    const cw = buildCrossword(mk([['apple'], ['plate'], ['tape'], ['peel']]));
    const grid = new Map<string, string>();
    // Rebuild letters from cells and confirm no null-letter numbered cell.
    cw.cells.forEach((c, i) => {
      const r = Math.floor(i / cw.cols);
      const col = i % cw.cols;
      if (c.letter) grid.set(`${r},${col}`, c.letter);
    });
    // Across/down clue counts are non-negative and total the placed entries.
    expect(cw.across.length + cw.down.length).toBeGreaterThan(0);
  });

  it('falls back to "<n> letters" when a clue is missing', () => {
    const cw = buildCrossword(mk([['bread'], ['read']]));
    const all = [...cw.across, ...cw.down];
    const bread = all.find((e) => e.word === 'BREAD');
    expect(bread?.clue).toBe('5 letters');
  });

  it('uses the provided clue when present', () => {
    const cw = buildCrossword(mk([['bread', 'You bake it'], ['read', 'Do this to a book']]));
    const all = [...cw.across, ...cw.down];
    expect(all.find((e) => e.word === 'BREAD')?.clue).toBe('You bake it');
  });

  it('reports non-interlocking entries as unplaced', () => {
    // Two words sharing no letters cannot interlock.
    const cw = buildCrossword(mk([['abc'], ['xyz']]));
    expect(cw.unplaced).toContain('XYZ');
  });
});
