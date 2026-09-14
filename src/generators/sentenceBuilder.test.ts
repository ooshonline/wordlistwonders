import { describe, it, expect } from 'vitest';
import {
  buildSentenceSet,
  sentenceEligible,
  fillPrompt,
  SENTENCE_PROMPTS,
  SENTENCE_BASE_PROMPT,
} from './sentenceBuilder';
import type { Tier, Word } from '../types';

const w = (
  id: string,
  text: string,
  tier: Tier = 'normal',
  extra: Partial<Word> = {},
): Word => ({ id, text, tier, ...extra });

const list: Word[] = [
  w('1', 'apple', 'key', { clue: 'A round fruit.', gloss: 'la manzana' }),
  w('2', 'bread'),
  w('3', 'cheese', 'bonus', { clue: 'Made from milk.' }),
  w('4', 'grape'),
];

describe('sentenceEligible', () => {
  it('keeps words with real text and drops blank ones', () => {
    const words = [w('1', 'apple'), w('2', '   '), w('3', ''), w('4', 'pear')];
    expect(sentenceEligible(words).map((x) => x.id)).toEqual(['1', '4']);
  });
});

describe('fillPrompt', () => {
  it('substitutes every {word} token', () => {
    expect(fillPrompt('Use "{word}" and "{word}".', 'cat')).toBe('Use "cat" and "cat".');
  });
  it('returns the template unchanged when there is no token', () => {
    expect(fillPrompt('No token here.', 'cat')).toBe('No token here.');
  });
});

describe('buildSentenceSet', () => {
  it('numbers cards 1..N in list order by default', () => {
    const data = buildSentenceSet(list);
    expect(data.total).toBe(4);
    expect(data.cards.map((c) => c.index)).toEqual([1, 2, 3, 4]);
    expect(data.cards.map((c) => c.word)).toEqual(['apple', 'bread', 'cheese', 'grape']);
    expect(data.mode).toBe('mixed');
  });

  it('carries the image-slot key and tier for each card', () => {
    const data = buildSentenceSet(list);
    expect(data.cards[0].slotId).toBe('slot-1');
    expect(data.cards[0].tier).toBe('key');
    expect(data.cards[2].tier).toBe('bonus');
  });

  it('substitutes the word into every prompt and leaves no {word} token', () => {
    const data = buildSentenceSet(list);
    for (const c of data.cards) {
      expect(c.prompt).toContain(c.word);
      expect(c.prompt).not.toContain('{word}');
    }
  });

  it('mixed mode cycles through the prompt pool in order', () => {
    const many: Word[] = Array.from({ length: SENTENCE_PROMPTS.length + 2 }, (_, i) =>
      w(String(i), 'word' + i),
    );
    const data = buildSentenceSet(many, { mode: 'mixed' });
    data.cards.forEach((c, i) => {
      const expected = fillPrompt(SENTENCE_PROMPTS[i % SENTENCE_PROMPTS.length], 'word' + i);
      expect(c.prompt).toBe(expected);
    });
  });

  it('simple mode uses the base prompt for every card', () => {
    const data = buildSentenceSet(list, { mode: 'simple' });
    expect(data.mode).toBe('simple');
    data.cards.forEach((c) => {
      expect(c.prompt).toBe(fillPrompt(SENTENCE_BASE_PROMPT, c.word));
    });
  });

  it('carries clue as hint and gloss as translation, undefined when absent', () => {
    const data = buildSentenceSet(list);
    expect(data.cards[0].hint).toBe('A round fruit.');
    expect(data.cards[0].gloss).toBe('la manzana');
    expect(data.cards[1].hint).toBeUndefined(); // bread has no clue
    expect(data.cards[1].gloss).toBeUndefined(); // bread has no gloss
    expect(data.cards[2].hint).toBe('Made from milk.');
    expect(data.cards[2].gloss).toBeUndefined(); // cheese has clue but no gloss
  });

  it('skips blank-text words and keeps numbering contiguous', () => {
    const words = [w('1', 'apple'), w('2', '   '), w('3', 'pear'), w('4', '')];
    const data = buildSentenceSet(words);
    expect(data.total).toBe(2);
    expect(data.cards.map((c) => c.index)).toEqual([1, 2]);
    expect(data.cards.map((c) => c.word)).toEqual(['apple', 'pear']);
  });

  it('trims surrounding whitespace from the word', () => {
    const data = buildSentenceSet([w('1', '  apple  ')]);
    expect(data.cards[0].word).toBe('apple');
    expect(data.cards[0].prompt).toContain('"apple"');
  });

  it('returns an empty set for an empty list without throwing', () => {
    const data = buildSentenceSet([]);
    expect(data.total).toBe(0);
    expect(data.cards).toEqual([]);
  });

  it('preserves the same set of words when shuffled', () => {
    const data = buildSentenceSet(list, { shuffleOrder: true });
    expect(data.total).toBe(4);
    expect(data.cards.map((c) => c.word).sort()).toEqual(['apple', 'bread', 'cheese', 'grape']);
    // indices are still contiguous 1..N regardless of order
    expect(data.cards.map((c) => c.index)).toEqual([1, 2, 3, 4]);
  });
});

describe('SENTENCE_PROMPTS invariants', () => {
  it('every template contains the {word} token', () => {
    for (const t of SENTENCE_PROMPTS) {
      expect(t).toContain('{word}');
    }
  });
  it('the base prompt is the first of the pool', () => {
    expect(SENTENCE_PROMPTS[0]).toBe(SENTENCE_BASE_PROMPT);
  });
});
