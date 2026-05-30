import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { C } from '../constants/theme';

interface Props {
  response: string;
  thinking: boolean;
  accent?: string;
}

export default function ClaudeBox({ response, thinking, accent = C.week[0] }: Props) {
  const d = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    if (!thinking) return;
    const anims = d.map((v, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 180),
        Animated.timing(v, { toValue: 1,   duration: 350, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.3, duration: 350, useNativeDriver: true }),
      ])),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [thinking]);

  if (!thinking && !response) return null;

  return (
    <View style={[s.box, { borderLeftColor: accent }]}>
      <Text style={[s.label, { color: accent }]}>CLAUDE</Text>
      {thinking ? (
        <View style={s.dots}>
          {d.map((v, i) => (
            <Animated.View key={i} style={[s.dot, { opacity: v, backgroundColor: accent }]} />
          ))}
          <Text style={s.thinkingText}>thinking…</Text>
        </View>
      ) : (
        <Text style={s.text}>{response}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  box:          { backgroundColor: C.surface, borderRadius: 12, borderLeftWidth: 3, padding: 14 },
  label:        { fontSize: 10, fontFamily: 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  dots:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  thinkingText: { color: C.muted, fontSize: 13, fontStyle: 'italic', marginLeft: 4 },
  text:         { color: C.text, fontSize: 15, lineHeight: 23 },
});
