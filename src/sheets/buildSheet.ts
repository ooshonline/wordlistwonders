import type { DisplayMode, Word, WordSet } from '../types';
import { memoPuzzle } from '../generators/cache';
import { wordSig, cleanWord } from '../generators/random';
import { buildBingoCards } from '../generators/bingo';
import { buildWordSearch } from '../generators/wordsearch';
import { buildCrossword } from '../generators/crossword';
import type { StoreState } from '../store';

/** Free-distribution credit stamped on printed worksheets when opted in (M1). */
const CREDIT_LINE = 'Made with Wordlist Wonders · ooshonline.github.io/wordlistwonders';

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
  across: { num: number; clue: string }[];
  down: { num: number; clue: string }[];
  cells: { letter: string | null; num: number | null; showLetter: boolean }[];
  isKey: boolean;
  title: string;
  subtitle: string;
  showNameLine: boolean;
  credit?: string;
}
export type SheetPage = BingoPage | FlashPage | SearchPage | CrossPage;

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
    const px = Math.floor(Math.min(46, 700 / Math.max(1, data.size)));
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
    const px = raw.cols > 18 ? 26 : raw.cols > 14 ? 30 : 34;
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
    const mkPage = (isKey: boolean): CrossPage => ({
      kind: 'cross',
      cols: raw.cols,
      cellPx: px,
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
  }

  // Stamp the opt-in credit line onto every page (off by default).
  if (state.printCredit) for (const p of pages) p.credit = CREDIT_LINE;

  return {
    pages,
    kindLabel,
    summary,
    warning,
    showClueColumn: kind === 'crossword',
    showShuffle: kind !== 'flashcards',
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
