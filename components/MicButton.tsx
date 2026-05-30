import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../constants/theme';

interface Props {
  recording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function MicButton({ recording, onPress, disabled }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const ring  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!recording) { pulse.setValue(1); ring.setValue(1); return; }
    const p = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.00, duration: 600, useNativeDriver: true }),
    ]));
    const r = Animated.loop(Animated.sequence([
      Animated.timing(ring, { toValue: 1.6, duration: 900, useNativeDriver: true }),
      Animated.timing(ring, { toValue: 1.0, duration: 900, useNativeDriver: true }),
    ]));
    p.start(); r.start();
    return () => { p.stop(); r.stop(); };
  }, [recording]);

  return (
    <Animated.View style={[s.wrap, { transform: [{ scale: pulse }] }]}>
      {recording && (
        <Animated.View style={[s.ring, {
          transform: [{ scale: ring }],
          opacity: ring.interpolate({ inputRange: [1, 1.6], outputRange: [0.5, 0] }),
        }]} />
      )}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[s.btn, { backgroundColor: recording ? C.red : '#2A2A3A' }]}
      >
        <Ionicons name={recording ? 'mic' : 'mic-outline'} size={36} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: C.red },
  btn:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', elevation: 6 },
});
