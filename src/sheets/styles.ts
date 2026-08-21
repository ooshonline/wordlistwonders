import type { CSSProperties } from 'react';
import { C, BODY, DISPLAY } from '../tokens';

// ── Bingo cell styling (ported from the prototype) ──────────────────────────
export function bingoCellStyle(kind: 'free' | 'blank' | 'word', content: string): CSSProperties {
  const free = kind === 'free';
  const blank = kind === 'blank';
  const bg = free ? C.amber : blank ? C.blankSurface : '#ffffff';
  const border = free ? `2px solid ${C.amberBorder}` : blank ? `2px dashed ${C.blankBorder}` : `2px solid ${C.borderLight}`;
  const color = free ? C.amberInk2 : C.ink;
  const pad = content === 'imagesOnly' ? 2 : content === 'imageWord' ? 3 : 4;
  const gap = content === 'imagesOnly' ? 0 : content === 'imageWord' ? 1 : 2;
  return {
    aspectRatio: '1',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontWeight: 800,
    borderRadius: 10,
    background: bg,
    border,
    color,
    padding: pad,
    boxSizing: 'border-box',
    gap,
  };
}

export function bingoCellTextStyle(content: string): CSSProperties {
  return content === 'imageWord'
    ? { flex: '0 0 auto', width: '100%', fontSize: 9, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
    : { fontSize: 13, lineHeight: 1.2 };
}

export const bingoCellImageStyle: CSSProperties = {
  flex: '1 1 auto',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  minHeight: 0,
  maxHeight: '100%',
};

// ── Flash card styling ──────────────────────────────────────────────────────
export function flashCardStyle(cutLines: boolean): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    boxSizing: 'border-box',
    overflow: 'hidden',
    border: cutLines ? `1px dashed ${C.cutGuide}` : '1px solid transparent',
  };
}

export function flashTextStyle(perPage: number): CSSProperties {
  const size = perPage <= 2 ? 54 : perPage <= 4 ? 38 : perPage <= 6 ? 30 : 24;
  return { fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1.1, textAlign: 'center', color: C.ink };
}

export const flashImageStyle: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  flex: '1 1 auto',
  minHeight: 0,
  maxHeight: '100%',
};

export const findWordsLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: C.teal,
  marginBottom: 10,
};

export const clueBody: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 7,
  textWrap: 'pretty',
};

export const bodyFont = BODY;
