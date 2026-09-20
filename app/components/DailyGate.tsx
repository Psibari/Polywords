import React from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';

const GATE = require('../../assets/images/dailycastle/gate.png');

type Props = {
  /** 0 = gate fully raised (hidden), 1 = gate fully lowered (showing clues) */
  gatePosition: Animated.Value;
  clues: string[];
  revealedCount: 1 | 2 | 3;
  width: number;
  height: number;
  openTravel: number;
  scale: number;
};

/**
 * The stone gate that drops down like a portcullis.
 * The canvas is locked to the Daily castle opening; it does not infer its
 * height from the source PNG anymore.
 */
export default function DailyGate({
  gatePosition,
  clues,
  revealedCount,
  width,
  height,
  openTravel,
  scale,
}: Props) {
  const translateY = gatePosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-openTravel, 0],
    extrapolate: 'extend',
  });

  return (
    <Animated.View
      style={[
        styles.root,
        {
          width,
          height,
          transform: [{ translateY }],
        },
      ]}
    >
      <Image
        source={GATE}
        style={[styles.gateImage, { width, height }]}
        resizeMode="stretch"
      />

      <View
        style={[
          styles.clueOverlay,
          {
            paddingHorizontal: 24 * scale,
            gap: 8 * scale,
          },
        ]}
      >
        {clues.slice(0, revealedCount).map((clue, index) => {
          const isLast = index === revealedCount - 1;
          return (
            <Text
              key={`${clue}-${index}`}
              style={[
                styles.clueText,
                {
                  fontSize: 23 * scale,
                  lineHeight: 27 * scale,
                  letterSpacing: 0.6 * scale,
                },
                !isLast && {
                  color: 'rgba(255,247,214,0.92)',
                  fontSize: 17 * scale,
                  lineHeight: 20 * scale,
                },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
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
    overflow: 'visible',
  },
  gateImage: {
    ...StyleSheet.absoluteFillObject,
  },
  clueOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueText: {
    color: '#FFF7D6',
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    textAlign: 'center',
    width: '100%',
  },
});
