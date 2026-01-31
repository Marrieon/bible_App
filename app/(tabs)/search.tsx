import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { EmptyState } from '../../src/components/EmptyState';
import { TranslationPicker } from '../../src/components/TranslationPicker';
import { VerseCard } from '../../src/components/VerseCard';
import { Translation, isTranslation } from '../../src/constants/translations';
import { getStateValue, setStateValue } from '../../src/db';
import {
  Verse,
  formatReference,
  getInteractions,
  searchVerses,
  setHighlight,
  toggleBookmark,
} from '../../src/services/bible';
import { getTheme, spacing } from '../../src/theme';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const isFocused = useIsFocused();
  const router = useRouter();

  const [translation, setTranslation] = useState<Translation>('KJV');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState({
    bookmarked: new Set<number>(),
    highlights: new Map<number, string>(),
    notes: new Map<number, string>(),
  });

  useEffect(() => {
    (async () => {
      const saved = await getStateValue('preferred_translation');
      if (saved && isTranslation(saved)) {
        setTranslation(saved);
      }
    })();
  }, []);

  const runSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setInteractions({
        bookmarked: new Set(),
        highlights: new Map(),
        notes: new Map(),
      });
      return;
    }
    setLoading(true);
    const matches = await searchVerses(query, translation);
    setResults(matches);
    const indices = matches.map((verse) => verse.verseIndex);
    const nextInteractions = await getInteractions(translation, indices);
    setInteractions(nextInteractions);
    setLoading(false);
  }, [query, translation]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }
    const timer = setTimeout(() => {
      runSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, translation, isFocused, runSearch]);

  const handleSelectTranslation = async (value: Translation) => {
    setTranslation(value);
    await setStateValue('preferred_translation', value);
  };

  const renderVerse = (verse: Verse) => (
    <VerseCard
      key={`${verse.translation}-${verse.verseIndex}`}
      verse={verse}
      reference={formatReference(verse)}
      bookmarked={interactions.bookmarked.has(verse.verseIndex)}
      highlightColor={interactions.highlights.get(verse.verseIndex)}
      hasNote={interactions.notes.has(verse.verseIndex)}
      onOpen={() => {
        router.push({
          pathname: '/verse/[verseIndex]',
          params: { verseIndex: String(verse.verseIndex), translation },
        });
      }}
      onToggleBookmark={async () => {
        await toggleBookmark(verse);
        await runSearch();
      }}
      onToggleHighlight={async () => {
        const next = interactions.highlights.get(verse.verseIndex) ? null : theme.highlight;
        await setHighlight(verse, next);
        await runSearch();
      }}
      onOpenNote={() => {
        router.push({
          pathname: '/verse/[verseIndex]',
          params: { verseIndex: String(verse.verseIndex), translation, focusNote: '1' },
        });
      }}
      theme={theme}
    />
  );

  const emptyMessage = useMemo(() => {
    if (!query.trim()) {
      return 'Search any word or phrase to find matching verses.';
    }
    return 'No verses matched your search.';
  }, [query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Search</Text>
          <Pressable
            style={({ pressed }) => [
              styles.translationPill,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => setPickerVisible(true)}
          >
            <Text style={[styles.translationText, { color: theme.text }]}>{translation}</Text>
          </Pressable>
        </View>

        <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.card }]}> 
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search verses"
            placeholderTextColor={theme.muted}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
        </View>

        {loading ? (
          <Text style={[styles.loading, { color: theme.muted }]}>Searching...</Text>
        ) : results.length === 0 ? (
          <EmptyState title="Search the Bible" message={emptyMessage} theme={theme} />
        ) : (
          <View style={styles.results}>{results.map(renderVerse)}</View>
        )}
      </ScrollView>

      <TranslationPicker
        visible={pickerVisible}
        selected={translation}
        onSelect={handleSelectTranslation}
        onClose={() => setPickerVisible(false)}
        theme={theme}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  translationPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  translationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    fontSize: 16,
  },
  loading: {
    fontSize: 14,
  },
  results: {
    gap: spacing.md,
  },
});
