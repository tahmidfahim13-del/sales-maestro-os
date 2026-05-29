import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getCurrentDay,
  getCurrentWeek,
  getTodayLog,
  saveDailyLog,
  updateStreak,
  DayTier,
  DailyLog,
} from '../utils/storage';
import { COLORS, WEEK_THEMES, TIER_LABELS } from '../constants/theme';
import { callClaude, buildDailyQuotePrompt } from '../utils/claude';

const MODULES = [
  { id: 'morning', label: 'Morning Check-In', icon: 'sunny-outline', field: 'morningDone' },
  { id: 'evening', label: 'Evening Audit', icon: 'moon-outline', field: 'eveningDone' },
  { id: 'braindump', label: 'Brain Dump', icon: 'flash-outline', field: null },
  { id: 'roleplay', label: 'Roleplay', icon: 'mic-outline', field: 'roleplayDone' },
  { id: 'weekly', label: 'Weekly Review', icon: 'bar-chart-outline', field: null },
];

export default function HomeScreen() {
  const router = useRouter();
  const [day, setDay] = useState(1);
  const [week, setWeek] = useState(1);
  const [streak, setStreak] = useState(0);
  const [tier, setTier] = useState<DayTier | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [quote, setQuote] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const weekTheme = WEEK_THEMES[week - 1] || WEEK_THEMES[0];
  const accentColor = weekTheme.color;

  async function loadData() {
    const d = await getCurrentDay();
    const w = getCurrentWeek(d);
    setDay(d);
    setWeek(w);
    const s = await updateStreak();
    setStreak(s);
    const l = await getTodayLog();
    setLog(l);
    if (l?.tier) setTier(l.tier);
  }

  async function fetchQuote(d: number, w: number) {
    try {
      const theme = WEEK_THEMES[w - 1];
      const q = await callClaude(
        buildDailyQuotePrompt(d, w, theme.name),
        [{ role: 'user', content: 'Give me today\'s line.' }],
      );
      setQuote(q);
    } catch {
      setQuote('Execute before you explain.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData().then(() => {
        getCurrentDay().then((d) => {
          const w = getCurrentWeek(d);
          fetchQuote(d, w);
        });
      });
    }, []),
  );

  async function selectTier(t: DayTier) {
    setTier(t);
    await saveDailyLog({ tier: t });
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const progress = Math.round((day / 28) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.dayLabel, { color: accentColor }]}>DAY {day} / 28</Text>
          <Text style={styles.weekTheme}>{weekTheme.name.toUpperCase()} — WEEK {week}</Text>
          <Text style={styles.tagline}>{weekTheme.tagline}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={22} color={COLORS.secondaryText} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
      </View>

      {quote ? (
        <View style={[styles.quoteCard, { borderLeftColor: accentColor }]}>
          <Text style={[styles.quoteLabel, { color: accentColor }]}>TODAY</Text>
          <Text style={styles.quoteText}>"{quote}"</Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: accentColor }]}>{streak}</Text>
          <Text style={styles.statLabel}>STREAK</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: accentColor }]}>{week}</Text>
          <Text style={styles.statLabel}>WEEK</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: accentColor }]}>{28 - day}</Text>
          <Text style={styles.statLabel}>DAYS LEFT</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TODAY'S TIER</Text>
        <View style={styles.tierRow}>
          {(['full', 'half', 'survival'] as DayTier[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tierBtn,
                tier === t && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
              onPress={() => selectTier(t)}
            >
              <Text style={[styles.tierText, tier === t && styles.tierTextActive]}>
                {TIER_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MODULES</Text>
        <View style={styles.moduleGrid}>
          {MODULES.map((m) => {
            const done = m.field ? !!(log as any)?.[m.field] : false;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.moduleCard, done && { borderColor: accentColor }]}
                onPress={() => router.push(`/${m.id}` as any)}
              >
                <Ionicons
                  name={m.icon as any}
                  size={28}
                  color={done ? accentColor : COLORS.secondaryText}
                />
                <Text style={[styles.moduleLabel, done && { color: accentColor }]}>
                  {m.label}
                </Text>
                {done && <Ionicons name="checkmark-circle" size={16} color={accentColor} style={styles.check} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  dayLabel: { fontFamily: 'monospace', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  weekTheme: { color: COLORS.primaryText, fontFamily: 'monospace', fontSize: 13, letterSpacing: 1, marginTop: 2 },
  tagline: { color: COLORS.secondaryText, fontSize: 13, marginTop: 2 },
  settingsBtn: { padding: 8 },
  progressBar: { height: 3, backgroundColor: COLORS.border, borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  quoteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    padding: 16,
    marginBottom: 20,
  },
  quoteLabel: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  quoteText: { color: COLORS.primaryText, fontSize: 15, lineHeight: 22, fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: { fontFamily: 'monospace', fontSize: 28, fontWeight: '900' },
  statLabel: { color: COLORS.mutedText, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionLabel: { color: COLORS.secondaryText, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  tierRow: { flexDirection: 'row', gap: 8 },
  tierBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  tierText: { color: COLORS.secondaryText, fontSize: 12, fontFamily: 'monospace' },
  tierTextActive: { color: '#FFFFFF', fontWeight: '700' },
  moduleGrid: { gap: 10 },
  moduleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  moduleLabel: { flex: 1, color: COLORS.primaryText, fontSize: 15, fontWeight: '600' },
  check: { marginLeft: 'auto' },
});
