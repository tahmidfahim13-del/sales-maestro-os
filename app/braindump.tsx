import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import MicButton from '../components/MicButton';
import TranscriptBox from '../components/TranscriptBox';
import { useVoice } from '../hooks/useVoice';
import { callClaude, buildBrainDumpPrompt } from '../utils/claude';
import { getCurrentWeek, getCurrentDay } from '../utils/storage';
import { COLORS, WEEK_THEMES } from '../constants/theme';

interface BrainDumpResult {
  now: { item: string; action: string }[];
  later: string[];
  trash: string[];
}

export default function BrainDumpScreen() {
  const router = useRouter();
  const { isRecording, transcript, setTranscript, startRecording, stopRecording, speak } = useVoice();
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<BrainDumpResult | null>(null);
  const [accentColor, setAccentColor] = useState(COLORS.week1);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    async function load() {
      const d = await getCurrentDay();
      const w = getCurrentWeek(d);
      setAccentColor(WEEK_THEMES[w - 1]?.color || COLORS.week1);
    }
    load();
  }, []);

  async function handleMic() {
    if (isRecording) {
      await stopRecording();
      if (inputText || transcript) await submit(inputText || transcript);
    } else {
      const ok = await startRecording();
      if (!ok) Alert.alert('Permission denied', 'Microphone access is required.');
    }
  }

  async function submit(dump: string) {
    if (!dump.trim()) return;
    setThinking(true);
    try {
      const prompt = buildBrainDumpPrompt();
      const res = await callClaude(prompt, [{ role: 'user', content: dump }]);
      const cleaned = res.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed: BrainDumpResult = JSON.parse(cleaned);
      setResult(parsed);
      const summary = `You have ${parsed.now.length} NOW items, ${parsed.later.length} LATER, and ${parsed.trash.length} in trash.`;
      speak(summary);
    } catch (e: any) {
      Alert.alert('Error', 'Could not parse response. ' + e.message);
    } finally {
      setThinking(false);
    }
  }

  useEffect(() => {
    if (transcript) setInputText(transcript);
  }, [transcript]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: accentColor }]}>BRAIN DUMP</Text>
      <Text style={styles.sub}>Speak everything on your mind. Claude will sort it.</Text>

      <TranscriptBox
        transcript={inputText}
        placeholder="Say everything — tasks, worries, ideas, distractions. All of it."
      />

      <View style={styles.micArea}>
        <MicButton isRecording={isRecording} onPress={handleMic} disabled={thinking} />
        <Text style={styles.micLabel}>
          {isRecording ? 'Listening... tap to sort' : thinking ? 'Sorting...' : 'Tap to speak'}
        </Text>
      </View>

      {thinking && (
        <Text style={[styles.thinkingLabel, { color: accentColor }]}>Sorting your mind...</Text>
      )}

      {result && (
        <View style={styles.results}>
          <Text style={styles.sectionHead}>NOW</Text>
          {result.now.map((item, i) => (
            <View key={i} style={[styles.card, { borderLeftColor: COLORS.micActive }]}>
              <Text style={styles.cardItem}>{item.item}</Text>
              <Text style={styles.cardAction}>→ {item.action}</Text>
            </View>
          ))}
          {result.now.length === 0 && <Text style={styles.empty}>Nothing urgent. Good.</Text>}

          <Text style={[styles.sectionHead, { marginTop: 20 }]}>LATER</Text>
          {result.later.map((item, i) => (
            <View key={i} style={[styles.card, { borderLeftColor: accentColor }]}>
              <Text style={styles.cardItem}>{item}</Text>
            </View>
          ))}
          {result.later.length === 0 && <Text style={styles.empty}>No deferred items.</Text>}

          <Text style={[styles.sectionHead, { marginTop: 20 }]}>TRASH</Text>
          {result.trash.map((item, i) => (
            <View key={i} style={[styles.card, { borderLeftColor: COLORS.mutedText, opacity: 0.6 }]}>
              <Text style={[styles.cardItem, { textDecorationLine: 'line-through', color: COLORS.secondaryText }]}>{item}</Text>
            </View>
          ))}
          {result.trash.length === 0 && <Text style={styles.empty}>Nothing to trash.</Text>}

          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: accentColor }]}
            onPress={() => { setResult(null); setInputText(''); setTranscript(''); }}
          >
            <Text style={[styles.resetBtnText, { color: accentColor }]}>NEW DUMP</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 16, paddingBottom: 60 },
  title: { fontFamily: 'monospace', fontSize: 22, fontWeight: '900', letterSpacing: 3, marginBottom: 8 },
  sub: { color: COLORS.secondaryText, fontSize: 14, marginBottom: 20 },
  micArea: { alignItems: 'center', marginVertical: 32 },
  micLabel: { color: COLORS.secondaryText, fontSize: 13, marginTop: 12 },
  thinkingLabel: { textAlign: 'center', fontFamily: 'monospace', fontSize: 13, letterSpacing: 2 },
  results: { marginTop: 16 },
  sectionHead: {
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 3,
    color: COLORS.secondaryText,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 8,
  },
  cardItem: { color: COLORS.primaryText, fontSize: 15, fontWeight: '600' },
  cardAction: { color: COLORS.secondaryText, fontSize: 13, marginTop: 4 },
  empty: { color: COLORS.mutedText, fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  resetBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  resetBtnText: { fontFamily: 'monospace', fontWeight: '700', fontSize: 13, letterSpacing: 2 },
});
