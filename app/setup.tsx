import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { saveApiKey, setStartDate } from '../utils/storage';
import { requestPermissions, scheduleDaily } from '../utils/notifications';
import { C } from '../constants/theme';

export default function Setup() {
  const router = useRouter();
  const [key, setKey]       = useState('');
  const [loading, setLoading] = useState(false);

  async function go() {
    if (!key.trim().startsWith('sk-ant-')) {
      Alert.alert('Invalid key', 'Anthropic API keys start with sk-ant-');
      return;
    }
    setLoading(true);
    try {
      await saveApiKey(key.trim());
      await setStartDate(new Date().toISOString().split('T')[0]);
      await requestPermissions();
      await scheduleDaily(1);
      router.replace('/home');
    } finally {
      setLoading(false);
    }
  }

  const ready = key.trim().length > 10 && !loading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>SALES{'\n'}MAESTRO{'\n'}OS</Text>
        <Text style={s.sub}>28-Day AI Accountability System</Text>

        <View style={s.card}>
          <Text style={[s.cardTitle, { color: C.week[0] }]}>ANTHROPIC API KEY</Text>
          <Text style={s.cardBody}>
            Your key is stored only on this device. Get yours at console.anthropic.com
          </Text>
          <TextInput
            style={s.input}
            placeholder="sk-ant-api03-…"
            placeholderTextColor={C.dim}
            value={key}
            onChangeText={setKey}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </View>

        <View style={s.rules}>
          {[
            '28 days. No restarts. No excuses.',
            'Voice is how you show up.',
            'Accountability is the product.',
          ].map(r => <Text key={r} style={s.rule}>— {r}</Text>)}
        </View>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: C.week[0] }, !ready && s.off]}
          onPress={go}
          disabled={!ready}
        >
          <Text style={s.btnText}>{loading ? 'INITIALIZING…' : 'START DAY 1'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  content:   { padding: 28, paddingTop: 80, alignItems: 'center' },
  logo:      { fontFamily: 'monospace', fontSize: 42, fontWeight: '900', color: C.text, textAlign: 'center', lineHeight: 50, letterSpacing: 4, marginBottom: 8 },
  sub:       { color: C.muted, fontSize: 12, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 48 },
  card:      { width: '100%', backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 28, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 10 },
  cardBody:  { color: C.muted, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  input:     { backgroundColor: C.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 15, padding: 14 },
  rules:     { width: '100%', marginBottom: 40 },
  rule:      { color: C.text, fontSize: 14, lineHeight: 28, fontStyle: 'italic' },
  btn:       { borderRadius: 14, paddingVertical: 18, paddingHorizontal: 60, alignItems: 'center' },
  off:       { opacity: 0.4 },
  btnText:   { color: '#FFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 16, letterSpacing: 2 },
});
