import React, { useCallback, useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { C, WEEK_THEMES, WEEK_TAGLINES } from '../constants/theme';
import {
  getCurrentDay, weekOf, getTodayLog, saveLog,
  updateStreak, Tier, DayLog,
} from '../utils/storage';
import { askClaude, PROMPTS } from '../utils/claude';

const TIERS: { id: Tier; label: string }[] = [
  { id: 'full',     label: 'Full Day' },
  { id: 'half',     label: 'Half Day' },
  { id: 'survival', label: 'Survival Day' },
];

const MODULES = [
  { route: '/morning',   label: 'Morning Check-In', icon: 'sunny-outline',     field: 'morningDone'  },
  { route: '/evening',   label: 'Evening Audit',     icon: 'moon-outline',      field: 'eveningDone'  },
  { route: '/braindump', label: 'Brain Dump',         icon: 'flash-outline',     field: null           },
  { route: '/roleplay',  label: 'Roleplay',           icon: 'mic-outline',       field: 'roleplayDone' },
  { route: '/weekly',    label: 'Weekly Review',      icon: 'bar-chart-outline', field: null           },
];

export default function HomeScreen() {
  const router = useRouter();
  const [day,        setDay]        = useState(1);
  const [week,       setWeek]       = useState(1);
  const [streak,     setStreak]     = useState(0);
  const [tier,       setTier]       = useState<Tier | null>(null);
  const [log,        setLog]        = useState<DayLog | null>(null);
  const [quote,      setQuote]      = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const accent = C.week[(week - 1) % 4];

  async function load() {
    const d = await getCurrentDay();
    const w = weekOf(d);
    setDay(d); setWeek(w);
    setStreak(await updateStreak());
    const l = await getTodayLog();
    setLog(l);
    if (l?.tier) setTier(l.tier);
  }

  async function fetchQuote(d: number, w: number) {
    try {
      const q = await askClaude(
        PROMPTS.quote(d, WEEK_THEMES[w - 1]),
        [{ role: 'user', content: 'Give me today\'s line.' }],
      );
      setQuote(q);
    } catch {
      setQuote('Execute before you explain.');
    }
  }

  useFocusEffect(useCallback(() => {
    load().then(() =>
      getCurrentDay().then(d => fetchQuote(d, weekOf(d))),
    );
  }, []));

  async function pickTier(t: Tier) {
    setTier(t);
    await saveLog({ tier: t });
  }

  const pct = Math.round((day / 28) * 100);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          tintColor={accent}
        />
      }
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[s.dayNum, { color: accent }]}>DAY {day} / 28</Text>
          <Text style={s.weekLine}>{WEEK_THEMES[week - 1].toUpperCase()} — WEEK {week}</Text>
          <Text style={s.tagline}>{WEEK_TAGLINES[week - 1]}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={s.gear}>
          <Ionicons name="settings-outline" size={22} color={C.muted} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={s.bar}>
        <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: accent }]} />
      </View>

      {/* Daily quote */}
      {!!quote && (
        <View style={[s.quoteCard, { borderLeftColor: accent }]}>
          <Text style={[s.quoteLabel, { color: accent }]}>TODAY</Text>
          <Text style={s.quoteText}>"{quote}"</Text>
        </View>
      )}

      {/* Stats */}
      <View style={s.statsRow}>
        {([['streak', streak], ['week', week], ['left', 28 - day]] as [string, number][]).map(([l, v]) => (
          <View key={l} style={s.stat}>
            <Text style={[s.statN, { color: accent }]}>{v}</Text>
            <Text style={s.statL}>{l.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      {/* Tier picker */}
      <Text style={s.secLabel}>TODAY'S TIER</Text>
      <View style={s.tierRow}>
        {TIERS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[s.tierBtn, tier === t.id && { backgroundColor: accent, borderColor: accent }]}
            onPress={() => pickTier(t.id)}
          >
            <Text style={[s.tierText, tier === t.id && { color: '#FFF', fontWeight: '700' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modules */}
      <Text style={s.secLabel}>MODULES</Text>
      {MODULES.map(m => {
        const done = m.field ? !!(log as any)?.[m.field] : false;
        return (
          <TouchableOpacity
            key={m.route}
            style={[s.module, done && { borderColor: accent }]}
            onPress={() => router.push(m.route as any)}
          >
            <Ionicons name={m.icon as any} size={26} color={done ? accent : C.muted} />
            <Text style={[s.moduleLabel, done && { color: accent }]}>{m.label}</Text>
            {done && <Ionicons name="checkmark-circle" size={16} color={accent} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:      { flex: 1, backgroundColor: C.bg },
  content:     { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  dayNum:      { fontFamily: 'monospace', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  weekLine:    { color: C.text, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1, marginTop: 2 },
  tagline:     { color: C.muted, fontSize: 13, marginTop: 2 },
  gear:        { padding: 8 },
  bar:         { height: 3, backgroundColor: C.border, borderRadius: 2, marginBottom: 18, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 2 },
  quoteCard:   { backgroundColor: C.surface, borderRadius: 12, borderLeftWidth: 3, padding: 14, marginBottom: 18 },
  quoteLabel:  { fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  quoteText:   { color: C.text, fontSize: 14, lineHeight: 21, fontStyle: 'italic' },
  statsRow:    { flexDirection: 'row', gap: 10, marginBottom: 22 },
  stat:        { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statN:       { fontFamily: 'monospace', fontSize: 26, fontWeight: '900' },
  statL:       { color: C.dim, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, marginTop: 3 },
  secLabel:    { color: C.muted, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  tierRow:     { flexDirection: 'row', gap: 8, marginBottom: 22 },
  tierBtn:     { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.surface },
  tierText:    { color: C.muted, fontSize: 11, fontFamily: 'monospace' },
  module:      { backgroundColor: C.surface, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, gap: 12, marginBottom: 10 },
  moduleLabel: { flex: 1, color: C.text, fontSize: 15, fontWeight: '600' },
});
