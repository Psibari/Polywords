import * as ExpoHaptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';

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
} as const;
