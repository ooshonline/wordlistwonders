import { boxSizeFor } from '../components/wordCard';

// Word Wall auto-layout. The column count is measured from the container by
// the WordWall component and shared here so display, drag origins, and
// "Reset Layout" all place cards on the same grid.

const GAP = 28;
const MARGIN = 30;

let currentCols = 4;

export function computeCols(containerW: number, showImage: boolean, showText: boolean): number {
  const box = boxSizeFor(showImage, showText);
  return Math.max(1, Math.floor((containerW - MARGIN * 2 + GAP) / (box.w + GAP)));
}

export function setWallCols(cols: number) {
  currentCols = Math.max(1, cols);
}

export function autoPos(i: number, showImage: boolean, showText: boolean): { x: number; y: number } {
  const box = boxSizeFor(showImage, showText);
  const cellW = box.w + GAP;
  const cellH = box.h + GAP;
  const col = i % currentCols;
  const row = Math.floor(i / currentCols);
  return { x: Math.round(MARGIN + col * cellW), y: Math.round(MARGIN + row * cellH) };
}
