import { useEffect, useState } from 'react';
import { useStore, currentSet } from '../store';
import { C, DISPLAY, BODY } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { Icon, icons, LabeledSeg, KeyTip, Kbd } from '../components/ui';
import { useActivityKeys } from '../components/activityKeys';
import { TimerRing } from '../components/TimerRing';
import { Confetti } from '../components/Confetti';
import { SECRET_MODES, SECRET_TIMER_CHOICES, secretModeInfo, type SecretMode } from '../generators/secretWord';

// Secret Word projector game (CX10) — charades, Pictionary, or describe-it.
// A student peeks at the hidden word (the class looks away), hides it again,
// then acts / draws / describes it while the class guesses against an optional
// round timer. "Got it!" celebrates and shows the word; time running out shows
// it too. Cards, mode and timer length live in the store (`secret` slice); the
// ticking countdown is local to this component so it stops when you leave.
export function SecretWord() {
  const set = useStore(currentSet);
  const secret = useStore((s) => s.secret);
  const initSecret = useStore((s) => s.initSecret);
  const next = useStore((s) => s.secretNext);
  const prev = useStore((s) => s.secretPrev);
  const setRevealed = useStore((s) => s.setSecretRevealed);
  const setMode = useStore((s) => s.setSecretMode);
  const setSeconds = useStore((s) => s.setSecretSeconds);
  const setShuffle = useStore((s) => s.setSecretShuffle);
  const reshuffle = useStore((s) => s.reshuffleSecret);

  // null = timer not started this round; 0 = time's up.
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [gotIt, setGotIt] = useState(0); // bumps the confetti burst
  const [won, setWon] = useState(false);

  // Rebuild when the active set changes so a stale word never lingers.
  useEffect(() => {
    initSecret();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id]);

  const { cards, index, total, revealed, mode, seconds, shuffleOrder } = secret;
  const card = total ? cards[index % total] : undefined;
  const info = secretModeInfo(mode);

  // A new word (or a new timer length) starts a fresh round.
  useEffect(() => {
    setTimeLeft(null);
    setRunning(false);
    setWon(false);
  }, [index, card?.slotId, seconds]);

  // Tick once a second while running.
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setTimeLeft((left) => Math.max(0, (left ?? 0) - 1)), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  // At zero, stop the clock and show the word to the class.
  useEffect(() => {
    if (running && timeLeft === 0) {
      setRunning(false);
      setRevealed(true);
    }
  }, [running, timeLeft, setRevealed]);

  const startTimer = () => {
    setRevealed(false);
    setWon(false);
    setTimeLeft(seconds);
    setRunning(true);
  };
  const toggleTimer = () => {
    if (running) setRunning(false);
    else if (timeLeft && timeLeft > 0) setRunning(true);
    else startTimer();
  };
  const celebrate = () => {
    setRunning(false);
    setRevealed(true);
    setWon(true);
    setGotIt((n) => n + 1);
  };

  useActivityKeys((key) => {
    if (!card) return false;
    if (key === 'ArrowRight' || key === 'PageDown') {
      next();
      return true;
    }
    if (key === 'ArrowLeft' || key === 'PageUp') {
      prev();
      return true;
    }
    const k = key.toLowerCase();
    if (k === 's') {
      setRevealed(!revealed);
      return true;
    }
    if (k === 't' && seconds > 0) {
      toggleTimer();
      return true;
    }
    if (k === 'g') {
      celebrate();
      return true;
    }
    return false;
  });

  if (!total || !card) {
    return (
      <div style={emptyWrap}>
        <div style={{ fontFamily: DISPLAY, fontSize: 26, color: C.ink }}>No words yet</div>
        <div style={{ fontSize: 16, color: C.placeholderInk, maxWidth: 420, textAlign: 'center' }}>
          Add a few words to this list in the Editor, then act, draw, or describe them here.
        </div>
      </div>
    );
  }

  const timeUp = timeLeft === 0;
  const status = won ? 'Well done! 🎉' : timeUp ? 'Time’s up! Here’s the word.' : '';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '24px 20px' }}>
      {gotIt > 0 && <Confetti burstKey={gotIt} pieces={60} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, maxWidth: '100%', minWidth: 0 }}>
        <button type="button" aria-label="Previous word" onClick={prev} style={navBtn} className="vw-guess-sidenav">
          <Icon path={icons.chevronLeft} size={26} />
        </button>

        <div
          key={index}
          style={{
            width: 720,
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            background: C.surface,
            border: `2px solid ${C.tealTint}`,
            borderRadius: 24,
            boxShadow: '0 10px 30px rgba(26, 50, 96, 0.08)',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            animation: 'vw-pop 0.25s ease',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: C.tealInk, textAlign: 'center' }}>
            <span aria-hidden="true">{info.emoji}</span> {info.instruction}
          </div>

          {revealed ? (
            <>
              <div style={{ width: 'min(240px,60%)', height: 170, maxHeight: '24vh' }}>
                <ImageSlot id={card.slotId} fit="contain" shape="rounded" radius={18} placeholder="Picture" />
              </div>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 'clamp(40px, 9vw, 76px)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: C.tealDeep,
                  textAlign: 'center',
                  overflowWrap: 'anywhere',
                }}
              >
                {card.word}
              </div>
              {mode === 'describe' && card.clue && (
                <div style={{ background: C.tealTint, color: C.tealInk, borderRadius: 14, padding: '8px 16px', fontSize: 17, textAlign: 'center' }}>
                  <strong>Idea:</strong> {card.clue}
                </div>
              )}
            </>
          ) : (
            <>
              <div
                aria-label="Hidden word"
                style={{
                  width: 'min(260px, 70%)',
                  height: 150,
                  maxHeight: '22vh',
                  borderRadius: 22,
                  background: C.track,
                  border: `3px dashed ${C.borderLight}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: DISPLAY,
                  fontSize: 90,
                  fontWeight: 800,
                  color: C.placeholderInk,
                }}
              >
                ?
              </div>
              <div style={{ fontSize: 15, color: C.ink2, textAlign: 'center', maxWidth: 460 }}>
                Class, close your eyes! The player taps <strong>Show word</strong> to peek, then <strong>Hide word</strong> and starts.
              </div>
            </>
          )}

          {seconds > 0 && timeLeft !== null && <TimerRing timeLeft={timeLeft} total={seconds} />}

          {status && (
            <div role="status" style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, color: won ? C.tealDeep : C.ink }}>
              {status}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" onClick={() => setRevealed(!revealed)} style={{ ...pillBtn, background: C.track, color: C.ink }}>
              {revealed ? 'Hide word' : 'Show word'}
            </button>
            {seconds > 0 && (
              <button type="button" onClick={toggleTimer} style={pillBtn}>
                {running ? 'Pause timer' : timeLeft && timeLeft > 0 ? 'Resume timer' : timeUp ? 'Restart timer' : `Start ${seconds}s timer`}
              </button>
            )}
            {!won && !timeUp && (
              <button type="button" onClick={celebrate} style={{ ...pillBtn, background: C.green, color: '#ffffff' }}>
                Got it! 🎉
              </button>
            )}
            {(won || timeUp) && (
              <button type="button" onClick={next} style={pillBtn}>
                Next word →
              </button>
            )}
          </div>
        </div>

        <button type="button" aria-label="Next word" onClick={next} style={navBtn} className="vw-guess-sidenav">
          <Icon path={icons.chevronRight} size={26} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
        <LabeledSeg
          label="Mode"
          name="vw-secret-mode"
          value={mode}
          onChange={(v) => setMode(v as SecretMode)}
          options={SECRET_MODES.map((m) => ({ value: m.id, label: `${m.emoji} ${m.label}` }))}
        />
        <LabeledSeg
          label="Timer"
          name="vw-secret-timer"
          value={seconds}
          onChange={(v) => setSeconds(Number(v))}
          options={SECRET_TIMER_CHOICES.map((n) => ({ value: n, label: n === 0 ? 'Off' : `${n}s` }))}
        />
        <LabeledSeg
          label="Order"
          name="vw-secret-order"
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
        {/* On phones the arrows move down here so the card can use the full width. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" aria-label="Previous word" onClick={prev} style={navBtn} className="vw-guess-bottomnav">
            <Icon path={icons.chevronLeft} size={22} />
          </button>
          <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7 }}>
            {index + 1} / {total}
          </div>
          <button type="button" aria-label="Next word" onClick={next} style={navBtn} className="vw-guess-bottomnav">
            <Icon path={icons.chevronRight} size={22} />
          </button>
        </div>
      </div>

      <KeyTip>
        <Kbd>S</Kbd> show / hide · <Kbd>T</Kbd> timer · <Kbd>G</Kbd> got it · <Kbd>→</Kbd> / <Kbd>PageDown</Kbd> next word · <Kbd>←</Kbd> previous
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
