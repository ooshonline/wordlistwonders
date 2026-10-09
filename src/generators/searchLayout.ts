/**
 * Word Search print layout: picks a cell size so the grid + "Find these words"
 * bank fit on ONE printed page. Pure + DOM-free (see crossLayout.ts for the
 * shared page budget).
 *
 * Budget (px, measured on the 816×1056 sheet): 952 tall inside the padding,
 * minus the title/name rows (~123) and room for the optional credit line (~50).
 * A long title wraps (~38 characters per line) and each extra line costs ~41px.
 * The bank is 4 columns: ~30px for its label plus ~27px per row (a little high,
 * so an occasional wrapped word still fits). The grid adds a 4px border and a
 * 26px gap above the bank.
 */

const BASE_BODY_H = 952 - 123 - 50;
const MAX_PX = 46;
const MAX_GRID_W = 700;
const MIN_PX = 16;

export function searchCellPx(size: number, bankCount: number, titleLength = 0): number {
  const n = Math.max(1, size);
  const titleLines = Math.max(1, Math.ceil(titleLength / 38));
  const bodyH = BASE_BODY_H - (titleLines - 1) * 41;
  const bankH = 30 + Math.ceil(Math.max(0, bankCount) / 4) * 27;
  const byHeight = Math.floor((bodyH - bankH - 4 - 26) / n);
  const byWidth = Math.floor(Math.min(MAX_PX, MAX_GRID_W / n));
  return Math.max(MIN_PX, Math.min(byWidth, byHeight));
}
