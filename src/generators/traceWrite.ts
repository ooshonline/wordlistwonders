// Pure "Trace & Write" generator. No DOM, no side effects, so it stays
// unit-testable.
//
// A Trace & Write sheet is handwriting practice: each word is printed in hollow
// letters to trace (1–3 times) on writing guide lines, with an empty set of the
// same guide lines underneath to copy it. Every eligible word gets one row;
// more pages are added so nothing is dropped.

import type { Word } from '../types';
import { rollEligible } from './rollRead';

/** Words per page the worksheet offers (fewer = bigger writing lines). */
export const TRACE_PER_PAGE_CHOICES = [3, 4, 6] as const;
export const TRACE_DEFAULT_PER_PAGE = 4;
/** How many hollow copies of the word to trace on each row. */
export const TRACE_REPEAT_CHOICES = [1, 2, 3] as const;
export const TRACE_DEFAULT_REPEATS = 2;

export interface TraceItem {
  num: number;
  /** The word as the teacher typed it (trimmed, inner spaces collapsed). */
  text: string;
  /** Image-slot key (`slot-<id>`) for an optional picture cue. */
  slotId: string;
}

export interface TraceWriteData {
  pages: TraceItem[][];
  /** Distinct words used (after blanks + duplicates are dropped). */
  total: number;
  perPage: number;
}

const norm = (text: string) => (text || '').trim().replace(/\s+/g, ' ');

/** Snap any number to the nearest choice (NaN / missing → fallback). */
export function snapChoice(n: number | undefined, choices: readonly number[], fallback: number): number {
  if (n === Infinity) return choices[choices.length - 1];
  if (n === -Infinity) return choices[0];
  if (n === undefined || !Number.isFinite(n)) return fallback;
  let best = choices[0];
  for (const c of choices) if (Math.abs(c - n) < Math.abs(best - n)) best = c;
  return best;
}

/** Split the list into pages of `perPage` numbered rows (list order). */
export function buildTraceWrite(words: Word[], perPageIn?: number): TraceWriteData {
  const perPage = snapChoice(perPageIn, TRACE_PER_PAGE_CHOICES, TRACE_DEFAULT_PER_PAGE);
  const items: TraceItem[] = rollEligible(words).map((w, i) => ({
    num: i + 1,
    text: norm(w.text),
    slotId: 'slot-' + w.id,
  }));
  const pages: TraceItem[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return { pages, total: items.length, perPage };
}

/** Rough width of `text` in em for Nunito ExtraBold — a little generous so
 *  the hollow letters never run past the margin. */
export function textEm(text: string): number {
  let em = 0;
  for (const ch of text) {
    if ('mwMW'.includes(ch)) em += 0.95;
    else if ('ijlt.,\'!|I '.includes(ch)) em += 0.38;
    else if (ch >= 'A' && ch <= 'Z') em += 0.75;
    else em += 0.64;
  }
  return Math.max(0.64, em);
}

/**
 * Font size (px) for the hollow trace word so it fits one writing band.
 * Capped by the band height (room for ascenders above and descenders below the
 * baseline) and by width: `repeats` copies side by side, `gapPx` apart, plus
 * a little left padding.
 */
export function traceFontPx(text: string, repeats: number, bandPx: number, widthPx: number, gapPx = 28): number {
  const copies = Math.max(1, repeats);
  const byHeight = bandPx * 0.8;
  const byWidth = (widthPx - 12 - (copies - 1) * gapPx) / (copies * textEm(text));
  return Math.max(10, Math.floor(Math.min(byHeight, byWidth)));
}
