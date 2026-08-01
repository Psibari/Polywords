import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Animated, Easing, StyleSheet, View, LayoutChangeEvent } from 'react-native';

type MeteorDef = { startXFrac: number; startYFrac: number; delayMs: number; durationMs: number };

// Hand-placed, staggered so meteors don't all fire together.
const METEORS: MeteorDef[] = [
  { startXFrac: 0.85, startYFrac: 0.05, delayMs: 0, durationMs: 1400 },
  { startXFrac: 0.65, startYFrac: 0.15, delayMs: 6000, durationMs: 1200 },
  { startXFrac: 0.95, startYFrac: 0.25, delayMs: 11000, durationMs: 1600 },
];

const METEOR_TRAVEL_X = -220;
const METEOR_TRAVEL_Y = 160;
const METEOR_REST_MS = 9000;

function Meteor({
  meteor,
  width,
  height,
  frozen,
}: {
  meteor: MeteorDef;
  width: number;
  height: number;
  frozen: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (frozen) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(meteor.delayMs),
        Animated.timing(progress, {
          toValue: 1,
          duration: meteor.durationMs,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(METEOR_REST_MS),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [frozen, meteor, progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, METEOR_TRAVEL_X] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, METEOR_TRAVEL_Y] });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 0.8, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: meteor.startXFrac * width,
        top: meteor.startYFrac * height,
        width: 46,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#FFFFFF',
        opacity,
        transform: [{ translateX }, { translateY }, { rotate: '145deg' }],
      }}
    />
  );
}

export type AmbientMeteorLayerProps = {
  frozen: boolean;
};

export default function AmbientMeteorLayer({ frozen }: AmbientMeteorLayerProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setSize(e.nativeEvent.layout);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {size.width > 0 &&
        METEORS.map((meteor, i) => (
          <Meteor key={i} meteor={meteor} width={size.width} height={size.height} frozen={frozen} />
        ))}
    </View>
  );
}
