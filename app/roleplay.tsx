import React, { useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import VoiceInput from '../components/VoiceInput';
import { C, PERSONAS, SCENARIOS } from '../constants/theme';
import { getCurrentDay, weekOf, saveLog, saveRoleplay } from '../utils/storage';
import { askClaude, PROMPTS, Msg } from '../utils/claude';

type Phase = 'setup' | 'session' | 'debrief';
interface Scores {
  articulation: number; confidence: number; pressure: number; strategy: number;
  summary: string;
}

export default function Roleplay() {
  const [accent,      setAccent]      = useState(C.week[0]);
  const [day,         setDay]         = useState(1);
  const [week,        setWeek]        = useState(1);
  const [phase,       setPhase]       = useState<Phase>('setup');
  const [personaIdx,  setPersonaIdx]  = useState(0);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [input,       setInput]       = useState('');
  const [thinking,    setThinking]    = useState(false);
  const [scores,      setScores]      = useState<Scores | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const difficulty = Math.min(Math.ceil(week * 1.25), 5);

  useEffect(() => {
    getCurrentDay().then(d => {
      setDay(d);
      const w = weekOf(d);
      setWeek(w);
      setAccent(C.week[w - 1]);
    });
  }, []);

  async function startSession() {
    setMessages([]); setPhase('session'); setThinking(true);
    try {
      const persona   = PERSONAS[personaIdx].label;
      const scenario  = SCENARIOS[scenarioIdx];
      const opener    = await askClaude(
        PROMPTS.roleplay(persona, difficulty, scenario),
        [{ role: 'user', content: 'Begin. Open with your first line as this character.' }],
      );
      const msgs: Msg[] = [{ role: 'assistant', content: opener }];
      setMessages(msgs);
      Speech.speak(opener, { rate: 0.95 });
    } catch (e: any) {
      Alert.alert('Error', e.message); setPhase('setup');
    } finally { setThinking(false); }
  }

  async function sendLine() {
    const line = input.trim();
    if (!line) return;
    if (line.toLowerCase().includes('end session')) { endSession(); return; }

    const updated: Msg[] = [...messages, { role: 'user', content: line }];
    setMessages(updated); setInput(''); setThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const reply = await askClaude(
        PROMPTS.roleplay(PERSONAS[personaIdx].label, difficulty, SCENARIOS[scenarioIdx]),
        updated,
      );
      const final: Msg[] = [...updated, { role: 'assistant', content: reply }];
      setMessages(final);
      Speech.speak(reply, { rate: 0.95 });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setThinking(false); }
  }

  async function endSession() {
    Speech.stop(); setThinking(true);
    try {
      const persona    = PERSONAS[personaIdx].label;
      const transcript = messages
        .map(m => `${m.role === 'user' ? 'Salesperson' : persona}: ${m.content}`)
        .join('\n');
      const raw   = await askClaude(
        PROMPTS.debrief(persona, transcript),
        [{ role: 'user', content: 'Give me my debrief.' }],
      );
      const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const sc: Scores = JSON.parse(clean);
      setScores(sc); setPhase('debrief');
      Speech.speak(sc.summary, { rate: 0.95 });
      await saveLog({ roleplayDone: true });
      await saveRoleplay({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        persona, difficulty, messages,
        debrief: sc.summary,
        scores: {
          articulation: sc.articulation, confidence: sc.confidence,
          pressure: sc.pressure, strategy: sc.strategy,
        },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setThinking(false); }
  }

  /* ── Setup ────────────────────────────────────────────────────── */
  if (phase === 'setup') return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <Text style={[s.title, { color: accent }]}>ROLEPLAY</Text>
      <Text style={s.sub}>Day {day} — Difficulty {difficulty}/5</Text>

      <Text style={s.secLbl}>OPPONENT</Text>
      {PERSONAS.map((p, i) => (
        <TouchableOpacity key={p.id}
          style={[s.option, personaIdx === i && { borderColor: accent }]}
          onPress={() => setPersonaIdx(i)}>
          <Text style={[s.optTitle, personaIdx === i && { color: accent }]}>{p.label}</Text>
          <Text style={s.optDesc}>{p.desc}</Text>
        </TouchableOpacity>
      ))}

      <Text style={[s.secLbl, { marginTop: 18 }]}>SCENARIO</Text>
      {SCENARIOS.map((sc, i) => (
        <TouchableOpacity key={i}
          style={[s.option, scenarioIdx === i && { borderColor: accent }]}
          onPress={() => setScenarioIdx(i)}>
          <Text style={[s.optTitle, scenarioIdx === i && { color: accent }]}>{sc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[s.btn, { backgroundColor: accent }]} onPress={startSession}>
        <Text style={s.btnText}>START SESSION</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  /* ── Debrief ──────────────────────────────────────────────────── */
  if (phase === 'debrief' && scores) return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      <Text style={[s.title, { color: accent }]}>DEBRIEF</Text>
      <Text style={s.sub}>{PERSONAS[personaIdx].label}</Text>

      <View style={s.scoresGrid}>
        {([
          ['Articulation', scores.articulation],
          ['Confidence',   scores.confidence],
          ['Pressure',     scores.pressure],
          ['Strategic',    scores.strategy],
        ] as [string, number][]).map(([l, v]) => (
          <View key={l} style={s.scoreBox}>
            <Text style={[s.scoreNum, { color: accent }]}>{v}/5</Text>
            <Text style={s.scoreLbl}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={[s.debriefCard, { borderLeftColor: accent }]}>
        <Text style={[s.secLbl, { color: accent }]}>EVALUATION</Text>
        <Text style={s.debriefText}>{scores.summary}</Text>
      </View>

      <TouchableOpacity style={[s.btn, { backgroundColor: accent }]} onPress={() => setPhase('setup')}>
        <Text style={s.btnText}>NEW SESSION</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  /* ── Session ──────────────────────────────────────────────────── */
  return (
    <View style={s.sessionWrap}>
      <View style={s.sessionHeader}>
        <View>
          <Text style={[s.sessionPersona, { color: accent }]}>{PERSONAS[personaIdx].label}</Text>
          <Text style={s.sessionDiff}>Difficulty {difficulty}/5</Text>
        </View>
        <TouchableOpacity style={s.endBtn} onPress={endSession}>
          <Text style={s.endBtnText}>END SESSION</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.chat}
        contentContainerStyle={s.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <View key={i} style={[
            s.bubble,
            m.role === 'user'
              ? s.userBubble
              : [s.aiBubble, { borderColor: accent }],
          ]}>
            {m.role === 'assistant' && (
              <Text style={[s.bubbleLbl, { color: accent }]}>
                {PERSONAS[personaIdx].label.toUpperCase()}
              </Text>
            )}
            <Text style={s.bubbleText}>{m.content}</Text>
          </View>
        ))}
        {thinking && (
          <View style={[s.bubble, s.aiBubble, { borderColor: accent }]}>
            <Text style={[s.bubbleLbl, { color: accent }]}>THINKING…</Text>
          </View>
        )}
      </ScrollView>

      <View style={s.inputArea}>
        <VoiceInput
          value={input}
          onChange={setInput}
          disabled={thinking}
          placeholder='Respond — or say "end session" to finish'
        />
        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: accent }, !input.trim() && s.off]}
          onPress={sendLine}
          disabled={!input.trim() || thinking}
        >
          <Text style={s.btnText}>SEND</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: C.bg },
  content:       { padding: 24, paddingTop: 16, paddingBottom: 60, gap: 12 },
  title:         { fontFamily: 'monospace', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  sub:           { color: C.muted, fontSize: 14 },
  secLbl:        { color: C.muted, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, marginBottom: 8 },
  option:        { backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  optTitle:      { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  optDesc:       { color: C.muted, fontSize: 13 },
  btn:           { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  off:           { opacity: 0.4 },
  btnText:       { color: '#FFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
  scoresGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scoreBox:      { flex: 1, minWidth: '45%', backgroundColor: C.surface, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  scoreNum:      { fontFamily: 'monospace', fontSize: 26, fontWeight: '900' },
  scoreLbl:      { color: C.muted, fontSize: 12, marginTop: 3 },
  debriefCard:   { backgroundColor: C.surface, borderRadius: 12, borderLeftWidth: 3, padding: 14 },
  debriefText:   { color: C.text, fontSize: 15, lineHeight: 23 },
  sessionWrap:   { flex: 1, backgroundColor: C.bg },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  sessionPersona:{ fontFamily: 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  sessionDiff:   { color: C.muted, fontSize: 12, marginTop: 2 },
  endBtn:        { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.red },
  endBtnText:    { color: C.red, fontFamily: 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  chat:          { flex: 1 },
  chatContent:   { padding: 14, gap: 10 },
  bubble:        { borderRadius: 12, padding: 13, maxWidth: '90%' },
  userBubble:    { alignSelf: 'flex-end', backgroundColor: '#1E2A3A' },
  aiBubble:      { alignSelf: 'flex-start', backgroundColor: C.surface, borderWidth: 1 },
  bubbleLbl:     { fontSize: 9, fontFamily: 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 5 },
  bubbleText:    { color: C.text, fontSize: 14, lineHeight: 21 },
  inputArea:     { padding: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 10 },
  sendBtn:       { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
