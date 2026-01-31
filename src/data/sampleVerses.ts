import { Translation } from '../constants/translations';

export type SampleVerse = {
  translation: Translation;
  book: number;
  chapter: number;
  verse: number;
  verseIndex: number;
  text: string;
};

const base = [
  { book: 1, chapter: 1, verse: 1, verseIndex: 1 },
  { book: 1, chapter: 1, verse: 2, verseIndex: 2 },
  { book: 1, chapter: 1, verse: 3, verseIndex: 3 },
  { book: 1, chapter: 1, verse: 4, verseIndex: 4 },
  { book: 1, chapter: 1, verse: 5, verseIndex: 5 },
  { book: 1, chapter: 1, verse: 6, verseIndex: 6 },
  { book: 1, chapter: 1, verse: 7, verseIndex: 7 },
  { book: 1, chapter: 1, verse: 8, verseIndex: 8 },
  { book: 1, chapter: 1, verse: 9, verseIndex: 9 },
  { book: 1, chapter: 1, verse: 10, verseIndex: 10 },
];

function build(translation: Translation): SampleVerse[] {
  return base.map((item) => ({
    ...item,
    translation,
    text: `Sample text for Genesis ${item.chapter}:${item.verse} (${translation}).`,
  }));
}

export const SAMPLE_VERSES: SampleVerse[] = [
  ...build('KJV'),
  ...build('ASV'),
  ...build('WEB'),
  ...build('DRA'),
];
