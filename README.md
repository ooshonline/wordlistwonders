# Wordlist Wonders

A teacher-facing web app for ESL / primary classrooms. Maintain **word lists**
(word + optional clue + optional image per entry) and instantly turn any list
into ten classroom activities — four printable worksheets and six projector
games — with no re-entry of content.

**One list in, many activities out.** Every activity reads the same list, so
editing a word anywhere updates it everywhere. Images are keyed by word id
(`slot-<wordId>`), so a picture uploaded once appears in every activity.

Built as a React + TypeScript SPA (Vite) from the Claude Design handoff in
[`design-source/handoff/`](design-source/handoff/).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # type-check + production bundle into dist/
npm run preview  # serve the built bundle
npm test         # run the generator unit tests
```

The build uses a relative `base` (`./`), so `dist/` can be hosted from any
static host or subpath — e.g. GitHub Pages.

## Activities

**PRINT** (produce paper): Flash Cards · Bingo · Word Search · Crossword
**PROJECT** (shown on a classroom screen): Word Wall · Carousel · Reveal · Quiz ·
Missing Word · Flyswatter

## Architecture

- `src/types.ts` — the `Word` / `WordSet` data model.
- `src/store.ts` — the single source of truth (Zustand): sets, words, activity
  settings, navigation, and every action. Persists word lists to `localStorage`.
- `src/generators/` — **pure, DOM-free** puzzle builders (`bingo`, `wordsearch`,
  `crossword`) plus `random` helpers and the `cache` memo. These carry the real
  product logic and are unit-tested. Puzzles are memoized by
  `kind | wordSignature | options | salt`, so a puzzle stays stable while the
  teacher types elsewhere; **Shuffle** bumps the salt.
- `src/images.ts` + `src/components/ImageSlot.tsx` — user-fillable image slots
  (drag-drop / browse, canvas-downscale to WebP, contain-fit, pan/zoom reframe),
  persisted to `localStorage` keyed by word id.
- `src/components/` — shared UI (segmented controls, buttons, icons, word-card
  styling).
- `src/views/` — Home, Library, Editor, Display router, and the toolbar (in
  `App.tsx`).
- `src/activities/` — the six projector activities.
- `src/sheets/` — the shared sheet workspace (control card + editor + preview
  with ResizeObserver zoom) and the four worksheet renderers.
- `src/index.css` — the print pipeline (`@media print`, driven by a body
  attribute; `visibility`-based so no blank pages).

## Notes

- Word lists persist across reloads (`localStorage` key `vocabwall_v3`); images
  persist under `wordlist_wonders_images`. In a hosted multi-user product, back
  these with real user storage, preserving the word-id key convention.
- Audio uses the Web Speech API as a stand-in for recorded audio.
