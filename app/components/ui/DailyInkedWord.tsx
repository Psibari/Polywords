import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { FONTS } from '../../constants/fonts';
import { dailyScrollMaterial } from '../../ui/pwDailyMaterials';
import { DAILY_CLUE_TYPE } from '../dailyScrollLayout';

type Props = {
  label: string;
  // 0 = the card is still a card; 1 = fully inked into the parchment.
  progress: Animated.Value;
};

// The claimed word after it stops being a card.
//
// The point is not that the card comes to LOOK like it belongs on the
// scroll. It ends up written in the document's own hand — FONTS.wordDisplay
// and dailyScrollMaterial.clueInk are exactly what the clues above it are
// drawn with — so it reads as another line of the same document.
//
// Every driven property here is opacity or transform, so this runs on the
// native driver. It must not be given anything layout- or color-animated.
export default function DailyInkedWord({ label, progress }: Props) {
  const opacity = progress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0, 1],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-1.5deg'],
  });

  return (
    <Animated.Text
      style={[styles.ink, { opacity, transform: [{ scale }, { rotate }] }]}
      numberOfLines={1}
      allowFontScaling={false}
    >
      {label.toUpperCase()}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  ink: {
    color: dailyScrollMaterial.clueInk,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: DAILY_CLUE_TYPE.activeSize + 6,
    letterSpacing: 1.2,
    textAlign: 'center',
    // Pressed into the paper, not floating above it. A dark contact shadow,
    // never the gold glow the card shell carries — gold reads as a lit
    // object hovering, which is the effect being removed.
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
