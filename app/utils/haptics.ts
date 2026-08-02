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
  | 'mastery';

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
      case 'bossEntry':
      case 'bossCorrect':
      case 'bossHaunted':
        return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
      case 'mastery':
        return ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
    }
  },
} as const;
