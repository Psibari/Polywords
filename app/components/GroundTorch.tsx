import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { TorchGlow } from './ui/TorchGlow';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';

type Props = {
  size?: number;
  // Offsets when this torch's flicker sequence starts. Because it's inside
  // the looped Animated.sequence below, this delay re-applies at the top of
  // every loop iteration (not just once at mount) — the two torches never
  // lock into a fixed phase offset and instead keep drifting relative to
  // each other over time. That's the intended visual (torches never
  // perfectly sync), not a bug.
  delayMs?: number;
};

const FLICKER_MS = 900;

// A torch for the graphic ground: a warm gold glow (reusing TorchGlow's
// proven flicker/reduced-motion pattern with a custom color) behind a small
// flat flame shape that scales gently, independent of the glow's own pulse.
export default function GroundTorch({ size = 64, delayMs = 0 }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion !== false) {
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(scale, {
          toValue: 1.12,
          duration: FLICKER_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: FLICKER_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: FLICKER_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      scale.setValue(1);
    };
  }, [reduceMotion, scale, delayMs]);

  const flameSize = size * 0.5;

  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      <TorchGlow size={size} color={PW.color.gold} />
      <Animated.View
        style={{
          position: 'absolute',
          top: size * 0.22,
          width: flameSize,
          height: flameSize,
          transform: [{ scale }],
        }}
      >
        <Svg width={flameSize} height={flameSize} viewBox="0 0 100 100">
          <Path
            d="M 50 15 C 35 35 35 55 50 68 C 65 55 65 35 50 15 Z"
            fill={PW.color.gold}
          />
          <Path
            d="M 50 38 C 43 48 43 58 50 64 C 57 58 57 48 50 38 Z"
            fill={PW.color.amber}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
