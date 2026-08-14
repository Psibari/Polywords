import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGrad,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { FONTS } from '../constants/fonts';
import { HERO_BOOK_PERSPECTIVE } from '../ui/heroBookMotion';
import { heroBookMaterial as M } from '../ui/pwMaterials';
import { PW } from '../ui/pwTheme';
import { HUNT_BOOK_V2_GEOMETRY as G } from './huntBookV2PrototypeGeometry';

type Props = {
  coverRotateX: Animated.AnimatedInterpolation<string>;
  intakeOpacity: Animated.AnimatedInterpolation<number>;
  intakeScaleY: Animated.AnimatedInterpolation<number>;
  word: string;
  textScale: number;
};

const CH = G.coverHeight;

// Exact path geometry from the historical pre-rig SVG HeroBook.
const COVER_PLANE = 'M 26 14 L 334 14 Q 350 14 350 30 L 350 142 Q 350 158 334 158 L 26 158 Q 10 158 10 142 L 10 30 Q 10 14 26 14 Z';
const COVER_REAR = 'M 24 10 L 336 10 Q 354 10 354 28 L 354 146 Q 354 162 336 162 L 24 162 Q 6 162 6 146 L 6 28 Q 6 10 24 10 Z';
const COVER_INSET = 'M 36 24 L 324 24 Q 336 24 336 36 L 336 138 Q 336 150 324 150 L 36 150 Q 24 150 24 138 L 24 36 Q 24 24 36 24 Z';
const HINGE_BAND = 'M 22 10 L 338 10 Q 354 10 354 24 L 6 24 Q 6 10 22 10 Z';
const HINGE_EDGE = 'M 16 24 L 344 24';

export function HuntBookV2PrototypeBook({
  coverRotateX,
  intakeOpacity,
  intakeScaleY,
  word,
  textScale,
}: Props) {
  return (
    <View style={styles.book}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${G.viewBoxWidth} ${G.viewBoxHeight}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgGrad id="pageTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={M.pagesCreamTop} />
            <Stop offset="0.55" stopColor={M.pagesCream} />
            <Stop offset="1" stopColor={M.pagesCreamBot} />
          </SvgGrad>
          <SvgGrad id="pageBottom" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={M.pagesCreamTop} />
            <Stop offset="0.45" stopColor={M.pagesCream} />
            <Stop offset="1" stopColor={M.pagesCreamBot} />
          </SvgGrad>
          <SvgGrad id="lowerCover" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={M.coverPurple} />
            <Stop offset="1" stopColor={M.coverPurpleBot} />
          </SvgGrad>
        </Defs>

        <Path
          d="M 12 150 L 348 150 L 352 180 Q 352 204 332 204 L 28 204 Q 8 204 8 180 Z"
          fill="url(#lowerCover)"
          stroke={M.goldTrim}
          strokeOpacity={0.34}
          strokeWidth={1.2}
        />

        <Path
          d="M 28 158 L 332 158 L 334 178 Q 334 196 316 196 L 44 196 Q 26 196 26 178 Z"
          fill="url(#pageBottom)"
        />
        <Path d="M 32 166 L 328 166" stroke={M.pagesLine} strokeOpacity={0.34} strokeWidth={1} />
        <Path d="M 31 173 L 329 173" stroke={M.pagesLine} strokeOpacity={0.27} strokeWidth={1} />
        <Path d="M 32 180 L 328 180" stroke={M.pagesLine} strokeOpacity={0.20} strokeWidth={1} />
        <Path d="M 36 187 L 324 187" stroke={M.pagesLine} strokeOpacity={0.14} strokeWidth={1} />
        <Path
          d="M 40 192 Q 180 196 320 192"
          fill="none"
          stroke={M.goldTrim}
          strokeOpacity={0.58}
          strokeWidth={2}
        />

        <Path d={COVER_PLANE} fill="url(#pageTop)" />
        <Path d="M 32 36 L 328 36" stroke={M.pagesLine} strokeOpacity={0.28} strokeWidth={1} />
        <Path d="M 32 58 L 328 58" stroke={M.pagesLine} strokeOpacity={0.24} strokeWidth={1} />
        <Path d="M 32 80 L 328 80" stroke={M.pagesLine} strokeOpacity={0.20} strokeWidth={1} />
        <Path d="M 32 102 L 328 102" stroke={M.pagesLine} strokeOpacity={0.16} strokeWidth={1} />
        <Path d="M 32 124 L 328 124" stroke={M.pagesLine} strokeOpacity={0.12} strokeWidth={1} />
        <Path d="M 32 146 L 328 146" stroke={M.pagesLine} strokeOpacity={0.08} strokeWidth={1} />
      </Svg>

      <Animated.View
        style={[
          styles.cover,
          {
            transform: [
              { perspective: HERO_BOOK_PERSPECTIVE },
              { translateY: -(CH / 2) },
              { rotateX: coverRotateX },
              { translateY: CH / 2 },
            ],
          },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${G.viewBoxWidth} ${CH}`}
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <SvgGrad id="face" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={M.coverPurpleTop} />
              <Stop offset="0.5" stopColor={M.coverPurple} />
              <Stop offset="1" stopColor={M.coverPurpleBot} />
            </SvgGrad>
            <SvgGrad id="sheen" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.08} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="1" stopColor="#000000" stopOpacity={0.06} />
            </SvgGrad>
            <RadialGradient id="glow" cx="50%" cy="50%" rx="52%" ry="48%">
              <Stop offset="0" stopColor={M.goldTrim} stopOpacity={0.12} />
              <Stop offset="0.6" stopColor={M.intakeGlow} stopOpacity={0.04} />
              <Stop offset="1" stopColor="#0F0D2A" stopOpacity={0} />
            </RadialGradient>
            <SvgGrad id="spine" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#241A54" />
              <Stop offset="0.5" stopColor="#1A1446" />
              <Stop offset="1" stopColor="#141038" />
            </SvgGrad>
          </Defs>

          <Path d={COVER_REAR} fill={M.hingeRail} />
          <Path d={COVER_PLANE} fill="url(#face)" />
          <Path d={COVER_PLANE} fill="url(#sheen)" />
          <Path d={COVER_PLANE} fill="url(#glow)" />
          <Path d={COVER_PLANE} fill="none" stroke={M.goldTrim} strokeWidth={3} />
          <Path d={COVER_INSET} fill="none" stroke={M.goldTrim} strokeOpacity={0.28} strokeWidth={0.8} />
          <Path d={HINGE_BAND} fill="url(#spine)" />
          <Path d="M 32 11 L 328 11" stroke={M.goldTrim} strokeOpacity={0.34} strokeWidth={1} />
          <Path d={HINGE_EDGE} fill="none" stroke={M.goldTrim} strokeOpacity={0.70} strokeWidth={2} />
          <Path d="M 100 13 L 100 21" stroke={M.goldTrim} strokeOpacity={0.34} strokeWidth={1} />
          <Path d="M 180 13 L 180 21" stroke={M.goldTrim} strokeOpacity={0.34} strokeWidth={1} />
          <Path d="M 260 13 L 260 21" stroke={M.goldTrim} strokeOpacity={0.34} strokeWidth={1} />
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.intakeSeam,
            {
              opacity: intakeOpacity,
              transform: [{ scaleY: intakeScaleY }],
            },
          ]}
        />

        <View pointerEvents="none" style={styles.coverContent}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            numberOfLines={1}
            style={[
              styles.word,
              {
                fontSize: 96 * textScale,
                lineHeight: 102 * textScale,
              },
            ]}
          >
            {word}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  book: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: G.viewBoxHeight,
    overflow: 'visible',
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.60,
    shadowRadius: 16,
    elevation: 14,
  },
  cover: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: G.coverHeight,
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.50,
    shadowRadius: 12,
    elevation: 10,
  },
  intakeSeam: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    bottom: 3,
    height: 7,
    borderRadius: 4,
    backgroundColor: M.intakeGlow,
    shadowColor: M.goldTrim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.82,
    shadowRadius: 8,
    elevation: 5,
  },
  coverContent: {
    position: 'absolute',
    left: '4%',
    right: '4%',
    top: 26,
    bottom: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: {
    width: '100%',
    color: M.goldTrim,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(245,200,66,0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
