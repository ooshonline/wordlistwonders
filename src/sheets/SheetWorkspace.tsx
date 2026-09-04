import { useEffect, useMemo, useRef } from 'react';
import { useStore, currentSet } from '../store';
import type { DisplayMode } from '../types';
import { C, DISPLAY } from '../tokens';
import { Icon, LabeledSeg, icons } from '../components/ui';
import { buildSheet, sheetEditRows } from './buildSheet';
import { SheetPageView } from './SheetPages';
import { hasClue } from '../generators/clueSuggest';

// Drive the browser print dialog for worksheet pages. Uses a body attribute so
// screen and print share one DOM (see index.css @media print rules).
function printSheet() {
  document.body.setAttribute('data-print-mode', 'sheet');
  const cleanup = () => {
    document.body.removeAttribute('data-print-mode');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}

export function SheetWorkspace() {
  const set = useStore(currentSet);
  const kind = useStore((s) => s.displayMode) as DisplayMode;
  const state = useStore();
  const editorOpen = useStore((s) => s.sheetEditorOpen);
  const colW = useStore((s) => s.sheetColW);
  const setSheetColW = useStore((s) => s.setSheetColW);
  const toggleEditor = useStore((s) => s.toggleSheetEditor);
  const reshuffle = useStore((s) => s.reshuffleSheet);
  const printCredit = useStore((s) => s.printCredit);
  const setPrintCredit = useStore((s) => s.setPrintCredit);
  const addWord = useStore((s) => s.addWord);
  const removeWord = useStore((s) => s.removeWord);
  const updateWordField = useStore((s) => s.updateWordField);
  const suggestMissingClues = useStore((s) => s.suggestMissingClues);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Crossword clue-suggestion affordance (F6): only when clues are actually blank.
  const blankClues = kind === 'crossword' ? set.words.filter((w) => !hasClue(w)).length : 0;

  const data = useMemo(
    () => buildSheet(kind, set, state),
    // Rebuild when inputs that affect the sheet change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, set, state.bingo, state.flash, state.wordsearch, state.crossword, state.salt, state.printCredit],
  );

  // Live preview zoom from the measured column width.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w && Math.abs((colW || 0) - w) > 1) setSheetColW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [colW, setSheetColW]);

  const zoom = Math.min(1, Math.max(0.35, ((colW || 900) - 26) / 816));
  const rows = sheetEditRows(set.words, data.editLabels);

  return (
    <div
      className="vw-sheet-area"
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        padding: 22,
        background: C.workspace,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}
    >
      {/* Control card */}
      <div
        className="vw-noprint"
        style={{
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
          background: '#ffffff',
          border: `1px solid ${C.borderCard}`,
          borderRadius: 22,
          padding: '16px 22px',
          boxShadow: '0 6px 18px rgba(26,50,96,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 800 }}>{data.kindLabel}</div>
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.5 }}>{data.summary}</div>
          {data.showShuffle && (
            <button
              type="button"
              onClick={() => reshuffle(kind as 'bingo' | 'wordsearch' | 'crossword')}
              style={outlineBtn}
            >
              Shuffle
            </button>
          )}
          <button
            type="button"
            onClick={toggleEditor}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              background: C.track,
              color: C.ink,
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {editorOpen ? 'Hide Words' : 'Edit Words'}
          </button>
          <button
            type="button"
            onClick={printSheet}
            style={{
              padding: '11px 22px',
              borderRadius: 999,
              background: C.green,
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: `0 4px 0 ${C.greenShadow}`,
              whiteSpace: 'nowrap',
            }}
          >
            Print
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
          <SheetControls kind={kind} />
          {/* Global print option: an opt-in app credit line on every worksheet (M1). */}
          <LabeledSeg
            label="Credit line"
            name="vw-printcredit"
            value={printCredit}
            onChange={setPrintCredit}
            options={[
              { value: false, label: 'Off' },
              { value: true, label: 'On' },
            ]}
          />
        </div>

        {(data.warning || blankClues > 0) && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              maxWidth: 640,
            }}
          >
            {data.warning && (
              <div
                style={{
                  background: C.amber,
                  color: C.amberInk,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '9px 16px',
                  borderRadius: 12,
                  textAlign: 'center',
                }}
              >
                {data.warning}
              </div>
            )}
            {/* F6: one-tap local clue suggestions for a fresh, clue-less list. */}
            {blankClues > 0 && (
              <button type="button" onClick={suggestMissingClues} style={outlineBtn}>
                {`Suggest clues for ${blankClues} blank${blankClues === 1 ? '' : 's'}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div
        className="vw-sheet-cols"
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        {editorOpen && (
          <div
            className="vw-noprint"
            style={{
              flex: '0 0 380px',
              minWidth: 0,
              overflow: 'auto',
              alignSelf: 'stretch',
              background: '#ffffff',
              border: `1px solid ${C.borderCard}`,
              borderRadius: 22,
              padding: '20px 22px',
              boxShadow: '0 6px 18px rgba(26,50,96,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 800 }}>Words in this activity</div>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.5 }}>
                Edits apply to every activity and to your saved list
              </div>
            </div>
            {rows.map(({ word, label }) => (
              <div key={word.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {label && (
                  <div
                    style={{
                      flex: 'none',
                      width: 38,
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '6px 0',
                      borderRadius: 8,
                      background: label.charAt(0) === 'A' ? C.tealTint : C.amber,
                      color: label.charAt(0) === 'A' ? C.tealInk : C.amberInk,
                    }}
                  >
                    {label}
                  </div>
                )}
                <input
                  value={word.text}
                  onChange={(e) => updateWordField(word.id, 'text', e.target.value)}
                  placeholder="Word"
                  style={{
                    flex: '1 1 140px',
                    minWidth: 0,
                    padding: '9px 13px',
                    borderRadius: 11,
                    border: `2px solid ${C.borderLight}`,
                    fontWeight: 700,
                    fontSize: 15,
                    color: C.ink,
                  }}
                />
                {data.showClueColumn && (
                  <input
                    value={word.clue || ''}
                    onChange={(e) => updateWordField(word.id, 'clue', e.target.value)}
                    placeholder="Clue students will read…"
                    style={{
                      flex: '1 1 100%',
                      order: 9,
                      padding: '8px 13px',
                      borderRadius: 11,
                      border: `2px solid ${C.track}`,
                      fontWeight: 600,
                      fontSize: 13,
                      color: C.ink2,
                    }}
                  />
                )}
                <button
                  type="button"
                  aria-label="Remove word"
                  onClick={() => removeWord(word.id)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    background: C.track,
                    border: 'none',
                    color: C.danger,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flex: 'none',
                  }}
                >
                  <Icon path={icons.x} size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addWord}
              style={{
                padding: 12,
                borderRadius: 14,
                background: '#ffffff',
                color: C.ink,
                border: `2px dashed ${C.greenDashed}`,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              + Add Word
            </button>
          </div>
        )}

        <div className="vw-sheet-scroll" ref={scrollRef} style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          <div
            className="vw-sheet-wrap"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 30,
              paddingBottom: 8,
              // zoom keeps the sheet crisp while fitting the column width
              zoom,
            }}
          >
            {data.pages.map((page, i) => (
              <SheetPageView key={i} page={page} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const outlineBtn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 999,
  background: '#ffffff',
  color: C.ink,
  border: `2px solid ${C.ink}`,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

// ── per-activity control rows ───────────────────────────────────────────────
function SheetControls({ kind }: { kind: DisplayMode }) {
  const bingo = useStore((s) => s.bingo);
  const flash = useStore((s) => s.flash);
  const ws = useStore((s) => s.wordsearch);
  const cw = useStore((s) => s.crossword);
  const setBingoCount = useStore((s) => s.setBingoCount);
  const setBingoGridSize = useStore((s) => s.setBingoGridSize);
  const setBingoPerPage = useStore((s) => s.setBingoPerPage);
  const setBingoContent = useStore((s) => s.setBingoContent);
  const setBingoAllowRepeat = useStore((s) => s.setBingoAllowRepeat);
  const setFlashPerPage = useStore((s) => s.setFlashPerPage);
  const setFlashContent = useStore((s) => s.setFlashContent);
  const setFlashCutLines = useStore((s) => s.setFlashCutLines);
  const setSearchSize = useStore((s) => s.setSearchSize);
  const setSearchDiagonals = useStore((s) => s.setSearchDiagonals);
  const setSearchBackwards = useStore((s) => s.setSearchBackwards);
  const setSearchAnswerKey = useStore((s) => s.setSearchAnswerKey);
  const setCrossAnswerKey = useStore((s) => s.setCrossAnswerKey);

  if (kind === 'bingo') {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={microLabel}>Cards</label>
          <input
            type="number"
            min={1}
            max={30}
            value={bingo.count}
            onChange={(e) => setBingoCount(parseInt(e.target.value, 10))}
            style={numInput}
          />
        </div>
        <LabeledSeg
          label="Grid"
          name="vw-bingosize"
          value={bingo.gridSize}
          onChange={setBingoGridSize}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: '3', label: '3×3' },
            { value: '4', label: '4×4' },
            { value: '5', label: '5×5' },
          ]}
        />
        <LabeledSeg
          label="Per page"
          name="vw-bingoperpage"
          value={bingo.perPage}
          onChange={setBingoPerPage}
          options={[1, 2, 4, 6].map((n) => ({ value: n, label: String(n) }))}
        />
        <LabeledSeg
          label="Content"
          name="vw-bingocontent"
          value={bingo.content}
          onChange={setBingoContent}
          options={[
            { value: 'words', label: 'Words' },
            { value: 'imageWord', label: 'Words + Images' },
            { value: 'imagesOnly', label: 'Images' },
          ]}
        />
        <LabeledSeg
          label="Duplicates"
          name="vw-bingorepeat"
          value={bingo.allowRepeat}
          onChange={setBingoAllowRepeat}
          options={[
            { value: false, label: 'One of each' },
            { value: true, label: 'Repeat to fill' },
          ]}
        />
      </>
    );
  }
  if (kind === 'flashcards') {
    return (
      <>
        <LabeledSeg
          label="Per page"
          name="vw-flashper"
          value={flash.perPage}
          onChange={setFlashPerPage}
          options={[1, 2, 4, 6, 8].map((n) => ({ value: n, label: String(n) }))}
        />
        <LabeledSeg
          label="Content"
          name="vw-flashcontent"
          value={flash.content}
          onChange={setFlashContent}
          options={[
            { value: 'imageWord', label: 'Word + Image' },
            { value: 'wordOnly', label: 'Word' },
            { value: 'imageOnly', label: 'Image' },
          ]}
        />
        <LabeledSeg
          label="Cut guides"
          name="vw-flashcut"
          value={flash.cutLines}
          onChange={setFlashCutLines}
          options={[
            { value: true, label: 'On' },
            { value: false, label: 'Off' },
          ]}
        />
      </>
    );
  }
  if (kind === 'wordsearch') {
    return (
      <>
        <LabeledSeg
          label="Grid"
          name="vw-wssize"
          value={ws.size}
          onChange={setSearchSize}
          options={[10, 12, 14, 16, 18].map((n) => ({ value: n, label: String(n) }))}
        />
        <LabeledSeg
          label="Diagonals"
          name="vw-wsdiag"
          value={ws.diagonals}
          onChange={setSearchDiagonals}
          options={[
            { value: true, label: 'On' },
            { value: false, label: 'Off' },
          ]}
        />
        <LabeledSeg
          label="Backwards"
          name="vw-wsback"
          value={ws.backwards}
          onChange={setSearchBackwards}
          options={[
            { value: true, label: 'On' },
            { value: false, label: 'Off' },
          ]}
        />
        <LabeledSeg
          label="Answer key"
          name="vw-wskey"
          value={ws.answerKey}
          onChange={setSearchAnswerKey}
          options={[
            { value: true, label: 'Include' },
            { value: false, label: 'Skip' },
          ]}
        />
      </>
    );
  }
  // crossword
  return (
    <LabeledSeg
      label="Answer key"
      name="vw-cwkey"
      value={cw.answerKey}
      onChange={setCrossAnswerKey}
      options={[
        { value: true, label: 'Include' },
        { value: false, label: 'Skip' },
      ]}
    />
  );
}

const microLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  opacity: 0.5,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const numInput: React.CSSProperties = {
  width: 70,
  padding: '8px 10px',
  borderRadius: 10,
  border: `2px solid ${C.borderLight}`,
  fontWeight: 800,
  color: C.ink,
};
