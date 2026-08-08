import { setAudioModeAsync } from 'expo-audio';

let audioSessionPromise: Promise<void> | null = null;

// setAudioModeAsync has been observed to hang indefinitely on-device
// (Expo Go, physical iPhone, 2026-08-08) — neither resolving nor
// rejecting. Every audio subsystem (SFX pools, MusicEngine) shares this
// one promise, so an unbounded wait here silently took down all audio in
// the app at once, with no error logged anywhere (a hang isn't a
// rejection). Bounding it converts that into a visible warning plus a
// graceful continue, instead of a permanent, silent, app-wide outage.
const CONFIGURE_TIMEOUT_MS = 2500;

function warnDev(message: string, error?: unknown): void {
  if (!__DEV__) return;
  if (error === undefined) {
    console.warn(`[AudioSession] ${message}`);
  } else {
    console.warn(`[AudioSession] ${message}`, error);
  }
}

// Expo Audio mode is app-global. Every audio subsystem shares this one
// idempotent configuration so SFX and music cannot race different modes.
export function ensureAudioSessionConfigured(): Promise<void> {
  if (!audioSessionPromise) {
    const configure = setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });

    configure.catch(error => {
      // Reset so a later caller gets a fresh attempt instead of being
      // stuck sharing this rejected promise for the rest of the session.
      audioSessionPromise = null;
      warnDev('setAudioModeAsync rejected.', error);
    });

    const timeout = new Promise<void>(resolve => {
      setTimeout(() => {
        warnDev(`setAudioModeAsync did not settle within ${CONFIGURE_TIMEOUT_MS}ms — continuing without confirmation.`);
        resolve();
      }, CONFIGURE_TIMEOUT_MS);
    });

    audioSessionPromise = Promise.race([configure, timeout]).then(() => undefined, () => undefined);
  }

  return audioSessionPromise;
}
