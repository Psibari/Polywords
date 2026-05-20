import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { SCORE_FLY } from '../constants/animations';

type Props = {
  value: number;
  startPosition: { x: number; y: number };
  /** y-position of the destination (score counter in top bar) */
  destY?: number;
  onComplete: () => void;
};

export function ScoreFloat({ value, startPosition, destY = 60, onComplete }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const travel = startPosition.y - destY;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: SCORE_FLY,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => onComplete());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -travel],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0.9, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: startPosition.x - 20,
          top: startPosition.y,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.text}>+{value}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  text: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
