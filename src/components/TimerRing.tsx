import { C, DISPLAY } from '../tokens';

// A projector-friendly countdown ring: the arc shrinks as time runs out and
// shifts color from calm teal → amber → red for at-a-glance urgency. Pure SVG,
// no libraries. The arc/color transition smooths the once-a-second timeLeft tick.
export function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0;
  // Urgency color: > half calm, last quarter urgent.
  const color = ratio > 0.5 ? C.teal : ratio > 0.25 ? C.amberBorder : C.danger;
  const low = ratio <= 0.25 && timeLeft > 0;
  return (
    <div
      style={{
        position: 'relative',
        width: 96,
        height: 96,
        animation: low ? 'vwTimerPulse 1s ease-in-out infinite' : undefined,
      }}
      aria-label={`${timeLeft} seconds left`}
    >
      <svg width={96} height={96} viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={48} cy={48} r={r} fill="none" stroke={C.track} strokeWidth={8} />
        <circle
          cx={48}
          cy={48}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: DISPLAY,
          fontSize: 30,
          fontWeight: 800,
          color,
          transition: 'color 0.4s ease',
        }}
      >
        {timeLeft}
      </div>
    </div>
  );
}
