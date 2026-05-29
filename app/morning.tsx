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
import { callClaude, buildMorningPrompt } from '../utils/claude';
import {
  getCurrentDay,
  getCurrentWeek,
  saveDailyLog,
  getTodayLog,
} from '../utils/storage';
import { COLORS, WEEK_THEMES } from '../constants/theme';

export default function MorningScreen() {
  const router = useRouter();
  const { isRecording, transcript, setTranscript, startRecording, stopRecording, speak } = useVoice();
  const [thinking, setThinking] = useState(false);
  const [response, setResponse] = useState('');
  const [day, setDay] = useState(1);
  const [accentColor, setAccentColor] = useState(COLORS.week1);
  const [done, setDone] = useState(false);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    async function load() {
      const d = await getCurrentDay();
      const w = getCurrentWeek(d);
      setDay(d);
      setAccentColor(WEEK_THEMES[w - 1]?.color || COLORS.week1);
      const log = await getTodayLog();
      if (log?.morningDone) {
        setDone(true);
        setResponse(log.claudeEvaluation || '');
        setInputText(log.morningCommitment || '');
      }
    }
    load();
  }, []);

  async function handleMic() {
    if (isRecording) {
      const text = await stopRecording();
      if (inputText || transcript) {
        await submit(inputText || transcript);
      }
    } else {
      const ok = await startRecording();
      if (!ok) Alert.alert('Permission denied', 'Microphone access is required.');
    }
  }

  async function submit(commitment: string) {
    if (!commitment.trim()) return;
    setThinking(true);
    try {
      const prompt = buildMorningPrompt(day);
      const res = await callClaude(prompt, [
        { role: 'user', content: commitment },
      ]);
      setResponse(res);
      speak(res);
      await saveDailyLog({
        morningDone: true,
        morningCommitment: commitment,
        claudeEvaluation: res,
      });
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
      <Text style={[styles.dayLine, { color: accentColor }]}>DAY {day} — MORNING</Text>
      <Text style={styles.title}>What is your commitment today?</Text>
      <Text style={styles.sub}>Speak it out loud. Make it real.</Text>

      <TranscriptBox
        transcript={inputText}
        placeholder="Tap the mic. Say what you're going to do today. Be specific."
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
  title: { color: COLORS.primaryText, fontSize: 24, fontWeight: '700', lineHeight: 32, marginBottom: 8 },
  sub: { color: COLORS.secondaryText, fontSize: 14, marginBottom: 20 },
  micArea: { alignItems: 'center', marginVertical: 32 },
  micLabel: { color: COLORS.secondaryText, fontSize: 13, marginTop: 12 },
  doneBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
});
