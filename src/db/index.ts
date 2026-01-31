import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as SQLite from 'expo-sqlite';

import { SAMPLE_VERSES } from '../data/sampleVerses';

const DB_NAME = 'bible.db';
const DB_DIR = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}SQLite`
  : null;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export type VerseRow = {
  id: number;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  verse_index: number;
  text: string;
};

export type BookmarkRow = {
  id: number;
  translation: string;
  verse_index: number;
  book: number;
  chapter: number;
  verse: number;
  created_at: string;
};

export type HighlightRow = {
  id: number;
  translation: string;
  verse_index: number;
  book: number;
  chapter: number;
  verse: number;
  color: string;
  created_at: string;
};

export type NoteRow = {
  id: number;
  translation: string;
  verse_index: number;
  book: number;
  chapter: number;
  verse: number;
  text: string;
  created_at: string;
  updated_at: string;
};

async function ensureDbAsset() {
  if (!DB_DIR) {
    return;
  }

  await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true });
  const dbPath = `${DB_DIR}/${DB_NAME}`;
  const dbInfo = await FileSystem.getInfoAsync(dbPath);
  if (dbInfo.exists) {
    return;
  }

  const asset = Asset.fromModule(require('../../assets/bible.db'));
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Bible database asset missing.');
  }

  await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
}

async function openDatabase() {
  await ensureDbAsset();
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrate(db);
  return db;
}

export async function getDbAsync() {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}

export async function runAsync(sql: string, params: SQLite.SQLiteBindParams = []) {
  const db = await getDbAsync();
  return db.runAsync(sql, params);
}

export async function getAllAsync<T>(sql: string, params: SQLite.SQLiteBindParams = []) {
  const db = await getDbAsync();
  return db.getAllAsync<T>(sql, params);
}

export async function getFirstAsync<T>(sql: string, params: SQLite.SQLiteBindParams = []) {
  const db = await getDbAsync();
  return db.getFirstAsync<T>(sql, params);
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      translation TEXT NOT NULL,
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      verse_index INTEGER NOT NULL,
      text TEXT NOT NULL
    );`
  );
  await db.execAsync(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_verses_unique ON verses(translation, verse_index);'
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_verses_ref ON verses(translation, book, chapter, verse);'
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      translation TEXT NOT NULL,
      verse_index INTEGER NOT NULL,
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(translation, verse_index)
    );`
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      translation TEXT NOT NULL,
      verse_index INTEGER NOT NULL,
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(translation, verse_index)
    );`
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      translation TEXT NOT NULL,
      verse_index INTEGER NOT NULL,
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(translation, verse_index)
    );`
  );

  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`
  );
}

export async function getVerseCount() {
  const row = await getFirstAsync<{ count: number }>('SELECT COUNT(1) as count FROM verses;');
  return row?.count ?? 0;
}

export async function seedSampleData() {
  const now = new Date().toISOString();

  for (const verse of SAMPLE_VERSES) {
    await runAsync(
      `INSERT OR IGNORE INTO verses
      (translation, book, chapter, verse, verse_index, text)
      VALUES (?, ?, ?, ?, ?, ?);`,
      [
        verse.translation,
        verse.book,
        verse.chapter,
        verse.verse,
        verse.verseIndex,
        verse.text,
      ]
    );
  }

  await setStateValue('sample_seeded_at', now);
}

export async function getStateValue(key: string) {
  const row = await getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?;', [key]);
  return row?.value ?? null;
}

export async function setStateValue(key: string, value: string) {
  await runAsync('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?);', [key, value]);
}
