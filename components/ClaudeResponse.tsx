import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  response: string;
  thinking: boolean;
  accentColor?: string;
}

export default function ClaudeResponse({ response, thinking, accentColor = COLORS.week1 }: Props) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!thinking) return;
    const makeAnim = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      );
    const a1 = makeAnim(dot1, 0);
    const a2 = makeAnim(dot2, 200);
    const a3 = makeAnim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [thinking]);

  if (!thinking && !response) return null;

  return (
    <View style={[styles.container, { borderLeftColor: accentColor }]}>
      <Text style={[styles.label, { color: accentColor }]}>CLAUDE</Text>
      {thinking ? (
        <View style={styles.thinkingRow}>
          <Animated.View style={[styles.dot, { opacity: dot1, backgroundColor: accentColor }]} />
          <Animated.View style={[styles.dot, { opacity: dot2, backgroundColor: accentColor }]} />
          <Animated.View style={[styles.dot, { opacity: dot3, backgroundColor: accentColor }]} />
          <Text style={styles.thinkingText}>thinking...</Text>
        </View>
      ) : (
        <Text style={styles.responseText}>{response}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    padding: 14,
    marginTop: 8,
  },
  label: {
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 8,
    fontWeight: '700',
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  thinkingText: {
    color: COLORS.secondaryText,
    fontSize: 14,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  responseText: {
    color: COLORS.primaryText,
    fontSize: 15,
    lineHeight: 23,
  },
});
