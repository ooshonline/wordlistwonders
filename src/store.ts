import { create } from 'zustand';
import type {
  ContentMode,
  DisplayMode,
  PrintMode,
  StylePreset,
  Tier,
  View,
  Voice,
  Word,
  WordSet,
} from './types';
import { SEED_SETS } from './seed';
import { shuffle } from './generators/random';
import { autoPos as wallAutoPos } from './activities/wallLayout';

const STORAGE_KEY = 'vocabwall_v3';

// ── quiz sub-state ──────────────────────────────────────────────────────────
export interface QuizState {
  order: string[];
  pointer: number;
  targetId: string | null;
  options: Word[];
  answered: boolean;
  selected: string | null;
  correct: boolean | null;
  teamCount: number;
  scores: number[];
  countdown: 'off' | '10' | '20' | '30' | 'custom';
  customSeconds: number;
  timeLeft: number | null;
  missed: string[];
  done: boolean;
}

interface DragState {
  wordId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}
interface ResizeState {
  wordId: string;
  startX: number;
  startY: number;
  startScale: number;
}

export interface StoreState {
  view: View;
  presenterMode: boolean;
  displayMode: DisplayMode;
  stylePreset: StylePreset;
  contentMode: ContentMode;
  toast: string | null;
  librarySearch: string;
  missingWord: { removedId: string | null; revealed: boolean; history: string[] };
  flyswatter: { scoreA: number; scoreB: number; lastWordId: string | null };
  bingo: { count: number; gridSize: string; perPage: number; content: string; allowRepeat: boolean };
  flash: { perPage: number; content: string; cutLines: boolean };
  wordsearch: { size: number; diagonals: boolean; backwards: boolean; answerKey: boolean };
  crossword: { answerKey: boolean };
  currentSetId: string;
  selectedWordId: string | null;
  dragging: DragState | null;
  resizing: ResizeState | null;
  gridZoom: number;
  wallSpeed: number;
  carouselIndex: number;
  carouselPlaying: boolean;
  revealedBySet: Record<string, Record<string, boolean>>;
  quiz: QuizState;
  printOpen: boolean;
  sheetEditorOpen: boolean;
  sheetColW: number;
  /** Per-kind shuffle salt; incrementing busts the puzzle memo cache. */
  salt: { bingo: number; wordsearch: number; crossword: number };
  sets: WordSet[];
}

export interface StoreActions {
  // navigation
  goHome: () => void;
  goLibrary: () => void;
  goEditor: () => void;
  goDisplay: () => void;
  togglePresenter: () => void;
  setMode: (mode: DisplayMode) => void;
  setStyle: (preset: StylePreset) => void;
  setContentMode: (mode: ContentMode) => void;
  openSet: (id: string) => void;
  openEditor: (id: string) => void;
  // zoom (word wall)
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  setWallSpeed: (v: number) => void;
  // library
  setLibrarySearch: (v: string) => void;
  createSet: () => void;
  duplicateSet: (id: string) => void;
  deleteSet: (id: string) => void;
  // editor
  setSetName: (v: string) => void;
  setSetTheme: (v: string) => void;
  setSetGrade: (v: string) => void;
  setSetTags: (v: string) => void;
  setSetVoice: (v: Voice) => void;
  addWord: () => void;
  removeWord: (id: string) => void;
  updateWordField: (id: string, field: keyof Word, val: unknown) => void;
  setWordTier: (id: string, tier: Tier) => void;
  setWordColor: (id: string, color: string | null) => void;
  toggleRecorded: (id: string) => void;
  speakWord: (word: Word) => void;
  // toast / undo
  dismissToast: () => void;
  undoToast: () => void;
  // grid drag/resize
  startDrag: (e: React.MouseEvent, wordId: string, origin: { x: number; y: number }) => void;
  startResize: (e: React.MouseEvent, wordId: string) => void;
  onGridMouseMove: (e: React.MouseEvent) => void;
  onGridMouseUp: () => void;
  selectWord: (id: string | null) => void;
  resetGridLayout: (sortMode: 'random' | 'tier' | 'alpha') => void;
  // carousel
  carouselNext: () => void;
  carouselPrev: () => void;
  togglePlay: () => void;
  setSpeed: (v: number) => void;
  restartCarouselTimer: () => void;
  // reveal
  toggleReveal: (id: string) => void;
  resetReveal: () => void;
  // missing word
  removeOneWord: () => void;
  revealMissing: () => void;
  // flyswatter
  markFlyswatterWord: (id: string) => void;
  addFlyswatterScore: (team: 'scoreA' | 'scoreB') => void;
  // quiz
  initQuiz: () => void;
  setTeamCount: (n: number) => void;
  setCountdown: (v: QuizState['countdown']) => void;
  setQuizCustomSeconds: (v: number) => void;
  answerQuiz: (optId: string) => void;
  addScore: (teamIdx: number) => void;
  nextQuestion: () => void;
  playQuizAgain: () => void;
  createReviewSetFromMissed: () => void;
  // sheet settings
  setBingoCount: (v: number) => void;
  setBingoGridSize: (v: string) => void;
  setBingoPerPage: (v: number) => void;
  setBingoContent: (v: string) => void;
  setBingoAllowRepeat: (v: boolean) => void;
  setFlashPerPage: (v: number) => void;
  setFlashContent: (v: string) => void;
  setFlashCutLines: (v: boolean) => void;
  setSearchSize: (v: number) => void;
  setSearchDiagonals: (v: boolean) => void;
  setSearchBackwards: (v: boolean) => void;
  setSearchAnswerKey: (v: boolean) => void;
  setCrossAnswerKey: (v: boolean) => void;
  reshuffleSheet: (kind: 'bingo' | 'wordsearch' | 'crossword') => void;
  toggleSheetEditor: () => void;
  setSheetColW: (w: number) => void;
  // print handout
  openPrint: () => void;
  closePrint: () => void;
  togglePrintBlank: (id: string) => void;
  setPrintMode: (mode: PrintMode) => void;
  setPrintPercent: (v: number) => void;
  shuffleRandomBlanks: () => void;
}

export type Store = StoreState & StoreActions;

// ── module-level timers (mirror the prototype's this._timer / this._quizTimer)
let carouselTimer: ReturnType<typeof setInterval> | null = null;
let quizTimer: ReturnType<typeof setInterval> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let pendingUndo: (() => void) | null = null;

// ── persistence ─────────────────────────────────────────────────────────────
function loadInitial(): { sets: WordSet[]; currentSetId: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.sets) && data.sets.length) {
        return { sets: data.sets, currentSetId: data.currentSetId || data.sets[0].id };
      }
    }
  } catch {
    /* ignore */
  }
  return { sets: SEED_SETS, currentSetId: 'set-food' };
}

function persist(sets: WordSet[], currentSetId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sets, currentSetId }));
  } catch {
    /* ignore */
  }
}

// ── TTS (Web Speech API stands in for real recorded audio) ──────────────────
function speak(text: string, voicePref: Voice | undefined) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices() || [];
    const want = voicePref === 'uk' ? 'en-GB' : 'en-US';
    const v = voices.find((vc) => vc.lang === want) || voices.find((vc) => vc.lang && vc.lang.startsWith('en'));
    if (v) u.voice = v;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

const initial = loadInitial();

export const useStore = create<Store>((set, get) => {
  const getCurrentSet = (sets?: WordSet[]): WordSet => {
    const list = sets || get().sets;
    return list.find((s) => s.id === get().currentSetId) || list[0];
  };

  // Mutate sets then persist; optional callback runs after state settles.
  const mutateSets = (updater: (sets: WordSet[]) => WordSet[], cb?: () => void) => {
    set((s) => ({ sets: updater(s.sets) }));
    const st = get();
    persist(st.sets, st.currentSetId);
    if (cb) cb();
  };

  const showUndoToast = (message: string, restoreFn: () => void) => {
    if (toastTimer) clearTimeout(toastTimer);
    pendingUndo = restoreFn;
    set({ toast: message });
    toastTimer = setTimeout(() => {
      pendingUndo = null;
      set({ toast: null });
    }, 6000);
  };

  const buildQuizOptions = (targetId: string, words: Word[]): Word[] => {
    const target = words.find((w) => w.id === targetId)!;
    const pool = words.filter((w) => w.id !== targetId);
    const distractors = shuffle(pool).slice(0, 3);
    return shuffle([target, ...distractors]);
  };

  const startQuizCountdown = () => {
    if (quizTimer) clearInterval(quizTimer);
    const q = get().quiz;
    const secs =
      q.countdown === 'custom'
        ? q.customSeconds || 15
        : ({ '10': 10, '20': 20, '30': 30 } as Record<string, number>)[q.countdown];
    if (!secs || q.answered || q.done) {
      set((s) => ({ quiz: { ...s.quiz, timeLeft: null } }));
      return;
    }
    set((s) => ({ quiz: { ...s.quiz, timeLeft: secs } }));
    quizTimer = setInterval(() => {
      const s = get();
      if (s.quiz.answered || s.quiz.done) return;
      const left = (s.quiz.timeLeft || 0) - 1;
      if (left <= 0) {
        if (quizTimer) clearInterval(quizTimer);
        const target = getCurrentSet().words.find((w) => w.id === s.quiz.targetId);
        const missed =
          target && !s.quiz.missed.includes(target.id) ? [...s.quiz.missed, target.id] : s.quiz.missed;
        set({ quiz: { ...s.quiz, answered: true, selected: null, correct: false, timeLeft: 0, missed } });
      } else {
        set({ quiz: { ...s.quiz, timeLeft: left } });
      }
    }, 1000);
  };

  return {
    // ── initial state ──
    view: 'home',
    presenterMode: false,
    displayMode: 'grid',
    stylePreset: 'card',
    contentMode: 'both',
    toast: null,
    librarySearch: '',
    missingWord: { removedId: null, revealed: false, history: [] },
    flyswatter: { scoreA: 0, scoreB: 0, lastWordId: null },
    bingo: { count: 6, gridSize: 'auto', perPage: 2, content: 'words', allowRepeat: false },
    flash: { perPage: 4, content: 'imageWord', cutLines: true },
    wordsearch: { size: 12, diagonals: true, backwards: false, answerKey: false },
    crossword: { answerKey: false },
    currentSetId: initial.currentSetId,
    selectedWordId: null,
    dragging: null,
    resizing: null,
    gridZoom: 1,
    wallSpeed: 45,
    carouselIndex: 0,
    carouselPlaying: false,
    revealedBySet: {},
    quiz: {
      order: [],
      pointer: 0,
      targetId: null,
      options: [],
      answered: false,
      selected: null,
      correct: null,
      teamCount: 2,
      scores: [0, 0],
      countdown: 'off',
      customSeconds: 15,
      timeLeft: null,
      missed: [],
      done: false,
    },
    printOpen: false,
    sheetEditorOpen: false,
    sheetColW: 900,
    salt: { bingo: 0, wordsearch: 0, crossword: 0 },
    sets: initial.sets,

    // ── navigation ──
    goHome: () => set({ view: 'home' }),
    goLibrary: () => set({ view: 'library' }),
    goEditor: () => set({ view: 'editor' }),
    goDisplay: () => set({ view: 'display' }),
    togglePresenter: () => set((s) => ({ presenterMode: !s.presenterMode })),
    setMode: (mode) => {
      if (quizTimer) clearInterval(quizTimer);
      set({ displayMode: mode });
      if (mode === 'quiz') get().initQuiz();
      if (mode !== 'carousel') {
        set({ carouselPlaying: false });
        get().restartCarouselTimer();
      }
    },
    setStyle: (preset) =>
      set((s) => ({
        stylePreset: preset,
        contentMode: preset === 'stylized' ? 'wordOnly' : s.contentMode,
      })),
    setContentMode: (mode) => set({ contentMode: mode }),
    openSet: (id) => set({ currentSetId: id, view: 'display', carouselIndex: 0, selectedWordId: null }),
    openEditor: (id) => set({ currentSetId: id, view: 'editor' }),

    // ── zoom ──
    zoomIn: () => set((s) => ({ gridZoom: Math.max(0.25, Math.min(3, +(s.gridZoom + 0.1).toFixed(2))) })),
    zoomOut: () => set((s) => ({ gridZoom: Math.max(0.25, Math.min(3, +(s.gridZoom - 0.1).toFixed(2))) })),
    zoomReset: () => set({ gridZoom: 1 }),
    setWallSpeed: (v) => set({ wallSpeed: Math.max(25, Math.min(75, v || 45)) }),

    // ── library ──
    setLibrarySearch: (v) => set({ librarySearch: v }),
    createSet: () => {
      const id = 'set-' + Date.now();
      mutateSets(
        (sets) => [
          ...sets,
          {
            id,
            name: 'New Word List',
            theme: '',
            gradeLevel: '',
            tags: [],
            ttsVoice: 'us',
            carouselSpeed: 4,
            positions: {},
            cardScale: {},
            printBlanks: {},
            printMode: 'manual',
            printRandomPercent: 30,
            words: [],
          },
        ],
        () => set({ currentSetId: id, view: 'editor' }),
      );
    },
    duplicateSet: (id) => {
      mutateSets((sets) => {
        const src = sets.find((s) => s.id === id)!;
        const stamp = Date.now();
        const copy: WordSet = {
          ...src,
          id: 'set-' + stamp,
          name: src.name + ' (Copy)',
          words: src.words.map((w, i) => ({ ...w, id: w.id + '-c' + stamp + '-' + i })),
        };
        return [...sets, copy];
      });
    },
    deleteSet: (id) => {
      const snapshot = get().sets;
      const prevCurrent = get().currentSetId;
      mutateSets(
        (sets) => sets.filter((s) => s.id !== id),
        () => {
          if (get().currentSetId === id) {
            const remaining = get().sets;
            set({ currentSetId: remaining[0] ? remaining[0].id : '' });
            persist(get().sets, get().currentSetId);
          }
        },
      );
      showUndoToast('Word list deleted.', () =>
        mutateSets(
          () => snapshot,
          () => {
            set({ currentSetId: prevCurrent });
            persist(get().sets, get().currentSetId);
          },
        ),
      );
    },

    // ── editor ──
    setSetName: (v) => mutateSets((sets) => sets.map((s) => (s.id === get().currentSetId ? { ...s, name: v } : s))),
    setSetTheme: (v) => mutateSets((sets) => sets.map((s) => (s.id === get().currentSetId ? { ...s, theme: v } : s))),
    setSetGrade: (v) =>
      mutateSets((sets) => sets.map((s) => (s.id === get().currentSetId ? { ...s, gradeLevel: v } : s))),
    setSetTags: (v) => {
      const tags = v
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      mutateSets((sets) => sets.map((s) => (s.id === get().currentSetId ? { ...s, tags } : s)));
    },
    setSetVoice: (v) => mutateSets((sets) => sets.map((s) => (s.id === get().currentSetId ? { ...s, ttsVoice: v } : s))),
    addWord: () => {
      const id = 'w-' + Date.now();
      mutateSets((sets) =>
        sets.map((s) =>
          s.id === get().currentSetId ? { ...s, words: [...s.words, { id, text: 'new word', tier: 'normal' as Tier }] } : s,
        ),
      );
    },
    removeWord: (id) => {
      const snapshot = get().sets;
      mutateSets((sets) =>
        sets.map((s) => (s.id === get().currentSetId ? { ...s, words: s.words.filter((w) => w.id !== id) } : s)),
      );
      showUndoToast('Word deleted.', () => mutateSets(() => snapshot));
    },
    updateWordField: (id, field, val) =>
      mutateSets((sets) =>
        sets.map((s) =>
          s.id === get().currentSetId
            ? { ...s, words: s.words.map((w) => (w.id === id ? { ...w, [field]: val } : w)) }
            : s,
        ),
      ),
    setWordTier: (id, tier) => get().updateWordField(id, 'tier', tier),
    setWordColor: (id, color) => get().updateWordField(id, 'color', color),
    toggleRecorded: (id) => {
      const w = getCurrentSet().words.find((x) => x.id === id);
      get().updateWordField(id, 'audioRecorded', !w?.audioRecorded);
    },
    speakWord: (word) => speak(word.text, getCurrentSet().ttsVoice),

    // ── toast ──
    dismissToast: () => {
      if (toastTimer) clearTimeout(toastTimer);
      pendingUndo = null;
      set({ toast: null });
    },
    undoToast: () => {
      if (toastTimer) clearTimeout(toastTimer);
      if (pendingUndo) pendingUndo();
      pendingUndo = null;
      set({ toast: null });
    },

    // ── grid drag / resize ──
    startDrag: (e, wordId, origin) => {
      e.stopPropagation();
      e.preventDefault();
      set({
        selectedWordId: wordId,
        dragging: { wordId, startX: e.clientX, startY: e.clientY, origX: origin.x, origY: origin.y },
      });
    },
    startResize: (e, wordId) => {
      e.stopPropagation();
      e.preventDefault();
      const s = getCurrentSet();
      const scale = (s.cardScale && s.cardScale[wordId]) || 1;
      set({
        selectedWordId: wordId,
        resizing: { wordId, startX: e.clientX, startY: e.clientY, startScale: scale },
      });
    },
    onGridMouseMove: (e) => {
      const zoom = get().gridZoom || 1;
      const d = get().dragging;
      if (d) {
        const dx = (e.clientX - d.startX) / zoom;
        const dy = (e.clientY - d.startY) / zoom;
        const nx = Math.max(0, d.origX + dx);
        const ny = Math.max(0, d.origY + dy);
        set((s) => ({
          sets: s.sets.map((st) =>
            st.id === s.currentSetId
              ? { ...st, positions: { ...st.positions, [d.wordId]: { x: nx, y: ny } } }
              : st,
          ),
        }));
        return;
      }
      const r = get().resizing;
      if (r) {
        const delta = (e.clientX - r.startX + (e.clientY - r.startY)) / 2 / zoom;
        const next = Math.max(0.3, Math.min(6, +(r.startScale + delta / 120).toFixed(2)));
        set((s) => ({
          sets: s.sets.map((st) =>
            st.id === s.currentSetId ? { ...st, cardScale: { ...st.cardScale, [r.wordId]: next } } : st,
          ),
        }));
      }
    },
    onGridMouseUp: () => {
      if (get().dragging || get().resizing) {
        set({ dragging: null, resizing: null });
        persist(get().sets, get().currentSetId);
      }
    },
    selectWord: (id) => set({ selectedWordId: id }),
    resetGridLayout: (sortMode) => {
      const s = getCurrentSet();
      let orderedIds: string[];
      if (sortMode === 'tier') {
        const rank: Record<string, number> = { key: 0, normal: 1, bonus: 2 };
        orderedIds = [...s.words].sort((a, b) => rank[a.tier] - rank[b.tier]).map((w) => w.id);
      } else if (sortMode === 'alpha') {
        orderedIds = [...s.words].sort((a, b) => a.text.localeCompare(b.text)).map((w) => w.id);
      } else {
        orderedIds = shuffle(s.words.map((w) => w.id));
      }
      const cm = get().contentMode;
      const showImage = cm !== 'wordOnly';
      const showText = cm !== 'imageOnly';
      const positions: Record<string, { x: number; y: number }> = {};
      orderedIds.forEach((id, i) => (positions[id] = wallAutoPos(i, showImage, showText)));
      const cardScale: Record<string, number> = {};
      s.words.forEach((w) => (cardScale[w.id] = 1));
      mutateSets((sets) => sets.map((st) => (st.id === s.id ? { ...st, positions, cardScale } : st)));
    },

    // ── carousel ──
    carouselNext: () =>
      set((s) => {
        const cur = s.sets.find((x) => x.id === s.currentSetId) || s.sets[0];
        if (!cur.words.length) return {};
        return { carouselIndex: (s.carouselIndex + 1) % cur.words.length };
      }),
    carouselPrev: () =>
      set((s) => {
        const cur = s.sets.find((x) => x.id === s.currentSetId) || s.sets[0];
        if (!cur.words.length) return {};
        return { carouselIndex: (s.carouselIndex - 1 + cur.words.length) % cur.words.length };
      }),
    togglePlay: () => {
      set((s) => ({ carouselPlaying: !s.carouselPlaying }));
      get().restartCarouselTimer();
    },
    setSpeed: (v) => {
      const val = Math.max(1, Math.min(60, v || 4));
      mutateSets(
        (sets) => sets.map((s) => (s.id === get().currentSetId ? { ...s, carouselSpeed: val } : s)),
        () => get().restartCarouselTimer(),
      );
    },
    restartCarouselTimer: () => {
      if (carouselTimer) clearInterval(carouselTimer);
      if (get().carouselPlaying) {
        const s = getCurrentSet();
        carouselTimer = setInterval(() => get().carouselNext(), (s.carouselSpeed || 4) * 1000);
      }
    },

    // ── reveal ──
    toggleReveal: (wordId) =>
      set((s) => {
        const cur = { ...(s.revealedBySet[s.currentSetId] || {}) };
        cur[wordId] = !cur[wordId];
        return { revealedBySet: { ...s.revealedBySet, [s.currentSetId]: cur } };
      }),
    resetReveal: () => set((s) => ({ revealedBySet: { ...s.revealedBySet, [s.currentSetId]: {} } })),

    // ── missing word ──
    removeOneWord: () => {
      const s = getCurrentSet();
      const remaining = s.words.map((w) => w.id).filter((id) => !get().missingWord.history.includes(id));
      const pool = remaining.length ? remaining : s.words.map((w) => w.id);
      const history = remaining.length ? get().missingWord.history : [];
      const pick = pool[Math.floor(Math.random() * pool.length)];
      set({ missingWord: { removedId: pick, revealed: false, history: [...history, pick] } });
    },
    revealMissing: () => set((s) => ({ missingWord: { ...s.missingWord, revealed: true } })),

    // ── flyswatter ──
    markFlyswatterWord: (id) => set((s) => ({ flyswatter: { ...s.flyswatter, lastWordId: id } })),
    addFlyswatterScore: (team) => set((s) => ({ flyswatter: { ...s.flyswatter, [team]: s.flyswatter[team] + 1 } })),

    // ── quiz ──
    initQuiz: () => {
      const s = getCurrentSet();
      if (!s.words.length) return;
      const order = shuffle(s.words.map((w) => w.id));
      const targetId = order[0];
      const options = buildQuizOptions(targetId, s.words);
      const teamCount = get().quiz.teamCount || 2;
      set((st) => ({
        quiz: {
          order,
          pointer: 0,
          targetId,
          options,
          answered: false,
          selected: null,
          correct: null,
          teamCount,
          scores: new Array(teamCount).fill(0),
          countdown: st.quiz.countdown || 'off',
          customSeconds: st.quiz.customSeconds || 15,
          timeLeft: null,
          missed: [],
          done: false,
        },
      }));
      startQuizCountdown();
    },
    setTeamCount: (n) =>
      set((s) => ({
        quiz: { ...s.quiz, teamCount: n, scores: new Array(n).fill(0).map((_, i) => s.quiz.scores[i] || 0) },
      })),
    setCountdown: (v) => {
      set((s) => ({ quiz: { ...s.quiz, countdown: v } }));
      startQuizCountdown();
    },
    setQuizCustomSeconds: (v) => {
      const val = Math.max(3, Math.min(300, v || 15));
      set((s) => ({ quiz: { ...s.quiz, customSeconds: val } }));
      if (get().quiz.countdown === 'custom') startQuizCountdown();
    },
    answerQuiz: (optId) => {
      if (get().quiz.answered) return;
      if (quizTimer) clearInterval(quizTimer);
      const correct = optId === get().quiz.targetId;
      set((s) => {
        const missed = correct
          ? s.quiz.missed
          : s.quiz.missed.includes(s.quiz.targetId!)
            ? s.quiz.missed
            : [...s.quiz.missed, s.quiz.targetId!];
        return { quiz: { ...s.quiz, answered: true, selected: optId, correct, missed } };
      });
    },
    addScore: (teamIdx) =>
      set((s) => {
        const scores = [...s.quiz.scores];
        scores[teamIdx] = (scores[teamIdx] || 0) + 1;
        return { quiz: { ...s.quiz, scores } };
      }),
    nextQuestion: () => {
      const s = getCurrentSet();
      set((st) => {
        const pointer = st.quiz.pointer + 1;
        const order = st.quiz.order;
        if (pointer >= order.length) {
          return { quiz: { ...st.quiz, done: true, timeLeft: null } };
        }
        const targetId = order[pointer];
        const options = buildQuizOptions(targetId, s.words);
        return {
          quiz: { ...st.quiz, pointer, order, targetId, options, answered: false, selected: null, correct: null },
        };
      });
      startQuizCountdown();
    },
    playQuizAgain: () => get().initQuiz(),
    createReviewSetFromMissed: () => {
      const s = getCurrentSet();
      const missedWords = s.words.filter((w) => get().quiz.missed.includes(w.id));
      if (!missedWords.length) return;
      const id = 'set-' + Date.now();
      const stamp = Date.now();
      const newSet: WordSet = {
        id,
        name: s.name + ' — Review',
        theme: s.theme,
        gradeLevel: s.gradeLevel,
        tags: s.tags,
        ttsVoice: s.ttsVoice,
        carouselSpeed: 4,
        positions: {},
        cardScale: {},
        printBlanks: {},
        printMode: 'manual',
        printRandomPercent: 30,
        words: missedWords.map((w, i) => ({ ...w, id: w.id + '-rev-' + stamp + '-' + i })),
      };
      mutateSets(
        (sets) => [...sets, newSet],
        () => {
          set({ currentSetId: id, view: 'library' });
          persist(get().sets, get().currentSetId);
        },
      );
    },

    // ── sheet settings ──
    setBingoCount: (v) => set((s) => ({ bingo: { ...s.bingo, count: Math.max(1, Math.min(30, v || 1)) } })),
    setBingoGridSize: (v) => set((s) => ({ bingo: { ...s.bingo, gridSize: v } })),
    setBingoPerPage: (v) => set((s) => ({ bingo: { ...s.bingo, perPage: v } })),
    setBingoContent: (v) => set((s) => ({ bingo: { ...s.bingo, content: v } })),
    setBingoAllowRepeat: (v) => set((s) => ({ bingo: { ...s.bingo, allowRepeat: v } })),
    setFlashPerPage: (v) => set((s) => ({ flash: { ...s.flash, perPage: v } })),
    setFlashContent: (v) => set((s) => ({ flash: { ...s.flash, content: v } })),
    setFlashCutLines: (v) => set((s) => ({ flash: { ...s.flash, cutLines: v } })),
    setSearchSize: (v) => set((s) => ({ wordsearch: { ...s.wordsearch, size: v } })),
    setSearchDiagonals: (v) => set((s) => ({ wordsearch: { ...s.wordsearch, diagonals: v } })),
    setSearchBackwards: (v) => set((s) => ({ wordsearch: { ...s.wordsearch, backwards: v } })),
    setSearchAnswerKey: (v) => set((s) => ({ wordsearch: { ...s.wordsearch, answerKey: v } })),
    setCrossAnswerKey: (v) => set((s) => ({ crossword: { ...s.crossword, answerKey: v } })),
    reshuffleSheet: (kind) => set((s) => ({ salt: { ...s.salt, [kind]: s.salt[kind] + 1 } })),
    toggleSheetEditor: () => set((s) => ({ sheetEditorOpen: !s.sheetEditorOpen })),
    setSheetColW: (w) => set({ sheetColW: w }),

    // ── print handout ──
    openPrint: () => set({ printOpen: true }),
    closePrint: () => set({ printOpen: false }),
    togglePrintBlank: (wordId) =>
      mutateSets((sets) =>
        sets.map((s) => {
          if (s.id !== get().currentSetId) return s;
          const pb = { ...s.printBlanks };
          pb[wordId] = !pb[wordId];
          return { ...s, printBlanks: pb };
        }),
      ),
    setPrintMode: (mode) =>
      mutateSets((sets) => sets.map((s) => (s.id === get().currentSetId ? { ...s, printMode: mode } : s))),
    setPrintPercent: (v) =>
      mutateSets((sets) => sets.map((s) => (s.id === get().currentSetId ? { ...s, printRandomPercent: v } : s))),
    shuffleRandomBlanks: () => {
      const s = getCurrentSet();
      const n = Math.round(((s.printRandomPercent || 30) / 100) * s.words.length);
      const ids = shuffle(s.words.map((w) => w.id)).slice(0, n);
      const pb: Record<string, boolean> = {};
      ids.forEach((id) => (pb[id] = true));
      mutateSets((sets) => sets.map((st) => (st.id === s.id ? { ...st, printBlanks: pb } : st)));
    },
  };
});

/** Selector helper: the current set (falls back to the first). */
export function currentSet(s: Store): WordSet {
  return s.sets.find((x) => x.id === s.currentSetId) || s.sets[0];
}
