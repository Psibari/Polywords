import { setAudioModeAsync } from 'expo-audio';

let audioSessionPromise: Promise<void> | null = null;

// Expo Audio mode is app-global. Every audio subsystem shares this one
// idempotent configuration so SFX and music cannot race different modes.
export function ensureAudioSessionConfigured(): Promise<void> {
  if (!audioSessionPromise) {
    audioSessionPromise = setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    }).catch(error => {
      audioSessionPromise = null;
      throw error;
    });
  }

  return audioSessionPromise;
}
