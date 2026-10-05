import { useEffect, useMemo, useState } from 'react';
import { RAINBOW } from '../tokens';

// A short, pure-CSS confetti burst (G2) for celebration moments in the
// projector games. Pieces fall from the top of the screen over ~2.6s, then the
// layer unmounts. It never blocks clicks (pointer-events: none), is hidden from
// screen readers, and renders nothing for people who ask for reduced motion.
//
// To replay a burst, change `burstKey` (e.g. bump a counter on each award).

const DURATION_MS = 2600;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Tiny deterministic hash so each piece gets a stable, varied position without
// calling Math.random during render.
function spread(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function Confetti({ burstKey = 0, pieces = 80 }: { burstKey?: number; pieces?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), DURATION_MS + 400);
    return () => window.clearTimeout(t);
  }, [burstKey]);

  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: spread(i, burstKey + 1) * 100,
        delay: spread(i, burstKey + 2) * 500,
        drift: (spread(i, burstKey + 3) - 0.5) * 160,
        spin: 360 + spread(i, burstKey + 4) * 540,
        size: 7 + spread(i, burstKey + 5) * 6,
        round: spread(i, burstKey + 6) > 0.7,
        color: RAINBOW[i % RAINBOW.length],
      })),
    [pieces, burstKey],
  );

  if (!visible || prefersReducedMotion()) return null;

  return (
    <div className="vw-confetti" aria-hidden="true" key={burstKey}>
      {bits.map((b, i) => (
        <span
          key={i}
          style={
            {
              left: `${b.left}%`,
              width: b.size,
              height: b.round ? b.size : b.size * 0.45,
              borderRadius: b.round ? '50%' : 2,
              background: b.color,
              animationDelay: `${b.delay}ms`,
              animationDuration: `${DURATION_MS - b.delay}ms`,
              '--vw-drift': `${b.drift}px`,
              '--vw-spin': `${b.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
