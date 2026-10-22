import { useCallback, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  TERRACE_DAILY_DIVE,
  TERRACE_DIVE,
  terraceBookDiveNavigateAt,
  terraceDailyDiveTimeline,
  terraceDiveTimeline,
} from '../ui/homeTerraceDive';

// The Home dives' driver (timings: ui/homeTerraceDive.ts): the Hunt (buttons retreat, hall, zoom,
// flash), the Daily (castle rises, zoom into its door, flash) and the Polybook (buttons retreat, hall,
// then the Polybook screen raises its own cover out of the hall). Phases are chained with setTimeout
// and every animation is native-driven. The zoom and flash are NOT reset when Home loses focus: the
// next screen fades in over a gold Home. They reset when Home is focused again.

export type TerraceDiveKind = 'hunt' | 'daily' | 'book';

export type TerraceDive = {
  /** Scene scale, 1 at rest. */
  zoom: Animated.Value;
  /** Gold flash opacity, 0 at rest. */
  flash: Animated.Value;
  /** Hall visible in the console opening: 0 at rest, 1 once the Hunt dive starts. */
  hall: Animated.Value;
  /** HUNT and POLYBOOK receding into the hall: 0 at rest, 1 gone. */
  retreat: readonly [Animated.Value, Animated.Value];
  /** Castle rising from behind the mountains: 0 hidden below, 1 in its place (the rest value). */
  castle: Animated.Value;
  /** The castle is drawn (it is hidden at rest and for the whole Home except the Daily dive). */
  castleOn: boolean;
  /** Which dive is running; the scene aims the zoom accordingly. */
  target: TerraceDiveKind | null;
  /** True from the tap until Home is focused again: ignore presses. */
  diving: boolean;
  start: (kind: TerraceDiveKind, onArrive: () => void) => void;
};

export function useTerraceDive(): TerraceDive {
  const zoom = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const hall = useRef(new Animated.Value(0)).current;
  const castle = useRef(new Animated.Value(1)).current;
  const retreat = useRef<readonly [Animated.Value, Animated.Value]>([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy = useRef(false);
  const [diving, setDiving] = useState(false);
  const [target, setTarget] = useState<TerraceDiveKind | null>(null);
  const [castleOn, setCastleOn] = useState(false);

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
      castle.stopAnimation();
      retreat.forEach((v) => v.stopAnimation());
      zoom.setValue(1);
      flash.setValue(0);
      hall.setValue(0);
      castle.setValue(1);
      retreat.forEach((v) => v.setValue(0));
      busy.current = false;
      setDiving(false);
      setTarget(null);
      setCastleOn(false);
      return clearTimers;
    }, [castle, clearTimers, flash, hall, retreat, zoom]),
  );

  const start = useCallback(
    (kind: TerraceDiveKind, onArrive: () => void) => {
      if (busy.current) return;
      busy.current = true;
      setDiving(true);
      setTarget(kind);
      const at = (ms: number, fn: () => void) => {
        timers.current.push(setTimeout(fn, ms));
      };
      const zoomTo = (toValue: number, ms: number) =>
        Animated.timing(zoom, {
          toValue,
          duration: ms,
          easing: Easing.bezier(0.55, 0, 0.85, 0.45),
          useNativeDriver: true,
        }).start();
      const flashIn = (ms: number) =>
        Animated.timing(flash, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: true }).start();

      if (kind === 'hunt' || kind === 'book') {
        const t = terraceDiveTimeline(TERRACE_DIVE);
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
        if (kind === 'book') {
          // No zoom, no flash: the Polybook screen takes over and its cover rises out of the hall.
          at(terraceBookDiveNavigateAt(), onArrive);
          return;
        }
        at(t.zoomAt, () => zoomTo(TERRACE_DIVE.zoomScale, t.zoomMs));
        at(t.flashAt, () => flashIn(t.flashMs));
        at(t.navigateAt, onArrive);
        return;
      }

      const t = terraceDailyDiveTimeline(TERRACE_DAILY_DIVE);
      // The castle is drawn first, below the mountains, then rises into its place.
      castle.setValue(0);
      setCastleOn(true);
      Animated.timing(castle, {
        toValue: 1,
        duration: t.riseMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      at(t.zoomAt, () => zoomTo(TERRACE_DAILY_DIVE.zoomScale, t.zoomMs));
      at(t.flashAt, () => flashIn(t.flashMs));
      at(t.navigateAt, onArrive);
    },
    [castle, flash, hall, retreat, zoom],
  );

  return { zoom, flash, hall, retreat, castle, castleOn, target, diving, start };
}
