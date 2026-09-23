import { useEffect, useState } from 'react';
import { useStore, currentSet } from '../store';
import { C, DISPLAY, BODY } from '../tokens';
import { Icon, icons, LabeledSeg } from '../components/ui';
import {
  unassignedChips,
  bucketCounts,
  isAllSorted,
  type SortChip,
} from '../generators/categorySort';

// Category Sort projector activity (CX5). The teacher's word list becomes a tray
// of word chips plus 2–4 teacher-named buckets; the class sorts each word into a
// group. Two ways to place a chip so it works on a projector, a touch panel, or a
// mouse: tap a chip then tap a group (the reliable path for a whiteboard), or
// drag the chip onto a group. Chips in a group tap back to the tray. Bucket
// headings, count, and word order are all controlled here but the real logic —
// the board build and every assignment — lives in the store (`category` slice +
// buildCategorySort generator). Bucket labels + count persist per set, so a class
// re-opening a list finds the same categories.
export function CategorySort() {
  const set = useStore(currentSet);
  const category = useStore((s) => s.category);
  const initCategory = useStore((s) => s.initCategory);
  const assignChip = useStore((s) => s.assignChip);
  const clearChip = useStore((s) => s.clearChip);
  const resetBoard = useStore((s) => s.resetCategoryBoard);
  const setBucketLabel = useStore((s) => s.setBucketLabel);
  const setBucketCount = useStore((s) => s.setBucketCount);
  const setShuffle = useStore((s) => s.setCategoryShuffle);
  const reshuffle = useStore((s) => s.reshuffleCategory);

  // Which tray chip is "picked up" for tap-to-place, and which chip is mid-drag.
  // Both are transient view state, so they live here, not in the store.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Build (or rebuild) the board on mount and whenever the active set changes,
  // so switching lists never leaves stale chips on screen.
  useEffect(() => {
    initCategory();
    setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id]);

  const { chips, buckets, assignments, total, shuffleOrder, bucketCount } = category;

  if (!total) {
    return (
      <div style={emptyWrap}>
        <div style={{ fontFamily: DISPLAY, fontSize: 26, color: C.ink }}>No words yet</div>
        <div style={{ fontSize: 16, color: C.placeholderInk, maxWidth: 440, textAlign: 'center' }}>
          Add a few words to this list in the Editor, then sort them into groups here.
        </div>
      </div>
    );
  }

  const tray = unassignedChips(chips, assignments);
  const counts = bucketCounts(chips, assignments);
  const allSorted = isAllSorted(chips, assignments);

  // Place a chip into a bucket, whether it came from a tap or a drop.
  const place = (chipId: string | null, bucketId: string) => {
    if (!chipId) return;
    assignChip(chipId, bucketId);
    setSelectedId(null);
  };

  // Tapping a tray chip picks it up (or puts it down again).
  const toggleSelect = (chipId: string) =>
    setSelectedId((cur) => (cur === chipId ? null : chipId));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, padding: '24px 28px', minHeight: 0 }}>
      {/* Instruction / celebration line */}
      <div style={{ textAlign: 'center', minHeight: 26 }}>
        {allSorted ? (
          <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 800, color: C.tealDeep }}>
            All sorted! 🎉
          </div>
        ) : (
          <div style={{ fontSize: 15, color: C.placeholderInk }}>
            {selectedId
              ? 'Now tap a group to drop the word in.'
              : 'Tap a word then tap a group — or drag it across.'}
          </div>
        )}
      </div>

      {/* Tray of words still to sort. Dropping here sends a chip back. */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          clearChip(draggingId ?? '');
          setDraggingId(null);
        }}
        style={{
          border: `2px dashed ${C.borderCard}`,
          borderRadius: 16,
          background: C.blankSurface,
          padding: '12px 16px',
        }}
      >
        <div style={trayLabel}>Words to sort · {tray.length}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, minHeight: 44, alignItems: 'flex-start' }}>
          {tray.length === 0 ? (
            <div style={{ fontSize: 14, color: C.placeholderInk, padding: '10px 4px' }}>
              Every word has been placed.
            </div>
          ) : (
            tray.map((chip) => (
              <Chip
                key={chip.id}
                chip={chip}
                selected={selectedId === chip.id}
                onTap={() => toggleSelect(chip.id)}
                onDragStart={() => setDraggingId(chip.id)}
                onDragEnd={() => setDraggingId(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* The buckets. Tapping empty bucket space (with a chip picked up) drops it. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))`,
          gap: 14,
          alignContent: 'stretch',
        }}
      >
        {buckets.map((bucket, i) => {
          const inBucket = chips.filter((c) => assignments[c.id] === bucket.id);
          const palette = BUCKET_PALETTE[i % BUCKET_PALETTE.length];
          const armed = Boolean(selectedId); // a chip is picked up, so this bucket is a target
          return (
            <div
              key={bucket.id}
              onClick={() => place(selectedId, bucket.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                place(draggingId, bucket.id);
                setDraggingId(null);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: palette.bg,
                border: `2px solid ${armed ? C.teal : palette.border}`,
                boxShadow: armed ? `0 0 0 3px ${C.tealTint}` : 'none',
                borderRadius: 18,
                padding: 14,
                cursor: armed ? 'pointer' : 'default',
                transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  value={bucket.label}
                  onChange={(e) => setBucketLabel(i, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Group ${i + 1} name`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontFamily: DISPLAY,
                    fontSize: 20,
                    fontWeight: 800,
                    color: palette.ink,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid transparent`,
                    outline: 'none',
                    padding: '2px 0',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = palette.border)}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
                />
                <span style={{ ...countBadge, color: palette.ink, borderColor: palette.border }}>
                  {counts[bucket.id] || 0}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignContent: 'flex-start', flex: 1 }}>
                {inBucket.length === 0 ? (
                  <div style={{ fontSize: 13, color: C.placeholderInk, opacity: 0.85, padding: '6px 2px' }}>
                    {armed ? 'Tap here to drop the word in' : 'Drop words here'}
                  </div>
                ) : (
                  inBucket.map((chip) => (
                    <Chip
                      key={chip.id}
                      chip={chip}
                      inBucket
                      onTap={() => clearChip(chip.id)}
                      onDragStart={() => setDraggingId(chip.id)}
                      onDragEnd={() => setDraggingId(null)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <LabeledSeg
          label="Groups"
          name="vw-category-buckets"
          value={bucketCount}
          onChange={(v) => setBucketCount(Number(v))}
          options={[
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
          ]}
        />
        <LabeledSeg
          label="Order"
          name="vw-category-order"
          value={shuffleOrder}
          onChange={(v) => setShuffle(Boolean(v))}
          options={[
            { value: false, label: 'List order' },
            { value: true, label: 'Shuffle' },
          ]}
        />
        {shuffleOrder && (
          <button type="button" onClick={reshuffle} style={pillBtn}>
            Shuffle again
          </button>
        )}
        <button type="button" onClick={resetBoard} style={pillBtn}>
          <Icon path={icons.back} size={16} />
          Reset board
        </button>
      </div>
    </div>
  );
}

// A single word chip. A <div role="button"> (never a <button>) so it can safely
// hold richer content and never nests interactive controls (the B6/CX1 lesson).
function Chip({
  chip,
  selected,
  inBucket,
  onTap,
  onDragStart,
  onDragEnd,
}: {
  chip: SortChip;
  selected?: boolean;
  inBucket?: boolean;
  onTap: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={inBucket ? 'Tap to send back to the tray' : 'Tap to pick up'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        fontFamily: BODY,
        fontSize: 18,
        fontWeight: 700,
        color: selected ? C.tealInk : C.ink,
        background: selected ? C.tealTint : C.surface,
        border: `2px solid ${selected ? C.teal : C.borderCard}`,
        borderRadius: 12,
        padding: '8px 14px',
        cursor: 'grab',
        userSelect: 'none',
        boxShadow: '0 2px 6px rgba(26, 50, 96, 0.06)',
        wordBreak: 'break-word',
      }}
    >
      {chip.text}
    </div>
  );
}

// Distinct but on-brand tints so groups read apart on a projector.
const BUCKET_PALETTE = [
  { bg: C.tealTint, border: C.teal, ink: C.tealInk },
  { bg: C.amber, border: C.amberBorder, ink: C.amberInk },
  { bg: C.greenSurface, border: C.green, ink: C.greenShadow },
  { bg: C.blankSurface, border: C.borderCard, ink: C.ink },
] as const;

const trayLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  opacity: 0.5,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 8,
};

const countBadge: React.CSSProperties = {
  flexShrink: 0,
  minWidth: 26,
  textAlign: 'center',
  fontFamily: BODY,
  fontSize: 14,
  fontWeight: 800,
  background: C.surface,
  border: '2px solid',
  borderRadius: 999,
  padding: '1px 8px',
};

const pillBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
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
