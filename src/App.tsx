import { useEffect } from 'react';
import { useStore, currentSet } from './store';
import { SHEET_KINDS, type DisplayMode, type StylePreset, type ContentMode } from './types';
import { C, DISPLAY, BODY } from './tokens';
import { segStyle } from './components/ui';
import { Home } from './views/Home';
import { Library } from './views/Library';
import { Editor } from './views/Editor';
import { Display } from './views/Display';
import { PrintModal } from './components/PrintModal';

const MODE_LABELS: Record<DisplayMode, string> = {
  grid: 'Word Wall',
  carousel: 'Carousel',
  reveal: 'Reveal',
  quiz: 'Quiz',
  missing: 'Missing Word',
  flyswatter: 'Flyswatter',
  bingo: 'Bingo',
  flashcards: 'Flash Cards',
  wordsearch: 'Word Search',
  crossword: 'Crossword',
};

const PRINT_MODES: DisplayMode[] = ['flashcards', 'bingo', 'wordsearch', 'crossword'];
const PROJECT_MODES: DisplayMode[] = ['grid', 'carousel', 'reveal', 'quiz', 'missing', 'flyswatter'];

export function App() {
  const view = useStore((s) => s.view);
  const presenterMode = useStore((s) => s.presenterMode);
  const toast = useStore((s) => s.toast);
  const printOpen = useStore((s) => s.printOpen);

  // Global keyboard: Escape closes overlays; carousel arrows/space.
  const closePrint = useStore((s) => s.closePrint);
  const togglePresenter = useStore((s) => s.togglePresenter);
  const displayMode = useStore((s) => s.displayMode);
  const carouselNext = useStore((s) => s.carouselNext);
  const carouselPrev = useStore((s) => s.carouselPrev);
  const togglePlay = useStore((s) => s.togglePlay);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const s = useStore.getState();
        if (s.printOpen) {
          closePrint();
          return;
        }
        if (s.presenterMode) {
          togglePresenter();
          return;
        }
      }
      const s = useStore.getState();
      if (s.view !== 'display' || s.displayMode !== 'carousel') return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') carouselNext();
      else if (e.key === 'ArrowLeft') carouselPrev();
      else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePrint, togglePresenter, carouselNext, carouselPrev, togglePlay, displayMode]);

  const showToolbar = !presenterMode && view !== 'home';

  return (
    <div
      className="vw-app-root"
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: C.paper,
        fontFamily: BODY,
        color: C.ink,
        position: 'relative',
      }}
    >
      {showToolbar && <Toolbar />}

      <div
        className="vw-content-area"
        style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {view === 'home' && <Home />}
        {view === 'library' && <Library />}
        {view === 'editor' && <Editor />}
        {view === 'display' && <Display />}
      </div>

      {toast && <Toast />}
      {presenterMode && <PresenterBar />}
      {printOpen && <PrintModal />}
    </div>
  );
}

// ── activity toolbar ────────────────────────────────────────────────────────
function ModeGroup({ modes }: { modes: DisplayMode[] }) {
  const displayMode = useStore((s) => s.displayMode);
  const setMode = useStore((s) => s.setMode);
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        background: C.track,
        borderRadius: 16,
        padding: 4,
        gap: 2,
      }}
    >
      {modes.map((m) => {
        const active = displayMode === m;
        return (
          <label key={m} style={{ ...segStyle(active), fontFamily: BODY }}>
            <input type="radio" name="vw-mode" checked={active} onChange={() => setMode(m)} style={{ display: 'none' }} />
            {MODE_LABELS[m]}
          </label>
        );
      })}
    </div>
  );
}

function Toolbar() {
  const view = useStore((s) => s.view);
  const set = useStore(currentSet);
  const displayMode = useStore((s) => s.displayMode);
  const stylePreset = useStore((s) => s.stylePreset);
  const contentMode = useStore((s) => s.contentMode);
  const gridZoom = useStore((s) => s.gridZoom);
  const wallSpeed = useStore((s) => s.wallSpeed);
  const goHome = useStore((s) => s.goHome);
  const goLibrary = useStore((s) => s.goLibrary);
  const goEditor = useStore((s) => s.goEditor);
  const setStyle = useStore((s) => s.setStyle);
  const setContentMode = useStore((s) => s.setContentMode);
  const zoomIn = useStore((s) => s.zoomIn);
  const zoomOut = useStore((s) => s.zoomOut);
  const zoomReset = useStore((s) => s.zoomReset);
  const setWallSpeed = useStore((s) => s.setWallSpeed);
  const resetGridLayout = useStore((s) => s.resetGridLayout);
  const openPrint = useStore((s) => s.openPrint);
  const togglePresenter = useStore((s) => s.togglePresenter);

  const isDisplay = view === 'display';
  const isGrid = displayMode === 'grid';
  const isStylizedFloat = isGrid && stylePreset === 'stylized';
  const isSheet = SHEET_KINDS.includes(displayMode);
  const showContentToggle = displayMode === 'grid' || displayMode === 'carousel';

  return (
    <div
      className="vw-noprint"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '14px 24px',
        background: '#ffffff',
        borderBottom: `2px solid ${C.borderLight}`,
        flexWrap: 'wrap',
      }}
    >
      <div
        onClick={goHome}
        style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, color: C.green, whiteSpace: 'nowrap', cursor: 'pointer' }}
      >
        Wordlist Wonders
      </div>
      <button type="button" onClick={goLibrary} style={navLink}>
        My Word Lists
      </button>
      <button type="button" onClick={goEditor} style={navLink}>
        Edit Set
      </button>
      <div style={{ width: 2, alignSelf: 'stretch', background: C.borderLight, borderRadius: 2 }} />
      <div style={{ fontWeight: 800, whiteSpace: 'nowrap', fontFamily: DISPLAY, fontSize: 18 }}>{set?.name}</div>

      {isDisplay && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...groupLabel, color: C.teal }}>Print</span>
            <ModeGroup modes={PRINT_MODES} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...groupLabel, color: C.orange }}>Project</span>
            <ModeGroup modes={PROJECT_MODES} />
          </div>

          {isGrid && (
            <div style={{ display: 'flex', background: C.track, borderRadius: 999, padding: 4, gap: 2 }}>
              {(['card', 'stylized'] as StylePreset[]).map((p) => {
                const active = stylePreset === p;
                return (
                  <label key={p} style={{ ...segStyle(active), fontFamily: BODY }}>
                    <input type="radio" name="vw-style" checked={active} onChange={() => setStyle(p)} style={{ display: 'none' }} />
                    {p === 'card' ? 'Plain' : 'Stylized'}
                  </label>
                );
              })}
            </div>
          )}

          {isGrid && !isStylizedFloat && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.track, borderRadius: 999, padding: '4px 10px' }}>
              <button type="button" onClick={zoomOut} style={zoomBtn}>
                −
              </button>
              <div style={{ fontSize: 13, fontWeight: 700, minWidth: 44, textAlign: 'center' }}>
                {Math.round(gridZoom * 100)}%
              </div>
              <button type="button" onClick={zoomIn} style={zoomBtn}>
                +
              </button>
              <button
                type="button"
                onClick={zoomReset}
                style={{ fontSize: 12, fontWeight: 700, color: C.teal, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>
          )}

          {isGrid && !isStylizedFloat && (
            <select
              onChange={(e) => {
                if (e.target.value) resetGridLayout(e.target.value as 'random' | 'tier' | 'alpha');
                e.target.value = '';
              }}
              defaultValue=""
              style={{
                padding: '9px 12px',
                borderRadius: 999,
                background: C.track,
                color: C.ink,
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              <option value="">Reset Layout…</option>
              <option value="random">Random order</option>
              <option value="tier">Arrange by tier</option>
              <option value="alpha">Arrange alphabetically</option>
            </select>
          )}

          {isStylizedFloat && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.track, borderRadius: 999, padding: '6px 14px' }}>
              <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.75 }}>Speed</label>
              <input
                type="range"
                min={25}
                max={75}
                step={1}
                value={wallSpeed}
                onChange={(e) => setWallSpeed(parseInt(e.target.value, 10))}
              />
              <div style={{ fontSize: 13, fontWeight: 700, minWidth: 56 }}>{wallSpeed}px/s</div>
            </div>
          )}

          {showContentToggle && (
            <div style={{ display: 'flex', background: C.track, borderRadius: 999, padding: 4, gap: 2 }}>
              {(
                [
                  ['both', 'Both'],
                  ['wordOnly', 'Words'],
                  ['imageOnly', 'Images'],
                ] as [ContentMode, string][]
              ).map(([val, label]) => {
                const active = contentMode === val;
                return (
                  <label key={val} style={{ ...segStyle(active), fontFamily: BODY }}>
                    <input
                      type="radio"
                      name="vw-content"
                      checked={active}
                      onChange={() => setContentMode(val)}
                      style={{ display: 'none' }}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />

      {isDisplay && (
        <>
          <button
            type="button"
            onClick={openPrint}
            style={{ ...navBtnOutline, display: isSheet ? 'none' : 'inline-flex' }}
          >
            Word Bank Handout
          </button>
          <button
            type="button"
            onClick={togglePresenter}
            style={{
              padding: '12px 22px',
              borderRadius: 999,
              background: C.green,
              color: '#fff',
              border: 'none',
              fontFamily: BODY,
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: `0 4px 0 ${C.greenShadow}`,
            }}
          >
            Presenter Mode
          </button>
        </>
      )}
    </div>
  );
}

function Toast() {
  const toast = useStore((s) => s.toast);
  const undo = useStore((s) => s.undoToast);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        background: C.ink,
        color: '#fff',
        padding: '12px 18px',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        zIndex: 60,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600 }}>{toast}</span>
      <button type="button" onClick={undo} style={{ background: 'none', border: 'none', color: C.green, fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
        Undo
      </button>
      <button type="button" aria-label="Dismiss" onClick={dismiss} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.6, cursor: 'pointer', fontSize: 16 }}>
        ×
      </button>
    </div>
  );
}

function PresenterBar() {
  const set = useStore(currentSet);
  const displayMode = useStore((s) => s.displayMode);
  const togglePresenter = useStore((s) => s.togglePresenter);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(26,50,96,0.9)',
        backdropFilter: 'blur(6px)',
        color: '#fff',
        padding: '10px 22px',
        borderRadius: '999px 999px 0 0',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        zIndex: 50,
      }}
    >
      <span style={{ fontSize: 13, opacity: 0.85, fontWeight: 700 }}>
        {set?.name} · {MODE_LABELS[displayMode]}
      </span>
      <button
        type="button"
        onClick={togglePresenter}
        style={{ padding: '8px 16px', borderRadius: 999, background: C.green, color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
      >
        Exit Presenter Mode (Esc)
      </button>
    </div>
  );
}

const navLink: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 14,
  background: 'transparent',
  color: C.ink,
  border: 'none',
  fontFamily: BODY,
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
};
const navBtnOutline: React.CSSProperties = {
  padding: '11px 20px',
  borderRadius: 999,
  background: '#ffffff',
  color: C.ink,
  border: `2px solid ${C.ink}`,
  fontFamily: BODY,
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  alignItems: 'center',
};
const groupLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};
const zoomBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  background: '#fff',
  border: 'none',
  color: C.ink,
  fontWeight: 800,
  cursor: 'pointer',
  fontSize: 16,
};
