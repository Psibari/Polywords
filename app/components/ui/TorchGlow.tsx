import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useReducedMotionPreference } from '../../hooks/usePollyAmbientMotion';
import { chamberMaterial } from '../../ui/pwMaterials';

type Props = {
  size?: number;
};

const FLICKER_MIN = 0.55;
const FLICKER_MAX = 1;
const FLICKER_MS = 1400;

// A soft purple radial glow, sized to fill its container. Caller positions it by
// wrapping in an absolutely-positioned View of the same `size` — this component
// only draws the glow itself. Flicker is opacity-only (native driver) and freezes
// to a static mid glow under reduced motion, same pattern as usePollyAmbientMotion.
export function TorchGlow({ size = 64 }: Props) {
  const id = useId();
  const gradientId = `torchGlow-${id}`;
  const reduceMotion = useReducedMotionPreference();
  const opacity = useRef(new Animated.Value(FLICKER_MAX)).current;

  useEffect(() => {
    if (reduceMotion !== false) {
      opacity.setValue((FLICKER_MIN + FLICKER_MAX) / 2);
      return;
    }
    opacity.setValue(FLICKER_MAX);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: FLICKER_MIN,
          duration: FLICKER_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: FLICKER_MAX,
          duration: FLICKER_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(FLICKER_MAX);
    };
  }, [reduceMotion, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { width: size, height: size, opacity }]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={chamberMaterial.torchGlow} stopOpacity={0.34} />
            <Stop offset="1" stopColor={chamberMaterial.torchGlow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
