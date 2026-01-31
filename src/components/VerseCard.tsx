import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Verse } from '../services/bible';
import { Theme, radius, spacing } from '../theme';

type Props = {
  verse: Verse;
  reference: string;
  bookmarked: boolean;
  highlightColor?: string;
  hasNote: boolean;
  onOpen: () => void;
  onToggleBookmark: () => void;
  onToggleHighlight: () => void;
  onOpenNote: () => void;
  theme: Theme;
};

export function VerseCard({
  verse,
  reference,
  bookmarked,
  highlightColor,
  hasNote,
  onOpen,
  onToggleBookmark,
  onToggleHighlight,
  onOpenNote,
  theme,
}: Props) {
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: highlightColor ?? theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={[styles.reference, { color: theme.accent }]}>{reference}</Text>
      <Text style={[styles.text, { color: theme.text }]}>{verse.text}</Text>
      <View style={styles.actions}>
        <Pressable onPress={onToggleBookmark} hitSlop={8}>
          <MaterialCommunityIcons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={bookmarked ? theme.accent : theme.muted}
          />
        </Pressable>
        <Pressable onPress={onToggleHighlight} hitSlop={8}>
          <MaterialCommunityIcons
            name={highlightColor ? 'marker' : 'marker-outline'}
            size={20}
            color={highlightColor ? theme.accent : theme.muted}
          />
        </Pressable>
        <Pressable onPress={onOpenNote} hitSlop={8}>
          <MaterialCommunityIcons
            name={hasNote ? 'note-text' : 'note-text-outline'}
            size={20}
            color={hasNote ? theme.accent : theme.muted}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  reference: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
});
