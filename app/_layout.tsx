import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {});
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.primaryText,
          headerTitleStyle: { fontFamily: 'monospace', letterSpacing: 1 },
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ headerShown: false }} />
        <Stack.Screen name="reentry" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="morning" options={{ title: 'Morning Check-In' }} />
        <Stack.Screen name="evening" options={{ title: 'Evening Audit' }} />
        <Stack.Screen name="braindump" options={{ title: 'Brain Dump' }} />
        <Stack.Screen name="roleplay" options={{ title: 'Roleplay' }} />
        <Stack.Screen name="weekly" options={{ title: 'Weekly Review' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}
