import { useStore } from '../store';
import { C, DISPLAY } from '../tokens';
import { GreenButton, Icon, icons } from '../components/ui';

export function Library() {
  const sets = useStore((s) => s.sets);
  const librarySearch = useStore((s) => s.librarySearch);
  const setLibrarySearch = useStore((s) => s.setLibrarySearch);
  const createSet = useStore((s) => s.createSet);
  const openSet = useStore((s) => s.openSet);
  const openEditor = useStore((s) => s.openEditor);
  const duplicateSet = useStore((s) => s.duplicateSet);
  const deleteSet = useStore((s) => s.deleteSet);

  const q = librarySearch.toLowerCase().trim();
  const visible = sets.filter((set) => {
    if (!q) return true;
    const hay = [set.name, set.theme || '', set.gradeLevel || '', ...(set.tags || [])].join(' ').toLowerCase();
    return hay.includes(q);
  });

  const noSets = sets.length === 0;
  const noMatches = !noSets && visible.length === 0;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: DISPLAY, fontSize: 38, margin: 0, color: C.ink }}>My Word Lists</h1>
        <GreenButton onClick={createSet} style={{ fontSize: 15 }}>
          + New Set
        </GreenButton>
      </div>

      {/* Search is only useful once there's something to search. */}
      {!noSets && (
        <input
          value={librarySearch}
          onChange={(e) => setLibrarySearch(e.target.value)}
          placeholder="Search by name, theme, grade, or tag…"
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '11px 16px',
            borderRadius: 999,
            border: `2px solid ${C.borderLight}`,
            fontSize: 14,
            color: C.ink,
            marginBottom: 20,
          }}
        />
      )}

      {noSets && (
        <EmptyState
          title="No word lists yet"
          body="Start with one list of words — then turn it into four printable worksheets and six projector games in a click."
          action={
            <GreenButton onClick={createSet} style={{ fontSize: 15 }}>
              + Create your first list
            </GreenButton>
          }
        />
      )}

      {noMatches && (
        <EmptyState
          title="No lists match your search"
          body={`Nothing here matches “${librarySearch.trim()}”. Try a different word, or clear the search to see all your lists.`}
          action={
            <button type="button" onClick={() => setLibrarySearch('')} style={clearBtn}>
              Clear search
            </button>
          }
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 20 }}>
        {visible.map((set) => {
          const keyCount = set.words.filter((w) => w.tier === 'key').length;
          const normalCount = set.words.filter((w) => w.tier === 'normal').length;
          const bonusCount = set.words.filter((w) => w.tier === 'bonus').length;
          return (
            <div
              key={set.id}
              style={{
                background: C.surface,
                borderRadius: 20,
                boxShadow: '0 6px 20px rgba(26,50,96,0.08)',
                border: `1px solid ${C.borderLight}`,
                padding: 22,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: C.teal,
                }}
              >
                {set.words.length} words
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, margin: '6px 0 10px' }}>
                {set.name}
              </div>
              {set.theme ? <div style={{ fontSize: 12, color: C.ink2, marginBottom: 8 }}>{set.theme}</div> : null}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={pill(C.amber, C.amberInk2)}>{keyCount} key</span>
                <span style={pill(C.tealTint, C.tealInk)}>{normalCount} normal</span>
                <span style={pill(C.track, C.muted)}>{bonusCount} bonus</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => openSet(set.id)} style={makeBtn}>
                  Make Activities
                </button>
                <button type="button" onClick={() => openEditor(set.id)} style={editBtn}>
                  Edit
                </button>
                <button type="button" aria-label="Duplicate" onClick={() => duplicateSet(set.id)} style={iconBtn(C.ink)}>
                  <Icon path={icons.copy} size={16} />
                </button>
                <button type="button" aria-label="Delete" onClick={() => deleteSet(set.id)} style={iconBtn(C.danger)}>
                  <Icon path={icons.trash} size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
        maxWidth: 460,
        margin: '48px auto',
        padding: '40px 28px',
        background: C.surface,
        borderRadius: 24,
        border: `2px dashed ${C.borderLight}`,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: C.tealTint,
          color: C.teal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon path={icons.list} size={34} />
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, color: C.ink }}>{title}</div>
      <div style={{ fontSize: 15, color: C.ink2, lineHeight: 1.5 }}>{body}</div>
      <div style={{ marginTop: 6 }}>{action}</div>
    </div>
  );
}

const clearBtn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 999,
  background: C.surface,
  color: C.ink,
  border: `2px solid ${C.ink}`,
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
};

const pill = (bg: string, color: string) => ({
  background: bg,
  color,
  fontWeight: 800,
  fontSize: 12,
  padding: '5px 10px',
  borderRadius: 999,
});

const makeBtn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 999,
  background: C.green,
  color: '#fff',
  border: 'none',
  fontWeight: 800,
  fontSize: 14,
  cursor: 'pointer',
};
const editBtn: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 999,
  background: C.surface,
  color: C.ink,
  border: `2px solid ${C.ink}`,
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};
const iconBtn = (color: string): React.CSSProperties => ({
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
});
