import { useEffect } from 'react';
import { useStore, currentSet } from '../store';
import { C, DISPLAY, BODY } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { Icon, icons, LabeledSeg } from '../components/ui';

// Word of the Day projector activity (CX4). A calm, single-word focus: one word
// at a time, big, with its picture front and center. The class sees the word +
// image first; the teacher reveals its meaning (clue) and translation (gloss)
// when ready. next/prev step through the set, wrapping. The cards + navigation
// live in the store (`wordOfDay` slice + buildWordOfDay generator); this
// component only renders the current word and its controls.
export function WordOfDay() {
  const set = useStore(currentSet);
  const contentMode = useStore((s) => s.contentMode);
  const wordOfDay = useStore((s) => s.wordOfDay);
  const initWordOfDay = useStore((s) => s.initWordOfDay);
  const next = useStore((s) => s.wordOfDayNext);
  const prev = useStore((s) => s.wordOfDayPrev);
  const toggleReveal = useStore((s) => s.toggleWordOfDayReveal);
  const setShuffle = useStore((s) => s.setWordOfDayShuffle);
  const reshuffle = useStore((s) => s.reshuffleWordOfDay);

  // Build (or rebuild) the sequence on mount and whenever the active set
  // changes, so switching lists never leaves a stale word on screen.
  useEffect(() => {
    initWordOfDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id]);

  const showImage = contentMode !== 'wordOnly';
  const { cards, index, total, revealed, shuffleOrder } = wordOfDay;
  const card = total ? cards[index % total] : undefined;

  if (!total || !card) {
    return (
      <div style={emptyWrap}>
        <div style={{ fontFamily: DISPLAY, fontSize: 26, color: C.ink }}>No words yet</div>
        <div style={{ fontSize: 16, color: C.placeholderInk, maxWidth: 420, textAlign: 'center' }}>
          Add a few words to this list in the Editor and they'll appear here, one word at a time.
        </div>
      </div>
    );
  }

  const hasMeaning = Boolean(card.clue || card.gloss);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 32,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <button type="button" aria-label="Previous word" onClick={prev} style={navBtn}>
          <Icon path={icons.chevronLeft} size={26} />
        </button>

        <div
          key={index}
          style={{
            width: 600,
            maxWidth: '82vw',
            minWidth: 0,
            background: C.surface,
            border: `2px solid ${C.tealTint}`,
            borderRadius: 24,
            boxShadow: '0 10px 30px rgba(26, 50, 96, 0.08)',
            padding: '36px 40px',
            textAlign: 'center',
            animation: 'vw-pop 0.25s ease',
          }}
        >
          <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.placeholderInk }}>
            Word of the Day
          </div>

          {showImage && (
            <div style={{ width: 'min(320px,72%)', height: 240, maxHeight: '34vh', margin: '16px auto 20px' }}>
              <ImageSlot id={card.slotId} fit="contain" shape="rounded" radius={20} placeholder="Picture cue" />
            </div>
          )}

          <div style={{ fontFamily: DISPLAY, fontSize: 56, fontWeight: 800, color: C.tealDeep, lineHeight: 1.1, margin: '8px 0', wordBreak: 'break-word' }}>
            {card.word}
          </div>

          {hasMeaning ? (
            <div style={{ marginTop: 18 }}>
              {revealed ? (
                <div
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    gap: 6,
                    background: C.tealTint,
                    borderRadius: 16,
                    padding: '14px 22px',
                    maxWidth: '100%',
                  }}
                >
                  {card.clue && (
                    <div style={{ fontSize: 19, color: C.tealInk }}>
                      <strong>Meaning:</strong> {card.clue}
                    </div>
                  )}
                  {card.gloss && (
                    <div style={{ fontSize: 19, color: C.tealInk }}>
                      <strong>Translation:</strong> {card.gloss}
                    </div>
                  )}
                  <button type="button" onClick={toggleReveal} style={linkBtn}>
                    Hide meaning
                  </button>
                </div>
              ) : (
                <button type="button" onClick={toggleReveal} style={hintBtn}>
                  Show meaning
                </button>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 12, fontSize: 15, color: C.placeholderInk }}>
              Add a clue or translation in the Editor to show its meaning here.
            </div>
          )}
        </div>

        <button type="button" aria-label="Next word" onClick={next} style={navBtn}>
          <Icon path={icons.chevronRight} size={26} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
        <LabeledSeg
          label="Order"
          name="vw-wordday-order"
          value={shuffleOrder}
          onChange={(v) => setShuffle(Boolean(v))}
          options={[
            { value: false, label: 'List order' },
            { value: true, label: 'Shuffle' },
          ]}
        />
        {shuffleOrder && (
          <button type="button" onClick={reshuffle} style={reshuffleBtn}>
            Shuffle again
          </button>
        )}
        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7 }}>
          {index + 1} / {total}
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
  flexShrink: 0,
};

const hintBtn: React.CSSProperties = {
  padding: '9px 20px',
  borderRadius: 999,
  background: C.tealTint,
  color: C.tealInk,
  border: 'none',
  fontFamily: BODY,
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
};

const linkBtn: React.CSSProperties = {
  alignSelf: 'center',
  marginTop: 4,
  background: 'none',
  border: 'none',
  color: C.tealDeep,
  fontFamily: BODY,
  fontWeight: 800,
  fontSize: 14,
  cursor: 'pointer',
  textDecoration: 'underline',
};

const reshuffleBtn: React.CSSProperties = {
  padding: '9px 18px',
  borderRadius: 999,
  background: C.track,
  color: C.ink,
  border: 'none',
  fontFamily: BODY,
  fontWeight: 800,
  fontSize: 14,
  cursor: 'pointer',
};

const emptyWrap: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: 32,
};
