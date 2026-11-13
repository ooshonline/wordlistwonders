// CSV / TSV word-table parsing (F3). Pure and DOM-free: turns text pasted from a
// spreadsheet (tab-separated) or a .csv/.tsv file into word rows of
// `word, clue, tier`. Header row and tier column are optional.

import type { Tier, WordSet } from './types';

export interface WordRow {
  text: string;
  clue?: string;
  tier: Tier;
}

const TIER_WORDS: Record<string, Tier> = {
  key: 'key',
  core: 'key',
  normal: 'normal',
  extra: 'normal',
  bonus: 'bonus',
};

/** Split one line on `delim`, honoring "double quotes" (with "" as an escaped quote). */
export function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"' && cur === '') quoted = true;
    else if (ch === delim) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Choose tab if any line has one, else comma. */
export function detectDelimiter(text: string): string {
  return /\t/.test(text) ? '\t' : ',';
}

/** True when pasted text looks like a table with a clue/tier column (has a tab). */
export function looksLikeTable(text: string): boolean {
  return /\t/.test(text);
}

/**
 * Parse a table into word rows. Blank lines and blank words are skipped. A first
 * row whose first cell is "word"/"words"/"vocabulary" is treated as a header.
 */
export function parseWordTable(text: string): WordRow[] {
  const delim = detectDelimiter(text);
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const rows: WordRow[] = [];
  lines.forEach((line, i) => {
    const cells = splitLine(line, delim);
    const word = cells[0] ?? '';
    if (!word) return;
    if (i === 0 && /^(words?|vocab(ulary)?|term)$/i.test(word)) return;
    const row: WordRow = { text: word, tier: 'normal' };
    // Third column is the tier; if the second column is a tier word and there's no
    // third, treat it as the tier (word, tier). Otherwise the second is the clue.
    const second = cells[1] ?? '';
    const third = (cells[2] ?? '').toLowerCase();
    if (third in TIER_WORDS) {
      row.tier = TIER_WORDS[third];
      if (second) row.clue = second;
    } else if (cells.length === 2 && second.toLowerCase() in TIER_WORDS) {
      row.tier = TIER_WORDS[second.toLowerCase()];
    } else if (second) row.clue = second;
    rows.push(row);
  });
  return rows;
}

/** Build a brand-new set from a CSV/TSV file's text. Throws a friendly error if empty. */
export function tableToSet(text: string, fileName: string): WordSet {
  const rows = parseWordTable(text);
  if (rows.length === 0) throw new Error('No words found in that file.');
  const stamp = Date.now();
  const name = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Imported List';
  return {
    id: 'set-' + stamp,
    name,
    words: rows.map((r, i) => ({ id: `w-${stamp}-${i}`, text: r.text, tier: r.tier, ...(r.clue ? { clue: r.clue } : {}) })),
    carouselSpeed: 4,
    theme: '',
    gradeLevel: '',
    tags: [],
    ttsVoice: 'us',
    positions: {},
    cardScale: {},
    printBlanks: {},
    printMode: 'manual',
    printRandomPercent: 30,
  };
}
