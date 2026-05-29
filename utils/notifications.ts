import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSettings } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotifications(day: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SalesMaestroOS',
      body: `Day ${day}. What's your tier today? Tap to check in.`,
      sound: true,
    },
    trigger: {
      hour: settings.morningNotifHour,
      minute: settings.morningNotifMinute,
      repeats: true,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SalesMaestroOS',
      body: `Day ${day} audit. Did you do what you said?`,
      sound: true,
    },
    trigger: {
      hour: settings.eveningNotifHour,
      minute: settings.eveningNotifMinute,
      repeats: true,
    },
  });
}
