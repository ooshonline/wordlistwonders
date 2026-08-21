# Handoff: Wordlist Wonders

## Overview
Wordlist Wonders is a teacher-facing web app for ESL/primary classrooms. A teacher maintains **word lists** (word + optional clue + optional image per entry) and the app instantly turns any list into ten classroom activities — four printable worksheets and six projector games — with no re-entry of content.

Core promise: **one list in, many activities out.** Every activity reads the same list, so editing a word anywhere updates it everywhere.

## About the Design Files
The files in this bundle are **design references authored in HTML** — working prototypes that demonstrate intended look, layout, and behavior. They are **not production code to lift directly**.

The task is to **recreate these designs inside the target codebase's existing environment** (React, Vue, Svelte, SwiftUI, native, etc.), using its established component library, routing, state management, styling conventions, and build tooling. If no codebase exists yet, pick the framework most appropriate for the product (a React + TypeScript SPA is a sound default given the interaction density) and implement there.

The prototype is a single self-contained file with an inline logic class. In production this should be decomposed into real components and modules — see **Suggested Architecture** below.

## Fidelity
**High fidelity.** Colors, typography, spacing, radii, shadows, copy, and interaction behavior are all final and intentional. Recreate the UI faithfully. Exact values are given in **Design Tokens**; every screen section lists its own measurements.

The one deliberately loose area is imagery: images are user-supplied at runtime, so the design specifies *frames and fitting rules*, not particular pictures.

## Product Structure

Three top-level views:

1. **Home / Library** — pick or create a word list.
2. **Edit Set** — manage the words in a list (word, clue, image).
3. **Activity view** — the working surface, with a persistent toolbar that switches between activities.

The activity toolbar is split into two labelled groups:

- **PRINT** (teal label `#3FA6A0`): Flash Cards · Bingo · Word Search · Crossword
- **PROJECT** (orange label `#E4572E`): Word Wall · Carousel · Reveal · Quiz · Missing Word · Flyswatter

The grouping is meaningful and must be preserved: PRINT activities produce paper, PROJECT activities are shown on a classroom screen.

---

## Data Model

```ts
type Word = {
  id: string;          // stable; used as the image-slot key
  text: string;        // the vocabulary word
  clue?: string;       // definition/riddle — surfaced in the crossword
  tier?: 'key' | 'extra';
};

type WordSet = {
  id: string;
  name: string;              // shown in all worksheet headers
  words: Word[];
  carouselSpeed: number;     // seconds per card
  theme?: string;
  gradeLevel?: string;
  tags?: string[];
  positions?: Record<string, {x: number; y: number}>;  // Word Wall drag positions
  cardScale?: Record<string, number>;                  // Word Wall per-card scale
};
```

**Images** are keyed by word id, not stored on the word: slot id `slot-<wordId>`. Because the key is derived from the word id, an image uploaded once appears in every activity automatically (flash card, bingo cell, carousel, quiz, reveal…). Preserve this convention — it is the mechanism behind "upload once, use everywhere". In production, back it with an asset table keyed by word id.

---

## Activity Specifications

### Shared: the sheet workspace (all four PRINT activities)

Layout, top to bottom / left to right:

- **Control card** (pinned, non-scrolling): white `#ffffff`, 1px border `#E3DDCE`, radius 22px, padding 16px 22px, shadow `0 6px 18px rgba(26,50,96,0.08)`.
  - Row 1: activity name (Baloo 2, 22px, 800) · summary text (13px, 700, 50% opacity) · **Shuffle** button (outline: 2px `#1A3260`, radius 999px) · **Edit Words** / **Hide Words** toggle (fill `#F1EFE7`, radius 999px) · **Print** button (fill `#72C93A`, white text, 800, radius 999px, hard shadow `0 4px 0 #4F8F22`, hover `#5CAF2A`, active translateY(3px) + `0 1px 0`).
  - Row 2: activity-specific segmented controls. Each is a label (11px, 800, uppercase, letter-spacing 0.06em, 50% opacity) beside a pill group (track `#F1EFE7`, radius 999px, padding 4px, 2px gap).
  - Row 3 (conditional): warning banner — background `#FDEFD9`, text `#7A4E14`, 13px/700, radius 12px, padding 9px 16px, max-width 640px, centered.
- **Two-column body** filling the remaining height:
  - **Left: word editor** (only when open) — fixed `flex: 0 0 380px`, scrolls independently.
  - **Right: page preview** — flexible, scrolls independently, horizontally centered.

Critical layout constraints (these were bugs worth calling out):
- The app shell is `height: 100vh; overflow: hidden` and every intermediate flex container carries `min-height: 0`, so the two panels scroll internally and the page itself never scrolls.
- The scroll container must be a **separate element** from the zoomed layer. The zoom layer uses `align-items: flex-start` and the page element uses `margin-inline: auto` — centering the zoomed content with `align-items: center` pushes overflow into unreachable negative space.
- Preview scale is computed live from the measured width of the preview column (`ResizeObserver`): `scale = clamp(0.35, (columnWidth - 26) / 816, 1)`. Do not hardcode a zoom factor.

**Page geometry (all worksheets):** 816 × 1056 px (US Letter at 96dpi), 52px padding, white, `box-shadow: 0 12px 32px rgba(26,50,96,0.16)` on screen only.

**Page header:** title (Baloo 2, 26px, 800) reading `<List Name> — <Activity>` (plus ` (Answer Key)` on key pages), right-aligned subtitle (12px, 800, uppercase, letter-spacing 0.06em, 45% opacity), 2px bottom rule `#EDEAE0`, 10px padding-bottom.

**Name/Date line** (student-facing pages only, never on answer keys): flex row, 13px/800, color `#8C8676`, each field a 2px dotted `#C9C3B4` bottom border; Name flexes, Date is 190px.

---

### Word editor panel (shared by all PRINT activities)

Header: "Words in this activity" (Baloo 2, 18px, 800) with sub-line "Edits apply to every activity and to your saved list" (12px, 700, 50% opacity).

One row per word, `display:flex; gap:8px; flex-wrap:wrap`:
- **Position badge** (crossword only): 38px wide, centered, 12px/800, radius 8px, padding 6px 0. Across = background `#E1F3F1`, text `#215E5A`, label `A<num>`. Down = background `#FDEFD9`, text `#7A4E14`, label `D<num>`. Words not placed in the grid show no badge.
- **Word input**: `flex: 1 1 140px; min-width: 0`, padding 9px 13px, radius 11px, 2px border `#EDEAE0`, Nunito 15px/700, color `#1A3260`.
- **Clue input** (crossword only): `flex: 1 1 100%; order: 9` so it wraps onto its own line beneath the word — necessary in the 380px column. Padding 8px 13px, radius 11px, 2px border `#F1EFE7`, 13px/600, color `#5B6B85`, placeholder "Clue students will read…".
- **Delete button**: 36×36, radius 11px, background `#F1EFE7`, icon color `#C25450`, 15px stroke-2 X icon, `aria-label="Remove word"`.

Footer: **+ Add Word** — full width, padding 12px, radius 14px, white, 2px **dashed** border `#C7D9C3`, 14px/800, hover background `#F6FBF3`.

Behavior: every edit writes straight through to the word list and the preview regenerates. Deleting a word removes it from all activities. Adding appends an empty word ready to type.

---

### 1. Flash Cards

Controls: **Per page** (1 / 2 / 4 / 6 / 8) · **Content** (Word + Image / Word / Image) · **Cut guides** (On / Off).

Grid geometry by per-page: 1 → 1×1, 2 → 1×2, 4 → 2×2, 6 → 2×3, 8 → 2×4 (cols × rows). The grid fills the page body (`flex: 1` with `repeat(cols, 1fr) / repeat(rows, 1fr)`) so cards divide the sheet evenly and cut lines align across the page.

Card: centered flex column, gap 10px, padding 14px, `box-sizing: border-box`, `overflow: hidden`. Border is `1px dashed #A9A292` with cut guides on, `1px solid transparent` with them off (keeps geometry identical either way).

Word type size scales with density: ≤2/page → 54px, ≤4 → 38px, ≤6 → 30px, 8 → 24px. Baloo 2, 800, line-height 1.1, centered, `#1A3260`.

Image frame: `width:100%; flex:1 1 auto; min-height:0; max-height:100%` — see **Image Fitting**.

No shuffle control (card order follows list order intentionally — teachers expect a predictable deck).

---

### 2. Bingo

Controls: **Cards** (number input, 1–30) · **Grid** (Auto / 3×3 / 4×4 / 5×5) · **Per page** (1 / 2 / 4 / 6) · **Content** (Words / Words + Images / Images) · **Duplicates** (One of each / Repeat to fill).

Auto grid size from list length: ≥24 words → 5×5, ≥15 → 4×4, ≥8 → 3×3, else 2×2.

Odd-sized grids (3×3, 5×5) get a **FREE** center square: background `#FDEFD9`, 2px border `#F0AC3D`, text `#8A5A19`.

**Duplicates rule** (a specifically requested behavior):
- *One of each* (default) — each word appears at most once per card. If the list is shorter than the grid, leftover squares render **blank** (background `#FBF9F4`, 2px **dashed** border `#E2DDCE`) at shuffled positions, and the warning banner appears: "Not enough words to fill every square — empty squares left blank. Add words, choose a smaller grid, or allow repeats."
- *Repeat to fill* — the word pool is reshuffled and concatenated until the grid is full, so words may repeat.

Each card is independently shuffled, so no two cards match. Card chrome: 2px border `#1A3260`, radius 16px, padding 16px; title `<LIST NAME> · BINGO` (uppercased list name), Baloo 2, 14px, 800, centered, letter-spacing 0.04em, single-line with ellipsis. Cell grid `repeat(size, 1fr)` with 6px gap; word cells are white with 2px `#EDEAE0` border.

Cards-per-page column counts: 1 → 1, 2 → 2, 4 → 2, 6 → 3. Cards are grouped into real pages with a page break between them, and each card carries `break-inside: avoid`.

---

### 3. Word Search

Controls: **Grid** (10 / 12 / 14 / 16 / 18) · **Diagonals** (On / Off) · **Backwards** (On / Off) · **Answer key** (Include / Skip).

Generation: words are uppercased and stripped to A–Z, deduplicated, sorted **longest first** (materially improves packing). Direction set is horizontal + vertical, plus the two diagonals when Diagonals is on, plus the negation of all active directions when Backwards is on. Each word gets up to 500 random placement attempts; a placement is valid if it fits the bounds and every overlapping cell either is empty or already holds the same letter (so crossings are allowed). Remaining cells get random A–Z fill.

Cell size is computed to fit: `min(46, 700 / gridSize)` px, font-size `round(cellSize * 0.5)`, 1px `#EDEAE0` border per cell, 2px `#1A3260` border around the whole grid. Letters are Nunito 700 `#1A3260`.

Word bank below the grid: section label "Find these words" (12px, 800, uppercase, letter-spacing 0.07em, `#3FA6A0`), then a 4-column grid, 8px/18px gaps, entries 15px/700 with 0.03em letter-spacing, alphabetized.

Answer key page: identical grid, with letters belonging to placed words highlighted — background `#E1F3F1`, color `#215E5A`, weight 800. No Name/Date line.

Words too long for the grid, or that fail all attempts, are reported in the warning banner: "Didn't fit: X, Y — try a bigger grid."

### 4. Crossword

Controls: **Answer key** (Include / Skip). Plus **Shuffle**, which produces a genuinely different interlock each time.

Generation: entries are uppercased/stripped, deduplicated, sorted longest-first **with a random tiebreak among equal lengths**. The first entry is placed horizontally at the origin. Every subsequent entry is tested against each already-placed word: for each shared letter, try the perpendicular orientation aligned on that crossing. A placement is rejected if it would abut another word head-to-tail, or if any non-crossing cell is adjacent to an existing letter (prevents accidental adjacent-word gibberish). Among valid placements, the one with the **most crossings** wins, **with a coin-flip tiebreak between equal scores** — the two random tiebreaks are what make Shuffle meaningful; without them the greedy algorithm is deterministic. Entries that can't interlock are reported in the warning banner.

The grid is then cropped to its bounding box, and clue numbers are assigned by scanning cells in reading order; a cell shared by an across and a down entry gets one number used by both.

Rendering: cell size 34px, dropping to 30px above 14 columns and 26px above 18. Letter cells are white with a 1.5px `#1A3260` border; empty cells render as blank space of the same size (no border, no background). Clue numbers are absolutely positioned top:1px left:3px, 9px/800, 70% opacity. On the answer key, letters are shown at `round(cellSize*0.5)`, 800, `#1A3260`.

Clue lists sit in two columns, 28px gap: **ACROSS** label in `#3FA6A0`, **DOWN** in `#E4572E` (both 12px, 800, uppercase, 0.07em). Each clue is 14px/600 with a bold number, 7px bottom margin, `text-wrap: pretty`.

**Live clue editing:** the grid layout is cached (keyed by list content + shuffle salt), but the clue *text* is re-read from the word list on every render. Editing a clue updates the printed clue list immediately **without re-laying out the grid** — this separation matters and is easy to lose. Words with no clue fall back to "<n> letters", and the warning banner reports the count: "N word(s) have no clue yet — add clues in Edit Set so students have something to solve."

---

### PROJECT activities (existing, unchanged in this pass)

- **Word Wall** — draggable, individually scalable word cards on a canvas; positions and scales persist per set. Zoom control.
- **Carousel** — one word at a time, auto-advance at the set's `carouselSpeed`, play/pause.
- **Reveal** — words hidden until tapped; revealed state persists per set.
- **Quiz** — multiple choice against 2/3/4 teams with per-team scores, optional countdown (off / preset / custom seconds), tracks missed words, end-of-round summary.
- **Missing Word** — removes one word from the display; class guesses; reveal restores it. Keeps a history so it won't repeat immediately.
- **Flyswatter** — two-team race with score counters; teacher reads a word, teams find it.

All six read the same list and the same `slot-<wordId>` images.

---

## Image Fitting (explicit requirement)

Images must **never** be cropped or overflow their frame. Rules:

1. Every image frame uses **contain** fitting — the full image is letterboxed inside the frame rather than cropped.
2. Every frame is capped so it cannot outgrow its container: fixed-size frames carry `max-width: 100%` plus a viewport-relative height cap (e.g. carousel `height: 280px; max-height: 38vh`; quiz `height: 220px; max-height: 30vh`; reveal `height: 160px; max-height: 26vh`); flexible frames (bingo cells, flash cards) use `flex: 1 1 auto; min-width: 0; min-height: 0; max-height: 100%` so they shrink with the cell instead of pushing past it.
3. `min-height: 0` / `min-width: 0` on flex children is load-bearing — without it a flex item refuses to shrink below its content size and overflows.

The user can still pan/zoom an individual image to crop it deliberately; guaranteed-fully-visible is the default, not a restriction.

---

## Printing

Screen and print share one DOM; print is driven by a body attribute.

1. Set `document.body.dataset.printMode = 'sheet'`, call `window.print()`, clear the attribute on `afterprint`.
2. Print rules under `@media print`:
   - `body[data-print-mode="sheet"] * { visibility: hidden }` then `.vw-sheet, .vw-sheet * { visibility: visible !important }`. **Use `visibility`, not `display`** — a `display:none` ancestor cascade blanks the print target and yields empty pages.
   - `.vw-noprint { display: none !important }` hides the toolbar, control card, and editor.
   - Unwind the app's screen layout: the root becomes `height:auto; overflow:visible; display:block`, the scroll containers become `display:block; overflow:visible`, and the zoom layer is reset to `zoom: 1`.
   - Each `.vw-sheet` becomes full-width, borderless, shadowless, unpadded, with `break-after: page` (`auto` on the last). `.vw-bingo-card` and `.vw-flashcard` get `break-inside: avoid`.
3. `@page { margin: 12mm }`.

Result: exactly one printed page per previewed page, no blanks, at true Letter size. In a production stack this is a legitimate place to prefer a real PDF renderer, but the CSS route works and needs no server.

---

## Design Tokens

### Typography
- Display / headings: **Baloo 2** — weights 500, 600, 700, 800
- Body / UI: **Nunito** — weights 400, 600, 700, 800, 900
- Google Fonts: `https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap`

Scale in use: 54 / 38 / 30 / 26 / 24 / 22 / 18 / 17 / 15 / 14 / 13 / 12 / 11 / 9 px. Uppercase micro-labels are 11–12px, 800, letter-spacing 0.06–0.07em.

### Color
| Role | Hex |
|---|---|
| Ink / primary text | `#1A3260` |
| Secondary text | `#5B6B85` |
| Muted text | `#6B7686` |
| Paper / app background | `#FFFDF8` |
| Surface | `#ffffff` |
| Workspace background | `#EFEAE1` |
| Border, light | `#EDEAE0` |
| Border, card | `#E3DDCE` |
| Track / fill | `#F1EFE7` |
| Track hover | `#E7E3D6` |
| Teal accent (PRINT, Across) | `#3FA6A0` |
| Teal deep | `#2C7873` |
| Teal tint / key highlight | `#E1F3F1` |
| Teal ink | `#215E5A` |
| Orange accent (PROJECT, Down) | `#E4572E` |
| Green action | `#72C93A` (hover `#5CAF2A`, shadow `#4F8F22`) |
| Green dashed border | `#C7D9C3` (hover surface `#F6FBF3`) |
| Amber surface (FREE, warnings) | `#FDEFD9` |
| Amber border | `#F0AC3D` |
| Amber ink | `#7A4E14` / `#8A5A19` |
| Danger | `#C25450` |
| Dotted rule / placeholder ink | `#C9C3B4` / `#8C8676` |
| Cut guide | `#A9A292` |
| Blank cell surface / border | `#FBF9F4` / `#E2DDCE` |
| Category accents | `#8B5FBF` `#4C6FD6` `#D6488F` `#2FA8D5` |

### Spacing
4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 / 26 / 28 / 30 / 52 px. 52px is the worksheet page margin; 22px is the standard card padding.

### Radius
8 / 11 / 12 / 14 / 16 / 22 px, and `999px` for all pills and buttons.

### Shadow
- Card: `0 6px 18px rgba(26,50,96,0.08)`
- Page (screen only): `0 12px 32px rgba(26,50,96,0.16)`
- Button (hard/chunky): `0 4px 0 <darker>`, pressed `0 1px 0` + `translateY(3px)`

---

## State

```ts
{
  view: 'home' | 'edit' | 'activity',
  currentSetId: string,
  displayMode: 'grid'|'carousel'|'reveal'|'quiz'|'missing'|'flyswatter'
             | 'flashcards'|'bingo'|'wordsearch'|'crossword',
  sets: WordSet[],

  sheetEditorOpen: boolean,
  sheetColW: number,                       // measured preview column width -> zoom

  bingo:      { count, gridSize, perPage, content, allowRepeat },
  flash:      { perPage, content, cutLines },
  wordsearch: { size, diagonals, backwards, answerKey },
  crossword:  { answerKey },

  // projector activities
  missingWord, flyswatter, quiz, carouselIndex, carouselPlaying,
  revealedBySet, gridZoom, wallSpeed,
  toast, librarySearch
}
```

**Puzzle caching / shuffle:** generated puzzles are memoized under a key of `kind | wordSignature | options | shuffleSalt`, where `wordSignature` is `id:text` joined across the list. Changing an option or editing a word regenerates; re-rendering for any other reason does not. **Shuffle** increments a per-activity salt. This is what keeps a puzzle stable while a teacher types elsewhere on the page — replicate the semantics (React Query, `useMemo`, or a small memo map are all fine).

**Persistence:** word lists, images, and playback positions should survive reload. The prototype uses local storage; production should use whatever the codebase already uses for user data.

---

## Interactions & Behavior

- **Activity switching** is instant, no confirmation; activity-specific settings persist while switching so returning to Bingo restores prior choices.
- **Every activity is editable in place.** This is a product rule, not a nice-to-have: the user's directive was that each activity be as interactive and editable as possible. Adding a new activity means adding its editing affordance too.
- **Shuffle** regenerates layout only, never content.
- **Warnings are advisory, never blocking** — the sheet always renders something printable, with the banner explaining what to improve.
- **Print** opens the browser's native dialog; the on-screen preview is a faithful representation of the output.
- Buttons use the chunky pressed-shadow treatment; hover changes fill only.
- Keyboard: inputs commit on change; provide standard tab order through editor rows.

## Accessibility
- Icon-only buttons need labels (the delete button uses `aria-label="Remove word"`).
- Segmented controls are radio groups — keep the real `<input type="radio">` semantics with a shared `name` per group rather than styled divs.
- Body text is `#1A3260` on white/cream, comfortably above AA. The 45–50% opacity micro-labels are decorative metadata; don't put essential information there alone.
- Worksheet output must stay legible in grayscale — bingo blank cells and word-search key highlights are distinguished by border style as well as color.

## Assets
- **Fonts:** Baloo 2 and Nunito from Google Fonts (link above).
- **Icons:** inline SVG, 24×24 viewBox, `stroke-width: 2`, round caps/joins, `currentColor`. Substitute the codebase's icon set at the same weight.
- **Images:** none shipped. Every image is user-supplied at runtime through the drop-in slot component keyed `slot-<wordId>`. `image-slot.js` is included as a reference implementation of the drop/persist/fit behavior — replace it with the codebase's own uploader, preserving the id convention and the contain-fit rules.

## Suggested Architecture
The prototype is one file; production should split roughly as:

- `WordSetProvider` / store — sets, words, images, persistence. Single source of truth.
- `ActivityToolbar` — the PRINT/PROJECT mode switch.
- `SheetWorkspace` — control card + two-column body + ResizeObserver zoom; shared by all four worksheets.
- `WordEditorPanel` — the shared editor, with an optional clue column and optional position badges.
- `sheets/` — `FlashCardSheet`, `BingoSheet`, `WordSearchSheet`, `CrosswordSheet`. Presentational; receive generated data.
- `generators/` — `bingo.ts`, `wordsearch.ts`, `crossword.ts`. **Pure functions**, seedable random, no DOM. These carry the real product logic and deserve unit tests (grid fills, no-duplicate rule, crossing validity, unplaced reporting).
- `activities/` — the six projector activities.
- `print.css` — the print rules verbatim in spirit.

Keeping the generators pure and DOM-free is the highest-value structural decision here.

## Files in this bundle
- `Wordlist Wonders.dc.html` — the full working prototype (all ten activities). The authoritative reference.
- `image-slot.js` — reference image-slot component (drag-drop, persist, contain-fit).
- `README.md` — this document.

To study the prototype: open the HTML in a browser, choose a list, click **Make Activities**, then step through the PRINT group with **Edit Words** open, and use **Print** to inspect the paged output.
