import { describe, it, expect } from 'vitest';
import {
  buildSecretCards,
  clampSecretSeconds,
  secretModeInfo,
  SECRET_DEFAULT_SECONDS,
  SECRET_MODES,
} from './secretWord';
import type { Tier, Word } from '../types';

const w = (id: string, text: string, tier: Tier = 'normal', extra: Partial<Word> = {}): Word => ({
  id,
  text,
  tier,
  ...extra,
});

describe('buildSecretCards', () => {
  it('numbers cards 1..N in list order with slot ids and trimmed text', () => {
    const cards = buildSecretCards([w('a', ' apple ', 'key', { clue: 'A fruit.' }), w('b', 'bread')]);
    expect(cards).toEqual([
      { index: 1, word: 'apple', clue: 'A fruit.', slotId: 'slot-a', tier: 'key' },
      { index: 2, word: 'bread', clue: undefined, slotId: 'slot-b', tier: 'normal' },
    ]);
  });

  it('skips blank words and case-insensitive duplicates', () => {
    const cards = buildSecretCards([w('1', 'Cat'), w('2', '  '), w('3', 'cat '), w('4', 'dog'), w('5', '')]);
    expect(cards.map((c) => c.word)).toEqual(['Cat', 'dog']);
    expect(cards.map((c) => c.index)).toEqual([1, 2]);
  });

  it('treats a blank clue as no clue', () => {
    expect(buildSecretCards([w('1', 'sun', 'normal', { clue: '   ' })])[0].clue).toBeUndefined();
  });

  it('shuffles without losing or duplicating words, renumbering 1..N', () => {
    const words = 'one two three four five six seven eight'.split(' ').map((t, i) => w(String(i), t));
    const cards = buildSecretCards(words, { shuffleOrder: true });
    expect(cards.map((c) => c.word).sort()).toEqual(words.map((x) => x.text).sort());
    expect(cards.map((c) => c.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('returns no cards for an empty list', () => {
    expect(buildSecretCards([])).toEqual([]);
  });
});

describe('clampSecretSeconds', () => {
  it('keeps allowed choices and snaps others to the nearest one', () => {
    expect(clampSecretSeconds(0)).toBe(0);
    expect(clampSecretSeconds(60)).toBe(60);
    expect(clampSecretSeconds(40)).toBe(30);
    expect(clampSecretSeconds(500)).toBe(90);
    expect(clampSecretSeconds(-5)).toBe(0);
  });

  it('falls back to the default for NaN / Infinity', () => {
    expect(clampSecretSeconds(NaN)).toBe(SECRET_DEFAULT_SECONDS);
    expect(clampSecretSeconds(Infinity)).toBe(SECRET_DEFAULT_SECONDS);
  });
});

describe('secretModeInfo', () => {
  it('returns the matching mode, with a label and instruction for each', () => {
    expect(secretModeInfo('draw').emoji).toBe('✏️');
    for (const m of SECRET_MODES) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.instruction.length).toBeGreaterThan(0);
    }
  });
});
