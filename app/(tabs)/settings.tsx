import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useColorScheme } from 'react-native';

import { EmptyState } from '../../src/components/EmptyState';
import { getVerseCount, getStateValue, setStateValue } from '../../src/db';
import {
  disableReminders,
  getReminderSettings,
  requestNotificationPermission,
  scheduleDailyReminder,
  setReminderSettings,
} from '../../src/services/notifications';
import { syncConfigured, syncNow } from '../../src/services/sync';
import { getTheme, spacing } from '../../src/theme';

const TIME_OPTIONS = [
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '7:00 PM', hour: 19, minute: 0 },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [verseCount, setVerseCount] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      const count = await getVerseCount();
      setVerseCount(count);
      const reminder = await getReminderSettings();
      setReminderEnabled(reminder.enabled);
      setReminderHour(reminder.hour);
      setReminderMinute(reminder.minute);
      const lastSync = await getStateValue('last_sync_at');
      if (lastSync) {
        setSyncStatus(`Last sync: ${new Date(lastSync).toLocaleString()}`);
      }
    })();
  }, []);

  const updateReminder = async (enabled: boolean, hour = reminderHour, minute = reminderMinute) => {
    setReminderEnabled(enabled);
    setReminderHour(hour);
    setReminderMinute(minute);
    await setReminderSettings({ enabled, hour, minute });

    if (!enabled) {
      await disableReminders();
      return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) {
      setReminderEnabled(false);
      await setReminderSettings({ enabled: false, hour, minute });
      return;
    }
    await scheduleDailyReminder(hour, minute);
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncNow();
    setSyncing(false);
    if (result.ok) {
      const timestamp = new Date().toISOString();
      await setStateValue('last_sync_at', timestamp);
      setSyncStatus(`Last sync: ${new Date(timestamp).toLocaleString()}`);
    } else {
      setSyncStatus(result.message ?? 'Sync failed.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>Bible data</Text>
          {verseCount === 0 ? (
            <EmptyState
              title="No offline Bible data"
              message="Add a prebuilt database at /assets/bible.db to unlock the full library."
              theme={theme}
            />
          ) : (
            <Text style={[styles.bodyText, { color: theme.text }]}>
              {verseCount.toLocaleString()} verses available offline.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>Daily reminders</Text>
          <View style={styles.row}>
            <Text style={[styles.bodyText, { color: theme.text }]}>Enable reminder</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={(value) => updateReminder(value)}
              trackColor={{ false: theme.border, true: theme.accentSoft }}
              thumbColor={reminderEnabled ? theme.accent : theme.card}
            />
          </View>
          <View style={styles.timeGrid}>
            {TIME_OPTIONS.map((option) => {
              const selected = reminderHour === option.hour && reminderMinute === option.minute;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => updateReminder(true, option.hour, option.minute)}
                  style={({ pressed }) => [
                    styles.timeButton,
                    {
                      backgroundColor: selected ? theme.accent : theme.card,
                      borderColor: theme.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeLabel,
                      { color: selected ? theme.card : theme.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>Cloud sync</Text>
          {syncConfigured ? (
            <View style={styles.syncBlock}>
              <Text style={[styles.bodyText, { color: theme.text }]}>Sync bookmarks, highlights, and notes.</Text>
              <Pressable
                disabled={syncing}
                style={({ pressed }) => [
                  styles.syncButton,
                  {
                    backgroundColor: theme.accent,
                    opacity: pressed || syncing ? 0.75 : 1,
                  },
                ]}
                onPress={handleSync}
              >
                <Text style={[styles.syncText, { color: theme.card }]}>
                  {syncing ? 'Syncing...' : 'Sync now'}
                </Text>
              </Pressable>
              {syncStatus ? (
                <Text style={[styles.syncStatus, { color: theme.muted }]}>{syncStatus}</Text>
              ) : null}
            </View>
          ) : (
            <EmptyState
              title="Cloud sync not configured"
              message="Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable sync."
              theme={theme}
            />
          )}
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
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  bodyText: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  syncBlock: {
    gap: spacing.sm,
  },
  syncButton: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  syncText: {
    fontSize: 14,
    fontWeight: '600',
  },
  syncStatus: {
    fontSize: 12,
  },
});
