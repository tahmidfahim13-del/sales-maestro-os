import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getApiKey, getStartDate, setStartDate,
  daysSinceLastOpen, setLastOpen,
} from '../utils/storage';
import { C } from '../constants/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const key = await getApiKey();
      if (!key) { router.replace('/setup'); return; }

      if (!await getStartDate()) {
        await setStartDate(new Date().toISOString().split('T')[0]);
      }

      const gap = await daysSinceLastOpen();
      await setLastOpen();

      if (gap >= 2) {
        router.replace({ pathname: '/reentry', params: { days: String(gap) } });
      } else {
        router.replace('/home');
      }
    })();
  }, []);

  return (
    <View style={s.c}>
      <ActivityIndicator color={C.week[0]} size="large" />
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
});
