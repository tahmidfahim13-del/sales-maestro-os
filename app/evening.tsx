import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import VoiceInput from '../components/VoiceInput';
import ClaudeBox from '../components/ClaudeBox';
import { C } from '../constants/theme';
import { getCurrentDay, weekOf, getTodayLog, saveLog, getLast7 } from '../utils/storage';
import { askClaude, PROMPTS } from '../utils/claude';

export default function Evening() {
  const router = useRouter();
  const [day,        setDay]       = useState(1);
  const [accent,     setAccent]    = useState(C.week[0]);
  const [text,       setText]      = useState('');
  const [commitment, setCommit]    = useState('');
  const [thinking,   setThinking]  = useState(false);
  const [response,   setResponse]  = useState('');
  const [done,       setDone]      = useState(false);

  useEffect(() => {
    (async () => {
      const d = await getCurrentDay();
      setDay(d); setAccent(C.week[weekOf(d) - 1]);
      const l = await getTodayLog();
      if (l?.morningText) setCommit(l.morningText);
      if (l?.eveningDone) {
        setDone(true); setText(l.eveningText); setResponse(l.claudeResponse);
      }
    })();
  }, []);

  async function submit() {
    if (!text.trim()) return;
    setThinking(true);
    try {
      const last7 = await getLast7();
      const history = last7
        .map(l => `Day ${l.day}: committed="${l.morningText}", reported="${l.eveningText}", tier=${l.tier}`)
        .join('; ');
      const res = await askClaude(
        PROMPTS.evening(day, commitment, history),
        [{ role: 'user', content: text }],
      );
      setResponse(res);
      Speech.speak(res, { rate: 0.95 });
      await saveLog({ eveningDone: true, eveningText: text, claudeResponse: res });
      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setThinking(false);
    }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={[s.chip, { color: accent }]}>DAY {day} — EVENING AUDIT</Text>
      <Text style={s.title}>What actually happened?</Text>

      {!!commitment && (
        <View style={s.banner}>
          <Text style={s.bannerLbl}>YOU COMMITTED TO:</Text>
          <Text style={s.bannerText}>"{commitment}"</Text>
        </View>
      )}

      <Text style={s.sub}>Report honestly. No spin.</Text>

      <VoiceInput
        value={text}
        onChange={setText}
        placeholder="What did you do? What didn't happen? Be specific."
        disabled={done}
      />

      {!done && (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: accent }, !text.trim() && s.off]}
          onPress={submit}
          disabled={!text.trim() || thinking}
        >
          <Text style={s.btnText}>{thinking ? 'EVALUATING…' : 'SUBMIT REPORT'}</Text>
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
  scroll:     { flex: 1, backgroundColor: C.bg },
  content:    { padding: 24, paddingTop: 16, paddingBottom: 60, gap: 14 },
  chip:       { fontFamily: 'monospace', fontSize: 11, letterSpacing: 3 },
  title:      { color: C.text, fontSize: 22, fontWeight: '700' },
  banner:     { backgroundColor: C.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: C.border },
  bannerLbl:  { color: C.dim, fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 4 },
  bannerText: { color: C.muted, fontSize: 14, fontStyle: 'italic' },
  sub:        { color: C.muted, fontSize: 14 },
  btn:        { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  off:        { opacity: 0.4 },
  btnText:    { color: '#FFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
});
