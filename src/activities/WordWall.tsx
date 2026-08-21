import { useEffect, useMemo, useRef } from 'react';
import { useStore, currentSet } from '../store';
import { C, RAINBOW } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { Icon, icons } from '../components/ui';
import { contentBoxStyle, imgSizeFor, tierStyleFloat } from '../components/wordCard';
import { autoPos, computeCols, setWallCols } from './wallLayout';

// ── Static (plain) word wall: draggable, resizable cards on a zoom canvas ────
function StaticWall() {
  const set = useStore(currentSet);
  const contentMode = useStore((s) => s.contentMode);
  const preset = useStore((s) => s.stylePreset);
  const gridZoom = useStore((s) => s.gridZoom);
  const selectedWordId = useStore((s) => s.selectedWordId);
  const startDrag = useStore((s) => s.startDrag);
  const startResize = useStore((s) => s.startResize);
  const onMove = useStore((s) => s.onGridMouseMove);
  const onUp = useStore((s) => s.onGridMouseUp);
  const selectWord = useStore((s) => s.selectWord);
  const containerRef = useRef<HTMLDivElement>(null);

  const showImage = contentMode !== 'wordOnly';
  const showText = contentMode !== 'imageOnly';

  // Measure column count so display + drag + reset stay on the same grid.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWallCols(computeCols(el.clientWidth, showImage, showText));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showImage, showText]);

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) selectWord(null);
      }}
      style={{ flex: 1, position: 'relative', overflow: 'auto', background: C.sheetBg }}
    >
      <div
        style={{
          transform: `scale(${gridZoom})`,
          transformOrigin: '0 0',
          position: 'relative',
          width: 2600,
          height: 1800,
        }}
      >
        {set.words.map((w, i) => {
          const pos = set.positions?.[w.id] || autoPos(i, showImage, showText);
          const rawScale = set.cardScale?.[w.id] || 1;
          const scale = Math.max(0.5, Math.min(2, rawScale));
          const selected = selectedWordId === w.id;
          const imgSize = imgSizeFor(w.tier, preset);
          return (
            <div
              key={w.id}
              onMouseDown={(e) => startDrag(e, w.id, pos)}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              <div style={{ ...contentBoxStyle(w.tier, preset, showImage, showText), position: 'relative' }}>
                {showImage && (
                  <div style={{ width: imgSize, height: imgSize, maxWidth: '100%', margin: '0 auto 10px' }}>
                    <ImageSlot id={`slot-${w.id}`} fit="contain" shape="rounded" radius={16} placeholder="Image" />
                  </div>
                )}
                {showText && <div style={{ textAlign: 'center' }}>{w.text}</div>}
                {selected && (
                  <div
                    onMouseDown={(e) => startResize(e, w.id)}
                    style={{
                      position: 'absolute',
                      right: -6,
                      bottom: -6,
                      width: 22,
                      height: 22,
                      borderRadius: 8,
                      background: C.ink,
                      cursor: 'nwse-resize',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon path={icons.resize} size={12} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stylized float word wall: bouncing cards ────────────────────────────────
function FloatWall() {
  const set = useStore(currentSet);
  const contentMode = useStore((s) => s.contentMode);
  const wallSpeed = useStore((s) => s.wallSpeed);
  const containerRef = useRef<HTMLDivElement>(null);
  const elsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const physRef = useRef<Record<string, { x: number; y: number; vx: number; vy: number; w: number; h: number; measured: boolean }>>({});
  const rafRef = useRef<number>(0);
  const speedRef = useRef(wallSpeed);
  speedRef.current = wallSpeed;

  const showImage = contentMode !== 'wordOnly';
  const showText = contentMode !== 'imageOnly';

  // Stable per-word color for the float wall.
  const colors = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    set.words.forEach((w) => {
      map[w.id] = w.color || RAINBOW[Math.floor(Math.random() * RAINBOW.length)];
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id, set.words.map((w) => w.id).join(',')]);

  useEffect(() => {
    const box = containerRef.current;
    const bw = (box?.clientWidth || window.innerWidth) || 1200;
    const bh = (box?.clientHeight || window.innerHeight) || 800;
    const phys = physRef.current;
    set.words.forEach((w) => {
      if (!phys[w.id]) {
        const x = Math.random() * Math.max(100, bw - 180);
        const y = Math.random() * Math.max(100, bh - 100);
        const angle = Math.random() * Math.PI * 2;
        const speed = speedRef.current / 60;
        phys[w.id] = { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, w: 0, h: 0, measured: false };
      }
    });

    const tick = () => {
      const el0 = containerRef.current;
      const vw = el0?.clientWidth || window.innerWidth;
      const vh = el0?.clientHeight || window.innerHeight;
      set.words.forEach((word) => {
        const el = elsRef.current[word.id];
        const p = phys[word.id];
        if (!el || !p) return;
        if (!p.measured) {
          p.w = el.offsetWidth || 140;
          p.h = el.offsetHeight || 100;
          p.measured = true;
        }
        // keep magnitude in sync with the live speed control
        const mag = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
        const target = speedRef.current / 60;
        p.vx = (p.vx / mag) * target;
        p.vy = (p.vy / mag) * target;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x + p.w >= vw) {
          p.x = vw - p.w;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y <= 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
        } else if (p.y + p.h >= vh) {
          p.y = vh - p.h;
          p.vy = -Math.abs(p.vy);
        }
        el.style.transform = `translate(${p.x}px,${p.y}px)`;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [set.words]);

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: C.sheetBg }}>
      {set.words.map((w) => {
        const imgSize = imgSizeFor(w.tier, 'stylized');
        return (
          <div
            key={w.id}
            ref={(el) => (elsRef.current[w.id] = el)}
            style={{ position: 'absolute', top: 0, left: 0, willChange: 'transform' }}
          >
            <div style={tierStyleFloat(w.tier, colors[w.id])}>
              {showImage && (
                <div style={{ width: imgSize, height: imgSize, maxWidth: '100%', margin: '0 auto 10px' }}>
                  <ImageSlot id={`slot-${w.id}`} fit="contain" shape="rounded" radius={16} placeholder="Image" />
                </div>
              )}
              {showText && <div style={{ textAlign: 'center' }}>{w.text}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WordWall() {
  const stylePreset = useStore((s) => s.stylePreset);
  return stylePreset === 'stylized' ? <FloatWall /> : <StaticWall />;
}
