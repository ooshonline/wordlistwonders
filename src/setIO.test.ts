import { describe, it, expect } from 'vitest';
import { serializeSet, parseSetFile, setFilename, SET_FILE_APP, SET_FILE_VERSION } from './setIO';
import type { WordSet } from './types';

const sampleSet: WordSet = {
  id: 'set-food',
  name: 'Food Words',
  carouselSpeed: 5,
  theme: 'Food',
  gradeLevel: 'K-2',
  tags: ['esl', 'a1'],
  ttsVoice: 'uk',
  positions: { 'w-1': { x: 10, y: 20 } },
  cardScale: { 'w-1': 1.2 },
  printBlanks: { 'w-1': true },
  printMode: 'manual',
  printRandomPercent: 40,
  words: [
    { id: 'w-1', text: 'apple', clue: 'A red fruit', gloss: 'la manzana', tier: 'key', color: '#f00' },
    { id: 'w-2', text: 'bread', tier: 'normal' },
    { id: 'w-3', text: 'milk', tier: 'bonus', audioRecorded: true },
  ],
};

describe('serializeSet', () => {
  it('wraps the set with app + version markers', () => {
    const parsed = JSON.parse(serializeSet(sampleSet));
    expect(parsed.app).toBe(SET_FILE_APP);
    expect(parsed.version).toBe(SET_FILE_VERSION);
    expect(parsed.set.name).toBe('Food Words');
    expect(typeof parsed.exportedAt).toBe('string');
  });
});

describe('setFilename', () => {
  it('slugifies the set name', () => {
    expect(setFilename('Food Words')).toBe('food-words.wordlist.json');
    expect(setFilename('  Colors & Shapes!  ')).toBe('colors-shapes.wordlist.json');
  });
  it('falls back for an empty name', () => {
    expect(setFilename('')).toBe('word-list.wordlist.json');
    expect(setFilename('!!!')).toBe('word-list.wordlist.json');
  });
});

describe('parseSetFile round-trip', () => {
  it('restores the set from its own export', () => {
    const set = parseSetFile(serializeSet(sampleSet));
    expect(set.name).toBe('Food Words');
    expect(set.words).toHaveLength(3);
    expect(set.carouselSpeed).toBe(5);
    expect(set.ttsVoice).toBe('uk');
    expect(set.tags).toEqual(['esl', 'a1']);
  });

  it('preserves word ids so images travel', () => {
    const set = parseSetFile(serializeSet(sampleSet));
    expect(set.words.map((w) => w.id)).toEqual(['w-1', 'w-2', 'w-3']);
    expect(set.words[0].clue).toBe('A red fruit');
    expect(set.words[0].gloss).toBe('la manzana');
    expect(set.words[2].audioRecorded).toBe(true);
  });

  it('assigns a fresh set id (never clobbers an existing set)', () => {
    const set = parseSetFile(serializeSet(sampleSet));
    expect(set.id).not.toBe('set-food');
    expect(set.id.startsWith('set-')).toBe(true);
  });

  it('honors an explicit new set id', () => {
    const set = parseSetFile(serializeSet(sampleSet), 'set-custom');
    expect(set.id).toBe('set-custom');
  });
});

describe('parseSetFile leniency + defaults', () => {
  it('accepts a bare set object (hand-edited file)', () => {
    const bare = JSON.stringify({ name: 'Quick', words: [{ text: 'sun', tier: 'normal' }] });
    const set = parseSetFile(bare);
    expect(set.name).toBe('Quick');
    expect(set.words[0].text).toBe('sun');
  });

  it('fills defaults for a minimal file', () => {
    const set = parseSetFile(JSON.stringify({ words: [{ text: 'sun' }] }));
    expect(set.name).toBe('Imported List');
    expect(set.carouselSpeed).toBe(4);
    expect(set.ttsVoice).toBe('us');
    expect(set.printMode).toBe('manual');
    expect(set.words[0].tier).toBe('normal');
    expect(set.words[0].id.startsWith('w-')).toBe(true);
  });

  it('coerces an unknown tier to normal', () => {
    const set = parseSetFile(JSON.stringify({ words: [{ text: 'sun', tier: 'wild' }] }));
    expect(set.words[0].tier).toBe('normal');
  });

  it('skips blank / malformed word entries but keeps real ones', () => {
    const set = parseSetFile(
      JSON.stringify({ words: [{ text: '  ' }, 'nope', { text: 'moon' }, { id: 'x' }] }),
    );
    expect(set.words).toHaveLength(1);
    expect(set.words[0].text).toBe('moon');
  });

  it('drops non-string tags', () => {
    const set = parseSetFile(JSON.stringify({ words: [{ text: 'sun' }], tags: ['a', 3, null, 'b'] }));
    expect(set.tags).toEqual(['a', 'b']);
  });
});

describe('parseSetFile errors', () => {
  it('rejects invalid JSON', () => {
    expect(() => parseSetFile('{not json')).toThrow(/valid JSON/);
  });
  it('rejects a file with no words array', () => {
    expect(() => parseSetFile(JSON.stringify({ hello: 'world' }))).toThrow(/Wordlist Wonders list/);
  });
  it('rejects a list with zero usable words', () => {
    expect(() => parseSetFile(JSON.stringify({ words: [{ text: '' }, 'bad'] }))).toThrow(/no words/);
  });
});
