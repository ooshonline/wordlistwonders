// Word-list export / import (F2). Pure, DOM-free helpers so a teacher can back up
// a set to a `.json` file and load it back — on another computer or to share with
// a colleague. Word ids are preserved on import so uploaded images (keyed
// `slot-<wordId>`) line up again where the same browser already holds them; the
// *set* gets a fresh id so importing never clobbers an existing list.

import type { Tier, Voice, WordSet, Word } from './types';

/** File wrapper markers so we can recognize our own export on import. */
export const SET_FILE_APP = 'wordlist-wonders';
export const SET_FILE_VERSION = 1;

interface SetFile {
  app: string;
  version: number;
  exportedAt: string;
  set: WordSet;
}

const VALID_TIERS: Tier[] = ['key', 'normal', 'bonus'];

/** Serialize a set into the downloadable file text (pretty-printed JSON). */
export function serializeSet(set: WordSet): string {
  const file: SetFile = {
    app: SET_FILE_APP,
    version: SET_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    set,
  };
  return JSON.stringify(file, null, 2);
}

/** A filesystem-friendly download name for a set, e.g. "Food Words" → "food-words". */
export function setFilename(name: string): string {
  const slug = (name || 'word-list')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'word-list'}.wordlist.json`;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Normalize one raw word entry, preserving its id and any known fields. */
function normalizeWord(raw: unknown, stamp: number, i: number): Word | null {
  if (!isObj(raw)) return null;
  const text = typeof raw.text === 'string' ? raw.text.trim() : '';
  if (!text) return null; // real-data-only: skip blank entries rather than invent words
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `w-${stamp}-${i}`;
  const tier = VALID_TIERS.includes(raw.tier as Tier) ? (raw.tier as Tier) : 'normal';
  const word: Word = { id, text, tier };
  if (typeof raw.clue === 'string' && raw.clue.trim()) word.clue = raw.clue.trim();
  if (typeof raw.gloss === 'string' && raw.gloss.trim()) word.gloss = raw.gloss.trim();
  if (typeof raw.color === 'string') word.color = raw.color;
  if (raw.audioRecorded === true) word.audioRecorded = true;
  return word;
}

/**
 * Parse a `.json` file's text into a clean WordSet ready to add to the store.
 * Accepts our own export wrapper or a bare set object (a hand-edited file).
 * Throws an Error with a teacher-friendly message when the file can't be used.
 */
export function parseSetFile(text: string, newSetId?: string): WordSet {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON — please choose a list exported from Wordlist Wonders.");
  }

  // Unwrap either { app, version, set } or a bare set that has a `words` array.
  let raw: Record<string, unknown> | null = null;
  if (isObj(data) && isObj(data.set)) raw = data.set;
  else if (isObj(data) && Array.isArray(data.words)) raw = data;
  if (!raw || !Array.isArray(raw.words)) {
    throw new Error("This doesn't look like a Wordlist Wonders list.");
  }

  const stamp = Date.now();
  const words = raw.words
    .map((w, i) => normalizeWord(w, stamp, i))
    .filter((w): w is Word => w !== null);

  if (words.length === 0) {
    throw new Error('This list has no words in it.');
  }

  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === 'string' && t.trim() !== '')
    : [];

  const set: WordSet = {
    id: newSetId || 'set-' + stamp,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Imported List',
    words,
    carouselSpeed: typeof raw.carouselSpeed === 'number' && raw.carouselSpeed > 0 ? raw.carouselSpeed : 4,
    theme: typeof raw.theme === 'string' ? raw.theme : '',
    gradeLevel: typeof raw.gradeLevel === 'string' ? raw.gradeLevel : '',
    tags,
    ttsVoice: raw.ttsVoice === 'uk' ? ('uk' as Voice) : ('us' as Voice),
    positions: isObj(raw.positions) ? (raw.positions as WordSet['positions']) : {},
    cardScale: isObj(raw.cardScale) ? (raw.cardScale as WordSet['cardScale']) : {},
    printBlanks: isObj(raw.printBlanks) ? (raw.printBlanks as WordSet['printBlanks']) : {},
    printMode: raw.printMode === 'random' ? 'random' : 'manual',
    printRandomPercent: typeof raw.printRandomPercent === 'number' ? raw.printRandomPercent : 30,
  };
  return set;
}
