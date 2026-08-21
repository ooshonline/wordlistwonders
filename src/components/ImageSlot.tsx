import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ACCEPT_ATTR,
  acceptsFile,
  getSlot,
  setSlot,
  subscribeSlots,
  toDataUrl,
  type SlotValue,
} from '../images';
import { C } from '../tokens';

interface Props {
  id: string;
  /** Contain letterboxes the whole image (never cropped); cover fills. */
  fit?: 'contain' | 'cover';
  shape?: 'rect' | 'rounded' | 'circle' | 'pill';
  radius?: number;
  placeholder?: string;
  style?: CSSProperties;
}

const clampS = (s: number) => Math.max(1, Math.min(5, s));

/**
 * User-fillable image placeholder. Drop or browse to fill; the image persists
 * (keyed by id) and shows in every activity sharing that id. Default fit is
 * contain — the full image is always visible, never cropped. Double-click to
 * enter reframe mode (drag to pan, wheel to zoom) for a deliberate crop.
 */
export function ImageSlot({ id, fit = 'contain', shape = 'rounded', radius = 12, placeholder = 'Image', style }: Props) {
  const [value, setValue] = useState<SlotValue | null>(() => getSlot(id));
  const [over, setOver] = useState(false);
  const [reframe, setReframe] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const genRef = useRef(0);

  // Subscribe to the shared slot store so any slot with this id stays in sync.
  useEffect(() => {
    setValue(getSlot(id));
    return subscribeSlots(() => setValue(getSlot(id)));
  }, [id]);

  const borderRadius =
    shape === 'circle' ? '50%' : shape === 'pill' ? '9999px' : shape === 'rect' ? 0 : radius;

  const ingest = useCallback(
    async (file: File) => {
      if (!acceptsFile(file)) return;
      const gen = ++genRef.current;
      const w = hostRef.current?.clientWidth || 300;
      try {
        const url = await toDataUrl(file, w);
        if (gen !== genRef.current) return;
        setSlot(id, { u: url, s: 1, x: 0, y: 0 });
      } catch {
        /* ignore */
      }
    },
    [id],
  );

  // ── drag & drop ──
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current++;
    setOver(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (--dragDepth.current <= 0) {
      dragDepth.current = 0;
      setOver(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) ingest(f);
  };

  // ── reframe (pan / zoom for a deliberate crop) ──
  const panState = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const commitView = (patch: Partial<SlotValue>) => {
    const cur = getSlot(id);
    if (!cur) return;
    setSlot(id, { ...cur, ...patch });
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (!reframe || !value) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    panState.current = { px: e.clientX, py: e.clientY, x: value.x, y: value.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = panState.current;
    if (!p || !hostRef.current) return;
    const r = hostRef.current.getBoundingClientRect();
    const nx = p.x + ((e.clientX - p.px) / (r.width || 1)) * 100;
    const ny = p.y + ((e.clientY - p.py) / (r.height || 1)) * 100;
    setValue((v) => (v ? { ...v, x: nx, y: ny } : v));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!panState.current) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    panState.current = null;
    const v = valueRef.current;
    if (v) commitView({ x: v.x, y: v.y });
  };
  const onWheel = (e: React.WheelEvent) => {
    if (!reframe || !value) return;
    e.preventDefault();
    const next = clampS(value.s * Math.pow(1.0015, -e.deltaY));
    setValue((v) => (v ? { ...v, s: next } : v));
    commitView({ s: next });
  };

  // keep a live ref for pointerup commit
  const valueRef = useRef(value);
  valueRef.current = value;

  // exit reframe on Escape / outside click
  useEffect(() => {
    if (!reframe) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReframe(false);
    };
    const onDown = (e: PointerEvent) => {
      if (hostRef.current && !hostRef.current.contains(e.target as Node)) setReframe(false);
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onDown, true);
    };
  }, [reframe]);

  const filled = !!value;
  const imgTransform = value
    ? `translate(${value.x}%, ${value.y}%) scale(${value.s})`
    : undefined;

  return (
    <div
      ref={hostRef}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDoubleClick={() => filled && setReframe((r) => !r)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius,
        background: filled ? 'transparent' : 'rgba(127,127,127,0.08)',
        boxSizing: 'border-box',
        cursor: reframe ? 'grab' : filled ? 'default' : 'pointer',
        outline: reframe ? `2px solid ${C.orange}` : over ? `2px solid ${C.orange}` : 'none',
        outlineOffset: -2,
        ...style,
      }}
    >
      {filled ? (
        <img
          src={value!.u}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: fit,
            transform: imgTransform,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            border: `1.5px dashed ${over ? C.orange : C.dotted}`,
            borderRadius,
            background: 'transparent',
            color: C.muted,
            cursor: 'pointer',
            padding: 8,
            boxSizing: 'border-box',
            textAlign: 'center',
            font: 'inherit',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.5 }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}>{placeholder}</span>
        </button>
      )}

      {filled && (
        <button
          type="button"
          aria-label="Replace image"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            padding: '3px 7px',
            borderRadius: 6,
            border: 'none',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: 0,
            transition: 'opacity .12s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
        >
          Replace
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) ingest(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
