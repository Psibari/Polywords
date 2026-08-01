import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Easing, StyleSheet, View, LayoutChangeEvent } from 'react-native';

type DriftStar = { x: number; y: number; size: number; opacity: number };

// Hand-placed, not randomly generated — matches HomeEmbers.tsx's convention.
// x/y are fractions (0-1) of one tile's width/height.
const DRIFT_STARS: DriftStar[] = [
  { x: 0.08, y: 0.10, size: 2, opacity: 0.8 },
  { x: 0.22, y: 0.35, size: 1.5, opacity: 0.6 },
  { x: 0.35, y: 0.60, size: 2, opacity: 0.7 },
  { x: 0.48, y: 0.15, size: 1.5, opacity: 0.5 },
  { x: 0.55, y: 0.80, size: 2, opacity: 0.65 },
  { x: 0.63, y: 0.42, size: 1.5, opacity: 0.55 },
  { x: 0.71, y: 0.05, size: 2, opacity: 0.75 },
  { x: 0.78, y: 0.68, size: 1.5, opacity: 0.6 },
  { x: 0.85, y: 0.28, size: 2, opacity: 0.7 },
  { x: 0.92, y: 0.90, size: 1.5, opacity: 0.5 },
  { x: 0.15, y: 0.75, size: 1.5, opacity: 0.55 },
  { x: 0.60, y: 0.55, size: 2, opacity: 0.65 },
];

function Tile({ width, height }: { width: number; height: number }) {
  return (
    <View style={[styles.tile, { width, height }]} pointerEvents="none">
      {DRIFT_STARS.map((star, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: star.x * width,
            top: star.y * height,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: '#FFFFFF',
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
}

export type AmbientDriftLayerProps = {
  durationMs: number;
  frozen: boolean;
};

export default function AmbientDriftLayer({ durationMs, frozen }: AmbientDriftLayerProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useRef(new Animated.Value(0)).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setSize(e.nativeEvent.layout);
  }, []);

  useEffect(() => {
    if (frozen || size.height === 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [frozen, size.height, durationMs, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size.height || 1],
  });

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {size.height > 0 && (
        <>
          <Animated.View style={[styles.tileWrap, { transform: [{ translateY }] }]}>
            <Tile width={size.width} height={size.height} />
          </Animated.View>
          <Animated.View
            style={[
              styles.tileWrap,
              { transform: [{ translateY: Animated.subtract(translateY, size.height) }] },
            ]}
          >
            <Tile width={size.width} height={size.height} />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tileWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  tile: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
