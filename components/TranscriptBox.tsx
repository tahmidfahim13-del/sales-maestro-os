import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  transcript: string;
  placeholder?: string;
}

export default function TranscriptBox({ transcript, placeholder = 'Tap the mic and speak...' }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.text, !transcript && styles.placeholder]}>
          {transcript || placeholder}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
    maxHeight: 180,
    padding: 14,
  },
  scroll: {
    flex: 1,
  },
  text: {
    color: COLORS.primaryText,
    fontSize: 16,
    lineHeight: 24,
  },
  placeholder: {
    color: COLORS.mutedText,
    fontStyle: 'italic',
  },
});
