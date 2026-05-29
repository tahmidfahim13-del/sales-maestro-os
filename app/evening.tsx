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
import ClaudeResponse from '../components/ClaudeResponse';
import { useVoice } from '../hooks/useVoice';
import { callClaude, buildEveningPrompt } from '../utils/claude';
import {
  getCurrentDay,
  getCurrentWeek,
  saveDailyLog,
  getTodayLog,
  getLastSevenLogs,
} from '../utils/storage';
import { COLORS, WEEK_THEMES } from '../constants/theme';

export default function EveningScreen() {
  const router = useRouter();
  const { isRecording, transcript, setTranscript, startRecording, stopRecording, speak } = useVoice();
  const [thinking, setThinking] = useState(false);
  const [response, setResponse] = useState('');
  const [day, setDay] = useState(1);
  const [accentColor, setAccentColor] = useState(COLORS.week1);
  const [done, setDone] = useState(false);
  const [inputText, setInputText] = useState('');
  const [commitment, setCommitment] = useState('');

  useEffect(() => {
    async function load() {
      const d = await getCurrentDay();
      const w = getCurrentWeek(d);
      setDay(d);
      setAccentColor(WEEK_THEMES[w - 1]?.color || COLORS.week1);
      const log = await getTodayLog();
      if (log?.morningCommitment) setCommitment(log.morningCommitment);
      if (log?.eveningDone) {
        setDone(true);
        setResponse(log.claudeEvaluation || '');
        setInputText(log.eveningReport || '');
      }
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

  async function submit(report: string) {
    if (!report.trim()) return;
    setThinking(true);
    try {
      const sevenLogs = await getLastSevenLogs();
      const summary = sevenLogs
        .map((l) => `Day ${l.day}: committed to "${l.morningCommitment}", reported "${l.eveningReport}", tier: ${l.tier}`)
        .join('. ');
      const prompt = buildEveningPrompt(day, commitment, summary);
      const res = await callClaude(prompt, [{ role: 'user', content: report }]);
      setResponse(res);
      speak(res);
      await saveDailyLog({ eveningDone: true, eveningReport: report, claudeEvaluation: res });
      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setThinking(false);
    }
  }

  useEffect(() => {
    if (transcript) setInputText(transcript);
  }, [transcript]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.dayLine, { color: accentColor }]}>DAY {day} — EVENING AUDIT</Text>
      <Text style={styles.title}>What actually happened today?</Text>
      {commitment ? (
        <View style={styles.commitBanner}>
          <Text style={styles.commitLabel}>YOU SAID THIS MORNING:</Text>
          <Text style={styles.commitText}>"{commitment}"</Text>
        </View>
      ) : null}
      <Text style={styles.sub}>Report honestly. No spin. No excuses.</Text>

      <TranscriptBox
        transcript={inputText}
        placeholder="What did you do? What didn't happen? Be specific and honest."
      />

      <View style={styles.micArea}>
        <MicButton isRecording={isRecording} onPress={handleMic} disabled={thinking || done} />
        <Text style={styles.micLabel}>
          {isRecording ? 'Listening... tap to send' : done ? 'Completed' : 'Tap to speak'}
        </Text>
      </View>

      <ClaudeResponse response={response} thinking={thinking} accentColor={accentColor} />

      {done && (
        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: accentColor }]} onPress={() => router.back()}>
          <Text style={styles.doneBtnText}>BACK TO HOME</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 16, paddingBottom: 60 },
  dayLine: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, marginBottom: 12 },
  title: { color: COLORS.primaryText, fontSize: 24, fontWeight: '700', lineHeight: 32, marginBottom: 12 },
  commitBanner: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commitLabel: { color: COLORS.mutedText, fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 4 },
  commitText: { color: COLORS.secondaryText, fontSize: 14, fontStyle: 'italic' },
  sub: { color: COLORS.secondaryText, fontSize: 14, marginBottom: 20 },
  micArea: { alignItems: 'center', marginVertical: 32 },
  micLabel: { color: COLORS.secondaryText, fontSize: 13, marginTop: 12 },
  doneBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  doneBtnText: { color: '#FFFFFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
});
