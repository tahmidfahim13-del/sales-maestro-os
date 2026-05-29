import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getApiKey,
  getStartDate,
  setStartDate,
  getDaysSinceLastOpen,
  setLastOpenDate,
} from '../utils/storage';
import { COLORS } from '../constants/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const apiKey = await getApiKey();
      if (!apiKey) {
        router.replace('/setup');
        return;
      }

      const startDate = await getStartDate();
      if (!startDate) {
        await setStartDate(new Date().toISOString().split('T')[0]);
      }

      const daysSince = await getDaysSinceLastOpen();
      await setLastOpenDate();

      if (daysSince >= 2) {
        router.replace({ pathname: '/reentry', params: { days: String(daysSince) } });
      } else {
        router.replace('/home');
      }
    }
    init();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={COLORS.week1} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
