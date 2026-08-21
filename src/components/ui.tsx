import type { CSSProperties, ReactNode } from 'react';
import { C, BODY } from '../tokens';

// Segmented control button style (shared by every pill group in the app).
export function segStyle(active: boolean): CSSProperties {
  return active
    ? {
        padding: '9px 16px',
        borderRadius: 999,
        background: C.surface,
        color: C.ink,
        fontWeight: 800,
        fontSize: 14,
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(26,50,96,0.12)',
      }
    : {
        padding: '9px 16px',
        borderRadius: 999,
        background: 'transparent',
        color: C.muted,
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
      };
}

export interface SegOption<T> {
  value: T;
  label: string;
}

interface SegProps<T> {
  name: string;
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
  /** Track corner radius; toolbar groups use 16, most use 999. */
  trackRadius?: number;
  wrap?: boolean;
}

/**
 * A segmented control backed by real radio inputs (kept per the accessibility
 * spec — one shared `name` per group, the visual pill is the styled label).
 */
export function SegControl<T extends string | number | boolean>({
  name,
  value,
  options,
  onChange,
  trackRadius = 999,
  wrap = false,
}: SegProps<T>) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        background: C.track,
        borderRadius: trackRadius,
        padding: 4,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <label key={String(opt.value)} style={{ ...segStyle(active), fontFamily: BODY }}>
            <input
              type="radio"
              name={name}
              checked={active}
              onChange={() => onChange(opt.value)}
              style={{ display: 'none' }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

// A labelled segmented control (micro-label beside the pill group).
export function LabeledSeg<T extends string | number | boolean>(props: SegProps<T> & { label: string }) {
  const { label, ...seg } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 800,
          opacity: 0.5,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </label>
      <SegControl {...seg} />
    </div>
  );
}

// The chunky green primary button (hard pressed-shadow treatment).
export function GreenButton({
  children,
  onClick,
  style,
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'onClick'>) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '12px 22px',
        borderRadius: 999,
        background: C.green,
        color: '#fff',
        border: 'none',
        fontFamily: BODY,
        fontWeight: 800,
        fontSize: 15,
        cursor: 'pointer',
        boxShadow: `0 4px 0 ${C.greenShadow}`,
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.greenHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = C.green)}
      {...rest}
    >
      {children}
    </button>
  );
}

// Outline (secondary) button.
export function OutlineButton({
  children,
  onClick,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '11px 20px',
        borderRadius: 999,
        background: C.surface,
        color: C.ink,
        border: `2px solid ${C.ink}`,
        fontFamily: BODY,
        fontWeight: 700,
        fontSize: 15,
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Common SVG icons (24×24, stroke-2, currentColor) used across views.
export function Icon({ path, size = 18 }: { path: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}

export const icons = {
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  back: (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  play: (
    <>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </>
  ),
  mic: (
    <>
      <path d="M12 19v3" />
      <path d="M8 22h8" />
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
    </>
  ),
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  resize: (
    <>
      <path d="M21 15v6h-6" />
      <path d="M3 9V3h6" />
      <path d="M21 3 14 10" />
      <path d="m3 21 7-7" />
    </>
  ),
};
