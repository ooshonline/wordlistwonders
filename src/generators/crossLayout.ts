/**
 * Crossword print layout: picks a cell size (and whether the clues sit under or
 * beside the grid) so grid + clues fit on ONE printed page. Pure + DOM-free.
 *
 * Budget (px, measured on the 816×1056 sheet): 712 wide × 952 tall inside the
 * padding, minus the title/name rows (~123) and room for the optional credit
 * line (~50). A long title wraps (~38 characters per line at 26px beside the
 * subtitle) and each extra line costs ~41px. Clue heights are estimated
 * slightly high: 19px per line + 7px gap per clue, ~7.8px per character of
 * 14px text, plus ~30px for each Across/Down label.
 */

export interface CrossLayout {
  cellPx: number;
  /** Clues in one column to the right of the grid (tall, narrow grids). */
  side: boolean;
}

const PAGE_W = 712;
const BASE_BODY_H = 952 - 123 - 50;
const GAP = 28; // between grid and clues, either direction
const MIN_PX = 16;
const MIN_CLUE_W = 220;

type Clue = { clue: string };

/** Estimated height of one Across/Down block when its column is `width` px wide. */
export function clueBlockHeight(list: Clue[], width: number): number {
  const perLine = Math.max(10, Math.floor(width / 7.8));
  return 30 + list.reduce((h, c) => h + Math.ceil((c.clue.length + 4) / perLine) * 19 + 7, 0);
}

export function crossLayout(
  rows: number,
  cols: number,
  across: Clue[],
  down: Clue[],
  titleLength = 0,
): CrossLayout {
  const titleLines = Math.max(1, Math.ceil(titleLength / 38));
  const BODY_H = BASE_BODY_H - (titleLines - 1) * 41;
  const byWidth = cols > 18 ? 26 : cols > 14 ? 30 : 34;
  if (rows <= 0 || cols <= 0) return { cellPx: byWidth, side: false };

  // Stacked: grid on top, Across | Down in two half-width columns below.
  const halfW = (PAGE_W - GAP) / 2;
  const stackedClues = Math.max(clueBlockHeight(across, halfW), clueBlockHeight(down, halfW));
  const stacked = Math.min(byWidth, Math.floor((BODY_H - GAP - stackedClues) / rows));

  // Side by side: grid on the left, Across then Down in one column on the right.
  // Try the largest cell size first; the clue column narrows as cells grow.
  let side = 0;
  for (let px = Math.min(byWidth, Math.floor(BODY_H / rows)); px >= MIN_PX; px--) {
    const clueW = PAGE_W - GAP - cols * px;
    if (clueW < MIN_CLUE_W) continue;
    if (clueBlockHeight(across, clueW) + 16 + clueBlockHeight(down, clueW) <= BODY_H) {
      side = px;
      break;
    }
  }

  // Prefer the familiar stacked layout unless side-by-side gives clearly bigger cells.
  if (stacked >= MIN_PX && stacked >= side - 2) return { cellPx: stacked, side: false };
  if (side >= MIN_PX) return { cellPx: side, side: true };
  return { cellPx: MIN_PX, side: false };
}
