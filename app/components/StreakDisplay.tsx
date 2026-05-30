import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/useGameStore';

function streakColor(streak: number): string {
  'worklet';
  if (streak >= 7) return '#FF4500';
  if (streak >= 5) return '#FF9500';
  if (streak >= 3) return '#FFD700';
  return '#FFFFFF';
}

function milestoneLabel(milestone: 3 | 5 | 7): string {
  if (milestone === 3) return 'Keep moving.';
  if (milestone === 5) return "Now you're in it.";
  return 'Unstoppable.';
}

export function StreakDisplay() {
  const streak = useGameStore(s => s.game.streak);
  const streakMilestone = useGameStore(s => s.game.streakMilestone);
  const consumeMilestone = useGameStore(s => s.consumeMilestone);

  const streakSV = useSharedValue(0);
  const milestoneSV = useSharedValue<3 | 5 | 7 | null>(null);

  const scale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const labelTransY = useSharedValue(0);
  const labelOpacity = useSharedValue(0);

  useEffect(() => { streakSV.value = streak; }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { milestoneSV.value = streakMilestone; }, [streakMilestone]); // eslint-disable-line react-hooks/exhaustive-deps

  const [visible, setVisible] = useState(false);
  const [labelText, setLabelText] = useState('');
  const prevStreakRef = useRef(0);

  // Scale pop on increment, scale-out on reset to 0
  useEffect(() => {
    const prev = prevStreakRef.current;
    prevStreakRef.current = streak;

    if (streak > 0) {
      if (prev === 0) scale.value = 0;
      setVisible(true);
      scale.value = withSequence(
        withSpring(1.35, { damping: 3, stiffness: 400 }),
        withSpring(1.0, { damping: 15, stiffness: 200 }),
      );
    } else if (prev > 0) {
      scale.value = withSequence(
        withTiming(1.1, { duration: 80 }),
        withTiming(0, { duration: 200 }),
      );
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  // Milestone: glow ring, floating label, haptic
  useEffect(() => {
    if (!streakMilestone) return;

    setLabelText(milestoneLabel(streakMilestone));

    glowOpacity.value = withSequence(
      withTiming(1,   { duration: 166 }),
      withTiming(0.6, { duration: 166 }),
      withTiming(1,   { duration: 166 }),
      withTiming(0,   { duration: 332 }),
    );

    labelTransY.value = 0;
    labelOpacity.value = 1;
    labelTransY.value = withTiming(-28, { duration: 1100 });
    labelOpacity.value = withSequence(
      withTiming(1, { duration: 800 }),
      withTiming(0, { duration: 300 }),
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: playSound('streak') — add when streak sound file exists

    consumeMilestone();
  }, [streakMilestone]); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedCounterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    color: streakColor(streakSV.value),
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    borderColor: streakColor(streakSV.value),
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: labelTransY.value }],
    opacity: labelOpacity.value,
  }));

  if (!visible) return <View style={styles.placeholder} />;

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glowRing, animatedGlowStyle]}
      />
      <Animated.Text style={[styles.counter, animatedCounterStyle]}>
        ×{streak}
      </Animated.Text>
      <Animated.Text
        pointerEvents="none"
        style={[styles.milestoneLabel, animatedLabelStyle]}
      >
        {labelText}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    minWidth: 64,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    overflow: 'visible',
  },
  glowRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
  },
  counter: {
    fontSize: 28,
    fontFamily: 'BagelFatOne_400Regular',
    fontWeight: '400',
  },
  milestoneLabel: {
    position: 'absolute',
    top: -20,
    color: '#FFD700',
    fontSize: 13,
    fontFamily: 'BagelFatOne_400Regular',
    fontWeight: '400',
    textAlign: 'center',
    width: 120,
  },
});
