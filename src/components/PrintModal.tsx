import { useStore, currentSet } from '../store';
import type { PrintMode } from '../types';
import { C, DISPLAY } from '../tokens';
import { Icon, SegControl, icons } from './ui';

// Word Bank Handout: a printable poster of the list, with chosen words blanked
// for students to fill in. Prints via the non-sheet @media print rules.
export function PrintModal() {
  const set = useStore(currentSet);
  const close = useStore((s) => s.closePrint);
  const setPrintMode = useStore((s) => s.setPrintMode);
  const setPrintPercent = useStore((s) => s.setPrintPercent);
  const shuffleBlanks = useStore((s) => s.shuffleRandomBlanks);
  const togglePrintBlank = useStore((s) => s.togglePrintBlank);

  const mode: PrintMode = set.printMode === 'random' ? 'random' : 'manual';
  const percent = set.printRandomPercent || 30;
  const blanks = set.printBlanks || {};

  return (
    <div
      className="vw-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,50,96,0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="vw-modal-card"
        style={{
          background: '#ffffff',
          borderRadius: 22,
          boxShadow: '0 20px 60px rgba(26,50,96,0.3)',
          width: 'min(900px,100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 26,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700 }}>Print Handout — {set.name}</div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: C.track,
              border: 'none',
              color: C.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon path={icons.x} size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <SegControl<PrintMode>
            name="vw-printmode"
            value={mode}
            onChange={setPrintMode}
            options={[
              { value: 'manual', label: 'Manual' },
              { value: 'random', label: 'Random %' },
            ]}
          />
          {mode === 'manual' ? (
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.65 }}>
              Click a word below to blank it for students to fill in.
            </div>
          ) : (
            <>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={percent}
                onChange={(e) => setPrintPercent(parseInt(e.target.value, 10))}
              />
              <div style={{ fontSize: 13, fontWeight: 700, minWidth: 40 }}>{percent}%</div>
              <button
                type="button"
                onClick={shuffleBlanks}
                style={{
                  padding: '9px 16px',
                  borderRadius: 999,
                  background: '#ffffff',
                  color: C.ink,
                  border: `2px solid ${C.ink}`,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Shuffle blanks
              </button>
            </>
          )}
        </div>

        <div
          className="vw-modal-scroll"
          style={{ overflow: 'auto', flex: 1, border: `2px solid ${C.borderLight}`, borderRadius: 18, padding: 26 }}
        >
          <div className="vw-print-poster" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
            {set.words.map((w) => {
              const blanked = !!blanks[w.id];
              return (
                <div
                  key={w.id}
                  onClick={() => togglePrintBlank(w.id)}
                  style={{
                    textAlign: 'center',
                    padding: 14,
                    border: '2px dashed #D9D4C4',
                    borderRadius: 16,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {blanked ? (
                      <div style={{ border: `2px solid ${C.ink}`, height: 34, borderRadius: 8, margin: '0 auto', width: '80%' }} />
                    ) : (
                      <div>{w.text}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
          <button
            type="button"
            onClick={close}
            style={{
              padding: '11px 20px',
              borderRadius: 999,
              background: '#ffffff',
              color: C.ink,
              border: `2px solid ${C.ink}`,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '12px 22px',
              borderRadius: 999,
              background: C.green,
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: `0 4px 0 ${C.greenShadow}`,
            }}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
