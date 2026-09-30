import { useStore, currentSet } from '../store';
import { C } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { contentBoxStyle } from '../components/wordCard';
import { Kbd, KeyTip } from '../components/ui';
import { useActivityKeys, FORWARD_KEYS, BACK_KEYS } from '../components/activityKeys';

export function Reveal() {
  const set = useStore(currentSet);
  const revealedBySet = useStore((s) => s.revealedBySet);
  const currentSetId = useStore((s) => s.currentSetId);
  const preset = useStore((s) => s.stylePreset);
  const toggleReveal = useStore((s) => s.toggleReveal);
  const resetReveal = useStore((s) => s.resetReveal);

  const revealed = revealedBySet[currentSetId] || {};

  // Forward keys (Space, →, a clicker's PageDown) reveal the next hidden card in
  // order; back keys hide the most recently revealed one (last in order).
  useActivityKeys((key) => {
    if (FORWARD_KEYS.includes(key)) {
      const nextHidden = set.words.find((w) => !revealed[w.id]);
      if (nextHidden) toggleReveal(nextHidden.id);
      return true;
    }
    if (BACK_KEYS.includes(key)) {
      const lastShown = [...set.words].reverse().find((w) => revealed[w.id]);
      if (lastShown) toggleReveal(lastShown.id);
      return true;
    }
    return false;
  });

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {set.words.length > 0 ? (
          <KeyTip>
            Tip: <Kbd>Space</Kbd> or <Kbd>→</Kbd> reveals the next card, <Kbd>←</Kbd> hides it again.
          </KeyTip>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={resetReveal}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            background: C.track,
            color: C.ink,
            border: 'none',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Reset All
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
        {set.words.map((w) => {
          const isRevealed = !!revealed[w.id];
          return (
            <div
              key={w.id}
              onClick={() => toggleReveal(w.id)}
              style={{ ...contentBoxStyle(w.tier, preset, true, true), textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ width: '100%', height: 160, maxHeight: '26vh', marginBottom: 10 }}>
                <ImageSlot id={`slot-${w.id}`} fit="contain" shape="rounded" radius={16} placeholder="Image" />
              </div>
              {isRevealed ? (
                <div>{w.text}</div>
              ) : (
                <div style={{ opacity: 0.5, fontSize: '0.6em', fontWeight: 700 }}>Click to reveal</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
