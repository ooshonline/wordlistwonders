import { C, DISPLAY } from '../tokens';
import { ImageSlot } from '../components/ImageSlot';
import type { SheetPage } from './buildSheet';
import {
  bingoCellImageStyle,
  bingoCellStyle,
  bingoCellTextStyle,
  clueBody,
  findWordsLabel,
  flashCardStyle,
  flashImageStyle,
  flashTextStyle,
} from './styles';

// One US-Letter worksheet page (816×1056 at 96dpi). Screen-only shadow; print
// rules strip the chrome. Header + optional Name/Date line + activity body.
export function SheetPageView({ page }: { page: SheetPage }) {
  return (
    <div
      className="vw-sheet"
      style={{
        width: 816,
        flex: 'none',
        marginInline: 'auto',
        minHeight: 1056,
        background: '#ffffff',
        boxShadow: '0 12px 32px rgba(26,50,96,0.16)',
        padding: 52,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        color: C.ink,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          borderBottom: `2px solid ${C.borderLight}`,
          paddingBottom: 10,
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 800 }}>{page.title}</div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            opacity: 0.45,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {page.subtitle}
        </div>
      </div>

      {page.showNameLine && (
        <div style={{ display: 'flex', gap: 28, fontSize: 13, fontWeight: 800, color: C.placeholderInk }}>
          <div style={{ flex: 1, borderBottom: `2px dotted ${C.dotted}`, paddingBottom: 5 }}>Name</div>
          <div style={{ width: 190, borderBottom: `2px dotted ${C.dotted}`, paddingBottom: 5 }}>Date</div>
        </div>
      )}

      {page.kind === 'bingo' && <BingoBody page={page} />}
      {page.kind === 'flash' && <FlashBody page={page} />}
      {page.kind === 'search' && <SearchBody page={page} />}
      {page.kind === 'cross' && <CrossBody page={page} />}
    </div>
  );
}

function BingoBody({ page }: { page: Extract<SheetPage, { kind: 'bingo' }> }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(${page.columns}, minmax(0,1fr))`,
        gap: 26,
        alignContent: 'center',
      }}
    >
      {page.cards.map((card, ci) => (
        <div
          key={ci}
          className="vw-bingo-card"
          style={{ border: `2px solid ${C.ink}`, borderRadius: 16, padding: 16 }}
        >
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 14,
              fontWeight: 800,
              textAlign: 'center',
              marginBottom: 10,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {card.title}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${card.size}, 1fr)`, gap: 6 }}>
            {card.cells.map((c, i) => (
              <div key={i} style={bingoCellStyle(c.kind, page.content)}>
                {c.showImage && c.slotId && (
                  <div style={bingoCellImageStyle}>
                    <ImageSlot id={c.slotId} fit="contain" shape="rounded" radius={8} placeholder="" />
                  </div>
                )}
                {c.showText && <div style={bingoCellTextStyle(page.content)}>{c.text}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FlashBody({ page }: { page: Extract<SheetPage, { kind: 'flash' }> }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(${page.columns}, 1fr)`,
        gridTemplateRows: `repeat(${page.rows}, 1fr)`,
      }}
    >
      {page.cards.map((card, i) => (
        <div key={i} className="vw-flashcard" style={flashCardStyle(page.cutLines)}>
          {card.showImage && (
            <div style={flashImageStyle}>
              <ImageSlot id={card.slotId} fit="contain" shape="rounded" radius={12} placeholder="" />
            </div>
          )}
          {card.showText && <div style={flashTextStyle(page.perPage)}>{card.text}</div>}
        </div>
      ))}
    </div>
  );
}

function SearchBody({ page }: { page: Extract<SheetPage, { kind: 'search' }> }) {
  const px = page.cellPx;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${page.size}, ${px}px)`, border: `2px solid ${C.ink}` }}>
        {page.cells.map((c, i) => (
          <div
            key={i}
            style={{
              width: px,
              height: px,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${C.borderLight}`,
              fontSize: Math.round(px * 0.5),
              fontFamily: "'Nunito', sans-serif",
              ...(page.isKey && c.inWord
                ? { background: C.tealTint, color: C.tealInk, fontWeight: 800 }
                : { color: C.ink, fontWeight: 700 }),
            }}
          >
            {c.ch}
          </div>
        ))}
      </div>
      <div style={{ width: '100%' }}>
        <div style={findWordsLabel}>Find these words</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px 18px' }}>
          {page.bank.map((b, i) => (
            <div key={i} style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.03em' }}>
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CrossBody({ page }: { page: Extract<SheetPage, { kind: 'cross' }> }) {
  const px = page.cellPx;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${page.cols}, ${px}px)`, justifyContent: 'center' }}>
        {page.cells.map((c, i) =>
          c.letter ? (
            <div
              key={i}
              style={{
                position: 'relative',
                width: px,
                height: px,
                border: `1.5px solid ${C.ink}`,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: Math.round(px * 0.5),
                color: C.ink,
              }}
            >
              {c.num && (
                <span style={{ position: 'absolute', top: 1, left: 3, fontSize: 9, fontWeight: 800, opacity: 0.7 }}>
                  {c.num}
                </span>
              )}
              {c.showLetter && <span>{c.letter}</span>}
            </div>
          ) : (
            <div key={i} style={{ width: px, height: px }} />
          ),
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        <div>
          <div style={{ ...findWordsLabel, color: C.teal }}>Across</div>
          {page.across.map((cl) => (
            <div key={cl.num} style={clueBody}>
              <b>{cl.num}.</b> {cl.clue}
            </div>
          ))}
        </div>
        <div>
          <div style={{ ...findWordsLabel, color: C.orange }}>Down</div>
          {page.down.map((cl) => (
            <div key={cl.num} style={clueBody}>
              <b>{cl.num}.</b> {cl.clue}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
