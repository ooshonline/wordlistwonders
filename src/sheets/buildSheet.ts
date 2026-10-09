import type { DisplayMode, Word, WordSet } from '../types';
import { memoPuzzle } from '../generators/cache';
import { wordSig, cleanWord } from '../generators/random';
import { buildBingoCards } from '../generators/bingo';
import { buildWordSearch } from '../generators/wordsearch';
import { searchCellPx } from '../generators/searchLayout';
import { buildCrossword } from '../generators/crossword';
import { crossLayout } from '../generators/crossLayout';
import { buildSpellingTest, spellingPages, type SpellingPrompt } from '../generators/spellingTest';
import { alphabetize, buildWordScramble, scramblePages, type ScrambleHint } from '../generators/wordScramble';
import { alphaEligible, buildAlphaOrder } from '../generators/alphaOrder';
import { buildRollRead, ROLL_COLS, type RollCell } from '../generators/rollRead';
import { buildTraceWrite, type TraceItem } from '../generators/traceWrite';
import type { StoreState } from '../store';

/** Free-distribution credit stamped on printed worksheets when opted in (M1). */
const CREDIT_LINE = 'Made with Wordlist Wonders · ribbitpond.com/wordlist-wonders';

// ── page view-models ────────────────────────────────────────────────────────
export interface BingoCellView {
  kind: 'free' | 'blank' | 'word';
  text: string;
  showImage: boolean;
  showText: boolean;
  slotId?: string;
}
export interface BingoCardView {
  size: number;
  title: string;
  cells: BingoCellView[];
}
export interface BingoPage {
  kind: 'bingo';
  columns: number;
  cards: BingoCardView[];
  title: string;
  subtitle: string;
  showNameLine: boolean;
  content: string;
  credit?: string;
}
export interface FlashCardView {
  text: string;
  slotId: string;
  showImage: boolean;
  showText: boolean;
}
export interface FlashPage {
  kind: 'flash';
  columns: number;
  rows: number;
  cards: FlashCardView[];
  perPage: number;
  cutLines: boolean;
  title: string;
  subtitle: string;
  showNameLine: boolean;
  credit?: string;
}
export interface SearchPage {
  kind: 'search';
  size: number;
  cellPx: number;
  bank: string[];
  cells: { ch: string; inWord: boolean }[];
  isKey: boolean;
  title: string;
  subtitle: string;
  showNameLine: boolean;
  credit?: string;
}
export interface CrossPage {
  kind: 'cross';
  cols: number;
  cellPx: number;
  cluesBeside: boolean;
  across: { num: number; clue: string }[];
  down: { num: number; clue: string }[];
  cells: { letter: string | null; num: number | null; showLetter: boolean }[];
  isKey: boolean;
  title: string;
  subtitle: string;
  showNameLine: boolean;
  credit?: string;
}
export interface SpellingItemView {
  num: number;
  /** The word — rendered only on the answer key. */
  answer: string;
  /** Image-slot key, used in the picture-prompt mode. */
  slotId: string;
  showImage: boolean;
  showAnswer: boolean;
}
export interface SpellingPage {
  kind: 'spelling';
  items: SpellingItemView[];
  prompt: SpellingPrompt;
  isKey: boolean;
  title: string;
  subtitle: string;
  showNameLine: boolean;
  credit?: string;
}
export interface ScrambleItemView {
  num: number;
  /** The jumbled letters the student unscrambles. */
  scrambled: string;
  /** The real word — rendered only on the answer key. */
  answer: string;
  /** First letter, pre-printed on the line when the first-letter hint is on. */
  firstLetter: string;
  slotId: string;
  showAnswer: boolean;
}
export interface ScramblePage {
  kind: 'scramble';
  items: ScrambleItemView[];
  hint: ScrambleHint;
  /** Alphabetized answers for the word bank box (empty = no bank). */
  wordBank: string[];
  isKey: boolean;
  title: string;
  subtitle: string;
  showNameLine: boolean;
  credit?: string;
}
export interface AlphaGroupView {
  num: number;
  /** Words in the jumbled order printed for the student. */
  jumbled: string[];
  /** Words in ABC order — written on the lines only on the answer key. */
  sorted: string[];
  showAnswer: boolean;
}
export interface AlphaPage {
  kind: 'alpha';
  groups: AlphaGroupView[];
  isKey: boolean;
  title: string;
  subtitle: string;
  showNameLine: boolean;
  credit?: string;
}
export interface RollPage {
  kind: 'roll';
  /** `rows` arrays of ROLL_COLS cells; column i belongs to die face i + 1. */
  rows: RollCell[][];
  pictures: boolean;
  title: string;
  subtitle: string;
  showNameLine: boolean;
  credit?: string;
}
export interface TracePage {
  kind: 'trace';
  /** Rows on this page; the renderer sizes them to share the page height. */
  items: TraceItem[];
  /** Rows per full page, so a short last page keeps the same row height. */
  perPage: number;
  repeats: number;
  pictures: boolean;
  title: string;
  subtitle: string;
  showNameLine: boolean;
  credit?: string;
}
export type SheetPage = BingoPage | FlashPage | SearchPage | CrossPage | SpellingPage | ScramblePage | AlphaPage | RollPage | TracePage;

export interface SheetData {
  pages: SheetPage[];
  kindLabel: string;
  summary: string;
  warning: string;
  showClueColumn: boolean;
  showShuffle: boolean;
  editLabels: Record<string, string>;
}

const flashGeometry = (perPage: number): { cols: number; rows: number } =>
  ({
    1: { cols: 1, rows: 1 },
    2: { cols: 1, rows: 2 },
    4: { cols: 2, rows: 2 },
    6: { cols: 2, rows: 3 },
    8: { cols: 2, rows: 4 },
  })[perPage] || { cols: 2, rows: 2 };

const bingoColumns = (n: number): number => ({ 1: 1, 2: 2, 4: 2, 6: 3 })[n] || 2;


export function buildSheet(kind: DisplayMode, set: WordSet, state: StoreState): SheetData {
  const words = set.words;
  const listName = set.name || 'Word List';
  const sig = wordSig(words);
  const pages: SheetPage[] = [];
  let kindLabel = '';
  let summary = '';
  let warning = '';
  const editLabels: Record<string, string> = {};

  if (kind === 'bingo') {
    const b = state.bingo;
    const perPage = b.perPage || 2;
    const content = b.content || 'words';
    const cards = memoPuzzle(`bingo|${sig}|${b.count}|${b.gridSize}|${b.allowRepeat}|${state.salt.bingo}`, () =>
      buildBingoCards(words, b.count || 6, b.gridSize, b.allowRepeat),
    );
    const withImage = content === 'imageWord' || content === 'imagesOnly';
    const cellText = content !== 'imagesOnly';
    let blanks = 0;
    const cardViews: BingoCardView[] = cards.map((card) => ({
      size: card.size,
      title: listName.toUpperCase() + ' · BINGO',
      cells: card.cells.map((c): BingoCellView => {
        if ('free' in c) return { kind: 'free', text: 'FREE', showImage: false, showText: true };
        if ('blank' in c) {
          blanks++;
          return { kind: 'blank', text: '', showImage: false, showText: false };
        }
        const w = words.find((x) => x.id === c.id);
        return {
          kind: 'word',
          text: w ? w.text : '',
          showImage: withImage,
          showText: cellText,
          slotId: w ? 'slot-' + w.id : 'slot-none',
        };
      }),
    }));
    const columns = bingoColumns(perPage);
    for (let i = 0; i < cardViews.length; i += perPage) {
      pages.push({
        kind: 'bingo',
        columns,
        cards: cardViews.slice(i, i + perPage),
        title: listName + ' — Bingo',
        subtitle: 'Page ' + (pages.length + 1),
        showNameLine: false,
        content,
      });
    }
    kindLabel = 'Bingo Cards';
    summary = `${cardViews.length} cards · ${pages.length} page(s)`;
    if (blanks)
      warning =
        'Not enough words to fill every square — empty squares left blank. Add words, choose a smaller grid, or allow repeats.';
  } else if (kind === 'flashcards') {
    const f = state.flash;
    const geo = flashGeometry(f.perPage);
    const content = f.content || 'imageWord';
    const showImg = content !== 'wordOnly';
    const showTxt = content !== 'imageOnly';
    const cardViews: FlashCardView[] = words.map((w) => ({
      text: w.text,
      slotId: 'slot-' + w.id,
      showImage: showImg,
      showText: showTxt,
    }));
    for (let i = 0; i < cardViews.length; i += f.perPage) {
      pages.push({
        kind: 'flash',
        columns: geo.cols,
        rows: geo.rows,
        cards: cardViews.slice(i, i + f.perPage),
        perPage: f.perPage,
        cutLines: !!f.cutLines,
        title: listName + ' — Flash Cards',
        subtitle: 'Page ' + (pages.length + 1),
        showNameLine: false,
      });
    }
    kindLabel = 'Flash Cards';
    summary = `${cardViews.length} cards · ${pages.length} page(s)`;
  } else if (kind === 'wordsearch') {
    const ws = state.wordsearch;
    const data = memoPuzzle(`ws|${sig}|${ws.size}|${ws.diagonals}|${ws.backwards}|${state.salt.wordsearch}`, () =>
      buildWordSearch(words, ws.size, ws.diagonals, ws.backwards),
    );
    // Size cells so grid + word bank fit one page (B9: a wrapped long title +
    // credit line overflowed). Measured on the longer answer-key title.
    const px = searchCellPx(data.size, data.bank.length, (listName + ' — Word Search (Answer Key)').length);
    const mkPage = (isKey: boolean): SearchPage => ({
      kind: 'search',
      size: data.size,
      cellPx: px,
      bank: data.bank,
      cells: data.cells.map((c) => ({ ch: c.ch, inWord: c.inWord })),
      isKey,
      title: listName + ' — Word Search' + (isKey ? ' (Answer Key)' : ''),
      subtitle: `${data.size}×${data.size} · ${data.bank.length} words`,
      showNameLine: !isKey,
    });
    pages.push(mkPage(false));
    if (ws.answerKey) pages.push(mkPage(true));
    kindLabel = 'Word Search';
    summary = `${data.bank.length} words hidden · ${pages.length} page(s)`;
    if (data.unplaced.length) warning = "Didn't fit: " + data.unplaced.join(', ') + ' — try a bigger grid.';
  } else if (kind === 'crossword') {
    const cw = state.crossword;
    const raw = memoPuzzle(`cw|${sig}|${state.salt.crossword}`, () => buildCrossword(words));
    raw.across.forEach((e) => (editLabels[e.word] = 'A' + e.num));
    raw.down.forEach((e) => (editLabels[e.word] = 'D' + e.num));
    // Clues are read live from the word list so edits show immediately
    // without re-laying out the grid.
    const liveClues = (list: { num: number; word: string }[]): { num: number; clue: string }[] =>
      list.map((e) => {
        const w = words.find((x) => cleanWord(x.text) === e.word);
        const c = w && (w.clue || '').trim();
        return { num: e.num, clue: c || e.word.length + ' letters' };
      });
    const across = liveClues(raw.across);
    const down = liveClues(raw.down);
    // Size cells (and place clues under or beside the grid) to fit one page.
    // Measured on the longer answer-key title so both pages share one layout.
    const keyTitle = listName + ' — Crossword (Answer Key)';
    const layout = crossLayout(raw.rows, raw.cols, across, down, keyTitle.length);
    const mkPage = (isKey: boolean): CrossPage => ({
      kind: 'cross',
      cols: raw.cols,
      cellPx: layout.cellPx,
      cluesBeside: layout.side,
      across,
      down,
      cells: raw.cells.map((c) => ({ letter: c.letter, num: c.num, showLetter: !!(isKey && c.letter) })),
      isKey,
      title: listName + ' — Crossword' + (isKey ? ' (Answer Key)' : ''),
      subtitle: `${across.length} across · ${down.length} down`,
      showNameLine: !isKey,
    });
    pages.push(mkPage(false));
    if (cw.answerKey) pages.push(mkPage(true));
    kindLabel = 'Crossword';
    summary = `${across.length + down.length} entries placed`;
    const noClues = words.filter((w) => !(w.clue || '').trim()).length;
    if (raw.unplaced.length)
      warning = "Couldn't interlock: " + raw.unplaced.join(', ') + '. Shuffle to try a different layout.';
    else if (noClues)
      warning = `${noClues} word(s) have no clue yet — add clues in Edit Set so students have something to solve.`;
  } else if (kind === 'spelling') {
    const sp = state.spelling;
    // Randomized order only re-rolls when the teacher shuffles (salt), so the
    // preview is stable between renders. Test + key pages share this one order.
    const test = memoPuzzle(
      `spelling|${sig}|${sp.prompt}|${sp.perPage}|${sp.shuffleOrder}|${state.salt.spelling}`,
      () => buildSpellingTest(words, { prompt: sp.prompt, perPage: sp.perPage, shuffleOrder: sp.shuffleOrder }),
    );
    const chunks = spellingPages(test);
    const isImage = test.prompt === 'image';
    const wordCount = `${test.total} word${test.total === 1 ? '' : 's'}`;
    const mkPage = (chunk: typeof chunks[number], idx: number, isKey: boolean): SpellingPage => ({
      kind: 'spelling',
      items: chunk.map((it) => ({
        num: it.num,
        answer: it.answer,
        slotId: it.slotId,
        showImage: isImage,
        showAnswer: isKey,
      })),
      prompt: test.prompt,
      isKey,
      title: listName + ' — Spelling Test' + (isKey ? ' (Answer Key)' : ''),
      subtitle: wordCount + (chunks.length > 1 ? ` · Page ${idx + 1} of ${chunks.length}` : ''),
      // Answer key omits Name/Date (B1); the student sheet keeps it.
      showNameLine: !isKey,
    });
    chunks.forEach((chunk, i) => pages.push(mkPage(chunk, i, false)));
    if (sp.answerKey) chunks.forEach((chunk, i) => pages.push(mkPage(chunk, i, true)));
    kindLabel = 'Spelling Test';
    summary = `${wordCount} · ${pages.length} page(s)`;
    if (test.total === 0) warning = 'Add some words to this list to build a spelling test.';
  } else if (kind === 'scramble') {
    const sc = state.scramble;
    // Scrambles are random, so they only re-roll on Shuffle (salt) — the preview
    // stays stable between renders, and the puzzle + key pages share one build.
    const puzzle = memoPuzzle(
      `scramble|${sig}|${sc.perPage}|${sc.shuffleOrder}|${state.salt.scramble}`,
      () => buildWordScramble(words, { perPage: sc.perPage, shuffleOrder: sc.shuffleOrder }),
    );
    const chunks = scramblePages(puzzle);
    const wordCount = `${puzzle.total} word${puzzle.total === 1 ? '' : 's'}`;
    const mkPage = (chunk: typeof chunks[number], idx: number, isKey: boolean): ScramblePage => ({
      kind: 'scramble',
      items: chunk.map((it) => ({
        num: it.num,
        scrambled: it.scrambled,
        answer: it.answer,
        firstLetter: it.firstLetter,
        slotId: it.slotId,
        showAnswer: isKey,
      })),
      hint: sc.hint,
      // Each student page banks just its own answers; the key doesn't need one.
      wordBank: sc.wordBank && !isKey ? alphabetize(chunk) : [],
      isKey,
      title: listName + ' — Word Scramble' + (isKey ? ' (Answer Key)' : ''),
      subtitle: wordCount + (chunks.length > 1 ? ` · Page ${idx + 1} of ${chunks.length}` : ''),
      showNameLine: !isKey,
    });
    chunks.forEach((chunk, i) => pages.push(mkPage(chunk, i, false)));
    if (sc.answerKey) chunks.forEach((chunk, i) => pages.push(mkPage(chunk, i, true)));
    kindLabel = 'Word Scramble';
    summary = `${wordCount} · ${pages.length} page(s)`;
    const skipped = words.filter((w) => (w.text || '').trim()).length - puzzle.total;
    if (puzzle.total === 0) warning = 'Add some words to this list to build a word scramble.';
    else if (skipped > 0)
      warning = `${skipped} word(s) are too short to scramble (one letter, or all the same letter), so they're left out.`;
  } else if (kind === 'alpha') {
    const al = state.alpha;
    // Jumbles are random, so they only re-roll on Shuffle (salt); the student
    // pages and the key share one build so the key always matches.
    const data = memoPuzzle(`alpha|${sig}|${al.groupSize}|${al.shuffleGroups}|${state.salt.alpha}`, () =>
      buildAlphaOrder(words, { groupSize: al.groupSize, shuffleGroups: al.shuffleGroups }),
    );
    // Sets sit two across: sets of up to 4 words fit three rows per page,
    // longer sets two rows (measured to stay inside one US-Letter sheet).
    const perPage = al.groupSize <= 4 ? 6 : 4;
    const chunks: typeof data.groups[] = [];
    for (let i = 0; i < data.groups.length; i += perPage) chunks.push(data.groups.slice(i, i + perPage));
    const wordCount = `${data.total} word${data.total === 1 ? '' : 's'}`;
    const setCount = `${data.groups.length} set${data.groups.length === 1 ? '' : 's'}`;
    const mkPage = (chunk: typeof data.groups, idx: number, isKey: boolean): AlphaPage => ({
      kind: 'alpha',
      groups: chunk.map((g) => ({
        num: g.num,
        jumbled: g.jumbled.map((it) => it.text),
        sorted: g.sorted.map((it) => it.text),
        showAnswer: isKey,
      })),
      isKey,
      title: listName + ' — ABC Order' + (isKey ? ' (Answer Key)' : ''),
      subtitle: `${wordCount} · ${setCount}` + (chunks.length > 1 ? ` · Page ${idx + 1} of ${chunks.length}` : ''),
      showNameLine: !isKey,
    });
    chunks.forEach((chunk, i) => pages.push(mkPage(chunk, i, false)));
    if (al.answerKey) chunks.forEach((chunk, i) => pages.push(mkPage(chunk, i, true)));
    kindLabel = 'ABC Order';
    summary = `${wordCount} · ${pages.length} page(s)`;
    const nonBlank = words.filter((w) => (w.text || '').trim()).length;
    const dupes = nonBlank - alphaEligible(words).length;
    if (data.total === 0) warning = 'Add some words to this list to build an ABC order sheet.';
    else if (data.total < 2) warning = 'Add at least two words so there is something to put in ABC order.';
    else if (dupes > 0) warning = `${dupes} repeated word(s) appear only once, so every set has one right order.`;
  } else if (kind === 'roll') {
    const rr = state.roll;
    // Repeats are random, so the grid only re-rolls on Shuffle (salt).
    const data = memoPuzzle(`roll|${sig}|${rr.rows}|${rr.shuffleOrder}|${state.salt.roll}`, () =>
      buildRollRead(words, { rows: rr.rows, shuffleOrder: rr.shuffleOrder }),
    );
    const wordCount = `${data.total} word${data.total === 1 ? '' : 's'}`;
    data.grids.forEach((g, i) =>
      pages.push({
        kind: 'roll',
        rows: g.rows,
        pictures: rr.pictures,
        title: listName + ' — Roll & Read',
        subtitle: wordCount + (data.grids.length > 1 ? ` · Page ${i + 1} of ${data.grids.length}` : ''),
        showNameLine: true,
      }),
    );
    kindLabel = 'Roll & Read';
    summary = `${wordCount} · ${pages.length} page(s)`;
    if (data.total === 0) warning = 'Add some words to this list to build a Roll & Read sheet.';
    else if (data.total < ROLL_COLS)
      warning = `With only ${data.total} word(s), some repeat in the same row. Add ${ROLL_COLS}+ words for more variety.`;
  } else if (kind === 'trace') {
    const tw = state.trace;
    // No randomness: rows follow the list order, so no memo/salt is needed.
    const data = buildTraceWrite(words, tw.perPage);
    const wordCount = `${data.total} word${data.total === 1 ? '' : 's'}`;
    data.pages.forEach((items, i) =>
      pages.push({
        kind: 'trace',
        items,
        perPage: data.perPage,
        repeats: tw.repeats,
        pictures: tw.pictures,
        title: listName + ' — Trace & Write',
        subtitle: wordCount + (data.pages.length > 1 ? ` · Page ${i + 1} of ${data.pages.length}` : ''),
        showNameLine: true,
      }),
    );
    kindLabel = 'Trace & Write';
    summary = `${wordCount} · ${pages.length} page(s)`;
    if (data.total === 0) warning = 'Add some words to this list to build a Trace & Write sheet.';
  }

  // Stamp the opt-in credit line onto every page (off by default).
  if (state.printCredit) for (const p of pages) p.credit = CREDIT_LINE;

  return {
    pages,
    kindLabel,
    summary,
    warning,
    showClueColumn: kind === 'crossword',
    // Spelling only shuffles when the teacher opts into randomized order.
    showShuffle: kind === 'spelling' ? state.spelling.shuffleOrder : kind !== 'flashcards' && kind !== 'trace',
    editLabels,
  };
}

/** The per-word rows for the sheet editor panel (with optional crossword badge). */
export function sheetEditRows(words: Word[], editLabels: Record<string, string>) {
  return words.map((w) => {
    const label = editLabels[cleanWord(w.text)] || '';
    return { word: w, label };
  });
}
