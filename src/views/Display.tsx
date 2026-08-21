import { useStore } from '../store';
import { WordWall } from '../activities/WordWall';
import { Carousel } from '../activities/Carousel';
import { Reveal } from '../activities/Reveal';
import { Quiz } from '../activities/Quiz';
import { MissingWord } from '../activities/MissingWord';
import { Flyswatter } from '../activities/Flyswatter';
import { SheetWorkspace } from '../sheets/SheetWorkspace';

export function Display() {
  const mode = useStore((s) => s.displayMode);
  switch (mode) {
    case 'grid':
      return <WordWall />;
    case 'carousel':
      return <Carousel />;
    case 'reveal':
      return <Reveal />;
    case 'quiz':
      return <Quiz />;
    case 'missing':
      return <MissingWord />;
    case 'flyswatter':
      return <Flyswatter />;
    case 'bingo':
    case 'flashcards':
    case 'wordsearch':
    case 'crossword':
      return <SheetWorkspace />;
    default:
      return null;
  }
}
