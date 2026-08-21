import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { C, DISPLAY, RAINBOW } from '../tokens';

interface FloatWord {
  key: number;
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
}

interface Phys {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  measured: boolean;
}

// Decorative floating vocabulary on the landing screen. Physics ported from
// the prototype (velocity + wall bounce + pairwise separation).
export function Home() {
  const sets = useStore((s) => s.sets);
  const goLibrary = useStore((s) => s.goLibrary);
  const containerRef = useRef<HTMLDivElement>(null);
  const elsRef = useRef<(HTMLDivElement | null)[]>([]);
  const physRef = useRef<Phys[]>([]);
  const rafRef = useRef<number>(0);

  const floatWords = useMemo<FloatWord[]>(() => {
    const pool: string[] = [];
    sets.forEach((set) => set.words.forEach((w) => pool.push(w.text)));
    if (!pool.length) return [];
    const count = 20;
    const words: FloatWord[] = [];
    for (let i = 0; i < count; i++) {
      words.push({
        key: i,
        text: pool[Math.floor(Math.random() * pool.length)],
        color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)],
        opacity: +(0.3 + Math.random() * 0.1).toFixed(2),
        fontSize: Math.round(16 + Math.random() * 34),
      });
    }
    return words;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets.length]);

  useEffect(() => {
    const box = containerRef.current;
    const vw = (box?.clientWidth || window.innerWidth) || 1200;
    const vh = (box?.clientHeight || window.innerHeight) || 800;
    const minSpawnDist = Math.min(vw, vh) / 5;
    const phys: Phys[] = [];
    for (let i = 0; i < floatWords.length; i++) {
      let x = 0;
      let y = 0;
      let tries = 0;
      let ok = false;
      while (!ok && tries < 40) {
        x = Math.random() * vw;
        y = Math.random() * vh;
        tries++;
        ok = phys.every((p) => Math.hypot(p.x - x, p.y - y) >= minSpawnDist);
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 / 60;
      phys.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, w: 0, h: 0, measured: false });
    }
    physRef.current = phys;

    const separate = (ph: Phys[], w: number, h: number) => {
      const n = ph.length;
      for (let pass = 0; pass < 14; pass++) {
        let moved = false;
        for (let i = 0; i < n; i++) {
          const p = ph[i];
          if (!p.measured) continue;
          for (let j = i + 1; j < n; j++) {
            const q = ph[j];
            if (!q.measured) continue;
            const pcx = p.x + p.w / 2;
            const pcy = p.y + p.h / 2;
            const qcx = q.x + q.w / 2;
            const qcy = q.y + q.h / 2;
            let dx = pcx - qcx;
            let dy = pcy - qcy;
            let dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = Math.max(p.w, q.w) / 2 + Math.max(p.h, q.h) / 2 + 20;
            if (dist < minDist) {
              moved = true;
              if (dist < 0.01) {
                dx = Math.random() - 0.5 || 0.1;
                dy = Math.random() - 0.5 || 0.1;
                dist = Math.sqrt(dx * dx + dy * dy);
              }
              const push = (minDist - dist) * 0.65;
              const ux = dx / dist;
              const uy = dy / dist;
              p.x = Math.max(0, Math.min(w - p.w, p.x + ux * push));
              p.y = Math.max(0, Math.min(h - p.h, p.y + uy * push));
              q.x = Math.max(0, Math.min(w - q.w, q.x - ux * push));
              q.y = Math.max(0, Math.min(h - q.h, q.y - uy * push));
            }
          }
        }
        if (!moved) break;
      }
    };

    const tick = () => {
      const el0 = containerRef.current;
      const w = el0?.clientWidth || window.innerWidth;
      const h = el0?.clientHeight || window.innerHeight;
      const els = elsRef.current;
      const ph = physRef.current;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const p = ph[i];
        if (!el || !p) continue;
        if (!p.measured) {
          p.w = el.offsetWidth || 100;
          p.h = el.offsetHeight || 40;
          p.measured = true;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x + p.w >= w) {
          p.x = w - p.w;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y <= 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
        } else if (p.y + p.h >= h) {
          p.y = h - p.h;
          p.vy = -Math.abs(p.vy);
        }
      }
      separate(ph, w, h);
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const p = ph[i];
        if (!el || !p) continue;
        el.style.transform = `translate(${p.x}px,${p.y}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [floatWords]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.paper,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {floatWords.map((fw, i) => (
          <div
            key={fw.key}
            ref={(el) => (elsRef.current[i] = el)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: fw.color,
              opacity: fw.opacity,
              fontSize: fw.fontSize,
              fontFamily: DISPLAY,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              willChange: 'transform',
            }}
          >
            {fw.text}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontSize: 64, fontWeight: 800, color: C.ink }}>Wordlist Wonders</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.ink2, maxWidth: 440 }}>
          Turn any wordlist into ready-to-run classroom activities.
        </div>
        <button
          type="button"
          onClick={goLibrary}
          style={{
            marginTop: 12,
            padding: '18px 48px',
            borderRadius: 999,
            background: C.green,
            color: '#fff',
            border: 'none',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            cursor: 'pointer',
            boxShadow: `0 6px 0 ${C.greenShadow}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.greenHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.green)}
        >
          Start
        </button>
      </div>
    </div>
  );
}
