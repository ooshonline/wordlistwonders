import { useEffect, useId, useRef, useState } from 'react';
import { C, BODY, DISPLAY } from '../tokens';
import { ACTIVITY_TIPS } from '../activityTips';
import type { DisplayMode } from '../types';

/**
 * "Tips" toolbar button (C3): a small disclosure card with one or two lines on
 * running the current activity in class. Closes on Escape, an outside click, or
 * when the teacher switches activity.
 */
export function ActivityTips({ mode, label }: { mode: DisplayMode; label: string }) {
  const [open, setOpen] = useState(false);
  // Open toward whichever side has room (the button wraps to the left on phones).
  const [alignLeft, setAlignLeft] = useState(false);
  const [panelWidth, setPanelWidth] = useState(340);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const tips = ACTIVITY_TIPS[mode] || [];

  useEffect(() => setOpen(false), [mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Stop activity shortcuts (and presenter Esc handling) from also firing.
        e.stopPropagation();
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  if (!tips.length) return null;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          const rect = btnRef.current?.getBoundingClientRect();
          if (rect) {
            // Keep a 16px gutter from the screen edge on whichever side we open.
            const left = rect.right < 356;
            setAlignLeft(left);
            setPanelWidth(Math.min(340, left ? window.innerWidth - rect.left - 16 : rect.right - 16));
          }
          setOpen((o) => !o);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 18px',
          borderRadius: 999,
          background: open ? C.tealTint : '#ffffff',
          color: C.ink,
          border: `2px solid ${open ? C.teal : C.borderLight}`,
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            background: C.teal,
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ?
        </span>
        Tips
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={`Tips for ${label}`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            ...(alignLeft ? { left: 0 } : { right: 0 }),
            zIndex: 50,
            width: panelWidth,
            background: '#ffffff',
            border: `2px solid ${C.borderLight}`,
            borderRadius: 16,
            boxShadow: '0 12px 32px rgba(26,50,96,0.16)',
            padding: '14px 18px 16px',
            color: C.ink,
            textAlign: 'left',
          }}
        >
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 17, marginBottom: 6 }}>
            Using {label} in class
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6, fontSize: 14, lineHeight: 1.45 }}>
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
