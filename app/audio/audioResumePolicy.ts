// When the app returns from a long absence, the audio objects it left behind
// (the music player and the sound-effect players) may be stale. iOS can restart
// its media service while an app is away, and Apple's guidance is to throw the
// old players away and create new ones. A 2026-11-07 TestFlight crash (build 17)
// froze on the first sound after a return from the background and was then
// killed by the watchdog, stuck waiting on the media service.
//
// This file holds only the decision, so it can be tested without a phone.

/** TEST VALUE: shorter absences keep the audio they already have. Pete's phone decides. */
export const AUDIO_REBUILD_AFTER_AWAY_MS = 60_000;

export function shouldRebuildAudioOnReturn(awayMs: number | null): boolean {
  if (awayMs === null || !Number.isFinite(awayMs) || awayMs < 0) return false;
  return awayMs >= AUDIO_REBUILD_AFTER_AWAY_MS;
}

/**
 * Measures how long the app was away. iOS reports `inactive` and then
 * `background`, so only the first departure counts; the clock restarts after
 * each return.
 */
export function createAwayTracker() {
  let leftAt: number | null = null;
  return {
    left(now: number): void {
      if (leftAt === null) leftAt = now;
    },
    returned(now: number): number | null {
      if (leftAt === null) return null;
      const away = now - leftAt;
      leftAt = null;
      return away;
    },
  };
}
