import { useStore, currentSet } from '../store';
import type { Tier, Voice } from '../types';
import { C, DISPLAY, RAINBOW } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import { Icon, SegControl, icons } from '../components/ui';

const TIERS: { value: Tier; label: string }[] = [
  { value: 'key', label: 'Key' },
  { value: 'normal', label: 'Normal' },
  { value: 'bonus', label: 'Bonus' },
];

export function Editor() {
  const set = useStore(currentSet);
  const setSetName = useStore((s) => s.setSetName);
  const setSetTheme = useStore((s) => s.setSetTheme);
  const setSetGrade = useStore((s) => s.setSetGrade);
  const setSetTags = useStore((s) => s.setSetTags);
  const setSetVoice = useStore((s) => s.setSetVoice);
  const goDisplay = useStore((s) => s.goDisplay);
  const addWord = useStore((s) => s.addWord);
  const removeWord = useStore((s) => s.removeWord);
  const updateWordField = useStore((s) => s.updateWordField);
  const setWordTier = useStore((s) => s.setWordTier);
  const setWordColor = useStore((s) => s.setWordColor);
  const toggleRecorded = useStore((s) => s.toggleRecorded);
  const speakWord = useStore((s) => s.speakWord);

  if (!set) return null;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button type="button" aria-label="Back" onClick={goDisplay} style={backBtn}>
          <Icon path={icons.back} size={18} />
        </button>
        <input
          value={set.name}
          onChange={(e) => setSetName(e.target.value)}
          style={{
            fontFamily: DISPLAY,
            fontSize: 30,
            fontWeight: 700,
            border: 'none',
            background: 'transparent',
            padding: '4px 8px',
            maxWidth: 520,
            color: C.ink,
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, maxWidth: 940 }}>
        <input
          value={set.theme || ''}
          onChange={(e) => setSetTheme(e.target.value)}
          placeholder="Theme (e.g. Food)"
          style={{ ...metaInput, width: 180 }}
        />
        <input
          value={set.gradeLevel || ''}
          onChange={(e) => setSetGrade(e.target.value)}
          placeholder="Grade level"
          style={{ ...metaInput, width: 140 }}
        />
        <input
          value={(set.tags || []).join(', ')}
          onChange={(e) => setSetTags(e.target.value)}
          placeholder="Tags, comma separated"
          style={{ ...metaInput, width: 220 }}
        />
        <SegControl<Voice>
          name="vw-voice"
          value={set.ttsVoice || 'us'}
          onChange={setSetVoice}
          options={[
            { value: 'us', label: 'US Voice' },
            { value: 'uk', label: 'UK Voice' },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gap: 14, maxWidth: 940 }}>
        {set.words.map((w) => (
          <div
            key={w.id}
            style={{
              background: C.surface,
              borderRadius: 18,
              border: `1px solid ${C.borderLight}`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 14,
            }}
          >
            <div style={{ width: 72, height: 72, flex: 'none' }}>
              <ImageSlot id={`slot-${w.id}`} fit="contain" shape="rounded" radius={14} placeholder="Image" />
            </div>
            <div style={{ flex: 1, display: 'grid', gap: 6 }}>
              <input
                value={w.text}
                onChange={(e) => updateWordField(w.id, 'text', e.target.value)}
                placeholder="Word"
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `2px solid ${C.borderLight}`,
                  fontWeight: 700,
                  fontSize: 16,
                  color: C.ink,
                }}
              />
              <input
                value={w.clue || ''}
                onChange={(e) => updateWordField(w.id, 'clue', e.target.value)}
                placeholder="Clue / definition — used for crossword puzzles"
                style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: `2px solid ${C.track}`,
                  fontWeight: 600,
                  fontSize: 13,
                  color: C.ink2,
                }}
              />
            </div>
            <SegControl<Tier>
              name={`tier-${w.id}`}
              value={w.tier}
              onChange={(t) => setWordTier(w.id, t)}
              options={TIERS}
            />
            <div style={{ display: 'flex', gap: 5, flex: 'none' }}>
              {RAINBOW.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label="Word color"
                  onClick={() => setWordColor(w.id, w.color === c ? null : c)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: c,
                    border: w.color === c ? `3px solid ${C.ink}` : '2px solid #ffffff',
                    boxShadow: `0 0 0 1px ${C.borderLight}`,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
            <button type="button" aria-label="Play word" onClick={() => speakWord(w)} style={sqBtn(C.teal)}>
              <Icon path={icons.play} size={16} />
            </button>
            <button
              type="button"
              aria-label="Record audio"
              onClick={() => toggleRecorded(w.id)}
              style={{
                ...sqBtn(w.audioRecorded ? C.amberInk : C.ink),
                background: w.audioRecorded ? C.amber : C.track,
              }}
            >
              <Icon path={icons.mic} size={16} />
            </button>
            <button type="button" aria-label="Remove word" onClick={() => removeWord(w.id)} style={sqBtn(C.danger)}>
              <Icon path={icons.x} size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addWord}
          style={{
            padding: 14,
            borderRadius: 16,
            background: C.surface,
            color: C.ink,
            border: `2px dashed ${C.greenDashed}`,
            fontWeight: 800,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          + Add Word
        </button>
      </div>
    </div>
  );
}

const backBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: C.track,
  border: 'none',
  color: C.ink,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
const metaInput: React.CSSProperties = {
  padding: '9px 14px',
  borderRadius: 12,
  border: `2px solid ${C.borderLight}`,
  fontSize: 14,
  color: C.ink,
};
const sqBtn = (color: string): React.CSSProperties => ({
  width: 38,
  height: 38,
  borderRadius: 12,
  background: C.track,
  border: 'none',
  color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flex: 'none',
});
