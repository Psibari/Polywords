import { useCallback, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TERRACE_DIVE, terraceDiveTimeline } from '../ui/homeTerraceDive';
import type { TerraceEntrance } from './useTerraceEntrance';

// The Hunt dive's driver (timings: ui/homeTerraceDive.ts). Phases are chained with setTimeout and
// every animation is native-driven. The zoom and flash are NOT reset when Home loses focus: the
// next screen fades in over a gold Home. They reset when Home is focused again.

export type TerraceDive = {
  /** Scene scale, 1 at rest. */
  zoom: Animated.Value;
  /** Gold flash opacity, 0 at rest. */
  flash: Animated.Value;
  /** Hall opacity inside the console opening, 0 at rest. */
  hall: Animated.Value;
  /** True from the tap until Home is focused again: ignore presses. */
  diving: boolean;
  start: (onArrive: () => void) => void;
};

export function useTerraceDive(entrance: TerraceEntrance): TerraceDive {
  const zoom = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const hall = useRef(new Animated.Value(0)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy = useRef(false);
  const [diving, setDiving] = useState(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useFocusEffect(
    useCallback(() => {
      clearTimers();
      zoom.stopAnimation();
      flash.stopAnimation();
      hall.stopAnimation();
      zoom.setValue(1);
      flash.setValue(0);
      hall.setValue(0);
      busy.current = false;
      setDiving(false);
      return clearTimers;
    }, [clearTimers, flash, hall, zoom]),
  );

  const start = useCallback(
    (onArrive: () => void) => {
      if (busy.current) return;
      busy.current = true;
      setDiving(true);
      const t = terraceDiveTimeline(TERRACE_DIVE);
      const at = (ms: number, fn: () => void) => {
        timers.current.push(setTimeout(fn, ms));
      };
      const retreat = (index: number) =>
        Animated.timing(entrance.progress[index], {
          toValue: 0,
          duration: t.retreatMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();

      Animated.timing(hall, {
        toValue: 1,
        duration: t.hallFadeMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
      at(t.polybookRetreatAt, () => retreat(2));
      at(t.huntRetreatAt, () => retreat(1));
      at(t.zoomAt, () =>
        Animated.timing(zoom, {
          toValue: TERRACE_DIVE.zoomScale,
          duration: t.zoomMs,
          easing: Easing.bezier(0.55, 0, 0.85, 0.45),
          useNativeDriver: true,
        }).start(),
      );
      at(t.flashAt, () =>
        Animated.timing(flash, {
          toValue: 1,
          duration: t.flashMs,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(),
      );
      at(t.navigateAt, onArrive);
    },
    [entrance.progress, flash, hall, zoom],
  );

  return { zoom, flash, hall, diving, start };
}
