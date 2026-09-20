import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';

const STONE_GATE = require('../../assets/images/dailycastle/stonegate.png');

type Props = {
  /** 0 = gate fully raised (hidden), 1 = gate fully lowered (showing clues) */
  gatePosition: Animated.Value;
  /** Clue texts to display on the gate face, one at a time */
  clues: string[];
  /** How many clues are currently revealed (1, 2, or 3) */
  revealedCount: 1 | 2 | 3;
  /** Width of the gate area */
  width: number;
};

/**
 * The stone gate that drops down like a portcullis.
 * Clues appear on its face one at a time as they're revealed.
 * Rises on correct answer, pops on wrong answer.
 */
export default function DailyGate({
  gatePosition,
  clues,
  revealedCount,
  width,
}: Props) {
  // Gate height scales from the image aspect (816x1056)
  const GATE_ASPECT = 1056 / 816;
  const gateHeight = width * GATE_ASPECT;

  // The gate's translateY: when gatePosition=1 it's at 0 (fully down),
  // when gatePosition=0 it's at -gateHeight (fully up/hidden)
  const translateY = gatePosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-gateHeight, 0],
  });

  return (
    <Animated.View
      style={[
        styles.root,
        {
          width,
          height: gateHeight,
          transform: [{ translateY }],
        },
      ]}
    >
      <Image
        source={STONE_GATE}
        style={[styles.gateImage, { width, height: gateHeight }]}
        resizeMode="stretch"
      />
      {/* Clue text overlaid on the gate face */}
      <View style={styles.clueOverlay}>
        {clues.slice(0, revealedCount).map((clue, index) => {
          const isLast = index === revealedCount - 1;
          return (
            <Text
              key={`${clue}-${index}`}
              style={[
                styles.clueText,
                !isLast && styles.clueTextMemory,
              ]}
              numberOfLines={2}
            >
              {clue.toUpperCase()}
            </Text>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  gateImage: {
    ...StyleSheet.absoluteFill,
  },
  clueOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  clueText: {
    color: '#FFF7D6',
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 23,
    lineHeight: 27,
    letterSpacing: 0.6,
    textAlign: 'center',
    width: '100%',
  },
  clueTextMemory: {
    color: 'rgba(255,247,214,0.92)',
    fontSize: 17,
    lineHeight: 20,
  },
});
