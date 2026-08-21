import { useStore, currentSet } from '../store';
import { C } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { contentBoxStyle, imgSizeFor } from '../components/wordCard';

export function MissingWord() {
  const set = useStore(currentSet);
  const missing = useStore((s) => s.missingWord);
  const preset = useStore((s) => s.stylePreset);
  const removeOne = useStore((s) => s.removeOneWord);
  const reveal = useStore((s) => s.revealMissing);

  const hasRemoved = !!missing.removedId && !missing.revealed;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {hasRemoved && (
          <button
            type="button"
            onClick={reveal}
            style={{
              padding: '9px 16px',
              borderRadius: 999,
              background: C.track,
              color: C.ink,
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reveal
          </button>
        )}
        <button
          type="button"
          onClick={removeOne}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            background: C.green,
            color: '#fff',
            border: 'none',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {missing.removedId ? 'Remove Another' : 'Remove One'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 18 }}>
        {set.words.map((w) => {
          const isRemoved = missing.removedId === w.id && !missing.revealed;
          const imgSize = imgSizeFor(w.tier, preset);
          return (
            <div key={w.id} style={{ ...contentBoxStyle(w.tier, preset, true, true), textAlign: 'center' }}>
              {isRemoved ? (
                <>
                  <div style={{ width: imgSize, height: imgSize, margin: '0 auto 10px', borderRadius: 16, background: C.borderLight }} />
                  <div style={{ opacity: 0.3 }}>?</div>
                </>
              ) : (
                <>
                  <div style={{ width: imgSize, height: imgSize, maxWidth: '100%', margin: '0 auto 10px' }}>
                    <ImageSlot id={`slot-${w.id}`} fit="contain" shape="rounded" radius={16} placeholder="Image" />
                  </div>
                  <div>{w.text}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
