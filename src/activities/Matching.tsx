import { useEffect } from 'react';
import { useStore, currentSet } from '../store';
import type { MatchMode } from '../generators/matching';
import { C, DISPLAY } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { SegControl } from '../components/ui';

const TEAM_NAMES = ['Team A', 'Team B', 'Team C', 'Team D'];

// Matching / Memory projector game (CX1). A grid of face-down cards; a team
// flips two to find a word ↔ image (or word ↔ clue) pair. A correct match keeps
// the same team's turn and scores a point; a miss passes the turn. The deck and
// all scoring live in the store (`match` slice + buildMatchDeck generator); this
// component only renders the board and schedules the brief reveal before compare.
export function Matching() {
  const set = useStore(currentSet);
  const match = useStore((s) => s.match);
  const initMatch = useStore((s) => s.initMatch);
  const flipMatchCard = useStore((s) => s.flipMatchCard);
  const resolveMatch = useStore((s) => s.resolveMatch);
  const setMatchMode = useStore((s) => s.setMatchMode);
  const setMatchTeamCount = useStore((s) => s.setMatchTeamCount);
  const reshuffleMatch = useStore((s) => s.reshuffleMatch);

  // Deal a board if none exists yet (e.g. after a reload dropped the deck).
  // Runs once per mount; if a game is already in progress (cards present) it's a
  // no-op, so navigating away and back never resets an in-progress round.
  useEffect(() => {
    if (match.cards.length === 0) initMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After a team flips its second card, hold both face-up for a beat so the
  // class can read them, then resolve (score + keep/pass the turn).
  useEffect(() => {
    if (match.flipped.length === 2) {
      const t = setTimeout(() => resolveMatch(), 950);
      return () => clearTimeout(t);
    }
  }, [match.flipped, resolveMatch]);

  const scoreboards = TEAM_NAMES.slice(0, match.teamCount).map((name, i) => ({
    name,
    score: match.scores[i] || 0,
    i,
  }));
  const topScore = Math.max(0, ...match.scores);
  const winners = scoreboards.filter((sb) => sb.score === topScore && topScore > 0);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 18,
        padding: 28,
        overflow: 'auto',
      }}
    >
      {/* Setup controls — mode + teams + reshuffle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        <SegControl<MatchMode>
          name="vw-match-mode"
          value={match.mode}
          onChange={setMatchMode}
          options={[
            { value: 'image', label: 'Word + Image' },
            { value: 'clue', label: 'Word + Clue' },
          ]}
        />
        <SegControl<number>
          name="vw-match-teams"
          value={match.teamCount}
          onChange={setMatchTeamCount}
          options={[2, 3, 4].map((n) => ({ value: n, label: `${n} Teams` }))}
        />
        <button type="button" onClick={reshuffleMatch} style={outlineBtn}>
          Shuffle
        </button>
      </div>

      {match.pairs === 0 ? (
        <EmptyBoard mode={match.mode} hasWords={set.words.length > 0} />
      ) : match.done ? (
        <>
          <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, marginTop: 8 }}>Round Complete!</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.ink2 }}>
            {winners.length === 1
              ? `${winners[0].name} wins!`
              : winners.length > 1
                ? "It's a tie!"
                : 'All pairs found.'}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {scoreboards.map((sb) => (
              <div key={sb.i} style={{ ...scoreCard, outline: winners.some((w) => w.i === sb.i) ? `3px solid ${C.teal}` : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: C.teal }}>{sb.name}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800 }}>{sb.score}</div>
              </div>
            ))}
          </div>
          <button type="button" onClick={reshuffleMatch} style={greenBtn}>
            Play Again
          </button>
        </>
      ) : (
        <>
          {/* Whose turn + how many pairs are left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 800, color: C.tealInk }}>
              {scoreboards[match.turn]?.name || 'Team'}&rsquo;s turn
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.6 }}>
              {match.matched.length} / {match.pairs} pairs found
            </div>
          </div>

          {/* The board */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${match.cols}, 1fr)`,
              gap: 12,
              width: '100%',
              maxWidth: Math.min(880, match.cols * 170),
            }}
          >
            {match.cards.map((card, i) => {
              const isMatched = match.matched.includes(card.pairId);
              const isFlipped = match.flipped.includes(i);
              const faceUp = isMatched || isFlipped;
              const busy = match.flipped.length >= 2;
              const clickable = !faceUp && !busy;
              // A div (not a <button>) so the image face's ImageSlot — which is
              // itself a <button> — never nests a button inside a button (invalid
              // DOM). role/tabIndex/onKeyDown keep it keyboard-operable.
              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={clickable ? 0 : -1}
                  aria-disabled={!clickable}
                  onClick={() => clickable && flipMatchCard(i)}
                  onKeyDown={(e) => {
                    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      flipMatchCard(i);
                    }
                  }}
                  aria-label={faceUp ? card.text || 'image card' : 'face-down card'}
                  style={{
                    boxSizing: 'border-box',
                    aspectRatio: '1 / 1',
                    borderRadius: 16,
                    border: faceUp ? `2px solid ${isMatched ? C.teal : C.amberBorder}` : `2px solid ${C.borderCard}`,
                    background: isMatched ? C.tealTint : faceUp ? C.surface : C.track,
                    boxShadow: faceUp ? '0 4px 14px rgba(26,50,96,0.10)' : 'none',
                    cursor: clickable ? 'pointer' : 'default',
                    opacity: isMatched ? 0.85 : 1,
                    padding: card.face === 'match' && card.text === '' ? 6 : 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.1s ease',
                    minWidth: 0,
                  }}
                >
                  {!faceUp ? (
                    // Card back — a calm, branded "?" so face-down cards read on a projector.
                    <span aria-hidden="true" style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800, color: C.trackHover }}>
                      ?
                    </span>
                  ) : card.face === 'match' && card.text === '' ? (
                    // Image half (image mode): the shared slot for this word.
                    <div style={{ width: '100%', height: '100%' }}>
                      <ImageSlot id={`slot-${card.wordId}`} fit="contain" shape="rounded" radius={12} placeholder="Image" />
                    </div>
                  ) : (
                    // Word half, or the clue half in clue mode.
                    <span
                      style={{
                        fontFamily: card.face === 'word' ? DISPLAY : "'Nunito', sans-serif",
                        fontSize: card.face === 'word' ? 22 : 15,
                        fontWeight: card.face === 'word' ? 800 : 700,
                        color: card.face === 'word' ? C.ink : C.ink2,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        wordBreak: 'break-word',
                      }}
                    >
                      {card.text}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live scoreboard */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            {scoreboards.map((sb) => (
              <div
                key={sb.i}
                style={{
                  ...scoreCard,
                  minWidth: 120,
                  outline: sb.i === match.turn ? `3px solid ${C.teal}` : 'none',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: C.teal }}>{sb.name}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 800 }}>{sb.score}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Guidance when no board can be dealt: an empty set, or clue mode with no clues.
function EmptyBoard({ mode, hasWords }: { mode: MatchMode; hasWords: boolean }) {
  return (
    <div style={{ maxWidth: 460, textAlign: 'center', marginTop: 40, color: C.ink2 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, color: C.ink, marginBottom: 8 }}>
        Not enough to match yet
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.5 }}>
        {!hasWords
          ? 'Add some words to this list first, then a matching board will appear.'
          : mode === 'clue'
            ? 'Clue mode needs words that have a clue. Add clues in the Editor, or switch to Word + Image above.'
            : 'Add at least two words to this list to build a matching board.'}
      </div>
    </div>
  );
}

const scoreCard: React.CSSProperties = {
  background: C.surface,
  borderRadius: 18,
  boxShadow: '0 6px 20px rgba(26,50,96,0.08)',
  padding: '12px 20px',
  textAlign: 'center',
  minWidth: 120,
};
const outlineBtn: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 999,
  background: C.surface,
  color: C.ink,
  border: `2px solid ${C.ink}`,
  fontWeight: 700,
  cursor: 'pointer',
};
const greenBtn: React.CSSProperties = {
  padding: '12px 22px',
  borderRadius: 999,
  background: C.green,
  color: '#fff',
  border: 'none',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: `0 4px 0 ${C.greenShadow}`,
};
