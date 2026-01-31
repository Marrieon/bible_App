import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Translation, isTranslation } from '../../src/constants/translations';
import { getStateValue } from '../../src/db';
import {
  Verse,
  formatReference,
  getInteractions,
  getVerseByIndex,
  saveNote,
  setHighlight,
  toggleBookmark,
} from '../../src/services/bible';
import { getTheme, spacing } from '../../src/theme';

const HIGHLIGHT_OPTIONS = ['#F9E1B5', '#F4C7B3', '#BFE3D0', '#C7D7F4'];

export default function VerseDetailScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const params = useLocalSearchParams();

  const [verse, setVerse] = useState<Verse | null>(null);
  const [translation, setTranslation] = useState<Translation>('KJV');
  const [bookmarked, setBookmarked] = useState(false);
  const [highlightColor, setHighlightColor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const noteRef = useRef<TextInput>(null);

  const verseIndex = useMemo(() => {
    const raw = params.verseIndex;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value ? Number(value) : 0;
  }, [params.verseIndex]);

  useEffect(() => {
    (async () => {
      const paramTranslation = Array.isArray(params.translation)
        ? params.translation[0]
        : params.translation;
      if (paramTranslation && isTranslation(paramTranslation)) {
        setTranslation(paramTranslation);
      } else {
        const saved = await getStateValue('preferred_translation');
        if (saved && isTranslation(saved)) {
          setTranslation(saved);
        }
      }
    })();
  }, [params.translation]);

  useEffect(() => {
    const load = async () => {
      if (!verseIndex || !translation) {
        return;
      }
      const data = await getVerseByIndex(translation, verseIndex);
      setVerse(data);
      if (!data) {
        return;
      }
      const interactions = await getInteractions(translation, [data.verseIndex]);
      setBookmarked(interactions.bookmarked.has(data.verseIndex));
      setHighlightColor(interactions.highlights.get(data.verseIndex) ?? null);
      setNote(interactions.notes.get(data.verseIndex) ?? '');
    };

    load();
  }, [translation, verseIndex]);

  useEffect(() => {
    const focus = Array.isArray(params.focusNote) ? params.focusNote[0] : params.focusNote;
    if (focus === '1') {
      setTimeout(() => noteRef.current?.focus(), 250);
    }
  }, [params.focusNote]);

  if (!verse) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <Text style={[styles.loading, { color: theme.muted }]}>Loading verse...</Text>
      </View>
    );
  }

  const handleBookmark = async () => {
    const next = await toggleBookmark(verse);
    setBookmarked(next);
  };

  const handleHighlight = async (color: string | null) => {
    const next = await setHighlight(verse, color);
    setHighlightColor(next);
  };

  const handleSaveNote = async () => {
    setSaving(true);
    const saved = await saveNote(verse, note);
    setNote(saved ?? '');
    setSaving(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.reference, { color: theme.accent }]}>{formatReference(verse)}</Text>
          <Text style={[styles.text, { color: theme.text }]}>{verse.text}</Text>
          <View style={styles.toolbar}>
            <Pressable onPress={handleBookmark} hitSlop={8}>
              <MaterialCommunityIcons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={bookmarked ? theme.accent : theme.muted}
              />
            </Pressable>
            <Text style={[styles.translation, { color: theme.muted }]}>{translation}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>Highlight</Text>
          <View style={styles.highlightRow}>
            <Pressable
              onPress={() => handleHighlight(null)}
              style={({ pressed }) => [
                styles.highlightOption,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.clearLabel, { color: theme.muted }]}>Clear</Text>
            </Pressable>
            {HIGHLIGHT_OPTIONS.map((color) => (
              <Pressable
                key={color}
                onPress={() => handleHighlight(color)}
                style={({ pressed }) => [
                  styles.highlightOption,
                  {
                    backgroundColor: color,
                    borderColor: highlightColor === color ? theme.accent : theme.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>Notes</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Write your thoughts here..."
            placeholderTextColor={theme.muted}
            multiline
            ref={noteRef}
            style={[
              styles.noteInput,
              {
                borderColor: theme.border,
                backgroundColor: theme.card,
                color: theme.text,
              },
            ]}
          />
          <Pressable
            onPress={handleSaveNote}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: theme.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.saveText, { color: theme.card }]}>
              {saving ? 'Saving...' : 'Save note'}
            </Text>
          </Pressable>
        </View>
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
  loading: {
    padding: spacing.lg,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  reference: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  text: {
    fontSize: 18,
    lineHeight: 26,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  translation: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  highlightOption: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearLabel: {
    fontSize: 10,
  },
  noteInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    fontSize: 14,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
