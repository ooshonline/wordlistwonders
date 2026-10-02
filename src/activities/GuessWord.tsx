import { useEffect, useState } from 'react';
import { useStore, currentSet } from '../store';
import { C, DISPLAY, BODY } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { Icon, icons, LabeledSeg, KeyTip, Kbd } from '../components/ui';
import { useActivityKeys } from '../components/activityKeys';
import { ALPHABET, GUESS_MISS_OPTIONS, guessProgress, keyState } from '../generators/guessWord';

// Guess the Word projector game (CX8) — a friendly, no-gallows hangman. One
// hidden word at a time: the class calls letters, the teacher taps them on the
// A–Z keyboard (or types them). Hits fill the blanks; misses fill a row of dots.
// The round ends when the word is solved or the dots run out, and the word (and
// its picture) is shown either way. State lives in the store (`guess` slice);
// hits/misses are derived by the pure guessProgress().
export function GuessWord() {
  const set = useStore(currentSet);
  const guess = useStore((s) => s.guess);
  const initGuess = useStore((s) => s.initGuess);
  const guessLetter = useStore((s) => s.guessLetter);
  const next = useStore((s) => s.guessNext);
  const prev = useStore((s) => s.guessPrev);
  const reveal = useStore((s) => s.revealGuess);
  const setMisses = useStore((s) => s.setGuessMisses);
  const setShuffle = useStore((s) => s.setGuessShuffle);
  const reshuffle = useStore((s) => s.reshuffleGuess);
  const [showClue, setShowClue] = useState(false);

  // Rebuild when the active set changes so a stale word never lingers.
  useEffect(() => {
    initGuess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id]);

  const { cards, index, total, guessed, revealed, maxMisses, shuffleOrder } = guess;
  const card = total ? cards[index % total] : undefined;

  // The clue hint is per word — hide it again on every new word.
  useEffect(() => setShowClue(false), [index, card?.id]);

  useActivityKeys((key) => {
    if (!card) return false;
    if (/^[a-z]$/i.test(key)) {
      guessLetter(key);
      return true;
    }
    if (key === 'ArrowRight' || key === 'PageDown') {
      next();
      return true;
    }
    if (key === 'ArrowLeft' || key === 'PageUp') {
      prev();
      return true;
    }
    return false;
  });

  if (!total || !card) {
    return (
      <div style={emptyWrap}>
        <div style={{ fontFamily: DISPLAY, fontSize: 26, color: C.ink }}>No words yet</div>
        <div style={{ fontSize: 16, color: C.placeholderInk, maxWidth: 420, textAlign: 'center' }}>
          Add a few words to this list in the Editor, then guess them here letter by letter.
        </div>
      </div>
    );
  }

  const p = guessProgress(card, guessed, maxMisses);
  const over = p.over || revealed;
  const tiles = revealed ? p.tiles.map((t) => ({ ...t, shown: true })) : p.tiles;
  const status = p.solved ? 'You got it! 🎉' : p.lost ? 'Out of guesses — here’s the word.' : revealed ? 'Here’s the word.' : '';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, padding: '28px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, maxWidth: '100%' }}>
        <button type="button" aria-label="Previous word" onClick={prev} style={navBtn}>
          <Icon path={icons.chevronLeft} size={26} />
        </button>

        <div
          key={index}
          style={{
            width: 760,
            maxWidth: '78vw',
            minWidth: 0,
            background: C.surface,
            border: `2px solid ${C.tealTint}`,
            borderRadius: 24,
            boxShadow: '0 10px 30px rgba(26, 50, 96, 0.08)',
            padding: '26px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            animation: 'vw-pop 0.25s ease',
          }}
        >
          {over && (
            <div style={{ width: 'min(240px,60%)', height: 170, maxHeight: '24vh' }}>
              <ImageSlot id={card.slotId} fit="contain" shape="rounded" radius={18} placeholder="Picture" />
            </div>
          )}

          {/* The word: one tile per character; spaces/hyphens show from the start. */}
          <div
            aria-label={over ? card.text : `${p.tiles.filter((t) => t.isLetter).length} letter word`}
            style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: '100%' }}
          >
            {tiles.map((t, i) =>
              t.isLetter ? (
                <div
                  key={i}
                  style={{
                    width: 54,
                    height: 66,
                    borderBottom: `5px solid ${t.shown ? C.teal : C.ink}`,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    fontFamily: DISPLAY,
                    fontSize: 48,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: p.lost && !p.hits.includes(t.ch.toUpperCase()) ? C.orange : C.tealDeep,
                  }}
                >
                  {t.shown ? t.ch.toUpperCase() : ''}
                </div>
              ) : (
                <div key={i} style={{ width: t.ch === ' ' ? 26 : 'auto', height: 66, display: 'flex', alignItems: 'flex-end', fontFamily: DISPLAY, fontSize: 48, fontWeight: 800, color: C.ink }}>
                  {t.ch === ' ' ? '' : t.ch}
                </div>
              ),
            )}
          </div>

          {/* Misses: friendly dots, no gallows. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.placeholderInk }}>
              Misses
            </span>
            <div style={{ display: 'flex', gap: 6 }} aria-label={`${p.misses.length} of ${maxMisses} misses`}>
              {Array.from({ length: maxMisses }, (_, i) => (
                <span
                  key={i}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: i < p.misses.length ? C.orange : C.track,
                    border: `2px solid ${i < p.misses.length ? C.orange : C.borderLight}`,
                  }}
                />
              ))}
            </div>
            {p.misses.length > 0 && (
              <span style={{ fontSize: 16, fontWeight: 800, color: C.orange, letterSpacing: '0.12em' }}>{p.misses.join(' ')}</span>
            )}
          </div>

          {status ? (
            <div role="status" style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, color: p.solved ? C.tealDeep : C.ink }}>
              {status}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {card.clue &&
                (showClue ? (
                  <div style={{ background: C.tealTint, color: C.tealInk, borderRadius: 14, padding: '8px 16px', fontSize: 17 }}>
                    <strong>Clue:</strong> {card.clue}
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowClue(true)} style={pillBtn}>
                    Show clue
                  </button>
                ))}
              <button type="button" onClick={reveal} style={{ ...pillBtn, background: C.track, color: C.ink }}>
                Show the word
              </button>
            </div>
          )}

          {/* On-screen A–Z keyboard (big targets for a touch board). */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 7, maxWidth: 640 }}>
            {ALPHABET.map((l) => {
              const st = keyState(p, l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-label={`Letter ${l}${st === 'idle' ? '' : st === 'hit' ? ', in the word' : ', not in the word'}`}
                  disabled={over || st !== 'idle'}
                  onClick={() => guessLetter(l)}
                  style={{
                    width: 44,
                    height: 48,
                    borderRadius: 12,
                    border: 'none',
                    fontFamily: DISPLAY,
                    fontSize: 22,
                    fontWeight: 800,
                    cursor: over || st !== 'idle' ? 'default' : 'pointer',
                    background: st === 'hit' ? C.teal : st === 'miss' ? C.track : C.tealTint,
                    color: st === 'hit' ? '#ffffff' : st === 'miss' ? C.placeholderInk : C.tealInk,
                    opacity: st === 'miss' ? 0.55 : over && st === 'idle' ? 0.6 : 1,
                    textDecoration: st === 'miss' ? 'line-through' : 'none',
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <button type="button" aria-label="Next word" onClick={next} style={navBtn}>
          <Icon path={icons.chevronRight} size={26} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
        <LabeledSeg
          label="Misses"
          name="vw-guess-misses"
          value={maxMisses}
          onChange={(v) => setMisses(Number(v))}
          options={GUESS_MISS_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
        />
        <LabeledSeg
          label="Order"
          name="vw-guess-order"
          value={shuffleOrder}
          onChange={(v) => setShuffle(Boolean(v))}
          options={[
            { value: false, label: 'List order' },
            { value: true, label: 'Shuffle' },
          ]}
        />
        {shuffleOrder && (
          <button type="button" onClick={reshuffle} style={{ ...pillBtn, background: C.track, color: C.ink }}>
            Shuffle again
          </button>
        )}
        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7 }}>
          {index + 1} / {total}
        </div>
      </div>

      <KeyTip>
        Type letters on the keyboard, or tap them · <Kbd>→</Kbd> / <Kbd>PageDown</Kbd> next word · <Kbd>←</Kbd> previous
      </KeyTip>
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

const pillBtn: React.CSSProperties = {
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

const emptyWrap: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: 40,
};
