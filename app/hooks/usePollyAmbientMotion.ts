import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

export type PollyAmbientProfile = 'home' | 'daily' | 'hunt' | 'results';

const PROFILE = {
  home: { rise: -3, drift: 1.5, riseMs: 2350, settleMs: 2800, driftMs: 3400 },
  daily: { rise: -2.5, drift: 1.25, riseMs: 2600, settleMs: 3100, driftMs: 3900 },
  hunt: { rise: -4, drift: 2, riseMs: 1750, settleMs: 2150, driftMs: 2700 },
  results: { rise: -2, drift: 1, riseMs: 2800, settleMs: 3300, driftMs: 4200 },
} as const;

export function useReducedMotionPreference(): boolean | null {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

export function usePollyAmbientMotion(
  profile: PollyAmbientProfile,
  active = true,
) {
  const reduceMotion = useReducedMotionPreference();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateX.stopAnimation();
    translateY.stopAnimation();
    translateX.setValue(0);
    translateY.setValue(0);
    if (!active || reduceMotion !== false) return;

    const p = PROFILE[profile];
    const breath = Animated.loop(
      Animated.sequence([
        Animated.delay(Math.round(p.riseMs * 0.42)),
        Animated.timing(translateY, {
          toValue: p.rise,
          duration: p.riseMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(Math.round(p.settleMs * 0.24)),
        Animated.timing(translateY, {
          toValue: 0,
          duration: p.settleMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const watch = Animated.loop(
      Animated.sequence([
        Animated.delay(Math.round(p.driftMs * 0.75)),
        Animated.timing(translateX, {
          toValue: p.drift,
          duration: p.driftMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(Math.round(p.driftMs * 0.38)),
        Animated.timing(translateX, {
          toValue: -p.drift * 0.55,
          duration: Math.round(p.driftMs * 1.12),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: Math.round(p.driftMs * 0.72),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    breath.start();
    watch.start();
    return () => {
      breath.stop();
      watch.stop();
      translateX.setValue(0);
      translateY.setValue(0);
    };
  }, [active, profile, reduceMotion, translateX, translateY]);

  return { translateX, translateY, reduceMotion };
}
