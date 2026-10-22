import { useCallback, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TERRACE_DIVE, terraceDiveTimeline } from '../ui/homeTerraceDive';

// The Hunt dive's driver (timings: ui/homeTerraceDive.ts). Phases are chained with setTimeout and
// every animation is native-driven. The zoom and flash are NOT reset when Home loses focus: the
// next screen fades in over a gold Home. They reset when Home is focused again.

export type TerraceDive = {
  /** Scene scale, 1 at rest. */
  zoom: Animated.Value;
  /** Gold flash opacity, 0 at rest. */
  flash: Animated.Value;
  /** Hall visible in the console opening: 0 at rest, 1 once the dive starts. */
  hall: Animated.Value;
  /** HUNT and POLYBOOK receding into the hall: 0 at rest, 1 gone. */
  retreat: readonly [Animated.Value, Animated.Value];
  /** True from the tap until Home is focused again: ignore presses. */
  diving: boolean;
  start: (onArrive: () => void) => void;
};

export function useTerraceDive(): TerraceDive {
  const zoom = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const hall = useRef(new Animated.Value(0)).current;
  const retreat = useRef<readonly [Animated.Value, Animated.Value]>([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
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
      retreat.forEach((v) => v.stopAnimation());
      zoom.setValue(1);
      flash.setValue(0);
      hall.setValue(0);
      retreat.forEach((v) => v.setValue(0));
      busy.current = false;
      setDiving(false);
      return clearTimers;
    }, [clearTimers, flash, hall, retreat, zoom]),
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
      // retreat[0] is HUNT, retreat[1] is POLYBOOK.
      const recede = (value: Animated.Value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: t.retreatMs,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start();

      // The hall is simply there, static: shown at once, behind the buttons that still cover it.
      hall.setValue(1);
      at(t.polybookRetreatAt, () => recede(retreat[1]));
      at(t.huntRetreatAt, () => recede(retreat[0]));
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
    [flash, hall, retreat, zoom],
  );

  return { zoom, flash, hall, retreat, diving, start };
}
