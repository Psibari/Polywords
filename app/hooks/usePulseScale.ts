import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotionPreference } from './usePollyAmbientMotion';

// Shared "breathing" idle pulse for primary CTAs (Home's ENTER THE HUNT,
// Results' RUN IT BACK). Was duplicated identically in both screens with
// neither checking reduce-motion; this is the one copy both now use.
export function usePulseScale(maxScale = 1.018, periodMs = 950) {
  const reduceMotion = useReducedMotionPreference();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: periodMs, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: periodMs, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  return pulse.interpolate({ inputRange: [0, 1], outputRange: [1, maxScale] });
}
