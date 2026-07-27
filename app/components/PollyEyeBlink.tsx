import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

type Props = {
  active: boolean;
};

const FIRST_BLINK_DELAY_MS = 1500;
const MIN_BLINK_GAP_MS = 3200;
const BLINK_GAP_VARIANCE_MS = 3300;

export function PollyEyeBlink({ active }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleY = useRef(new Animated.Value(0.25)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    function clearBlink() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      animationRef.current?.stop();
      animationRef.current = null;
      opacity.setValue(0);
      scaleY.setValue(0.25);
    }

    function closeAndOpen() {
      return Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 1,
            duration: 55,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(65),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 75,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 0.25,
            duration: 75,
            useNativeDriver: true,
          }),
        ]),
      ]);
    }

    function scheduleBlink(delayMs: number) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const doubleBlink = Math.random() < 0.22;
        const animation = doubleBlink
          ? Animated.sequence([
              closeAndOpen(),
              Animated.delay(115),
              closeAndOpen(),
            ])
          : closeAndOpen();

        animationRef.current = animation;
        animation.start(({ finished }) => {
          animationRef.current = null;
          if (!finished) return;
          const nextDelay =
            MIN_BLINK_GAP_MS +
            Math.round(Math.random() * BLINK_GAP_VARIANCE_MS);
          scheduleBlink(nextDelay);
        });
      }, delayMs);
    }

    clearBlink();
    if (active) scheduleBlink(FIRST_BLINK_DELAY_MS);
    return clearBlink;
  }, [active, opacity, scaleY]);

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.lid,
        {
          opacity,
          transform: [{ rotate: '-2deg' }, { scaleY }],
        },
      ]}
    >
      <Svg height="100%" viewBox="0 0 44 24" width="100%">
        <Defs>
          <LinearGradient id="pollyLid" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#68E83C" />
            <Stop offset="0.52" stopColor="#36C934" />
            <Stop offset="1" stopColor="#159B36" />
          </LinearGradient>
        </Defs>
        <Path
          d="M2 5 C13 10 31 11 42 5 C38 15 31 20 21 20 C11 20 5 14 2 5 Z"
          fill="url(#pollyLid)"
          stroke="#12351A"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
        <Path
          d="M4 7 C15 12 30 13 40 7"
          fill="none"
          stroke="#0A1F10"
          strokeLinecap="round"
          strokeWidth="2.4"
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // sprite4 is 283x413 and is rendered with contain inside a 246x246 square.
  // These coordinates land over its one visible eye without touching the art.
  lid: {
    position: 'absolute',
    left: 106,
    top: 76,
    width: 44,
    height: 24,
  },
});
