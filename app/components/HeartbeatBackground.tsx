import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useHeartbeat } from '../hooks/useHeartbeat';

// opacity range [max, min] for each tension level
const OPACITY: [number, number][] = [
  [1.0, 0.94],
  [1.0, 0.90],
  [1.0, 0.86],
  [1.0, 0.80],
];

export function HeartbeatBackground() {
  const { pulseAnim, tension } = useHeartbeat();
  const [maxOp, minOp] = OPACITY[Math.min(tension, 3)];

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [maxOp, minOp],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.bg, { opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: '#1A1040',
  },
});
