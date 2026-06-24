import { Animated, Easing } from 'react-native';
import { PW } from './pwTheme';

const HB = PW.motion.heroBook;

// Perspective value for the static 3D wrapper that holds the cover's depth.
export const HERO_BOOK_PERSPECTIVE = HB.perspective;

// Interpolation range + outputs for mapping the swing Animated.Value to rotateX.
export const HERO_BOOK_SWING_INPUT_RANGE = [HB.openAngle, HB.closedAngle, HB.overshootAngle] as const;
export const HERO_BOOK_SWING_OUTPUT_RANGE = [
  `${HB.openAngle}deg`,
  `${HB.closedAngle}deg`,
  `${HB.overshootAngle}deg`,
] as const;

// Reset the swing value to fully open (start of entrance).
export function heroBookSetOpen(swing: Animated.Value): void {
  swing.setValue(HB.openAngle);
}

// Entrance: cover swings shut — open → overshoot → settle → closed.
export function heroBookSwingShut(swing: Animated.Value): Animated.CompositeAnimation {
  const SWING = Easing.bezier(0.22, 1.0, 0.3, 1.0);
  return Animated.sequence([
    Animated.timing(swing, {
      toValue: HB.overshootAngle,
      duration: HB.swingInMs,
      easing: SWING,
      useNativeDriver: true,
    }),
    Animated.timing(swing, {
      toValue: HB.settleAngle,
      duration: HB.overshootMs,
      useNativeDriver: true,
    }),
    Animated.timing(swing, {
      toValue: HB.closedAngle,
      duration: HB.settleMs,
      useNativeDriver: true,
    }),
  ]);
}

// Exit: cover swings back open as it leaves.
export function heroBookSwingOpen(
  swing: Animated.Value,
  easing: (value: number) => number,
): Animated.CompositeAnimation {
  return Animated.timing(swing, {
    toValue: HB.openAngle,
    duration: HB.exitMs,
    easing,
    useNativeDriver: true,
  });
}

export const HERO_BOOK_FADE_IN_MS = HB.fadeInMs;
