import * as Notifications from 'expo-notifications';

import { getStateValue, setStateValue } from '../db';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DEFAULT_HOUR = 8;
const DEFAULT_MINUTE = 0;

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export async function getReminderSettings(): Promise<ReminderSettings> {
  const enabled = (await getStateValue('reminder_enabled')) === 'true';
  const hour = Number(await getStateValue('reminder_hour')) || DEFAULT_HOUR;
  const minute = Number(await getStateValue('reminder_minute')) || DEFAULT_MINUTE;
  return { enabled, hour, minute };
}

export async function setReminderSettings(settings: ReminderSettings) {
  await setStateValue('reminder_enabled', String(settings.enabled));
  await setStateValue('reminder_hour', String(settings.hour));
  await setStateValue('reminder_minute', String(settings.minute));
}

export async function requestNotificationPermission() {
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) {
    return true;
  }
  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Bible Reading',
      body: 'Your 10 verses are ready for today.',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function disableReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
