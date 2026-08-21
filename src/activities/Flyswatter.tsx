import { useStore, currentSet } from '../store';
import { C, DISPLAY } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';

export function Flyswatter() {
  const set = useStore(currentSet);
  const fly = useStore((s) => s.flyswatter);
  const mark = useStore((s) => s.markFlyswatterWord);
  const addScore = useStore((s) => s.addFlyswatterScore);

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Score label="Team A" score={fly.scoreA} />
        <div
          style={{
            textAlign: 'center',
            padding: '14px 24px',
            background: C.amber,
            borderRadius: 16,
            color: C.amberInk,
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          🗣️ Call out a random word from the board.
        </div>
        <Score label="Team B" score={fly.scoreB} />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
          gap: 14,
          width: '100%',
          maxWidth: 900,
        }}
      >
        {set.words.map((w) => {
          const isLast = w.id === fly.lastWordId;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => mark(w.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 16,
                borderRadius: 18,
                fontWeight: 800,
                fontSize: 18,
                cursor: 'pointer',
                background: isLast ? C.tealTint : C.surface,
                color: C.ink,
                border: `2px solid ${isLast ? C.teal : C.borderLight}`,
              }}
            >
              <div style={{ width: '100%', aspectRatio: '1', maxHeight: '100%' }}>
                <ImageSlot id={`slot-${w.id}`} fit="contain" shape="rounded" radius={12} placeholder="Image" />
              </div>
              <div>{w.text}</div>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>
        Tap the word that was swatted, then award the point.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" disabled={!fly.lastWordId} onClick={() => addScore('scoreA')} style={awardBtn(!fly.lastWordId)}>
          Award Team A
        </button>
        <button type="button" disabled={!fly.lastWordId} onClick={() => addScore('scoreB')} style={awardBtn(!fly.lastWordId)}>
          Award Team B
        </button>
      </div>
    </div>
  );
}

function Score({ label, score }: { label: string; score: number }) {
  return (
    <div
      style={{
        background: C.surface,
        borderRadius: 18,
        boxShadow: '0 6px 20px rgba(26,50,96,0.08)',
        padding: '12px 20px',
        textAlign: 'center',
        minWidth: 110,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.teal }}>{label}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800 }}>{score}</div>
    </div>
  );
}

const awardBtn = (disabled: boolean): React.CSSProperties => ({
  padding: '9px 16px',
  borderRadius: 999,
  background: C.tealTint,
  color: C.tealInk,
  border: 'none',
  fontWeight: 800,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});
