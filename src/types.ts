// Core data model. Follows the authoritative prototype: tiers are
// key / normal / bonus (the README's shorthand `key | extra` predates the
// three-tier system the prototype actually ships).

export type Tier = 'key' | 'normal' | 'bonus';

export interface Word {
  /** Stable id; also the image-slot key (`slot-<id>`). */
  id: string;
  /** The vocabulary word. */
  text: string;
  /** Definition / riddle — surfaced in the crossword. */
  clue?: string;
  /** Optional translation gloss shown in the editor seed data. */
  gloss?: string;
  tier: Tier;
  /** Optional per-word accent color (Word Wall / stylized). */
  color?: string | null;
  /** Teacher marked this word as having recorded audio. */
  audioRecorded?: boolean;
}

export type Voice = 'us' | 'uk';
export type PrintMode = 'manual' | 'random';

export interface WordSet {
  id: string;
  /** Shown in all worksheet headers. */
  name: string;
  words: Word[];
  /** Seconds per card in the Carousel. */
  carouselSpeed: number;
  theme?: string;
  gradeLevel?: string;
  tags?: string[];
  ttsVoice?: Voice;
  /** Word Wall drag positions, keyed by word id. */
  positions?: Record<string, { x: number; y: number }>;
  /** Word Wall per-card scale, keyed by word id. */
  cardScale?: Record<string, number>;
  /** Word-bank handout: which words are blanked for students to fill. */
  printBlanks?: Record<string, boolean>;
  printMode?: PrintMode;
  printRandomPercent?: number;
}

export type View = 'home' | 'library' | 'editor' | 'display';

export type DisplayMode =
  | 'grid'
  | 'carousel'
  | 'reveal'
  | 'quiz'
  | 'missing'
  | 'flyswatter'
  | 'flashcards'
  | 'bingo'
  | 'wordsearch'
  | 'crossword';

export type StylePreset = 'card' | 'stylized';
export type ContentMode = 'both' | 'wordOnly' | 'imageOnly';

/** The four PRINT worksheet kinds. */
export const SHEET_KINDS: DisplayMode[] = ['bingo', 'flashcards', 'wordsearch', 'crossword'];
