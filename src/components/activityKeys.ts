import { useEffect, useRef } from 'react';

/** Presenter clickers act as a plain keyboard: PageDown = forward, PageUp = back. */
export const FORWARD_KEYS = ['ArrowRight', 'PageDown', ' ', 'Enter'];
export const BACK_KEYS = ['ArrowLeft', 'PageUp'];

/** True when a keystroke belongs to a form field (typing a number, a word…). */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

function isActivatable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el?.closest?.('button, a[href], [role="button"], [role="tab"]');
}

/**
 * Window-level keyboard shortcuts for a projector activity. `onKey` gets the
 * `KeyboardEvent.key` and returns true when it handled it (the browser default,
 * e.g. page scroll on Space/PageDown, is then prevented). Skips form fields,
 * Space/Enter on a focused control, modifier combos and held-key repeats.
 */
export function useActivityKeys(onKey: (key: string) => boolean) {
  const ref = useRef(onKey);
  ref.current = onKey;
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      // Space/Enter on a focused button or link belongs to that control —
      // keyboard users tabbing through the toolbar must still activate it.
      if ((e.key === ' ' || e.key === 'Enter') && isActivatable(e.target)) return;
      if (ref.current(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
}
