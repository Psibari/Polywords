import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { PW } from '../ui/pwTheme';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';

// Ambient signature detail for the Home threshold: small motes of stolen
// magic drifting up out of the temple torches already in the background
// art. Fills the empty space beside Polly with atmosphere instead of dead
// air — motion only (transform + opacity), matches the animation rules.
type Ember = {
  left: number;
  bottom: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rise: number;
};

const EMBERS: Ember[] = [
  { left: 0.53, bottom: 0.62, size: 4, color: PW.color.gold, duration: 4200, delay: 0, rise: 46 },
  { left: 0.73, bottom: 0.55, size: 3, color: PW.color.foilLight, duration: 3600, delay: 900, rise: 38 },
  { left: 0.63, bottom: 0.73, size: 3, color: PW.color.gold, duration: 4800, delay: 1800, rise: 52 },
  { left: 0.80, bottom: 0.66, size: 4, color: PW.color.foilLight, duration: 4000, delay: 600, rise: 40 },
  { left: 0.48, bottom: 0.52, size: 3, color: PW.color.gold, duration: 3400, delay: 2400, rise: 34 },
  { left: 0.68, bottom: 0.59, size: 4, color: PW.color.foilLight, duration: 4600, delay: 1200, rise: 48 },
];

function EmberDot({ ember, width, height }: { ember: Ember; width: number; height: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotionPreference();

  useEffect(() => {
    if (reduceMotion !== false) {
      progress.setValue(0.45);
      return;
    }
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(ember.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: ember.duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ember, progress, reduceMotion]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -ember.rise],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 0.75, 1],
    outputRange: [0, 0.85, 0.5, 0],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          left: ember.left * width,
          bottom: ember.bottom * height,
          width: ember.size,
          height: ember.size,
          borderRadius: ember.size / 2,
          backgroundColor: ember.color,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

export default function HomeEmbers() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const handleLayout = (event: LayoutChangeEvent) => setSize(event.nativeEvent.layout);
  return (
    <View style={styles.root} pointerEvents="none" onLayout={handleLayout}>
      {size.width > 0 && EMBERS.map((ember, i) => (
        <EmberDot key={i} ember={ember} width={size.width} height={size.height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    position: 'absolute',
  },
});
