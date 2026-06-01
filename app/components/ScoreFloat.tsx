import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { FONTS } from '../constants/fonts';

type Props = {
  value: number;
  startPosition: { x: number; y: number };
  color?: string;
  onComplete: () => void;
};

export function ScoreFloat({ value, startPosition, color = '#F5C842', onComplete }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -44,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      <Text style={[styles.text, { color }]}>+{value}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontFamily: FONTS.hud,
  },
});
