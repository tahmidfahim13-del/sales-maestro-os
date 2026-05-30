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

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDaily(day: number): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const s = await getSettings();
  if (!s.notifsEnabled) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SalesMaestroOS',
      body: `Day ${day}. What's your tier? Tap to check in.`,
      sound: true,
    },
    trigger: { hour: s.morningHour, minute: s.morningMin, repeats: true },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SalesMaestroOS',
      body: `Day ${day} audit. Did you do what you said?`,
      sound: true,
    },
    trigger: { hour: s.eveningHour, minute: s.eveningMin, repeats: true },
  });
}
