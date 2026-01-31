import { createClient } from '@supabase/supabase-js';

import { listBookmarks, listHighlights, listNotes } from './bible';
import { runAsync } from '../db';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const syncConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = syncConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

async function ensureSession() {
  if (!supabase) {
    return { ok: false, message: 'Supabase not configured.' };
  }
  const session = await supabase.auth.getSession();
  if (session.data.session) {
    return { ok: true, userId: session.data.session.user.id } as const;
  }

  const signIn = await supabase.auth.signInAnonymously();
  if (signIn.error || !signIn.data.session) {
    return { ok: false, message: signIn.error?.message ?? 'Failed to sign in.' } as const;
  }

  return { ok: true, userId: signIn.data.session.user.id } as const;
}

export async function syncNow() {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured yet.' } as const;
  }

  const session = await ensureSession();
  if (!session.ok) {
    return session;
  }

  const userId = session.userId;
  const [bookmarks, highlights, notes] = await Promise.all([
    listBookmarks(),
    listHighlights(),
    listNotes(),
  ]);

  const bookmarkUpsert = await supabase.from('bookmarks').upsert(
    bookmarks.map((item) => ({
      user_id: userId,
      translation: item.translation,
      verse_index: item.verse_index,
      book: item.book,
      chapter: item.chapter,
      verse: item.verse,
      created_at: item.created_at,
    })),
    { onConflict: 'user_id,translation,verse_index' }
  );
  if (bookmarkUpsert.error) {
    return { ok: false, message: bookmarkUpsert.error.message } as const;
  }

  const highlightUpsert = await supabase.from('highlights').upsert(
    highlights.map((item) => ({
      user_id: userId,
      translation: item.translation,
      verse_index: item.verse_index,
      book: item.book,
      chapter: item.chapter,
      verse: item.verse,
      color: item.color,
      created_at: item.created_at,
    })),
    { onConflict: 'user_id,translation,verse_index' }
  );
  if (highlightUpsert.error) {
    return { ok: false, message: highlightUpsert.error.message } as const;
  }

  const noteUpsert = await supabase.from('notes').upsert(
    notes.map((item) => ({
      user_id: userId,
      translation: item.translation,
      verse_index: item.verse_index,
      book: item.book,
      chapter: item.chapter,
      verse: item.verse,
      text: item.text,
      updated_at: item.updated_at,
    })),
    { onConflict: 'user_id,translation,verse_index' }
  );
  if (noteUpsert.error) {
    return { ok: false, message: noteUpsert.error.message } as const;
  }

  const remoteBookmarks = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId);
  if (remoteBookmarks.error) {
    return { ok: false, message: remoteBookmarks.error.message } as const;
  }

  const remoteHighlights = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', userId);
  if (remoteHighlights.error) {
    return { ok: false, message: remoteHighlights.error.message } as const;
  }

  const remoteNotes = await supabase.from('notes').select('*').eq('user_id', userId);
  if (remoteNotes.error) {
    return { ok: false, message: remoteNotes.error.message } as const;
  }

  if (remoteBookmarks.data) {
    for (const item of remoteBookmarks.data) {
      await runAsync(
        `INSERT OR REPLACE INTO bookmarks
          (translation, verse_index, book, chapter, verse, created_at)
          VALUES (?, ?, ?, ?, ?, ?);`,
        [item.translation, item.verse_index, item.book, item.chapter, item.verse, item.created_at]
      );
    }
  }

  if (remoteHighlights.data) {
    for (const item of remoteHighlights.data) {
      await runAsync(
        `INSERT OR REPLACE INTO highlights
          (translation, verse_index, book, chapter, verse, color, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          item.translation,
          item.verse_index,
          item.book,
          item.chapter,
          item.verse,
          item.color,
          item.created_at,
        ]
      );
    }
  }

  if (remoteNotes.data) {
    for (const item of remoteNotes.data) {
      await runAsync(
        `INSERT OR REPLACE INTO notes
          (translation, verse_index, book, chapter, verse, text, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          item.translation,
          item.verse_index,
          item.book,
          item.chapter,
          item.verse,
          item.text,
          item.created_at ?? item.updated_at,
          item.updated_at,
        ]
      );
    }
  }

  return { ok: true } as const;
}
