import { describe, it, expect } from 'vitest';
import { buildWordSearch } from './wordsearch';
import type { Word } from '../types';

const mk = (texts: string[]): Word[] => texts.map((t, i) => ({ id: `w${i}`, text: t, tier: 'normal' as const }));

describe('buildWordSearch', () => {
  it('fills the whole grid with A–Z letters', () => {
    const ws = buildWordSearch(mk(['cat', 'dog', 'fish']), 10, true, false);
    expect(ws.cells).toHaveLength(100);
    expect(ws.cells.every((c) => /^[A-Z]$/.test(c.ch))).toBe(true);
  });

  it('every placed word is actually findable along a straight line', () => {
    const ws = buildWordSearch(mk(['apple', 'bread', 'water', 'chicken']), 14, true, true);
    const size = ws.size;
    const grid: string[][] = [];
    for (let r = 0; r < size; r++) grid.push(ws.cells.slice(r * size, r * size + size).map((c) => c.ch));

    const dirs = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
      [-1, 0],
      [0, -1],
      [-1, -1],
      [-1, 1],
    ];
    const findable = (word: string) => {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          for (const [dc, dr] of dirs) {
            let ok = true;
            for (let i = 0; i < word.length; i++) {
              const rr = r + dr * i;
              const cc = c + dc * i;
              if (rr < 0 || rr >= size || cc < 0 || cc >= size || grid[rr][cc] !== word[i]) {
                ok = false;
                break;
              }
            }
            if (ok) return true;
          }
        }
      }
      return false;
    };
    ws.bank.forEach((w) => expect(findable(w)).toBe(true));
  });

  it('reports words too long for the grid as unplaced', () => {
    const ws = buildWordSearch(mk(['extraordinary']), 8, true, false); // 13 > 8
    expect(ws.bank).toHaveLength(0);
    expect(ws.unplaced).toContain('EXTRAORDINARY');
  });

  it('dedupes and drops single-letter words', () => {
    const ws = buildWordSearch(mk(['cat', 'cat', 'a']), 10, false, false);
    expect(ws.bank.filter((w) => w === 'CAT')).toHaveLength(1);
    expect(ws.bank).not.toContain('A');
  });
});
