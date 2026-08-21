// Shared helpers for the pure generators. Kept DOM-free and side-effect-free
// (aside from Math.random) so the generators stay unit-testable.

/** Fisher-ish shuffle via decorate-sort-undecorate (matches the prototype). */
export function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((v) => [Math.random(), v] as [number, T])
    .sort((a, b) => a[0] - b[0])
    .map((x) => x[1]);
}

/** Uppercase and strip to A–Z. */
export function cleanWord(t: string | undefined): string {
  return (t || '').toUpperCase().replace(/[^A-Z]/g, '');
}

/** A stable content signature: `id:text` joined across the list. Drives the
 *  puzzle memo cache — changing a word's id or text regenerates. */
export function wordSig(words: { id: string; text: string }[]): string {
  return words.map((w) => w.id + ':' + w.text).join('|');
}
