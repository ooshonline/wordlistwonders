import { describe, expect, it } from 'vitest';
import type { Word } from '../types';
import { buildTraceWrite, snapChoice, textEm, traceFontPx, TRACE_PER_PAGE_CHOICES } from './traceWrite';

const w = (text: string, i: number): Word => ({ id: 'w' + i, text, tier: 'normal' }) as Word;
const list = (...texts: string[]) => texts.map(w);

describe('buildTraceWrite', () => {
  it('numbers every word once, in list order, across pages', () => {
    const data = buildTraceWrite(list('cat', 'dog', 'sun', 'hat', 'pen'), 4);
    expect(data.total).toBe(5);
    expect(data.pages.map((p) => p.length)).toEqual([4, 1]);
    expect(data.pages.flat().map((x) => `${x.num}${x.text}`)).toEqual(['1cat', '2dog', '3sun', '4hat', '5pen']);
    expect(data.pages[0][0].slotId).toBe('slot-w0');
  });

  it('drops blanks and case-insensitive duplicates, tidies spaces', () => {
    const data = buildTraceWrite(list('  ice   cream ', '', 'Cat', 'cat', '   '), 6);
    expect(data.pages.flat().map((x) => x.text)).toEqual(['ice cream', 'Cat']);
  });

  it('returns no pages for an empty list', () => {
    expect(buildTraceWrite([], 4)).toEqual({ pages: [], total: 0, perPage: 4 });
  });

  it('snaps words-per-page to an offered choice', () => {
    expect(buildTraceWrite([], 5).perPage).toBe(4);
    expect(buildTraceWrite([], NaN).perPage).toBe(4);
    expect(buildTraceWrite([], 99).perPage).toBe(6);
  });
});

describe('snapChoice', () => {
  it('picks the nearest choice and handles odd input', () => {
    expect(snapChoice(2, TRACE_PER_PAGE_CHOICES, 4)).toBe(3);
    expect(snapChoice(undefined, TRACE_PER_PAGE_CHOICES, 4)).toBe(4);
    expect(snapChoice(Infinity, TRACE_PER_PAGE_CHOICES, 4)).toBe(6);
    expect(snapChoice(-Infinity, TRACE_PER_PAGE_CHOICES, 4)).toBe(3);
  });
});

describe('traceFontPx', () => {
  it('fills the band height for a short word', () => {
    expect(traceFontPx('cat', 1, 80, 600)).toBe(64);
  });

  it('shrinks long words and extra copies to fit the width', () => {
    const one = traceFontPx('breakfast', 1, 80, 600);
    const three = traceFontPx('breakfast', 3, 80, 600);
    expect(three).toBeLessThan(one);
    // 3 copies + 2 gaps must fit the row width
    expect(3 * textEm('breakfast') * three + 2 * 28 + 12).toBeLessThanOrEqual(600);
  });

  it('gives wide letters more room than narrow ones', () => {
    expect(textEm('mom')).toBeGreaterThan(textEm('lit'));
    expect(traceFontPx('mom', 3, 105, 441)).toBeLessThan(traceFontPx('lit', 3, 105, 441));
  });

  it('never drops below a readable minimum', () => {
    expect(traceFontPx('a'.repeat(200), 3, 80, 600)).toBe(10);
  });
});
