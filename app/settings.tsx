import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, Switch,
  TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getSettings, saveSettings, getApiKey, saveApiKey, resetAll, getCurrentDay } from '../utils/storage';
import { scheduleDaily, requestPermissions } from '../utils/notifications';
import { C } from '../constants/theme';

export default function Settings() {
  const router = useRouter();
  const [mH, setMH] = useState('6');
  const [mM, setMM] = useState('00');
  const [eH, setEH] = useState('21');
  const [eM, setEM] = useState('00');
  const [notifs, setNotifs] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setMH(String(s.morningHour));
      setMM(String(s.morningMin).padStart(2, '0'));
      setEH(String(s.eveningHour));
      setEM(String(s.eveningMin).padStart(2, '0'));
      setNotifs(s.notifsEnabled);
      const k = await getApiKey();
      if (k) setApiKey(k);
    })();
  }, []);

  async function save() {
    const mh = parseInt(mH, 10), mm = parseInt(mM, 10);
    const eh = parseInt(eH, 10), em = parseInt(eM, 10);
    if ([mh, mm, eh, em].some(isNaN) || mh > 23 || mm > 59 || eh > 23 || em > 59) {
      Alert.alert('Invalid time', 'Hours must be 0–23, minutes 0–59.'); return;
    }
    await saveSettings({ morningHour: mh, morningMin: mm, eveningHour: eh, eveningMin: em, notifsEnabled: notifs });
    if (apiKey.trim()) await saveApiKey(apiKey.trim());
    if (notifs) { await requestPermissions(); await scheduleDaily(await getCurrentDay()); }
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  function confirmReset() {
    Alert.alert('Reset all data', 'This deletes all logs, sessions and settings. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => { await resetAll(); router.replace('/setup'); } },
    ]);
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>
      {/* API Key */}
      <Text style={s.secLbl}>API KEY</Text>
      <View style={s.keyRow}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          value={showKey ? apiKey : apiKey ? '••••••••••••••••' : ''}
          onChangeText={setApiKey}
          placeholder="sk-ant-…"
          placeholderTextColor={C.dim}
          autoCapitalize="none"
          autoCorrect={false}
          editable={showKey}
        />
        <TouchableOpacity style={s.toggleBtn} onPress={() => setShowKey(v => !v)}>
          <Text style={s.toggleText}>{showKey ? 'HIDE' : 'EDIT'}</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <Text style={[s.secLbl, { marginTop: 24 }]}>NOTIFICATIONS</Text>
      <View style={s.row}>
        <Text style={s.rowLbl}>Enable notifications</Text>
        <Switch value={notifs} onValueChange={setNotifs} trackColor={{ false: C.border, true: C.week[0] }} thumbColor="#FFF" />
      </View>

      <Text style={s.fieldLbl}>Morning time</Text>
      <View style={s.timeRow}>
        <TextInput style={s.timeInput} value={mH} onChangeText={setMH} keyboardType="number-pad" maxLength={2} />
        <Text style={s.colon}>:</Text>
        <TextInput style={s.timeInput} value={mM} onChangeText={setMM} keyboardType="number-pad" maxLength={2} />
      </View>

      <Text style={s.fieldLbl}>Evening time</Text>
      <View style={s.timeRow}>
        <TextInput style={s.timeInput} value={eH} onChangeText={setEH} keyboardType="number-pad" maxLength={2} />
        <Text style={s.colon}>:</Text>
        <TextInput style={s.timeInput} value={eM} onChangeText={setEM} keyboardType="number-pad" maxLength={2} />
      </View>

      <TouchableOpacity style={[s.btn, { backgroundColor: C.week[0] }]} onPress={save}>
        <Text style={s.btnText}>{saved ? '✓ SAVED' : 'SAVE SETTINGS'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[s.btn, s.dangerBtn]} onPress={confirmReset}>
        <Text style={[s.btnText, { color: C.red }]}>RESET ALL DATA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: C.bg },
  content:    { padding: 24, paddingBottom: 60 },
  secLbl:     { color: C.muted, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  input:      { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 15, padding: 14 },
  keyRow:     { flexDirection: 'row', gap: 10, alignItems: 'center' },
  toggleBtn:  { paddingHorizontal: 14, paddingVertical: 14, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  toggleText: { color: C.muted, fontFamily: 'monospace', fontSize: 11, letterSpacing: 1 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  rowLbl:     { color: C.text, fontSize: 15 },
  fieldLbl:   { color: C.muted, fontSize: 13, marginBottom: 8 },
  timeRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  timeInput:  { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 22, fontFamily: 'monospace', padding: 12, width: 64, textAlign: 'center' },
  colon:      { color: C.muted, fontSize: 24, fontWeight: '700' },
  btn:        { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  dangerBtn:  { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.red },
  btnText:    { color: '#FFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 14, letterSpacing: 2 },
});
