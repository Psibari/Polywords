import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Animated, Easing, StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { StarDensity } from './ambientSkyLayout';

type TwinkleStar = { x: number; y: number; size: number; durationMs: number; delayMs: number };

// Hand-placed, not randomly generated. x/y are fractions (0-1) of the
// container. Ordered arbitrarily; density just slices the front of the list.
const TWINKLE_STARS: TwinkleStar[] = [
  { x: 0.12, y: 0.20, size: 2, durationMs: 2600, delayMs: 0 },
  { x: 0.30, y: 0.45, size: 1.5, durationMs: 3200, delayMs: 500 },
  { x: 0.44, y: 0.12, size: 2, durationMs: 2800, delayMs: 1100 },
  { x: 0.58, y: 0.58, size: 1.5, durationMs: 3600, delayMs: 200 },
  { x: 0.67, y: 0.22, size: 2, durationMs: 3000, delayMs: 1500 },
  { x: 0.75, y: 0.48, size: 1.5, durationMs: 2400, delayMs: 800 },
  { x: 0.83, y: 0.15, size: 2, durationMs: 3400, delayMs: 300 },
  { x: 0.90, y: 0.60, size: 1.5, durationMs: 2900, delayMs: 1200 },
  { x: 0.20, y: 0.65, size: 1.5, durationMs: 3100, delayMs: 900 },
  { x: 0.50, y: 0.80, size: 2, durationMs: 2700, delayMs: 1600 },
  { x: 0.10, y: 0.85, size: 1.5, durationMs: 3300, delayMs: 400 },
  { x: 0.95, y: 0.30, size: 2, durationMs: 2500, delayMs: 1000 },
  { x: 0.38, y: 0.30, size: 1.5, durationMs: 3500, delayMs: 700 },
  { x: 0.63, y: 0.85, size: 2, durationMs: 2600, delayMs: 1300 },
];

const DENSITY_COUNT: Record<StarDensity, number> = { low: 8, medium: 11, high: 14 };

function TwinkleDot({
  star,
  left,
  top,
  frozen,
  tint,
}: {
  star: TwinkleStar;
  left: number;
  top: number;
  frozen: boolean;
  tint: string;
}) {
  const progress = useRef(new Animated.Value(frozen ? 0.85 : 0)).current;

  useEffect(() => {
    if (frozen) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(star.delayMs),
        Animated.timing(progress, {
          toValue: 1,
          duration: star.durationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: star.durationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [frozen, star, progress]);

  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.95] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: tint,
        opacity,
      }}
    />
  );
}

export type AmbientTwinkleLayerProps = {
  density: StarDensity;
  frozen: boolean;
  tint?: string;
};

export default function AmbientTwinkleLayer({ density, frozen, tint = '#FFFFFF' }: AmbientTwinkleLayerProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setSize(e.nativeEvent.layout);
  }, []);
  const stars = TWINKLE_STARS.slice(0, DENSITY_COUNT[density]);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {size.width > 0 &&
        stars.map((star, i) => (
          <TwinkleDot
            key={i}
            star={star}
            left={star.x * size.width}
            top={star.y * size.height}
            frozen={frozen}
            tint={tint}
          />
        ))}
    </View>
  );
}
