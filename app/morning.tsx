import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import VoiceInput from '../components/VoiceInput';
import ClaudeBox from '../components/ClaudeBox';
import { C } from '../constants/theme';
import { getCurrentDay, weekOf, getTodayLog, saveLog } from '../utils/storage';
import { askClaude, PROMPTS } from '../utils/claude';

export default function Morning() {
  const router = useRouter();
  const [day,      setDay]      = useState(1);
  const [accent,   setAccent]   = useState(C.week[0]);
  const [text,     setText]     = useState('');
  const [thinking, setThinking] = useState(false);
  const [response, setResponse] = useState('');
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    (async () => {
      const d = await getCurrentDay();
      setDay(d); setAccent(C.week[weekOf(d) - 1]);
      const l = await getTodayLog();
      if (l?.morningDone) {
        setDone(true); setText(l.morningText); setResponse(l.claudeResponse);
      }
    })();
  }, []);

  async function submit() {
    if (!text.trim()) return;
    setThinking(true);
    try {
      const res = await askClaude(
        PROMPTS.morning(day),
        [{ role: 'user', content: text }],
      );
      setResponse(res);
      Speech.speak(res, { rate: 0.95 });
      await saveLog({ morningDone: true, morningText: text, claudeResponse: res });
      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setThinking(false);
    }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={[s.chip, { color: accent }]}>DAY {day} — MORNING</Text>
      <Text style={s.title}>What is your commitment today?</Text>
      <Text style={s.sub}>Be specific. Make it real.</Text>

      <VoiceInput
        value={text}
        onChange={setText}
        placeholder="I will… (speak or type)"
        disabled={done}
      />

      {!done && (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: accent }, !text.trim() && s.off]}
          onPress={submit}
          disabled={!text.trim() || thinking}
        >
          <Text style={s.btnText}>{thinking ? 'SENDING…' : 'SUBMIT COMMITMENT'}</Text>
        </TouchableOpacity>
      )}

      <ClaudeBox response={response} thinking={thinking} accent={accent} />

      {done && (
        <TouchableOpacity style={[s.btn, { backgroundColor: accent, marginTop: 24 }]} onPress={() => router.back()}>
          <Text style={s.btnText}>BACK TO HOME</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: C.bg },
  content: { padding: 24, paddingTop: 16, paddingBottom: 60, gap: 16 },
  chip:    { fontFamily: 'monospace', fontSize: 11, letterSpacing: 3 },
  title:   { color: C.text, fontSize: 22, fontWeight: '700', lineHeight: 30 },
  sub:     { color: C.muted, fontSize: 14 },
  btn:     { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  off:     { opacity: 0.4 },
  btnText: { color: '#FFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
});
