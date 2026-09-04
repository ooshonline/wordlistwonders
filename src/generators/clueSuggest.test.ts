import { describe, it, expect } from 'vitest';
import { suggestClue, fillMissingClues, hasClue } from './clueSuggest';
import type { Word } from '../types';

const w = (p: Partial<Word> & { text: string }): Word => ({
  id: p.id ?? 'x',
  tier: 'normal',
  ...p,
});

describe('suggestClue', () => {
  it('never overwrites an existing clue', () => {
    expect(suggestClue(w({ text: 'apple', clue: 'A red fruit.' }))).toBeNull();
    // whitespace-only clue counts as blank
    expect(suggestClue(w({ text: 'apple', clue: '   ' }))).not.toBeNull();
  });

  it('returns null for a blank word', () => {
    expect(suggestClue(w({ text: '   ' }))).toBeNull();
    expect(suggestClue(w({ text: '' }))).toBeNull();
  });

  it('uses the translation gloss when present', () => {
    expect(suggestClue(w({ text: 'bread', gloss: 'el pan' }))).toBe('Translation: "el pan" · 5 letters');
  });

  it('falls back to a first/last-letter hint with no gloss', () => {
    expect(suggestClue(w({ text: 'bread' }))).toBe('Starts with "B", ends with "D" · 5 letters');
  });

  it('drops the "ends with" for short or same-end words', () => {
    expect(suggestClue(w({ text: 'go' }))).toBe('Starts with "G" · 2 letters');
    // first letter === last letter → no giveaway repetition
    expect(suggestClue(w({ text: 'level' }))).toBe('Starts with "L" · 5 letters');
  });

  it('never contains the answer word', () => {
    // (a 1-letter word is pathological — its only letter is the answer — and is
    // never a real crossword entry, so it's out of scope here.)
    const words = ['apple', 'go', 'level', 'banana', 'echo'];
    for (const text of words) {
      const clue = suggestClue(w({ text }))!;
      expect(clue.toLowerCase()).not.toContain(text.toLowerCase());
    }
  });

  it('ignores a gloss that would reveal the answer, using the letter hint', () => {
    // gloss equal to (or containing) the word must not be surfaced as the clue
    const clue = suggestClue(w({ text: 'taxi', gloss: 'taxi' }))!;
    expect(clue).toBe('Starts with "T", ends with "I" · 4 letters');
  });
});

describe('fillMissingClues', () => {
  it('fills only the blanks and reports the count', () => {
    const words: Word[] = [
      w({ id: 'a', text: 'apple', clue: 'A red fruit.' }),
      w({ id: 'b', text: 'bread', gloss: 'el pan' }),
      w({ id: 'c', text: 'cat' }),
    ];
    const { words: out, filled } = fillMissingClues(words);
    expect(filled).toBe(2);
    expect(out[0].clue).toBe('A red fruit.'); // untouched
    expect(out[1].clue).toBe('Translation: "el pan" · 5 letters');
    expect(out[2].clue).toBe('Starts with "C", ends with "T" · 3 letters');
    // every word now has a clue
    expect(out.every(hasClue)).toBe(true);
  });

  it('returns the same array reference when nothing is blank', () => {
    const words: Word[] = [w({ id: 'a', text: 'apple', clue: 'A red fruit.' })];
    const { words: out, filled } = fillMissingClues(words);
    expect(filled).toBe(0);
    expect(out).toBe(words);
  });
});
