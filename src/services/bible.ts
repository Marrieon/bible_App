import { Translation } from '../constants/translations';
import { getBookName } from '../constants/books';
import {
  getAllAsync,
  getFirstAsync,
  getStateValue,
  runAsync,
  setStateValue,
  VerseRow,
} from '../db';

const DAILY_COUNT = 10;

export type Verse = {
  translation: Translation;
  book: number;
  chapter: number;
  verse: number;
  verseIndex: number;
  text: string;
};

export type VerseInteraction = {
  bookmarked: Set<number>;
  highlights: Map<number, string>;
  notes: Map<number, string>;
};

export type DailyReading = {
  verses: Verse[];
  startIndex: number;
  endIndex: number;
  dayNumber: number;
  totalVerses: number;
};

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function daysBetween(start: Date, end: Date) {
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.floor((endTime - startTime) / 86400000);
}

function buildInClause(length: number) {
  return `(${new Array(length).fill('?').join(',')})`;
}

function mapVerse(row: VerseRow): Verse {
  return {
    translation: row.translation as Translation,
    book: row.book,
    chapter: row.chapter,
    verse: row.verse,
    verseIndex: row.verse_index,
    text: row.text,
  };
}

export function formatReference(verse: Pick<Verse, 'book' | 'chapter' | 'verse'>) {
  return `${getBookName(verse.book)} ${verse.chapter}:${verse.verse}`;
}

export async function getDailyReading(translation: Translation): Promise<DailyReading> {
  const todayKey = toDateKey();
  let startDate = await getStateValue('plan_start_date');
  let startIndex = Number(await getStateValue('plan_start_index')) || 1;

  if (!startDate) {
    startDate = todayKey;
    await setStateValue('plan_start_date', startDate);
    await setStateValue('plan_start_index', String(startIndex));
  }

  const daysElapsed = Math.max(0, daysBetween(dateFromKey(startDate), new Date()));
  const start = startIndex + daysElapsed * DAILY_COUNT;
  const end = start + DAILY_COUNT - 1;

  const totalRow = await getFirstAsync<{ total: number }>(
    'SELECT MAX(verse_index) as total FROM verses WHERE translation = ?;',
    [translation]
  );
  const totalVerses = totalRow?.total ?? 0;
  const endClamped = totalVerses > 0 ? Math.min(end, totalVerses) : end;

  const rows = await getAllAsync<VerseRow>(
    `SELECT translation, book, chapter, verse, verse_index, text
     FROM verses
     WHERE translation = ? AND verse_index BETWEEN ? AND ?
     ORDER BY verse_index ASC;`,
    [translation, start, endClamped]
  );

  return {
    verses: rows.map(mapVerse),
    startIndex: start,
    endIndex: endClamped,
    dayNumber: Math.floor((start - startIndex) / DAILY_COUNT) + 1,
    totalVerses,
  };
}

export async function searchVerses(query: string, translation: Translation) {
  if (!query.trim()) {
    return [] as Verse[];
  }
  const like = `%${query.trim()}%`;
  const rows = await getAllAsync<VerseRow>(
    `SELECT translation, book, chapter, verse, verse_index, text
     FROM verses
     WHERE translation = ? AND text LIKE ? COLLATE NOCASE
     ORDER BY verse_index ASC
     LIMIT 100;`,
    [translation, like]
  );
  return rows.map(mapVerse);
}

export async function getVerseByIndex(translation: Translation, verseIndex: number) {
  const row = await getFirstAsync<VerseRow>(
    `SELECT translation, book, chapter, verse, verse_index, text
     FROM verses
     WHERE translation = ? AND verse_index = ?;`,
    [translation, verseIndex]
  );
  return row ? mapVerse(row) : null;
}

export async function getInteractions(
  translation: Translation,
  verseIndices: number[]
): Promise<VerseInteraction> {
  const interactions: VerseInteraction = {
    bookmarked: new Set(),
    highlights: new Map(),
    notes: new Map(),
  };

  if (!verseIndices.length) {
    return interactions;
  }

  const clause = buildInClause(verseIndices.length);

  const bookmarkRows = await getAllAsync<{ verse_index: number }>(
    `SELECT verse_index FROM bookmarks WHERE translation = ? AND verse_index IN ${clause};`,
    [translation, ...verseIndices]
  );
  bookmarkRows.forEach((row) => interactions.bookmarked.add(row.verse_index));

  const highlightRows = await getAllAsync<{ verse_index: number; color: string }>(
    `SELECT verse_index, color FROM highlights WHERE translation = ? AND verse_index IN ${clause};`,
    [translation, ...verseIndices]
  );
  highlightRows.forEach((row) => interactions.highlights.set(row.verse_index, row.color));

  const noteRows = await getAllAsync<{ verse_index: number; text: string }>(
    `SELECT verse_index, text FROM notes WHERE translation = ? AND verse_index IN ${clause};`,
    [translation, ...verseIndices]
  );
  noteRows.forEach((row) => interactions.notes.set(row.verse_index, row.text));

  return interactions;
}

export async function toggleBookmark(verse: Verse) {
  const existing = await getFirstAsync<{ id: number }>(
    'SELECT id FROM bookmarks WHERE translation = ? AND verse_index = ?;',
    [verse.translation, verse.verseIndex]
  );

  if (existing) {
    await runAsync('DELETE FROM bookmarks WHERE id = ?;', [existing.id]);
    return false;
  }

  await runAsync(
    `INSERT OR REPLACE INTO bookmarks
      (translation, verse_index, book, chapter, verse, created_at)
      VALUES (?, ?, ?, ?, ?, ?);`,
    [
      verse.translation,
      verse.verseIndex,
      verse.book,
      verse.chapter,
      verse.verse,
      new Date().toISOString(),
    ]
  );
  return true;
}

export async function setHighlight(verse: Verse, color: string | null) {
  if (!color) {
    await runAsync(
      'DELETE FROM highlights WHERE translation = ? AND verse_index = ?;',
      [verse.translation, verse.verseIndex]
    );
    return null;
  }

  await runAsync(
    `INSERT OR REPLACE INTO highlights
      (translation, verse_index, book, chapter, verse, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      verse.translation,
      verse.verseIndex,
      verse.book,
      verse.chapter,
      verse.verse,
      color,
      new Date().toISOString(),
    ]
  );
  return color;
}

export async function saveNote(verse: Verse, text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    await runAsync('DELETE FROM notes WHERE translation = ? AND verse_index = ?;', [
      verse.translation,
      verse.verseIndex,
    ]);
    return null;
  }

  const now = new Date().toISOString();
  await runAsync(
    `INSERT OR REPLACE INTO notes
      (translation, verse_index, book, chapter, verse, text, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      verse.translation,
      verse.verseIndex,
      verse.book,
      verse.chapter,
      verse.verse,
      trimmed,
      now,
      now,
    ]
  );
  return trimmed;
}

export async function listBookmarks() {
  return getAllAsync<{
    translation: Translation;
    verse_index: number;
    book: number;
    chapter: number;
    verse: number;
    created_at: string;
  }>(
    'SELECT translation, verse_index, book, chapter, verse, created_at FROM bookmarks ORDER BY created_at DESC;'
  );
}

export async function listHighlights() {
  return getAllAsync<{
    translation: Translation;
    verse_index: number;
    book: number;
    chapter: number;
    verse: number;
    color: string;
    created_at: string;
  }>(
    'SELECT translation, verse_index, book, chapter, verse, color, created_at FROM highlights ORDER BY created_at DESC;'
  );
}

export async function listNotes() {
  return getAllAsync<{
    translation: Translation;
    verse_index: number;
    book: number;
    chapter: number;
    verse: number;
    text: string;
    updated_at: string;
  }>(
    'SELECT translation, verse_index, book, chapter, verse, text, updated_at FROM notes ORDER BY updated_at DESC;'
  );
}
