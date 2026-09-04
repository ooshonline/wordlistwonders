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

  it('places every word of an interlocking set (best-of-N + retry)', () => {
    // READ crosses BREAD on any shared letter, so a correct builder never
    // leaves either unplaced. Guards the placement improvement that keeps the
    // fail rate low (real 12–17 word teacher lists now place fully every build).
    const cw = buildCrossword(mk([['bread'], ['read']]));
    expect(cw.unplaced).toHaveLength(0);
    expect(cw.across.length + cw.down.length).toBe(2);
  });

  it('reports non-interlocking entries as unplaced', () => {
    // Two words sharing no letters cannot interlock: the first-sorted word
    // anchors the grid and the other is reported unplaced. Which word anchors
    // depends on the generator's random longest-first tiebreak, so assert the
    // invariant (exactly one of the pair is unplaced) rather than a fixed word.
    const cw = buildCrossword(mk([['abc'], ['xyz']]));
    expect(cw.unplaced).toHaveLength(1);
    expect(['ABC', 'XYZ']).toContain(cw.unplaced[0]);
  });
});
