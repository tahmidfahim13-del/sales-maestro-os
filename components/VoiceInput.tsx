/**
 * VoiceInput: tap mic to record (expo-av), tap again to stop.
 * Audio URI is surfaced via onAudioReady for base64 processing.
 * A multiline TextInput lets the user type/edit their input directly —
 * this is the primary text carrier sent to Claude.
 */
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Alert } from 'react-native';
import MicButton from './MicButton';
import { startRecording, stopRecording } from '../utils/audio';
import { C } from '../constants/theme';

interface Props {
  value: string;
  onChange: (t: string) => void;
  onAudioReady?: (uri: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function VoiceInput({
  value, onChange, onAudioReady, placeholder, disabled,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [hint, setHint] = useState('');

  async function handleMic() {
    if (recording) {
      setHint('Processing…');
      const uri = await stopRecording();
      setRecording(false);
      if (uri) {
        setHint('Recording saved — edit above if needed, then submit.');
        onAudioReady?.(uri);
      } else {
        setHint('');
      }
    } else {
      const ok = await startRecording();
      if (!ok) {
        Alert.alert('Permission required', 'Microphone access was denied.');
        return;
      }
      setRecording(true);
      setHint('Recording… tap mic to stop.');
    }
  }

  return (
    <View style={s.wrap}>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? 'Speak or type here…'}
        placeholderTextColor={C.dim}
        multiline
        editable={!disabled && !recording}
        textAlignVertical="top"
      />
      <View style={s.micRow}>
        <MicButton recording={recording} onPress={handleMic} disabled={disabled} />
        {!!hint && <Text style={s.hint}>{hint}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:   { gap: 6 },
  input:  {
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
    padding: 14,
  },
  micRow: { alignItems: 'center', paddingVertical: 4, gap: 8 },
  hint:   { color: C.muted, fontSize: 13, textAlign: 'center' },
});
