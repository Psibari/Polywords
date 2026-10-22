import { useCallback, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { dailyStoneSeatSfx, playSfx, warmTerraceEntranceSfx } from '../audio/sfx';
import {
  DAILY_PLAQUE_ENTRANCE,
  DAILY_PLAQUE_INITIAL_PROGRESS,
  DAILY_PLAQUE_MOTION_FAILSAFE_MS,
  DAILY_PLAQUE_PEAK,
  DAILY_STONE_SEAT_RATES,
} from '../ui/dailyPlaqueEntrance';
import {
  TERRACE_BUTTON_COUNT,
  terraceEntranceCues,
  terraceEntranceDelay,
  terraceEntranceMs,
  terraceTrembleMs,
} from '../ui/homeTerraceEntrance';
import { Haptics } from '../utils/haptics';
import { useReducedMotionPreference } from './usePollyAmbientMotion';

// Every time Home is shown, ENTER THE HUNT and then POLYBOOK come out of the console exactly as the
// Daily's answer blocks come out of their wall (DailyCastleStage): hidden, small and deep, zoom
// past flush, settle flush, a stone thud and tap per button, one grind and a tremble of the wall
// and console for the whole set. Progress per button is 0 hidden, DAILY_PLAQUE_PEAK farthest, 1 flush.

export type TerraceEntrance = {
  progress: readonly Animated.Value[];
  tremble: Animated.Value;
  /** Buttons are not pressable until the last one is flush. */
  locked: boolean;
};

function seatRow(row: number) {
  playSfx(dailyStoneSeatSfx(row), {
    rate: DAILY_STONE_SEAT_RATES[row % DAILY_STONE_SEAT_RATES.length],
  });
  Haptics.cueAsync('dailyStoneSeat');
}

export function useTerraceEntrance(): TerraceEntrance {
  const reduceMotion = useReducedMotionPreference();
  const progress = useRef(
    Array.from({ length: TERRACE_BUTTON_COUNT }, () => new Animated.Value(DAILY_PLAQUE_INITIAL_PROGRESS)),
  ).current;
  const tremble = useRef(new Animated.Value(0)).current;
  const [locked, setLocked] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const timers: ReturnType<typeof setTimeout>[] = [];
      let cancelled = false;
      // Home never warmed its sounds; the first play of a cue otherwise waits on a native load.
      warmTerraceEntranceSfx();

      const rest = () => {
        progress.forEach((v) => v.stopAnimation());
        tremble.stopAnimation();
        progress.forEach((v) => v.setValue(1));
        tremble.setValue(0);
      };
      // Buttons simply in the console, one thud and tap for the set.
      const showStill = () => {
        rest();
        const cues = terraceEntranceCues(0, false);
        if (cues.seatRow !== null) seatRow(cues.seatRow);
        setLocked(false);
      };

      // Reduce Motion still unknown: stay hidden and locked; this effect reruns when it is known,
      // and past the failsafe the buttons are shown in place.
      if (reduceMotion === null) {
        progress.forEach((v) => v.setValue(DAILY_PLAQUE_INITIAL_PROGRESS));
        setLocked(true);
        timers.push(setTimeout(showStill, DAILY_PLAQUE_MOTION_FAILSAFE_MS));
        return () => timers.forEach(clearTimeout);
      }
      if (reduceMotion) {
        showStill();
        return undefined;
      }

      setLocked(true);
      progress.forEach((v) => {
        v.stopAnimation();
        v.setValue(DAILY_PLAQUE_INITIAL_PROGRESS);
      });
      tremble.stopAnimation();
      tremble.setValue(0);

      progress.forEach((value, index) => {
        const cues = terraceEntranceCues(index, true);
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            // The grind and the tremble start together, with the first button.
            if (cues.shift) {
              playSfx('terraceStoneShift');
              Animated.timing(tremble, {
                toValue: 1,
                duration: terraceTrembleMs(),
                easing: Easing.linear,
                useNativeDriver: true,
              }).start();
            }
            Animated.timing(value, {
              toValue: DAILY_PLAQUE_PEAK,
              duration: DAILY_PLAQUE_ENTRANCE.punchMs,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (!finished) return;
              // The thud lands on the frame the button hits its farthest point.
              if (cues.seatRow !== null) seatRow(cues.seatRow);
              Animated.timing(value, {
                toValue: 1,
                duration: DAILY_PLAQUE_ENTRANCE.settleMs,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              }).start();
            });
          }, terraceEntranceDelay(index)),
        );
      });
      timers.push(setTimeout(() => !cancelled && setLocked(false), terraceEntranceMs(true)));

      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
        // Leaving mid-entrance never leaves a half-out button or an offset console.
        rest();
      };
    }, [progress, reduceMotion, tremble]),
  );

  return { progress, tremble, locked };
}
