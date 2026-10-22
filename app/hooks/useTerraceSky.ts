import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { TERRACE_MOON_RISE, TerraceMoonPhase, terraceMoonPhase } from '../ui/homeTerraceSky';

// The terrace sky's driver: the moon rises from behind the back mountains once per app open (the first time
// Home is shown), and it is the real moon phase for today's date. Later Home visits show the moon at rest.
// Shooting stars run on their own timer inside TerraceShootingStars; this hook only says when they may.
// Timings: ui/homeTerraceSky.ts.

export type TerraceSky = {
  /** Moon climb: 0 hidden behind the back mountains, 1 at its resting place. */
  moonRise: Animated.Value;
  phase: TerraceMoonPhase;
  /** Stars may fall: Home is focused and motion is allowed (the screen also holds them back during a dive). */
  starsOn: boolean;
};

/** True after the moon has started its climb in this app launch (module scope = once per app open). */
let moonRiseStarted = false;

/** `reduceMotion`: true = the system asks for less motion, null = not known yet. */
export function useTerraceSky(reduceMotion: boolean | null): TerraceSky {
  const focused = useIsFocused();
  const moonRise = useRef(new Animated.Value(moonRiseStarted ? 1 : 0)).current;
  const [phase] = useState(() => terraceMoonPhase(new Date()));
  const running = useRef(false);

  useEffect(() => {
    if (!focused || reduceMotion === null) return;
    if (moonRiseStarted || reduceMotion) {
      moonRise.setValue(1);
      return;
    }
    const s = TERRACE_MOON_RISE.timescale;
    const timer = setTimeout(() => {
      moonRiseStarted = true;
      running.current = true;
      Animated.timing(moonRise, {
        toValue: 1,
        duration: TERRACE_MOON_RISE.riseMs * s,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(() => {
        running.current = false;
      });
    }, TERRACE_MOON_RISE.delayMs * s);
    return () => {
      clearTimeout(timer);
      // Left Home mid-climb: finish it so the moon is in place when Home comes back.
      if (running.current) {
        moonRise.stopAnimation();
        moonRise.setValue(1);
        running.current = false;
      }
    };
  }, [focused, reduceMotion, moonRise]);

  return { moonRise, phase, starsOn: focused && reduceMotion === false };
}
