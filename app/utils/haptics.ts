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
  | 'gauntletBegin';

function hapticsEnabled(): boolean {
  return useGameStore.getState().hapticsEnabled;
}

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
      case 'gestureThreshold':
        return ExpoHaptics.selectionAsync();
      case 'standardCorrect':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
      case 'heightenedCorrect':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
      case 'wrong':
        return ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
      case 'bossEntry': {
        const first = ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy), 100);
        return first;
      }
      case 'bossCorrect':
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
    }
  },
} as const;
