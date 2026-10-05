import type { DisplayMode } from './types';

/**
 * One or two teacher-facing lines per activity: how to run it in class (C3).
 * Keep these short, warm, and practical — American spelling.
 */
export const ACTIVITY_TIPS: Record<DisplayMode, string[]> = {
  grid: [
    'Point to a word and ask the class to say it, act it out, or use it in a sentence.',
    'Drag cards into groups as you talk, or switch to Stylized for a calm warm-up screen.',
  ],
  carousel: [
    'Great for choral reading: the class reads each word aloud as it appears.',
    'Use Images only and ask students to name the picture before the word shows.',
  ],
  reveal: [
    'Students guess the hidden word from the picture, then tap the card to check.',
    'Arrow keys or a clicker reveal the next card, so you can teach from anywhere in the room.',
  ],
  quiz: [
    'Split the class into teams. Teams take turns answering, and you award the points.',
    'Turn the timer off for younger learners, or shorten it for a fast review round.',
  ],
  missing: [
    'Ask students to close their eyes, hide a word, then ask: “Which word is missing?”',
    'Press R to show the answer, then hide another one.',
  ],
  flyswatter: [
    'Two students stand at the board. Call out a word — the first to swat it wins the point.',
    'Tap the swatted word to mark it, then award the point to that team.',
  ],
  matching: [
    'Teams take turns flipping two cards to find a pair. A match scores and keeps the turn.',
    'Ask the team to say the word aloud before you flip the second card.',
  ],
  sentence: [
    'Give pairs 30 seconds to make a sentence with the word, then share a few aloud.',
    'Show the clue or translation only if a group needs a little help.',
  ],
  wordday: [
    'Start the lesson with one word: say it, look at the picture, and guess the meaning.',
    'Reveal the meaning, then ask students to use the word at least once today.',
  ],
  category: [
    'Name the groups (like “Food” and “Drink”), then invite students up to sort a word.',
    'Ask “Why does it go there?” — talking about the choice is the real learning.',
  ],
  guess: [
    'Students call out letters while you tap them. Wrong letters fill a dot — no scary drawings.',
    'Stuck? Show the clue. Then ask a student to use the word in a sentence.',
  ],
  secret: [
    'One student peeks at the word while the class closes their eyes, then acts, draws, or describes it.',
    'Play in teams: the team that guesses first gets the next turn.',
  ],
  flashcards: [
    'Print, cut, and use for quick drills, memory games, or a “hold up the card” check.',
    'Print two sets on card stock for a matching game in pairs.',
  ],
  bingo: [
    'Read a clue or show a picture, and students cover the matching word.',
    'Print one card per student; Shuffle gives every card a new layout.',
  ],
  wordsearch: [
    'A calm early-finisher task. Ask students to use three found words in a sentence.',
    'Include the answer key for self-checking at the end.',
  ],
  crossword: [
    'Add a short clue to each word in Edit Set — the clues are what students solve.',
    'Works well in pairs: one reads the clue, the other writes.',
  ],
  spelling: [
    'Read each word aloud (and a short sentence) while students write it down.',
    'Picture prompts let students spell without hearing the word first.',
  ],
  scramble: [
    'Students unscramble each word. Show the word bank for extra support.',
    'Turn it into a race: the first pair to finish reads their answers aloud.',
  ],
  alpha: [
    'Students write each set of words in ABC order.',
    'Remind them: if the first letters match, look at the second letter.',
  ],
};
