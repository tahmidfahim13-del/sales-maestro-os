import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../constants/theme';
import { setLastOpenDate } from '../utils/storage';

export default function ReentryScreen() {
  const router = useRouter();
  const { days } = useLocalSearchParams<{ days: string }>();
  const daysAway = parseInt(days || '2', 10);

  async function handleContinue() {
    await setLastOpenDate();
    router.replace('/home');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.number}>{daysAway}</Text>
      <Text style={styles.label}>DAYS AWAY</Text>

      <View style={styles.divider} />

      <Text style={styles.message}>
        You're not restarting.{'\n'}You're continuing.
      </Text>

      <Text style={styles.sub}>
        The gap doesn't erase the work.{'\n'}It's just a gap. Close it.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>CONTINUE →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  number: {
    fontFamily: 'monospace',
    fontSize: 96,
    fontWeight: '900',
    color: COLORS.micActive,
    lineHeight: 100,
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 14,
    letterSpacing: 4,
    color: COLORS.secondaryText,
    marginBottom: 40,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.border,
    marginBottom: 40,
  },
  message: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primaryText,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 20,
  },
  sub: {
    fontSize: 15,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 60,
  },
  button: {
    backgroundColor: COLORS.week1,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 60,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 3,
  },
});
