import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme, radius, spacing } from '../theme';

type Props = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  theme: Theme;
};

export function EmptyState({ title, message, actionLabel, onAction, theme }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.accent,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={onAction}
        >
          <Text style={[styles.buttonText, { color: theme.card }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
