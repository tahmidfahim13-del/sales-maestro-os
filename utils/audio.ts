/**
 * Audio recording via expo-av.
 * Records to a local URI, then reads it as base64 so it can be
 * embedded in an Anthropic API request if/when audio input is supported,
 * or handed off to any other transcription service.
 */
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

let _recording: Audio.Recording | null = null;

export async function startRecording(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return false;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    _recording = recording;
    return true;
  } catch {
    return false;
  }
}

export async function stopRecording(): Promise<string | null> {
  if (!_recording) return null;
  try {
    await _recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = _recording.getURI();
    _recording = null;
    return uri ?? null;
  } catch {
    _recording = null;
    return null;
  }
}

export async function uriToBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
