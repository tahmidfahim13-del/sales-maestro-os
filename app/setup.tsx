import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { saveApiKey, setStartDate } from '../utils/storage';
import { COLORS } from '../constants/theme';
import { requestNotificationPermissions, scheduleNotifications } from '../utils/notifications';

export default function SetupScreen() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStart() {
    if (!apiKey.trim().startsWith('sk-ant-')) {
      Alert.alert('Invalid Key', 'Anthropic API keys start with sk-ant-');
      return;
    }
    setLoading(true);
    try {
      await saveApiKey(apiKey.trim());
      await setStartDate(new Date().toISOString().split('T')[0]);
      await requestNotificationPermissions();
      await scheduleNotifications(1);
      router.replace('/home');
    } catch (e) {
      Alert.alert('Error', 'Could not save. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>SALES{'\n'}MAESTRO{'\n'}OS</Text>
        <Text style={styles.subtitle}>28-Day AI Accountability System</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>YOUR ANTHROPIC API KEY</Text>
          <Text style={styles.cardBody}>
            All AI responses are powered by Claude. Your key is stored locally on your device only.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="sk-ant-api03-..."
            placeholderTextColor={COLORS.mutedText}
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          <Text style={styles.hint}>
            Get your key at console.anthropic.com
          </Text>
        </View>

        <View style={styles.rules}>
          <Text style={styles.ruleTitle}>THE COMMITMENT</Text>
          {['28 days. No restarts. No excuses.', 'Voice is how you show up. Type is for cowards.', 'Accountability is the product.'].map((r) => (
            <Text key={r} style={styles.rule}>— {r}</Text>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={loading || !apiKey.trim()}
        >
          <Text style={styles.buttonText}>
            {loading ? 'INITIALIZING...' : 'START DAY 1'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    padding: 28,
    paddingTop: 80,
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'monospace',
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primaryText,
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.secondaryText,
    fontSize: 13,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: 48,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    color: COLORS.week1,
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 10,
  },
  cardBody: {
    color: COLORS.secondaryText,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.primaryText,
    fontSize: 15,
    padding: 14,
    marginBottom: 8,
  },
  hint: {
    color: COLORS.mutedText,
    fontSize: 12,
    textAlign: 'center',
  },
  rules: {
    width: '100%',
    marginBottom: 40,
  },
  ruleTitle: {
    color: COLORS.secondaryText,
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 10,
  },
  rule: {
    color: COLORS.primaryText,
    fontSize: 14,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: COLORS.week1,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 60,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 2,
  },
});
