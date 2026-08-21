import { useStore, currentSet } from '../store';
import { C } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { Icon, icons } from '../components/ui';
import { contentBoxStyle } from '../components/wordCard';

export function Carousel() {
  const set = useStore(currentSet);
  const idx = useStore((s) => s.carouselIndex);
  const preset = useStore((s) => s.stylePreset);
  const contentMode = useStore((s) => s.contentMode);
  const playing = useStore((s) => s.carouselPlaying);
  const prev = useStore((s) => s.carouselPrev);
  const next = useStore((s) => s.carouselNext);
  const togglePlay = useStore((s) => s.togglePlay);
  const setSpeed = useStore((s) => s.setSpeed);

  const words = set.words;
  const showImage = contentMode !== 'wordOnly';
  const showText = contentMode !== 'imageOnly';
  const carIdx = words.length ? idx % words.length : 0;
  const w = words[carIdx];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: 32,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <button type="button" aria-label="Previous" onClick={prev} style={navBtn}>
          <Icon path={icons.chevronLeft} size={26} />
        </button>
        <div
          style={{
            ...(w ? contentBoxStyle(w.tier, preset, showImage, showText) : {}),
            width: 420,
            textAlign: 'center',
            animation: 'vw-pop 0.25s ease',
          }}
          key={carIdx}
        >
          {w && showImage && (
            <div style={{ width: 'min(280px,100%)', height: 280, maxHeight: '38vh', margin: '0 auto 16px' }}>
              <ImageSlot id={`slot-${w.id}`} fit="contain" shape="rounded" radius={22} placeholder="Image" />
            </div>
          )}
          {w && showText && <div>{w.text}</div>}
        </div>
        <button type="button" aria-label="Next" onClick={next} style={navBtn}>
          <Icon path={icons.chevronRight} size={26} />
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <button
          type="button"
          aria-label="Play/Pause"
          onClick={togglePlay}
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: C.green,
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: `0 4px 0 ${C.greenShadow}`,
          }}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 700, opacity: 0.7 }}>Seconds/word</label>
          <input
            type="number"
            min={1}
            max={60}
            value={set.carouselSpeed || 4}
            onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
            style={{ width: 64, padding: 8, borderRadius: 10, border: `2px solid ${C.borderLight}`, fontWeight: 700 }}
          />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7 }}>
          {words.length ? `${carIdx + 1} / ${words.length}` : '0 / 0'}
        </div>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 999,
  background: C.track,
  border: 'none',
  color: C.ink,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
