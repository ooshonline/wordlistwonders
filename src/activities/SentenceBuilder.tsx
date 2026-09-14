import { useEffect } from 'react';
import { useStore, currentSet } from '../store';
import { C, DISPLAY, BODY } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { Icon, icons, LabeledSeg } from '../components/ui';

// Sentence Builder projector activity (CX2). One word at a time with a
// sentence-building prompt for the class ("Use ___ in a sentence.", plus varied
// prompts in mixed mode). The word's clue and translation are optional reveal
// scaffolds. The cards + all navigation live in the store (`sentence` slice +
// buildSentenceSet generator); this component only renders the current card and
// its controls.
export function SentenceBuilder() {
  const set = useStore(currentSet);
  const contentMode = useStore((s) => s.contentMode);
  const sentence = useStore((s) => s.sentence);
  const initSentence = useStore((s) => s.initSentence);
  const next = useStore((s) => s.sentenceNext);
  const prev = useStore((s) => s.sentencePrev);
  const toggleReveal = useStore((s) => s.toggleSentenceReveal);
  const setMode = useStore((s) => s.setSentenceMode);
  const setShuffle = useStore((s) => s.setSentenceShuffle);
  const reshuffle = useStore((s) => s.reshuffleSentence);

  // Build (or rebuild) the cards on mount and whenever the active set changes,
  // so switching lists never leaves stale prompts on screen. Starting fresh at
  // card 1 is fine for this step-through activity.
  useEffect(() => {
    initSentence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id]);

  const showImage = contentMode !== 'wordOnly';
  const { cards, index, total, revealed, mode, shuffleOrder } = sentence;
  const card = total ? cards[index % total] : undefined;

  if (!total || !card) {
    return (
      <div style={emptyWrap}>
        <div style={{ fontFamily: DISPLAY, fontSize: 26, color: C.ink }}>No words yet</div>
        <div style={{ fontSize: 16, color: C.placeholderInk, maxWidth: 420, textAlign: 'center' }}>
          Add a few words to this list in the Editor and they'll become sentence-building prompts here.
        </div>
      </div>
    );
  }

  const hasScaffold = Boolean(card.hint || card.gloss);

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
            width: 560,
            maxWidth: '82vw',
            minWidth: 0,
            background: C.surface,
            border: `2px solid ${C.tealTint}`,
            borderRadius: 24,
            boxShadow: '0 10px 30px rgba(26, 50, 96, 0.08)',
            padding: '32px 36px',
            textAlign: 'center',
            animation: 'vw-pop 0.25s ease',
          }}
        >
          {showImage && (
            <div style={{ width: 'min(200px,60%)', height: 160, maxHeight: '26vh', margin: '0 auto 20px' }}>
              <ImageSlot id={card.slotId} fit="contain" shape="rounded" radius={18} placeholder="Picture cue" />
            </div>
          )}

          <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.placeholderInk }}>
            The word is
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 44, fontWeight: 800, color: C.tealDeep, lineHeight: 1.1, margin: '4px 0 18px', wordBreak: 'break-word' }}>
            {card.word}
          </div>

          <div style={{ fontFamily: BODY, fontSize: 26, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>
            {card.prompt}
          </div>

          {hasScaffold && (
            <div style={{ marginTop: 22 }}>
              {revealed ? (
                <div
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    gap: 6,
                    background: C.tealTint,
                    borderRadius: 16,
                    padding: '12px 20px',
                    maxWidth: '100%',
                  }}
                >
                  {card.hint && (
                    <div style={{ fontSize: 17, color: C.tealInk }}>
                      <strong>Meaning:</strong> {card.hint}
                    </div>
                  )}
                  {card.gloss && (
                    <div style={{ fontSize: 17, color: C.tealInk }}>
                      <strong>Translation:</strong> {card.gloss}
                    </div>
                  )}
                  <button type="button" onClick={toggleReveal} style={linkBtn}>
                    Hide hint
                  </button>
                </div>
              ) : (
                <button type="button" onClick={toggleReveal} style={hintBtn}>
                  Show hint
                </button>
              )}
            </div>
          )}
        </div>

        <button type="button" aria-label="Next word" onClick={next} style={navBtn}>
          <Icon path={icons.chevronRight} size={26} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
        <LabeledSeg
          label="Prompts"
          name="vw-sentence-mode"
          value={mode}
          onChange={(v) => setMode(v as 'mixed' | 'simple')}
          options={[
            { value: 'mixed', label: 'Mixed' },
            { value: 'simple', label: 'Same' },
          ]}
        />
        <LabeledSeg
          label="Order"
          name="vw-sentence-order"
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
