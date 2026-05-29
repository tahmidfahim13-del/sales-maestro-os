import React, { useState, useEffect, useRef } from 'react';
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
import { useVoice } from '../hooks/useVoice';
import { callClaude, buildRoleplayPrompt, buildDebriefPrompt, Message } from '../utils/claude';
import {
  getCurrentDay,
  getCurrentWeek,
  saveDailyLog,
  saveRoleplaySession,
} from '../utils/storage';
import { COLORS, WEEK_THEMES, ROLEPLAY_PERSONAS, ROLEPLAY_SCENARIOS } from '../constants/theme';

type Phase = 'setup' | 'session' | 'debrief';

interface Scores { articulation: number; confidence: number; pressure: number; strategy: number; summary: string; }

export default function RoleplayScreen() {
  const router = useRouter();
  const { isRecording, transcript, setTranscript, startRecording, stopRecording, speak, stopSpeaking } = useVoice();
  const [phase, setPhase] = useState<Phase>('setup');
  const [personaIdx, setPersonaIdx] = useState(0);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const [debrief, setDebrief] = useState<Scores | null>(null);
  const [accentColor, setAccentColor] = useState(COLORS.week1);
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(1);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const difficulty = Math.min(Math.ceil(week * 1.2), 5);

  useEffect(() => {
    async function load() {
      const d = await getCurrentDay();
      const w = getCurrentWeek(d);
      setDay(d);
      setWeek(w);
      setAccentColor(WEEK_THEMES[w - 1]?.color || COLORS.week1);
    }
    load();
  }, []);

  useEffect(() => {
    if (transcript) setInputText(transcript);
  }, [transcript]);

  async function startSession() {
    setMessages([]);
    setPhase('session');
    setThinking(true);
    try {
      const persona = ROLEPLAY_PERSONAS[personaIdx];
      const scenario = ROLEPLAY_SCENARIOS[scenarioIdx];
      const prompt = buildRoleplayPrompt(persona.label, difficulty, scenario);
      const opener = await callClaude(prompt, [
        { role: 'user', content: 'Begin the scenario. Open with your first line as this character.' },
      ]);
      const newMessages: Message[] = [{ role: 'assistant', content: opener }];
      setMessages(newMessages);
      speak(opener);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setThinking(false);
    }
  }

  async function sendUserLine() {
    const text = inputText.trim();
    if (!text) return;
    if (text.toLowerCase().includes('end session')) {
      await endSession();
      return;
    }
    const persona = ROLEPLAY_PERSONAS[personaIdx];
    const scenario = ROLEPLAY_SCENARIOS[scenarioIdx];
    const updatedMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(updatedMessages);
    setInputText('');
    setTranscript('');
    setThinking(true);
    scrollRef.current?.scrollToEnd({ animated: true });
    try {
      const prompt = buildRoleplayPrompt(persona.label, difficulty, scenario);
      const res = await callClaude(prompt, updatedMessages);
      const finalMessages: Message[] = [...updatedMessages, { role: 'assistant', content: res }];
      setMessages(finalMessages);
      speak(res);
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setThinking(false);
    }
  }

  async function handleMic() {
    if (isRecording) {
      await stopRecording();
      if (inputText || transcript) await sendUserLine();
    } else {
      stopSpeaking();
      const ok = await startRecording();
      if (!ok) Alert.alert('Permission denied', 'Microphone access is required.');
    }
  }

  async function endSession() {
    stopSpeaking();
    setThinking(true);
    try {
      const persona = ROLEPLAY_PERSONAS[personaIdx];
      const debriefPrompt = buildDebriefPrompt(persona.label, messages);
      const res = await callClaude(debriefPrompt, [{ role: 'user', content: 'Give me my debrief.' }]);
      const cleaned = res.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed: Scores = JSON.parse(cleaned);
      setDebrief(parsed);
      setPhase('debrief');
      speak(parsed.summary);
      await saveDailyLog({ roleplayDone: true });
      await saveRoleplaySession({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        persona: ROLEPLAY_PERSONAS[personaIdx].label,
        difficulty,
        messages,
        debrief: parsed.summary,
        scores: {
          articulation: parsed.articulation,
          confidence: parsed.confidence,
          pressure: parsed.pressure,
          strategy: parsed.strategy,
        },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setThinking(false);
    }
  }

  if (phase === 'setup') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: accentColor }]}>ROLEPLAY</Text>
        <Text style={styles.sub}>Day {day} — Difficulty {difficulty}/5</Text>

        <Text style={styles.sectionLabel}>CHOOSE YOUR OPPONENT</Text>
        {ROLEPLAY_PERSONAS.map((p, i) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.optionCard, personaIdx === i && { borderColor: accentColor }]}
            onPress={() => setPersonaIdx(i)}
          >
            <Text style={[styles.optionTitle, personaIdx === i && { color: accentColor }]}>{p.label}</Text>
            <Text style={styles.optionDesc}>{p.description}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>SCENARIO</Text>
        {ROLEPLAY_SCENARIOS.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.optionCard, scenarioIdx === i && { borderColor: accentColor }]}
            onPress={() => setScenarioIdx(i)}
          >
            <Text style={[styles.optionTitle, scenarioIdx === i && { color: accentColor }]}>{s}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: accentColor }]} onPress={startSession}>
          <Text style={styles.startBtnText}>START SESSION</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (phase === 'debrief' && debrief) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: accentColor }]}>SESSION DEBRIEF</Text>
        <Text style={styles.sub}>{ROLEPLAY_PERSONAS[personaIdx].label}</Text>

        <View style={styles.scoresGrid}>
          {[
            { label: 'Articulation', val: debrief.articulation },
            { label: 'Confidence', val: debrief.confidence },
            { label: 'Under Pressure', val: debrief.pressure },
            { label: 'Strategic', val: debrief.strategy },
          ].map((s) => (
            <View key={s.label} style={styles.scoreBox}>
              <Text style={[styles.scoreNum, { color: accentColor }]}>{s.val}/5</Text>
              <Text style={styles.scoreLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.debriefCard, { borderLeftColor: accentColor }]}>
          <Text style={[styles.debriefLabel, { color: accentColor }]}>EVALUATION</Text>
          <Text style={styles.debriefText}>{debrief.summary}</Text>
        </View>

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: accentColor }]} onPress={() => setPhase('setup')}>
          <Text style={styles.startBtnText}>NEW SESSION</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={[styles.backBtnText, { color: accentColor }]}>BACK TO HOME</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sessionHeader}>
        <View>
          <Text style={[styles.sessionPersona, { color: accentColor }]}>{ROLEPLAY_PERSONAS[personaIdx].label}</Text>
          <Text style={styles.sessionDiff}>Difficulty {difficulty}/5</Text>
        </View>
        <TouchableOpacity onPress={endSession} style={styles.endBtn}>
          <Text style={styles.endBtnText}>END SESSION</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : [styles.assistantBubble, { borderColor: accentColor }]]}>
            {msg.role === 'assistant' && (
              <Text style={[styles.bubbleLabel, { color: accentColor }]}>{ROLEPLAY_PERSONAS[personaIdx].label.toUpperCase()}</Text>
            )}
            <Text style={[styles.bubbleText, msg.role === 'user' && styles.userText]}>{msg.content}</Text>
          </View>
        ))}
        {thinking && (
          <View style={[styles.bubble, styles.assistantBubble, { borderColor: accentColor }]}>
            <Text style={[styles.bubbleLabel, { color: accentColor }]}>THINKING...</Text>
          </View>
        )}
      </ScrollView>

      {inputText ? (
        <View style={styles.transcriptPreview}>
          <Text style={styles.transcriptText} numberOfLines={3}>{inputText}</Text>
        </View>
      ) : null}

      <View style={styles.inputBar}>
        <MicButton isRecording={isRecording} onPress={handleMic} disabled={thinking} />
        <Text style={styles.inputHint}>
          {isRecording ? 'Listening... tap to send' : 'Tap mic to speak — say "end session" to finish'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 16, paddingBottom: 60 },
  title: { fontFamily: 'monospace', fontSize: 22, fontWeight: '900', letterSpacing: 3, marginBottom: 6 },
  sub: { color: COLORS.secondaryText, fontSize: 14, marginBottom: 24 },
  sectionLabel: { color: COLORS.secondaryText, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  optionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionTitle: { color: COLORS.primaryText, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  optionDesc: { color: COLORS.secondaryText, fontSize: 13 },
  startBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  startBtnText: { color: '#FFFFFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
  scoresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  scoreBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreNum: { fontFamily: 'monospace', fontSize: 28, fontWeight: '900' },
  scoreLabel: { color: COLORS.secondaryText, fontSize: 12, marginTop: 4 },
  debriefCard: { backgroundColor: COLORS.surface, borderRadius: 12, borderLeftWidth: 3, padding: 16, marginBottom: 24 },
  debriefLabel: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  debriefText: { color: COLORS.primaryText, fontSize: 15, lineHeight: 23 },
  backBtn: { alignItems: 'center', marginTop: 16 },
  backBtnText: { fontFamily: 'monospace', fontSize: 14, letterSpacing: 2 },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sessionPersona: { fontFamily: 'monospace', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  sessionDiff: { color: COLORS.secondaryText, fontSize: 12, marginTop: 2 },
  endBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.micActive },
  endBtnText: { color: COLORS.micActive, fontFamily: 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, gap: 12 },
  bubble: { borderRadius: 12, padding: 14, maxWidth: '90%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1E2A3A' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderWidth: 1 },
  bubbleLabel: { fontSize: 9, fontFamily: 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  bubbleText: { color: COLORS.primaryText, fontSize: 14, lineHeight: 21 },
  userText: { color: COLORS.primaryText },
  transcriptPreview: {
    backgroundColor: COLORS.surfaceAlt,
    margin: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transcriptText: { color: COLORS.secondaryText, fontSize: 13, lineHeight: 20 },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  inputHint: { flex: 1, color: COLORS.secondaryText, fontSize: 12, lineHeight: 18 },
});
