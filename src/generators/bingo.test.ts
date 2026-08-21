import { describe, it, expect } from 'vitest';
import { autoBingoSize, buildBingoGrid, buildBingoCards } from './bingo';
import type { Word } from '../types';

const words = (n: number): Word[] =>
  Array.from({ length: n }, (_, i) => ({ id: `w${i}`, text: `word${i}`, tier: 'normal' as const }));

describe('autoBingoSize', () => {
  it('scales grid to list length', () => {
    expect(autoBingoSize(30)).toBe(5);
    expect(autoBingoSize(24)).toBe(5);
    expect(autoBingoSize(20)).toBe(4);
    expect(autoBingoSize(15)).toBe(4);
    expect(autoBingoSize(10)).toBe(3);
    expect(autoBingoSize(8)).toBe(3);
    expect(autoBingoSize(5)).toBe(2);
  });
});

describe('buildBingoGrid', () => {
  it('places a FREE center square on odd grids only', () => {
    const odd = buildBingoGrid(words(30), '3', false);
    const mid = Math.floor((odd.size * odd.size) / 2);
    expect(odd.cells[mid]).toEqual({ free: true });

    const even = buildBingoGrid(words(30), '4', false);
    expect(even.cells.some((c) => 'free' in c)).toBe(false);
  });

  it('one-of-each never repeats a word on a card', () => {
    const card = buildBingoGrid(words(30), '5', false);
    const ids = card.cells.filter((c): c is { id: string } => 'id' in c).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('one-of-each leaves blanks when the list is too short', () => {
    const card = buildBingoGrid(words(5), '4', false); // 16 squares, 5 words
    const blanks = card.cells.filter((c) => 'blank' in c).length;
    const filled = card.cells.filter((c) => 'id' in c).length;
    expect(filled).toBe(5);
    expect(blanks).toBe(11);
  });

  it('repeat-to-fill fills every square with no blanks', () => {
    const card = buildBingoGrid(words(5), '4', true); // 16 squares
    expect(card.cells.filter((c) => 'blank' in c).length).toBe(0);
    expect(card.cells.filter((c) => 'id' in c).length).toBe(16);
  });
});

describe('buildBingoCards', () => {
  it('returns the requested number of independently built cards', () => {
    const cards = buildBingoCards(words(24), 6, 'auto', false);
    expect(cards).toHaveLength(6);
    cards.forEach((c) => expect(c.size).toBe(5));
  });
});
