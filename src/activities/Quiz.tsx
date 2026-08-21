import { useStore, currentSet } from '../store';
import type { QuizState } from '../store';
import { C, DISPLAY } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { SegControl } from '../components/ui';

const TEAM_NAMES = ['Team A', 'Team B', 'Team C', 'Team D'];

export function Quiz() {
  const set = useStore(currentSet);
  const quiz = useStore((s) => s.quiz);
  const setTeamCount = useStore((s) => s.setTeamCount);
  const setCountdown = useStore((s) => s.setCountdown);
  const setCustomSeconds = useStore((s) => s.setQuizCustomSeconds);
  const answerQuiz = useStore((s) => s.answerQuiz);
  const addScore = useStore((s) => s.addScore);
  const nextQuestion = useStore((s) => s.nextQuestion);
  const playAgain = useStore((s) => s.playQuizAgain);
  const createReview = useStore((s) => s.createReviewSetFromMissed);

  const words = set.words;
  const quizTarget = words.find((w) => w.id === quiz.targetId);
  const missedWords = words.filter((w) => quiz.missed.includes(w.id));
  const scoreboards = TEAM_NAMES.slice(0, quiz.teamCount).map((name, i) => ({ name, score: quiz.scores[i] || 0, i }));

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: 32,
        overflow: 'auto',
      }}
    >
      {quiz.done ? (
        <>
          <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 700 }}>Round Complete!</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {scoreboards.map((sb) => (
              <div key={sb.i} style={scoreCard}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: C.teal }}>{sb.name}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800 }}>{sb.score}</div>
              </div>
            ))}
          </div>
          {missedWords.length > 0 && (
            <div style={{ maxWidth: 500, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Words the class missed:</div>
              <div style={{ fontSize: 15, color: C.ink2 }}>{missedWords.map((w) => w.text).join(', ')}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={playAgain} style={outlineBtn}>
              Play Again
            </button>
            {missedWords.length > 0 && (
              <button type="button" onClick={createReview} style={greenBtn}>
                Create review set from missed words
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <SegControl<number>
              name="vw-teams"
              value={quiz.teamCount}
              onChange={setTeamCount}
              options={[2, 3, 4].map((n) => ({ value: n, label: `${n} Teams` }))}
            />
            <SegControl<QuizState['countdown']>
              name="vw-countdown"
              value={quiz.countdown}
              onChange={setCountdown}
              options={[
                { value: 'off', label: 'Off' },
                { value: '10', label: '10s' },
                { value: '20', label: '20s' },
                { value: '30', label: '30s' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
            {quiz.countdown === 'custom' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: C.track,
                  borderRadius: 999,
                  padding: '6px 14px',
                }}
              >
                <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.75 }}>Seconds</label>
                <input
                  type="number"
                  min={3}
                  max={300}
                  value={quiz.customSeconds}
                  onChange={(e) => setCustomSeconds(parseInt(e.target.value, 10))}
                  style={{ width: 64, padding: 6, borderRadius: 8, border: `2px solid ${C.borderLight}`, fontWeight: 700 }}
                />
              </div>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.6 }}>
            {words.length ? `Question ${quiz.pointer + 1} of ${words.length}` : 'No words yet'}
          </div>
          {quiz.timeLeft !== null && quiz.timeLeft !== undefined && (
            <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 800, color: C.amberBorder }}>
              {quiz.timeLeft}s
            </div>
          )}
          <div style={{ width: 'min(320px,100%)', height: 220, maxHeight: '30vh' }}>
            <ImageSlot
              id={quizTarget ? `slot-${quizTarget.id}` : 'slot-none'}
              fit="contain"
              shape="rounded"
              radius={22}
              placeholder="Image"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%', maxWidth: 640 }}>
            {(quiz.options || []).map((o) => {
              let bg: string = '#ffffff';
              let color: string = C.ink;
              let border = `2px solid ${C.borderLight}`;
              if (quiz.answered) {
                if (o.id === quiz.targetId) {
                  bg = C.tealTint;
                  border = `2px solid ${C.teal}`;
                  color = C.tealInk;
                } else if (o.id === quiz.selected) {
                  bg = C.amber;
                  border = `2px solid ${C.amberBorder}`;
                  color = C.amberInk;
                }
              }
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => answerQuiz(o.id)}
                  style={{
                    padding: 22,
                    fontSize: 24,
                    fontWeight: 800,
                    borderRadius: 20,
                    cursor: 'pointer',
                    background: bg,
                    color,
                    border,
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  {o.text}
                </button>
              );
            })}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            {scoreboards.map((sb) => (
              <div key={sb.i} style={{ ...scoreCard, minWidth: 130 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: C.teal }}>{sb.name}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 800 }}>{sb.score}</div>
                <button
                  type="button"
                  disabled={!quiz.answered}
                  onClick={() => addScore(sb.i)}
                  style={{
                    marginTop: 6,
                    padding: '8px 16px',
                    borderRadius: 999,
                    background: C.tealTint,
                    color: C.tealInk,
                    border: 'none',
                    fontWeight: 800,
                    cursor: quiz.answered ? 'pointer' : 'default',
                    opacity: quiz.answered ? 1 : 0.5,
                  }}
                >
                  +1 point
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={!quiz.answered}
              onClick={nextQuestion}
              style={{
                padding: '14px 26px',
                borderRadius: 999,
                background: C.green,
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: 16,
                cursor: quiz.answered ? 'pointer' : 'default',
                opacity: quiz.answered ? 1 : 0.5,
                boxShadow: `0 4px 0 ${C.greenShadow}`,
              }}
            >
              Next Word
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const scoreCard: React.CSSProperties = {
  background: C.surface,
  borderRadius: 18,
  boxShadow: '0 6px 20px rgba(26,50,96,0.08)',
  padding: '14px 22px',
  textAlign: 'center',
  minWidth: 140,
};
const outlineBtn: React.CSSProperties = {
  padding: '12px 22px',
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
};
