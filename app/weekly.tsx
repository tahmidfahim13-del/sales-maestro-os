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
import { callClaude, buildWeeklyPrompt } from '../utils/claude';
import {
  getCurrentDay,
  getCurrentWeek,
  getDailyLogs,
  saveWeeklyReview,
  getWeeklyReviews,
} from '../utils/storage';
import { COLORS, WEEK_THEMES } from '../constants/theme';

export default function WeeklyScreen() {
  const router = useRouter();
  const { isRecording, transcript, setTranscript, startRecording, stopRecording, speak } = useVoice();
  const [thinking, setThinking] = useState(false);
  const [response, setResponse] = useState('');
  const [week, setWeek] = useState(1);
  const [accentColor, setAccentColor] = useState(COLORS.week1);
  const [done, setDone] = useState(false);
  const [inputText, setInputText] = useState('');
  const [identityStatement, setIdentityStatement] = useState('');

  useEffect(() => {
    async function load() {
      const d = await getCurrentDay();
      const w = getCurrentWeek(d);
      setWeek(w);
      setAccentColor(WEEK_THEMES[w - 1]?.color || COLORS.week1);
      const reviews = await getWeeklyReviews();
      const existing = reviews.find((r) => r.week === w);
      if (existing) {
        setDone(true);
        setResponse(existing.claudeEvaluation);
        setIdentityStatement(existing.identityStatement);
        setInputText(existing.userReflection);
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

  async function submit(reflection: string) {
    if (!reflection.trim()) return;
    setThinking(true);
    try {
      const logs = await getDailyLogs();
      const weekLogs = logs.filter((l) => {
        const logWeek = Math.ceil(l.day / 7);
        return logWeek === week;
      });
      const weekData = weekLogs.map((l) =>
        `Day ${l.day}: tier=${l.tier}, morning=${l.morningDone}, evening=${l.eveningDone}, roleplay=${l.roleplayDone}, commitment="${l.morningCommitment}", report="${l.eveningReport}"`
      ).join('; ');
      const prompt = buildWeeklyPrompt(week, weekData || 'No detailed logs available for this week.');
      const res = await callClaude(prompt, [{ role: 'user', content: reflection }]);
      const lines = res.split('\n');
      const identity = lines.find((l) => l.trim().startsWith('I am')) || '';
      const evalText = lines.filter((l) => !l.trim().startsWith('I am')).join('\n').trim();
      setResponse(evalText);
      setIdentityStatement(identity);
      speak(res);
      await saveWeeklyReview({
        week,
        date: new Date().toISOString().split('T')[0],
        userReflection: reflection,
        claudeEvaluation: evalText,
        identityStatement: identity,
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
      <Text style={[styles.weekLabel, { color: accentColor }]}>WEEK {week} REVIEW</Text>
      <Text style={styles.theme}>{WEEK_THEMES[week - 1]?.name}</Text>
      <Text style={styles.sub}>Reflect on the week honestly. What worked? What didn't?</Text>

      <TranscriptBox
        transcript={inputText}
        placeholder="Speak your honest reflection on this week — wins, failures, patterns you noticed."
      />

      <View style={styles.micArea}>
        <MicButton isRecording={isRecording} onPress={handleMic} disabled={thinking || done} />
        <Text style={styles.micLabel}>
          {isRecording ? 'Listening... tap to send' : done ? 'Review complete' : 'Tap to reflect'}
        </Text>
      </View>

      <ClaudeResponse response={response} thinking={thinking} accentColor={accentColor} />

      {identityStatement ? (
        <View style={[styles.identityCard, { borderColor: accentColor }]}>
          <Text style={[styles.identityLabel, { color: accentColor }]}>YOUR WEEK {week} IDENTITY</Text>
          <Text style={styles.identityText}>{identityStatement}</Text>
        </View>
      ) : null}

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
  weekLabel: { fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, marginBottom: 6 },
  theme: { color: COLORS.primaryText, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  sub: { color: COLORS.secondaryText, fontSize: 14, marginBottom: 20 },
  micArea: { alignItems: 'center', marginVertical: 32 },
  micLabel: { color: COLORS.secondaryText, fontSize: 13, marginTop: 12 },
  identityCard: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 20,
    marginTop: 24,
    alignItems: 'center',
  },
  identityLabel: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 10 },
  identityText: { color: COLORS.primaryText, fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  doneBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  doneBtnText: { color: '#FFFFFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
});
