import type { CSSProperties } from 'react';
import type { StylePreset, Tier } from '../types';
import { BODY, DISPLAY } from '../tokens';

// Tier/preset text styling for the projector activities (Word Wall, Carousel,
// Reveal, Missing Word). Ported from the prototype's tierStyle.
function tierStyle(tier: Tier, preset: StylePreset): CSSProperties {
  const styles: Record<StylePreset, Record<Tier, CSSProperties>> = {
    card: {
      key: { fontSize: 24, fontWeight: 700, color: '#1A3260', fontFamily: BODY },
      normal: { fontSize: 24, fontWeight: 700, color: '#1A3260', fontFamily: BODY },
      bonus: { fontSize: 24, fontWeight: 700, color: '#5B6B85', fontFamily: BODY },
    },
    stylized: {
      key: {
        fontSize: 38,
        fontWeight: 800,
        color: '#1A3260',
        background: '#ffffff',
        padding: '24px 28px',
        borderRadius: 22,
        boxShadow: '0 10px 24px rgba(63,166,160,0.35)',
        border: '2px solid #3FA6A0',
        transform: 'rotate(-2deg)',
        fontFamily: DISPLAY,
      },
      normal: {
        fontSize: 25,
        fontWeight: 700,
        color: '#1A3260',
        background: '#ffffff',
        padding: '18px 20px',
        borderRadius: 22,
        boxShadow: '0 8px 18px rgba(63,166,160,0.3)',
        border: '2px solid #3FA6A0',
        transform: 'rotate(1.5deg)',
        fontFamily: BODY,
      },
      bonus: {
        fontSize: 18,
        fontWeight: 600,
        color: '#1A3260',
        background: '#ffffff',
        padding: '10px 12px',
        borderRadius: 22,
        border: '2px solid #3FA6A0',
        transform: 'rotate(-1.5deg)',
        opacity: 0.8,
        fontFamily: BODY,
      },
    },
  };
  return { textAlign: 'center', ...styles[preset][tier] };
}

export function boxSizeFor(showImage: boolean, showText: boolean): { w: number; h: number } {
  if (showImage && showText) return { w: 240, h: 260 };
  if (showImage) return { w: 160, h: 160 };
  return { w: 220, h: 90 };
}

export function contentBoxStyle(
  tier: Tier,
  preset: StylePreset,
  showImage: boolean,
  showText: boolean,
): CSSProperties {
  const base = tierStyle(tier, preset);
  if (preset !== 'card') return base;
  const box = boxSizeFor(showImage, showText);
  const sized: CSSProperties = {
    ...base,
    width: box.w,
    height: box.h,
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };
  if (showImage && showText) {
    return {
      ...sized,
      background: '#ffffff',
      padding: 18,
      borderRadius: 20,
      border: '2px solid #3FA6A0',
      boxShadow: '0 6px 16px rgba(26,50,96,0.08)',
    };
  }
  return sized;
}

export function imgSizeFor(tier: Tier, preset: StylePreset): number {
  const map: Record<Tier, Record<StylePreset, number>> = {
    key: { card: 96, stylized: 140 },
    normal: { card: 96, stylized: 100 },
    bonus: { card: 96, stylized: 60 },
  };
  return map[tier][preset] || 90;
}

export function tierStyleFloat(tier: Tier, color: string): CSSProperties {
  const sizes: Record<Tier, number> = { key: 46, normal: 30, bonus: 20 };
  return {
    textAlign: 'center',
    fontFamily: DISPLAY,
    fontWeight: 800,
    color,
    fontSize: sizes[tier] || 28,
    whiteSpace: 'nowrap',
  };
}
