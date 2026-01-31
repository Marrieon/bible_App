import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { TRANSLATIONS, TRANSLATION_LABELS, Translation } from '../constants/translations';
import { Theme, radius, spacing } from '../theme';

type Props = {
  visible: boolean;
  selected: Translation;
  onSelect: (value: Translation) => void;
  onClose: () => void;
  theme: Theme;
};

export function TranslationPicker({ visible, selected, onSelect, onClose, theme }: Props) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Text style={[styles.title, { color: theme.text }]}>Choose Translation</Text>
          {TRANSLATIONS.map((translation) => (
            <Pressable
              key={translation}
              onPress={() => {
                onSelect(translation);
                onClose();
              }}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor:
                    translation === selected
                      ? theme.accentSoft
                      : pressed
                      ? theme.highlight
                      : 'transparent',
                },
              ]}
            >
              <Text style={[styles.optionText, { color: theme.text }]}>{translation}</Text>
              <Text style={[styles.optionLabel, { color: theme.muted }]}>
                {TRANSLATION_LABELS[translation]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionLabel: {
    fontSize: 12,
  },
});
