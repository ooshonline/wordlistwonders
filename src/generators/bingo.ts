// Pure bingo-card generator. No DOM. Ported from the prototype's
// buildBingoGrid / buildBingoCardsArray.

import type { Word } from '../types';
import { shuffle } from './random';

export type BingoCell =
  | { free: true }
  | { blank: true }
  | { id: string };

export interface BingoCard {
  size: number;
  cells: BingoCell[];
}

/** Auto grid size from list length: >=24 -> 5, >=15 -> 4, >=8 -> 3, else 2. */
export function autoBingoSize(n: number): number {
  return n >= 24 ? 5 : n >= 15 ? 4 : n >= 8 ? 3 : 2;
}

export function buildBingoGrid(
  words: Word[],
  sizeOverride: string | number | undefined,
  allowRepeat: boolean,
): BingoCard {
  const n = words.length;
  const size =
    sizeOverride && sizeOverride !== 'auto'
      ? parseInt(String(sizeOverride), 10)
      : autoBingoSize(n);
  const hasFree = size % 2 === 1;
  const total = size * size - (hasFree ? 1 : 0);
  const ids = words.map((w) => w.id);

  let pool: (string | null)[] = [];
  if (ids.length >= total) {
    pool = shuffle(ids).slice(0, total);
  } else if (allowRepeat) {
    // Reshuffle + concatenate the pool until the grid is full (words repeat).
    while (pool.length < total) pool = pool.concat(shuffle(ids));
    pool = pool.slice(0, total);
  } else {
    // One-of-each: leftover squares become blanks at shuffled positions.
    pool = shuffle(ids);
    while (pool.length < total) pool.push(null);
    pool = shuffle(pool);
  }

  const grid: BingoCell[] = [];
  let pi = 0;
  const mid = Math.floor((size * size) / 2);
  for (let i = 0; i < size * size; i++) {
    if (hasFree && i === mid) {
      grid.push({ free: true });
    } else {
      grid.push(pool[pi] ? { id: pool[pi] as string } : { blank: true });
      pi++;
    }
  }
  return { size, cells: grid };
}

export function buildBingoCards(
  words: Word[],
  count: number,
  gridSize: string | number | undefined,
  allowRepeat: boolean,
): BingoCard[] {
  const cards: BingoCard[] = [];
  for (let i = 0; i < count; i++) cards.push(buildBingoGrid(words, gridSize, allowRepeat));
  return cards;
}
