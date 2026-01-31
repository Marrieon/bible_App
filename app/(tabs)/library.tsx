import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { EmptyState } from '../../src/components/EmptyState';
import { getBookName } from '../../src/constants/books';
import { listBookmarks, listHighlights, listNotes } from '../../src/services/bible';
import { getTheme, spacing } from '../../src/theme';

export default function LibraryScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const isFocused = useIsFocused();
  const router = useRouter();

  type Bookmark = Awaited<ReturnType<typeof listBookmarks>>[number];
  type Highlight = Awaited<ReturnType<typeof listHighlights>>[number];
  type Note = Awaited<ReturnType<typeof listNotes>>[number];

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const load = async () => {
      const [nextBookmarks, nextHighlights, nextNotes] = await Promise.all([
        listBookmarks(),
        listHighlights(),
        listNotes(),
      ]);
      setBookmarks(nextBookmarks);
      setHighlights(nextHighlights);
      setNotes(nextNotes);
    };

    if (isFocused) {
      load();
    }
  }, [isFocused]);

  const hasContent = bookmarks.length || highlights.length || notes.length;

  const renderRow = (
    item: { translation: string; verse_index: number; book: number; chapter: number; verse: number },
    accent?: string
  ) => {
    const reference = `${getBookName(item.book)} ${item.chapter}:${item.verse}`;
    return (
      <Pressable
        key={`${item.translation}-${item.verse_index}`}
        onPress={() =>
          router.push({
            pathname: '/verse/[verseIndex]',
            params: { verseIndex: String(item.verse_index), translation: item.translation },
          })
        }
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View>
          <Text style={[styles.reference, { color: theme.text }]}>{reference}</Text>
          <Text style={[styles.translation, { color: theme.muted }]}>{item.translation}</Text>
        </View>
        {accent ? <View style={[styles.accentDot, { backgroundColor: accent }]} /> : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Library</Text>
        {!hasContent ? (
          <EmptyState
            title="No saved items yet"
            message="Bookmark, highlight, or add notes to verses and they will appear here."
            theme={theme}
          />
        ) : (
          <View style={styles.sections}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.muted }]}>Bookmarks</Text>
              {bookmarks.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.muted }]}>No bookmarks yet.</Text>
              ) : (
                bookmarks.map((item) => renderRow(item))
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.muted }]}>Highlights</Text>
              {highlights.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.muted }]}>No highlights yet.</Text>
              ) : (
                highlights.map((item) => renderRow(item, item.color))
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.muted }]}>Notes</Text>
              {notes.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.muted }]}>No notes yet.</Text>
              ) : (
                notes.map((item) => (
                  <Pressable
                    key={`${item.translation}-${item.verse_index}`}
                    onPress={() =>
                      router.push({
                        pathname: '/verse/[verseIndex]',
                        params: {
                          verseIndex: String(item.verse_index),
                          translation: item.translation,
                          focusNote: '1',
                        },
                      })
                    }
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={styles.noteBlock}>
                      <Text style={[styles.reference, { color: theme.text }]}
                      >{`${getBookName(item.book)} ${item.chapter}:${item.verse}`}</Text>
                      <Text style={[styles.noteText, { color: theme.muted }]} numberOfLines={2}>
                        {item.text}
                      </Text>
                    </View>
                    <Text style={[styles.translation, { color: theme.muted }]}>{item.translation}</Text>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  sections: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reference: {
    fontSize: 14,
    fontWeight: '600',
  },
  translation: {
    fontSize: 12,
  },
  accentDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  noteBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  noteText: {
    fontSize: 12,
  },
});
