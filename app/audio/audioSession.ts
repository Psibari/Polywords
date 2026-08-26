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
      // 'mixWithOthers' caused every player.play() call to throw expo-audio's
      // native "Session activation failed" (AVAudioSession.setActive) on iOS,
      // permanently silencing music and SFX once the bounded rebuild
      // self-heal in MusicEngine.ts/sfx.ts exhausted its attempts. 'doNotMix'
      // does not add this failing category option and is device-confirmed
      // fixed (2026-08-19). See CONTEXT.md for the investigation.
      interruptionMode: 'doNotMix',
    });

    audioSessionPromise = new Promise<void>(resolve => {
      let settled = false;
      let timedOut = false;
      const finish = (message?: string, error?: unknown) => {
        if (settled) return;
        settled = true;
        if (message) warnDev(message, error);
        resolve();
      };
      const timeoutId = setTimeout(() => {
        timedOut = true;
        finish(`setAudioModeAsync did not settle within ${CONFIGURE_TIMEOUT_MS}ms — continuing without confirmation.`);
      }, CONFIGURE_TIMEOUT_MS);

      configure.then(
        () => {
          clearTimeout(timeoutId);
          finish();
        },
        error => {
          clearTimeout(timeoutId);
          // A late rejection means the timed-out attempt really failed.
          // Clear the shared promise now so a later audio request can make
          // one fresh attempt, without overlapping the native call that just
          // settled.
          audioSessionPromise = null;
          finish('setAudioModeAsync rejected.', error);
        },
      );
    });
  }

  return audioSessionPromise;
}
