import { describe, it, expect } from 'vitest';
import { parseWordTable, splitLine, looksLikeTable } from './wordTable';

describe('wordTable', () => {
  it('parses tab-separated word/clue/tier', () => {
    const rows = parseWordTable('apple\ta red fruit\tkey\nbanana\tyellow\tbonus');
    expect(rows).toEqual([
      { text: 'apple', clue: 'a red fruit', tier: 'key' },
      { text: 'banana', clue: 'yellow', tier: 'bonus' },
    ]);
  });
  it('parses CSV with quotes and skips header + blanks', () => {
    const rows = parseWordTable('Word,Clue,Tier\r\n"hello, world","a ""greeting""",normal\r\n\r\n,empty,key');
    expect(rows).toEqual([{ text: 'hello, world', clue: 'a "greeting"', tier: 'normal' }]);
  });
  it('treats a lone tier second column as tier', () => {
    expect(parseWordTable('cat\tbonus')).toEqual([{ text: 'cat', tier: 'bonus' }]);
  });
  it('defaults tier and unknown tiers', () => {
    expect(parseWordTable('dog,a pet,huge')).toEqual([{ text: 'dog', clue: 'a pet', tier: 'normal' }]);
  });
  it('detects tables and splits lines', () => {
    expect(looksLikeTable('a\tb')).toBe(true);
    expect(looksLikeTable('a, b')).toBe(false);
    expect(splitLine('a,"b,c",d', ',')).toEqual(['a', 'b,c', 'd']);
  });
});
