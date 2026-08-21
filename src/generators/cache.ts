// Puzzle memoization. Generated puzzles are memoized under a key of
// `kind | wordSignature | options | salt`. Changing an option, editing a
// word, or bumping the shuffle salt regenerates; any other re-render reuses
// the cached puzzle so a puzzle stays stable while the teacher types
// elsewhere on the page.

const cache = new Map<string, unknown>();

export function memoPuzzle<T>(key: string, build: () => T): T {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key) as T;
}
