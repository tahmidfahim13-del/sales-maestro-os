import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import VoiceInput from '../components/VoiceInput';
import { C } from '../constants/theme';
import { getCurrentDay, weekOf } from '../utils/storage';
import { askClaude, PROMPTS } from '../utils/claude';

interface Dump {
  now:   { item: string; action: string }[];
  later: string[];
  trash: string[];
}

export default function BrainDump() {
  const [accent,   setAccent]   = useState(C.week[0]);
  const [text,     setText]     = useState('');
  const [thinking, setThinking] = useState(false);
  const [result,   setResult]   = useState<Dump | null>(null);

  useEffect(() => {
    getCurrentDay().then(d => setAccent(C.week[weekOf(d) - 1]));
  }, []);

  async function submit() {
    if (!text.trim()) return;
    setThinking(true);
    try {
      const raw   = await askClaude(PROMPTS.brainDump(), [{ role: 'user', content: text }]);
      const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const d: Dump = JSON.parse(clean);
      setResult(d);
      Speech.speak(
        `${d.now.length} now, ${d.later.length} later, ${d.trash.length} in trash.`,
        { rate: 0.95 },
      );
    } catch (e: any) {
      Alert.alert('Parse error', e.message);
    } finally {
      setThinking(false);
    }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={[s.title, { color: accent }]}>BRAIN DUMP</Text>
      <Text style={s.sub}>Say everything. Claude sorts it ruthlessly.</Text>

      <VoiceInput
        value={text}
        onChange={setText}
        placeholder="Tasks, worries, ideas, distractions — everything."
        disabled={thinking || !!result}
      />

      {!result && (
        <TouchableOpacity
          style={[s.btn, { backgroundColor: accent }, !text.trim() && s.off]}
          onPress={submit}
          disabled={!text.trim() || thinking}
        >
          <Text style={s.btnText}>{thinking ? 'SORTING…' : 'SORT MY MIND'}</Text>
        </TouchableOpacity>
      )}

      {result && (
        <>
          {/* NOW */}
          <Text style={[s.secHead, { color: C.red }]}>NOW</Text>
          {result.now.length === 0
            ? <Text style={s.empty}>Nothing urgent.</Text>
            : result.now.map((item, i) => (
              <View key={i} style={[s.card, { borderLeftColor: C.red }]}>
                <Text style={s.cardItem}>{item.item}</Text>
                <Text style={s.cardAction}>→ {item.action}</Text>
              </View>
            ))}

          {/* LATER */}
          <Text style={[s.secHead, { color: accent }]}>LATER</Text>
          {result.later.length === 0
            ? <Text style={s.empty}>Nothing deferred.</Text>
            : result.later.map((item, i) => (
              <View key={i} style={[s.card, { borderLeftColor: accent }]}>
                <Text style={s.cardItem}>{item}</Text>
              </View>
            ))}

          {/* TRASH */}
          <Text style={[s.secHead, { color: C.dim }]}>TRASH</Text>
          {result.trash.length === 0
            ? <Text style={s.empty}>Nothing to discard.</Text>
            : result.trash.map((item, i) => (
              <View key={i} style={[s.card, { borderLeftColor: C.dim, opacity: 0.55 }]}>
                <Text style={[s.cardItem, { textDecorationLine: 'line-through', color: C.muted }]}>{item}</Text>
              </View>
            ))}

          <TouchableOpacity
            style={[s.resetBtn, { borderColor: accent }]}
            onPress={() => { setResult(null); setText(''); }}
          >
            <Text style={[s.resetText, { color: accent }]}>NEW DUMP</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: C.bg },
  content:    { padding: 24, paddingTop: 16, paddingBottom: 60, gap: 14 },
  title:      { fontFamily: 'monospace', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  sub:        { color: C.muted, fontSize: 14 },
  btn:        { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  off:        { opacity: 0.4 },
  btnText:    { color: '#FFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
  secHead:    { fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, marginTop: 8 },
  card:       { backgroundColor: C.surface, borderRadius: 10, borderLeftWidth: 3, padding: 13 },
  cardItem:   { color: C.text, fontSize: 14, fontWeight: '600' },
  cardAction: { color: C.muted, fontSize: 13, marginTop: 4 },
  empty:      { color: C.dim, fontSize: 13, fontStyle: 'italic' },
  resetBtn:   { borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  resetText:  { fontFamily: 'monospace', fontWeight: '700', fontSize: 13, letterSpacing: 2 },
});
