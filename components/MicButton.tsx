import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface Props {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function MicButton({ isRecording, onPress, disabled }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      const ringLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(ring, { toValue: 1.5, duration: 900, useNativeDriver: true }),
          Animated.timing(ring, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      );
      pulseLoop.start();
      ringLoop.start();
      return () => {
        pulseLoop.stop();
        ringLoop.stop();
      };
    } else {
      pulse.setValue(1);
      ring.setValue(1);
    }
  }, [isRecording]);

  const bgColor = isRecording ? COLORS.micActive : '#2A2A3A';
  const iconColor = isRecording ? '#FFFFFF' : COLORS.micIdle;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pulse }] }]}>
      {isRecording && (
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: ring }],
              opacity: ring.interpolate({ inputRange: [1, 1.5], outputRange: [0.4, 0] }),
            },
          ]}
        />
      )}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[styles.button, { backgroundColor: bgColor }]}
        activeOpacity={0.8}
      >
        <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={36} color={iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.micActive,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.micActive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
});
