import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const requestPermissions = useCallback(async () => {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const granted = await requestPermissions();
      if (!granted) return false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setTranscript('');
      return true;
    } catch {
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    if (!recordingRef.current) return '';
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      setIsRecording(false);
      recordingRef.current = null;
      return transcript;
    } catch {
      setIsRecording(false);
      return transcript;
    }
  }, [transcript]);

  const speak = useCallback((text: string, onDone?: () => void) => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      rate: 0.95,
      pitch: 1.0,
      onDone: () => {
        setIsSpeaking(false);
        onDone?.();
      },
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  const simulateTranscript = useCallback((words: string) => {
    setTranscript(words);
  }, []);

  return {
    isRecording,
    transcript,
    isSpeaking,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
    setTranscript,
    simulateTranscript,
  };
}
