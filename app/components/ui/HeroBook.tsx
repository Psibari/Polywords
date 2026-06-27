import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { HERO_BOOK_PERSPECTIVE } from '../../ui/heroBookMotion';

export type HeroBookProps = {
  coverRotateX: Animated.AnimatedInterpolation<string>;
  intakeOpacity: Animated.Value;
  intakeScaleY: Animated.AnimatedInterpolation<number>;
  children: React.ReactNode;
};

const BOOK_VIEWBOX_WIDTH = 360;
const BOOK_VIEWBOX_HEIGHT = 172;
const COVER_VIEWBOX_WIDTH = 342;
const COVER_HEIGHT = 140;

export default function HeroBook({
  coverRotateX,
  intakeOpacity,
  intakeScaleY,
  children,
}: HeroBookProps) {
  return (
    <View pointerEvents="none" style={styles.root}>
      {/* V5 body: grounded violet mass with connected right and bottom page planes. */}
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${BOOK_VIEWBOX_WIDTH} ${BOOK_VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        style={styles.bodySvg}
      >
        <Defs>
          <LinearGradient id="bodyDepth" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#21184A" />
            <Stop offset="0.58" stopColor="#171233" />
            <Stop offset="1" stopColor="#0F0D2A" />
          </LinearGradient>
          <LinearGradient id="rightPages" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#E2D8BC" />
            <Stop offset="0.55" stopColor="#C9BB96" />
            <Stop offset="1" stopColor="#9F8B61" />
          </LinearGradient>
          <LinearGradient id="bottomPages" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#DED3B5" />
            <Stop offset="0.5" stopColor="#C5B58E" />
            <Stop offset="1" stopColor="#927D55" />
          </LinearGradient>
        </Defs>

        <Path
          d="M24 154 L350 146 L358 158 L28 168 Z"
          fill="#0F0D2A"
          opacity={0.72}
        />
        <Path
          d="M10 10 L340 10 L356 28 L356 148 L24 160 L10 142 Z"
          fill="url(#bodyDepth)"
          stroke="rgba(123,45,139,0.46)"
          strokeWidth={2}
        />

        <Path
          d="M338 14 L354 30 L354 148 L338 136 Z"
          fill="url(#rightPages)"
          stroke="rgba(245,200,66,0.28)"
          strokeWidth={1.25}
        />
        <Path d="M340 48 L353 58" stroke="rgba(104,86,52,0.30)" strokeWidth={1} />
        <Path d="M340 78 L353 88" stroke="rgba(104,86,52,0.26)" strokeWidth={1} />
        <Path d="M340 108 L353 118" stroke="rgba(104,86,52,0.30)" strokeWidth={1} />

        <Path
          d="M12 140 L338 136 L354 148 L24 158 Z"
          fill="url(#bottomPages)"
          stroke="rgba(245,200,66,0.24)"
          strokeWidth={1.25}
        />
        <Path d="M20 146 L344 142" stroke="rgba(104,86,52,0.32)" strokeWidth={1} />
        <Path d="M23 151 L349 147" stroke="rgba(104,86,52,0.24)" strokeWidth={1} />
      </Svg>

      {/* V5 intake: a recessed page-return seam inside the violet book body. */}
      <Animated.View
        style={[
          styles.intake,
          {
            opacity: intakeOpacity,
            transform: [{ scaleY: intakeScaleY }],
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 272 34" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="intakeDepth" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0F0D2A" />
              <Stop offset="0.52" stopColor="#4A1D66" />
              <Stop offset="1" stopColor="#7B2D8B" />
            </LinearGradient>
            <LinearGradient id="intakeGold" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#7B2D8B" stopOpacity={0} />
              <Stop offset="0.5" stopColor="#F5C842" stopOpacity={0.62} />
              <Stop offset="1" stopColor="#7B2D8B" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path
            d="M8 7 L264 7 L270 16 L264 27 L8 27 L2 18 Z"
            fill="url(#intakeDepth)"
            stroke="rgba(245,200,66,0.34)"
            strokeWidth={1.25}
          />
          <Path d="M18 17 L254 17" stroke="url(#intakeGold)" strokeWidth={2} />
        </Svg>
      </Animated.View>

      {/* V5 cover: top-hinged purple-gold face and solid underside. */}
      <Animated.View
        style={[
          styles.cover,
          {
            transform: [
              { perspective: HERO_BOOK_PERSPECTIVE },
              { translateY: -COVER_HEIGHT / 2 },
              { rotateX: coverRotateX },
              { translateY: COVER_HEIGHT / 2 },
            ],
          },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${COVER_VIEWBOX_WIDTH} ${COVER_HEIGHT}`}
          preserveAspectRatio="none"
          style={styles.coverSvg}
        >
          <Defs>
            <LinearGradient id="coverFace" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#2A1C59" />
              <Stop offset="0.55" stopColor="#191541" />
              <Stop offset="1" stopColor="#120F32" />
            </LinearGradient>
            <RadialGradient id="wordGlow" cx="50%" cy="52%" rx="58%" ry="62%">
              <Stop offset="0" stopColor="#F5C842" stopOpacity={0.14} />
              <Stop offset="0.62" stopColor="#7B2D8B" stopOpacity={0.06} />
              <Stop offset="1" stopColor="#0F0D2A" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Path
            d="M2 6 L336 4 L340 134 L10 140 L2 132 Z"
            fill="#0F0D2A"
            stroke="rgba(245,200,66,0.34)"
            strokeWidth={2}
          />
          <Path
            d="M0 2 L330 0 L334 10 L334 132 L8 136 L0 128 Z"
            fill="url(#coverFace)"
            stroke="#7B2D8B"
            strokeWidth={2.5}
          />
          <Path
            d="M0 2 L330 0 L334 10 L334 132 L8 136 L0 128 Z"
            fill="url(#wordGlow)"
          />
          <Path
            d="M8 10 L322 8 L326 16 L326 124 L14 128 L8 122 Z"
            fill="none"
            stroke="#F5C842"
            strokeWidth={2.5}
          />
          <Path
            d="M14 16 L316 14 L320 20 L320 118 L20 122 L14 116 Z"
            fill="none"
            stroke="rgba(245,200,66,0.30)"
            strokeWidth={1}
          />
          <Path
            d="M12 12 L320 10 L322 26 L14 28 Z"
            fill="#1E1A4A"
            stroke="rgba(245,200,66,0.42)"
            strokeWidth={1.25}
          />
          <Path d="M20 17 L314 15" stroke="#F5C842" strokeOpacity={0.56} strokeWidth={1.5} />
          <Path d="M20 23 L315 21" stroke="#F5C842" strokeOpacity={0.26} strokeWidth={1} />
        </Svg>

        <View pointerEvents="none" style={styles.coverContent}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  bodySvg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  intake: {
    position: 'absolute',
    left: 40,
    right: 48,
    top: 108,
    height: 34,
    zIndex: 2,
  },
  cover: {
    position: 'absolute',
    left: 4,
    right: 14,
    top: 4,
    height: COVER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  coverSvg: {
    ...StyleSheet.absoluteFillObject,
  },
  coverContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
