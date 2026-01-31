import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { EmptyState } from '../../src/components/EmptyState';
import { TranslationPicker } from '../../src/components/TranslationPicker';
import { VerseCard } from '../../src/components/VerseCard';
import { Translation, isTranslation } from '../../src/constants/translations';
import { getVerseCount, getStateValue, seedSampleData, setStateValue } from '../../src/db';
import {
  DailyReading,
  Verse,
  formatReference,
  getDailyReading,
  getInteractions,
  setHighlight,
  toggleBookmark,
} from '../../src/services/bible';
import { getTheme, spacing } from '../../src/theme';

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const isFocused = useIsFocused();
  const router = useRouter();

  const [translation, setTranslation] = useState<Translation>('KJV');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [verseCount, setVerseCount] = useState(0);
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

  const loadReading = useCallback(async () => {
    setLoading(true);
    const count = await getVerseCount();
    setVerseCount(count);

    if (count === 0) {
      setReading(null);
      setLoading(false);
      return;
    }

    const daily = await getDailyReading(translation);
    setReading(daily);
    const indices = daily.verses.map((verse) => verse.verseIndex);
    const nextInteractions = await getInteractions(translation, indices);
    setInteractions(nextInteractions);
    setLoading(false);
  }, [translation]);

  useEffect(() => {
    if (isFocused) {
      loadReading();
    }
  }, [isFocused, loadReading]);

  const handleSelectTranslation = async (value: Translation) => {
    setTranslation(value);
    await setStateValue('preferred_translation', value);
  };

  const handleLoadSample = async () => {
    await seedSampleData();
    await loadReading();
  };

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

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
        await loadReading();
      }}
      onToggleHighlight={async () => {
        const next = interactions.highlights.get(verse.verseIndex) ? null : theme.highlight;
        await setHighlight(verse, next);
        await loadReading();
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: theme.muted }]}>Daily reading</Text>
            <Text style={[styles.title, { color: theme.text }]}>{todayLabel}</Text>
          </View>
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

        {loading ? (
          <Text style={[styles.loading, { color: theme.muted }]}>Loading...</Text>
        ) : verseCount === 0 ? (
          <EmptyState
            title="Bible data not found"
            message="Add an offline Bible database to /assets/bible.db or load the sample data to preview the app."
            actionLabel="Load sample data"
            onAction={handleLoadSample}
            theme={theme}
          />
        ) : reading ? (
          <View style={styles.readingBlock}>
            <View style={styles.readingMeta}>
              <Text style={[styles.metaText, { color: theme.muted }]}>Day {reading.dayNumber}</Text>
              <Text style={[styles.metaText, { color: theme.muted }]}>Verses {reading.startIndex}-{reading.endIndex} of {reading.totalVerses}</Text>
            </View>
            <View style={styles.verseList}>{reading.verses.map(renderVerse)}</View>
          </View>
        ) : (
          <EmptyState
            title="No verses yet"
            message="Your Bible data loaded but there are no verses in the database."
            theme={theme}
          />
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
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: '600',
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
  loading: {
    fontSize: 14,
  },
  readingBlock: {
    gap: spacing.md,
  },
  readingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verseList: {
    gap: spacing.md,
  },
});
