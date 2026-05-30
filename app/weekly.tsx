import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import VoiceInput from '../components/VoiceInput';
import ClaudeBox from '../components/ClaudeBox';
import { C, WEEK_THEMES } from '../constants/theme';
import { getCurrentDay, weekOf, getLogs, saveWeekly, getWeeklies } from '../utils/storage';
import { askClaude, PROMPTS } from '../utils/claude';

export default function Weekly() {
  const router = useRouter();
  const [week,        setWeek]        = useState(1);
  const [accent,      setAccent]      = useState(C.week[0]);
  const [text,        setText]        = useState('');
  const [thinking,    setThinking]    = useState(false);
  const [response,    setResponse]    = useState('');
  const [identity,    setIdentity]    = useState('');
  const [done,        setDone]        = useState(false);

  useEffect(() => {
    (async () => {
      const d = await getCurrentDay();
      const w = weekOf(d);
      setWeek(w); setAccent(C.week[w - 1]);
      const reviews = await getWeeklies();
      const existing = reviews.find(r => r.week === w);
      if (existing) {
        setDone(true);
        setText(existing.reflection);
        setResponse(existing.evaluation);
        setIdentity(existing.identity);
      }
    })();
  }, []);

  async function submit() {
    if (!text.trim()) return;
    setThinking(true);
    try {
      const logs     = await getLogs();
      const weekLogs = logs.filter(l => weekOf(l.day) === week);
      const data     = weekLogs
        .map(l => `Day ${l.day}: tier=${l.tier}, morning=${l.morningDone}, evening=${l.eveningDone}, roleplay=${l.roleplayDone}, committed="${l.morningText}", reported="${l.eveningText}"`)
        .join('; ') || 'No detailed logs for this week.';

      const res = await askClaude(
        PROMPTS.weekly(week, data),
        [{ role: 'user', content: text }],
      );

      // Split out the identity statement (starts with "I am")
      const lines    = res.split('\n');
      const idLine   = lines.find(l => l.trim().startsWith('I am')) ?? '';
      const evalText = lines.filter(l => !l.trim().startsWith('I am')).join('\n').trim();

      setResponse(evalText);
      setIdentity(idLine);
      Speech.speak(res, { rate: 0.95 });

      await saveWeekly({ week, reflection: text, evaluation: evalText, identity: idLine });
      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setThinking(false);
    }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={[s.chip, { color: accent }]}>WEEK {week} REVIEW</Text>
      <Text style={s.title}>{WEEK_THEMES[week - 1]}</Text>
      <Text style={s.sub}>Reflect on the week honestly. What worked? What didn't?</Text>

      <VoiceInput
        value={text}
        onChange={setText}
        placeholder="Speak your honest reflection on this week…"
        disabled={done}
      />

      {!done && (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: accent }, !text.trim() && s.off]}
          onPress={submit}
          disabled={!text.trim() || thinking}
        >
          <Text style={s.btnText}>{thinking ? 'EVALUATING…' : 'SUBMIT REVIEW'}</Text>
        </TouchableOpacity>
      )}

      <ClaudeBox response={response} thinking={thinking} accent={accent} />

      {!!identity && (
        <View style={[s.identityCard, { borderColor: accent }]}>
          <Text style={[s.identityLbl, { color: accent }]}>YOUR WEEK {week} IDENTITY</Text>
          <Text style={s.identityText}>{identity}</Text>
        </View>
      )}

      {done && (
        <TouchableOpacity style={[s.btn, { backgroundColor: accent, marginTop: 8 }]} onPress={() => router.back()}>
          <Text style={s.btnText}>BACK TO HOME</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:       { flex: 1, backgroundColor: C.bg },
  content:      { padding: 24, paddingTop: 16, paddingBottom: 60, gap: 16 },
  chip:         { fontFamily: 'monospace', fontSize: 11, letterSpacing: 3 },
  title:        { color: C.text, fontSize: 26, fontWeight: '800' },
  sub:          { color: C.muted, fontSize: 14 },
  btn:          { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  off:          { opacity: 0.4 },
  btnText:      { color: '#FFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
  identityCard: { borderRadius: 14, borderWidth: 2, padding: 20, alignItems: 'center' },
  identityLbl:  { fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 10 },
  identityText: { color: C.text, fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 28 },
});
