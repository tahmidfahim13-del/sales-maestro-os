import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSettings, saveSettings, saveApiKey, getApiKey, getCurrentDay } from '../utils/storage';
import { scheduleNotifications, requestNotificationPermissions } from '../utils/notifications';
import { COLORS } from '../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const [morningHour, setMorningHour] = useState('6');
  const [morningMin, setMorningMin] = useState('0');
  const [eveningHour, setEveningHour] = useState('21');
  const [eveningMin, setEveningMin] = useState('0');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const s = await getSettings();
      setMorningHour(String(s.morningNotifHour));
      setMorningMin(String(s.morningNotifMinute).padStart(2, '0'));
      setEveningHour(String(s.eveningNotifHour));
      setEveningMin(String(s.eveningNotifMinute).padStart(2, '0'));
      setNotifEnabled(s.notificationsEnabled);
      const k = await getApiKey();
      if (k) setApiKey(k);
    }
    load();
  }, []);

  async function handleSave() {
    const mh = parseInt(morningHour, 10);
    const mm = parseInt(morningMin, 10);
    const eh = parseInt(eveningHour, 10);
    const em = parseInt(eveningMin, 10);
    if (isNaN(mh) || mh < 0 || mh > 23 || isNaN(mm) || mm < 0 || mm > 59 ||
      isNaN(eh) || eh < 0 || eh > 23 || isNaN(em) || em < 0 || em > 59) {
      Alert.alert('Invalid times', 'Please enter valid hours (0-23) and minutes (0-59).');
      return;
    }
    await saveSettings({
      morningNotifHour: mh,
      morningNotifMinute: mm,
      eveningNotifHour: eh,
      eveningNotifMinute: em,
      notificationsEnabled: notifEnabled,
    });
    if (apiKey.trim()) await saveApiKey(apiKey.trim());
    if (notifEnabled) {
      await requestNotificationPermissions();
      const day = await getCurrentDay();
      await scheduleNotifications(day);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleReset() {
    Alert.alert(
      'Reset All Data',
      'This will delete all your logs, streaks, and session history. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/setup');
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>API KEY</Text>
        <View style={styles.keyRow}>
          <TextInput
            style={[styles.input, styles.keyInput]}
            value={showKey ? apiKey : apiKey ? '••••••••••••••••' : ''}
            onChangeText={setApiKey}
            placeholder="sk-ant-..."
            placeholderTextColor={COLORS.mutedText}
            autoCapitalize="none"
            autoCorrect={false}
            editable={showKey}
          />
          <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.showBtn}>
            <Text style={styles.showBtnText}>{showKey ? 'HIDE' : 'EDIT'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Enable notifications</Text>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: COLORS.border, true: COLORS.week1 }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Morning hour</Text>
            <TextInput style={styles.timeInput} value={morningHour} onChangeText={setMorningHour} keyboardType="number-pad" maxLength={2} />
          </View>
          <Text style={styles.colon}>:</Text>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Minute</Text>
            <TextInput style={styles.timeInput} value={morningMin} onChangeText={setMorningMin} keyboardType="number-pad" maxLength={2} />
          </View>
          <Text style={styles.timeSep}>AM</Text>
        </View>
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Evening hour</Text>
            <TextInput style={styles.timeInput} value={eveningHour} onChangeText={setEveningHour} keyboardType="number-pad" maxLength={2} />
          </View>
          <Text style={styles.colon}>:</Text>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Minute</Text>
            <TextInput style={styles.timeInput} value={eveningMin} onChangeText={setEveningMin} keyboardType="number-pad" maxLength={2} />
          </View>
          <Text style={styles.timeSep}>PM</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{saved ? '✓ SAVED' : 'SAVE SETTINGS'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetBtnText}>RESET ALL DATA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 60 },
  section: { marginBottom: 32 },
  sectionLabel: { color: COLORS.secondaryText, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, marginBottom: 14 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.primaryText,
    fontSize: 15,
    padding: 14,
  },
  keyRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  keyInput: { flex: 1 },
  showBtn: { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  showBtnText: { color: COLORS.secondaryText, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  rowLabel: { color: COLORS.primaryText, fontSize: 15 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16 },
  timeBlock: { alignItems: 'center' },
  timeLabel: { color: COLORS.mutedText, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 6 },
  timeInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.primaryText,
    fontSize: 22,
    fontFamily: 'monospace',
    padding: 12,
    width: 64,
    textAlign: 'center',
  },
  colon: { color: COLORS.secondaryText, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  timeSep: { color: COLORS.secondaryText, fontSize: 14, fontFamily: 'monospace', marginBottom: 14 },
  saveBtn: { backgroundColor: COLORS.week1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  saveBtnText: { color: '#FFFFFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
  resetBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.micActive },
  resetBtnText: { color: COLORS.micActive, fontFamily: 'monospace', fontWeight: '700', fontSize: 14, letterSpacing: 2 },
});
