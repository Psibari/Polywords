import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { PW } from '../../ui/pwTheme';

type Props = {
  // 0-3, from useHeartbeat() — the same phase-tier signal already driving
  // swipe-gap timing elsewhere in the board. This component does not
  // define or own that signal, only consumes it.
  tension: number;
  isBoss: boolean;
};

// Reach contracts as tension rises — same SVG-radial-gradient technique
// already shipped in TorchGlow.tsx (one continuous gradient, anchored at
// a point, not the four-rectangle construction that was rejected).
// Expressed as a scale on the wrapping view (native-driver-safe) rather
// than animating the SVG gradient's own radius prop.
const REACH_SCALE_BY_TENSION = [1, 0.87, 0.74, 0.6] as const;

export function BookLight({ tension, isBoss }: Props) {
  const reachScale = useRef(new Animated.Value(REACH_SCALE_BY_TENSION[0])).current;

  useEffect(() => {
    Animated.timing(reachScale, {
      toValue: REACH_SCALE_BY_TENSION[Math.min(tension, 3)],
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [tension, reachScale]);

  const glowColor = isBoss ? PW.color.amber : PW.color.gold;

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { transform: [{ scale: reachScale }] }]}
    >
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="bookLight" cx="50%" cy="30%" r="65%">
            <Stop offset="0" stopColor={glowColor} stopOpacity={0.10} />
            <Stop offset="0.55" stopColor={glowColor} stopOpacity={0.03} />
            <Stop offset="1" stopColor={PW.color.bgDeep} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#bookLight)" />
      </Svg>
    </Animated.View>
  );
}
