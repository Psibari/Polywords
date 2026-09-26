import React from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import {
  DAILY_CLUE_FONT,
  fitDailyClueFontSize,
  type DailyCastleRect,
} from '../ui/dailyCastleScene';

// gate2.png recoloured to the old Daily scroll colour by
// tools/art/build_daily_gate.py (Pete, 2026-09-26). Same canvas and plank lines.
const GATE = require('../../assets/images/dailycastle/gate_scroll.png');

type Props = {
  /**
   * 1 = closed (clues showing), 0 = raised out of the opening. Values above 1
   * sink the gate past closed for the wrong-claim slam, capped at `maxSink`.
   */
  gatePosition: Animated.Value;
  clues: string[];
  revealedCount: 1 | 2 | 3;
  /** Gate image rect, relative to the opening that clips it. */
  frame: DailyCastleRect;
  /** Clue rects, relative to the gate image. One per plank. */
  clueRects: DailyCastleRect[];
  openTravel: number;
  maxSink: number;
  /** Screen points per canvas point. */
  scale: number;
};

// gatePosition 1.06 is the deepest point of the wrong-claim slam; it maps to
// the full allowed sink so the board's top edge never drops below the crown of
// the opening.
const SLAM_DEPTH_INPUT = 1.06;

/**
 * The castle's portcullis. Clues are painted on its planks and travel with it,
 * so a raised gate carries the old clues out of sight and a lowered gate
 * brings the next round's clues down.
 */
export default function DailyGate({
  gatePosition,
  clues,
  revealedCount,
  frame,
  clueRects,
  openTravel,
  maxSink,
  scale,
}: Props) {
  // Canvas-point width of each clue's box: the fitter works in canvas points
  // (scale-free), the rects arrive in screen points.
  const visibleClues = clues.slice(0, revealedCount);
  const fontSizes = visibleClues.map((clue, index) =>
    fitDailyClueFontSize(clue, (clueRects[index]?.width ?? 0) / scale),
  );

  const translateY = gatePosition.interpolate({
    inputRange: [0, 1, SLAM_DEPTH_INPUT],
    outputRange: [-openTravel, 0, maxSink],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.root,
        {
          left: frame.x,
          top: frame.y,
          width: frame.width,
          height: frame.height,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Explicit size, never the file's own: see the back wall in DailyCastleStage. */}
      <Image
        source={GATE}
        style={[styles.gateImage, { width: frame.width, height: frame.height }]}
        resizeMode="stretch"
      />

      {visibleClues.map((clue, index) => {
        const rect = clueRects[index];
        if (!rect) return null;
        const isLatest = index === revealedCount - 1;
        return (
          <View
            key={`${index}-${clue}`}
            style={[
              styles.clueSlot,
              {
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
              },
            ]}
          >
            <Text
              style={[
                styles.clueText,
                {
                  fontSize: fontSizes[index] * scale,
                  lineHeight: fontSizes[index] * DAILY_CLUE_FONT.lineHeightRatio * scale,
                  letterSpacing: DAILY_CLUE_FONT.letterSpacing * scale,
                },
                !isLatest && styles.clueTextEarlier,
              ]}
              numberOfLines={DAILY_CLUE_FONT.maxLines}
              adjustsFontSizeToFit
              minimumFontScale={0.9}
            >
              {clue.toUpperCase()}
            </Text>
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
  },
  gateImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  clueSlot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueText: {
    color: '#FFF7D6',
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    textAlign: 'center',
    width: '100%',
    textShadowColor: 'rgba(5,4,11,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  clueTextEarlier: {
    color: 'rgba(255,247,214,0.86)',
  },
});
