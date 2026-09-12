import * as ExpoHaptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';

export type HapticCue =
  | 'gestureThreshold'
  | 'standardCorrect'
  | 'heightenedCorrect'
  | 'wrong'
  | 'bossEntry'
  | 'bossCorrect'
  | 'bossHaunted'
  | 'masteredBookImpact'
  | 'hauntedBookImpact'
  | 'mastery'
  | 'gauntletPick'
  | 'gauntletBegin'
  | 'gauntletWallTremble'
  | 'gauntletBrickTear'
  | 'gauntletBrickLand'
  | 'dailyInkPress'
  | 'dailyRodStop';

function hapticsEnabled(): boolean {
  return useGameStore.getState().hapticsEnabled;
}

// gauntletWallTremble fires a burst of one-shots rather than a single call,
// so its pulses can outlive the moment that started them (e.g. a fast exit
// from the gauntlet). Tracked here rather than returned from cueAsync, which
// must keep returning Promise<void> for every other cue — cancelled through
// the companion Haptics.cancelGauntletWallTremble() instead.
let gauntletWallTrembleTimeouts: ReturnType<typeof setTimeout>[] = [];

/**
 * Single haptics gateway for player-facing feedback.
 *
 * Keeping the preference check here makes Settings authoritative without
 * asking every animation or gameplay presenter to duplicate store logic.
 */
export const Haptics = {
  ImpactFeedbackStyle: ExpoHaptics.ImpactFeedbackStyle,
  NotificationFeedbackType: ExpoHaptics.NotificationFeedbackType,

  impactAsync(
    style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Medium,
  ): Promise<void> {
    if (!hapticsEnabled()) return Promise.resolve();
    return ExpoHaptics.impactAsync(style);
  },

  notificationAsync(type: ExpoHaptics.NotificationFeedbackType): Promise<void> {
    if (!hapticsEnabled()) return Promise.resolve();
    return ExpoHaptics.notificationAsync(type);
  },

  selectionAsync(): Promise<void> {
    if (!hapticsEnabled()) return Promise.resolve();
    return ExpoHaptics.selectionAsync();
  },

  cueAsync(cue: HapticCue): Promise<void> {
    if (!hapticsEnabled()) return Promise.resolve();
    switch (cue) {
      // selectionAsync is built for a stationary finger on a picker wheel; it
      // read as nothing at the 24px gesture threshold on device. Rigid sits
      // below the ceiling reserved for boss beats (Pete, 2026-09-12).
      case 'gestureThreshold':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
      case 'standardCorrect':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      // Heavy is reserved for boss beats, so this climbs by rhythm instead of
      // force: a double Medium pulse, same shape as gauntletBegin's pulses
      // (Pete, 2026-09-12).
      case 'heightenedCorrect': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 90);
        return first;
      }
      case 'wrong':
        return ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
      case 'bossEntry': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy), 100);
        return first;
      }
      // Heavy is the ceiling, and standardCorrect moved up to Medium, so a
      // single Heavy no longer reads as distinct from a routine correct.
      // bossCorrect climbs by shape instead of force: Rigid then Heavy,
      // same principle as bossEntry's own pulse (Pete, 2026-09-12).
      case 'bossCorrect': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy), 60);
        return first;
      }
      case 'bossHaunted':
      case 'masteredBookImpact':
      case 'hauntedBookImpact':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
      case 'mastery':
        return ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
      case 'gauntletPick':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      // Deliberately NOT bossEntry's double-heavy-pulse — reusing that cue
      // for a second, different moment made the gauntlet's own arrival feel
      // like more of the same instead of a distinct beat (Pete, 2026-08-15).
      // Three quick Medium pulses instead of two slow Heavy ones: faster,
      // lighter rhythm reads as "here we go" rather than repeating the
      // entrance's own weight, and echoes the 3-tile gauntlet itself.
      case 'gauntletBegin': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 90);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium), 180);
        return first;
      }
      // The Daily scroll's two physical contacts: the word pressing into the
      // parchment, and the rod arriving at its stop. Light then Medium, so
      // the rod lands heavier than the ink — the rod is the bigger object.
      case 'dailyInkPress':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      case 'dailyRodStop':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      // expo-haptics has no sustained or variable-length haptic, so the wall
      // rumble is simulated: seven Soft impacts at 60ms spacing, tight enough
      // to fuse into one continuous grind rather than read as seven separate
      // taps. Soft, not Light and not Rigid — dull and diffuse is the texture
      // of stone grinding in a wall, and Rigid is already spoken for by
      // gestureThreshold. The burst ends at 360ms, 40ms before the first
      // brick launches at BRICK_LEAD_IN_MS (400ms) (Pete, 2026-09-12).
      case 'gauntletWallTremble': {
        gauntletWallTrembleTimeouts.forEach(clearTimeout);
        gauntletWallTrembleTimeouts = [];
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft);
        [60, 120, 180, 240, 300, 360].forEach((delay) => {
          gauntletWallTrembleTimeouts.push(
            setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft), delay),
          );
        });
        return first;
      }
      // The entrance's remaining two beats ride the same call sites as their
      // sound, never a timer of their own — a parallel setTimeout against
      // BRICK_LEAD_IN_MS/BRICK_STAGGER_MS/BRICK_FLIGHT_MS would drift from the
      // actual animation and silently break if those constants are retuned.
      // Three-beat physics: grind (gauntletWallTremble), crack (this tear),
      // seat (the land below). Flight between them is deliberately silent —
      // that silence is what makes the landing read.
      case 'gauntletBrickTear':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);
      case 'gauntletBrickLand':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
    }
  },

  cancelGauntletWallTremble(): void {
    gauntletWallTrembleTimeouts.forEach(clearTimeout);
    gauntletWallTrembleTimeouts = [];
  },
} as const;
