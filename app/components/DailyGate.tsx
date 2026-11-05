import React, { useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FONTS } from '../constants/fonts';
import {
  DAILY_BREACH_CRACKS,
  dailyBreachCrackPath,
  dailyGateShownClueCount,
} from '../ui/dailyBreach';
import {
  DAILY_CLUE_FONT,
  DAILY_GATE_ART,
  DAILY_GATE_PT_PER_SRC,
  balanceDailyClue,
  dailyBreachHoleInGate,
  fitDailyClueFontSize,
  type DailyCastleRect,
} from '../ui/dailyCastleScene';

// The cartoon plank door, indigo (Pete, 2026-09-26), drawn by
// tools/art/build_daily_door.py on the old gate's canvas and plank lines.
const GATE = require('../../assets/images/dailycastle/gate_door.png');
// The same door with the breach hole in its bottom two clue planks (Pete,
// 2026-11-04), on the same 1399 x 1597 canvas, so it uses the same frame.
const GATE_BROKEN = require('../../assets/images/dailycastle/gate_door_broken.png');

// The crack overlay draws in the gate's own canvas points, so its viewBox is
// the gate image's size in canvas points and the gate's screen scale scales it.
const GATE_VIEWBOX_WIDTH = DAILY_GATE_ART.widthSrc * DAILY_GATE_PT_PER_SRC;
const GATE_VIEWBOX_HEIGHT = DAILY_GATE_ART.heightSrc * DAILY_GATE_PT_PER_SRC;
// Built once from a fixed seed: the same cracks every time, never re-rolled at render.
const CRACK_PATH = dailyBreachCrackPath(dailyBreachHoleInGate());

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
  /**
   * Show the broken gate (the breach). Only the first clue shows: the hole is
   * where clues two and three are painted. Default false.
   */
  broken?: boolean;
  /**
   * Side-to-side shudder in screen points (native driver), added to the gate's
   * transform. The caller drives it deterministically. Rests at 0.
   */
  jitterX?: Animated.Value | Animated.AnimatedInterpolation<number>;
  /** Opacity 0..1 of the cracks on the shut door (native driver). Rests at 0. */
  cracks?: Animated.Value;
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
  broken = false,
  jitterX,
  cracks,
}: Props) {
  // Resting values for the optional channels, so the transform and the crack
  // layer keep one shape on every render: a native-driven style must never
  // swap between an Animated node and a plain number.
  const restingJitterX = useRef(new Animated.Value(0)).current;
  const restingCracks = useRef(new Animated.Value(0)).current;
  const translateX = jitterX ?? restingJitterX;
  const cracksOpacity = cracks ?? restingCracks;

  // Canvas-point width of each clue's box: the fitter works in canvas points
  // (scale-free), the rects arrive in screen points.
  const shownCount = dailyGateShownClueCount(revealedCount, broken);
  const visibleClues = clues.slice(0, shownCount);
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
          transform: [{ translateY }, { translateX }],
        },
      ]}
    >
      {/* Explicit size, never the file's own: see the back wall in DailyCastleStage.
          Both doors stay mounted and switch by opacity, so the swap never
          draws an empty frame. */}
      <Image
        source={GATE}
        style={[styles.gateImage, { width: frame.width, height: frame.height, opacity: broken ? 0 : 1 }]}
        resizeMode="stretch"
      />
      <Image
        source={GATE_BROKEN}
        style={[styles.gateImage, { width: frame.width, height: frame.height, opacity: broken ? 1 : 0 }]}
        resizeMode="stretch"
      />

      {/* Cracks on the shut door, under the clue text so it stays readable. */}
      <Animated.View
        style={[styles.cracks, { width: frame.width, height: frame.height, opacity: cracksOpacity }]}
      >
        <Svg
          width={frame.width}
          height={frame.height}
          viewBox={`0 0 ${GATE_VIEWBOX_WIDTH} ${GATE_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="none"
        >
          <Path
            d={CRACK_PATH}
            fill="none"
            stroke={DAILY_BREACH_CRACKS.color}
            strokeWidth={DAILY_BREACH_CRACKS.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      {visibleClues.map((clue, index) => {
        const rect = clueRects[index];
        if (!rect) return null;
        const isLatest = index === shownCount - 1;
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
              {balanceDailyClue(clue, fontSizes[index], rect.width / scale)}
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
  cracks: {
    position: 'absolute',
    left: 0,
    top: 0,
    pointerEvents: 'none',
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
