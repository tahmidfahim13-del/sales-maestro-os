import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { setLastOpen } from '../utils/storage';
import { C } from '../constants/theme';

export default function Reentry() {
  const router = useRouter();
  const { days } = useLocalSearchParams<{ days: string }>();

  return (
    <View style={s.c}>
      <Text style={s.num}>{days}</Text>
      <Text style={s.lbl}>DAYS AWAY</Text>
      <View style={s.line} />
      <Text style={s.msg}>You're not restarting.{'\n'}You're continuing.</Text>
      <Text style={s.sub}>The gap doesn't erase the work.{'\n'}Close it.</Text>
      <TouchableOpacity
        style={[s.btn, { backgroundColor: C.week[0] }]}
        onPress={async () => { await setLastOpen(); router.replace('/home'); }}
      >
        <Text style={s.btnText}>CONTINUE →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  c:       { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 40 },
  num:     { fontFamily: 'monospace', fontSize: 96, fontWeight: '900', color: C.red, lineHeight: 100 },
  lbl:     { fontFamily: 'monospace', fontSize: 13, letterSpacing: 4, color: C.muted, marginBottom: 36 },
  line:    { width: 60, height: 2, backgroundColor: C.border, marginBottom: 36 },
  msg:     { fontSize: 28, fontWeight: '700', color: C.text, textAlign: 'center', lineHeight: 38, marginBottom: 16 },
  sub:     { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 24, marginBottom: 56 },
  btn:     { borderRadius: 14, paddingVertical: 18, paddingHorizontal: 60 },
  btnText: { color: '#FFF', fontFamily: 'monospace', fontWeight: '800', fontSize: 16, letterSpacing: 3 },
});
