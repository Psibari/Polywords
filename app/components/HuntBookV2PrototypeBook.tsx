import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
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

const COVER_PLANE = [
  'M 26 14 L 334 14',
  'Q 350 14 350 30',
  `L 350 ${G.coverBottom - 16}`,
  `Q 350 ${G.coverBottom} 334 ${G.coverBottom}`,
  `L 26 ${G.coverBottom}`,
  `Q 10 ${G.coverBottom} 10 ${G.coverBottom - 16}`,
  'L 10 30 Q 10 14 26 14 Z',
].join(' ');

const COVER_REAR = [
  'M 24 10 L 336 10',
  'Q 354 10 354 28',
  `L 354 ${G.coverBottom - 12}`,
  `Q 354 ${G.coverBottom + 4} 336 ${G.coverBottom + 4}`,
  `L 24 ${G.coverBottom + 4}`,
  `Q 6 ${G.coverBottom + 4} 6 ${G.coverBottom - 12}`,
  'L 6 28 Q 6 10 24 10 Z',
].join(' ');

const COVER_INSET = [
  'M 36 24 L 324 24',
  'Q 336 24 336 36',
  `L 336 ${G.coverBottom - 24}`,
  `Q 336 ${G.coverBottom - 12} 324 ${G.coverBottom - 12}`,
  `L 36 ${G.coverBottom - 12}`,
  `Q 24 ${G.coverBottom - 12} 24 ${G.coverBottom - 24}`,
  'L 24 36 Q 24 24 36 24 Z',
].join(' ');

const HINGE_BAND = 'M 22 10 L 338 10 Q 354 10 354 24 L 6 24 Q 6 10 22 10 Z';
const HINGE_EDGE = 'M 16 24 L 344 24';
const RIBBON = [
  `M ${G.ribbonLeft} ${G.ribbonTop}`,
  `L ${G.ribbonRight} ${G.ribbonTop}`,
  `L ${G.ribbonRight} ${G.ribbonTailY}`,
  `L ${(G.ribbonLeft + G.ribbonRight) / 2} ${G.ribbonNotchY}`,
  `L ${G.ribbonLeft} ${G.ribbonTailY}`,
  'Z',
].join(' ');

export function HuntBookV2PrototypeBook({
  coverRotateX,
  intakeOpacity,
  intakeScaleY,
  word,
  textScale,
}: Props) {
  return (
    <View style={styles.book}>
      {/* Stationary book body: lower cover, page stack, intake bed and ribbon.
          Only the top cover below is allowed to rotate. */}
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${G.viewBoxWidth} ${G.viewBoxHeight}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgGradient id="v2Pages" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={M.pagesCreamTop} />
            <Stop offset="0.54" stopColor={M.pagesCream} />
            <Stop offset="1" stopColor={M.pagesCreamBot} />
          </SvgGradient>
          <SvgGradient id="v2LowerCover" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={M.coverPurple} />
            <Stop offset="1" stopColor={M.coverPurpleBot} />
          </SvgGradient>
          <SvgGradient id="v2Ribbon" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#9A6F08" />
            <Stop offset="0.48" stopColor={M.goldTrim} />
            <Stop offset="1" stopColor="#A97A0B" />
          </SvgGradient>
        </Defs>

        <Path
          d={`M 12 ${G.lowerCoverTop} L 348 ${G.lowerCoverTop} L 352 ${G.lowerCoverBottom - 24} Q 352 ${G.lowerCoverBottom} 332 ${G.lowerCoverBottom} L 28 ${G.lowerCoverBottom} Q 8 ${G.lowerCoverBottom} 8 ${G.lowerCoverBottom - 24} Z`}
          fill="url(#v2LowerCover)"
          stroke={M.goldTrim}
          strokeOpacity={0.34}
          strokeWidth={1.2}
        />
        <Path
          d={`M 28 ${G.pageBlockTop} L 332 ${G.pageBlockTop} L 334 ${G.pageBlockBottom - 18} Q 334 ${G.pageBlockBottom} 316 ${G.pageBlockBottom} L 44 ${G.pageBlockBottom} Q 26 ${G.pageBlockBottom} 26 ${G.pageBlockBottom - 18} Z`}
          fill="url(#v2Pages)"
        />
        <Path d={`M 32 ${G.pageBlockTop + 12} L 328 ${G.pageBlockTop + 12}`} stroke={M.pagesLine} strokeOpacity={0.34} strokeWidth={1} />
        <Path d={`M 31 ${G.pageBlockTop + 22} L 329 ${G.pageBlockTop + 22}`} stroke={M.pagesLine} strokeOpacity={0.27} strokeWidth={1} />
        <Path d={`M 32 ${G.pageBlockTop + 32} L 328 ${G.pageBlockTop + 32}`} stroke={M.pagesLine} strokeOpacity={0.20} strokeWidth={1} />
        <Path d={`M 36 ${G.pageBlockTop + 42} L 324 ${G.pageBlockTop + 42}`} stroke={M.pagesLine} strokeOpacity={0.14} strokeWidth={1} />

        <Path d={COVER_PLANE} fill="url(#v2Pages)" />
        <Path d="M 32 44 L 328 44" stroke={M.pagesLine} strokeOpacity={0.27} strokeWidth={1} />
        <Path d="M 32 72 L 328 72" stroke={M.pagesLine} strokeOpacity={0.23} strokeWidth={1} />
        <Path d="M 32 100 L 328 100" stroke={M.pagesLine} strokeOpacity={0.19} strokeWidth={1} />
        <Path d="M 32 128 L 328 128" stroke={M.pagesLine} strokeOpacity={0.15} strokeWidth={1} />
        <Path d="M 32 156 L 328 156" stroke={M.pagesLine} strokeOpacity={0.11} strokeWidth={1} />
        <Path d="M 32 184 L 328 184" stroke={M.pagesLine} strokeOpacity={0.08} strokeWidth={1} />

        {/* One continuous bookmark, including the visible forked/V-cut tail. */}
        <Path
          d={RIBBON}
          fill="url(#v2Ribbon)"
          stroke="#6E4D06"
          strokeOpacity={0.72}
          strokeWidth={1}
        />
        <Path
          d={`M ${(G.ribbonLeft + G.ribbonRight) / 2} ${G.ribbonTop + 5} L ${(G.ribbonLeft + G.ribbonRight) / 2} ${G.ribbonNotchY - 5}`}
          stroke="#FFF1A8"
          strokeOpacity={0.24}
          strokeWidth={1}
        />
      </Svg>

      <Animated.View
        style={[
          styles.cover,
          {
            transform: [
              { perspective: HERO_BOOK_PERSPECTIVE },
              { translateY: -(G.coverHeight / 2) },
              { rotateX: coverRotateX },
              { translateY: G.coverHeight / 2 },
            ],
          },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${G.viewBoxWidth} ${G.coverHeight}`}
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <SvgGradient id="v2Face" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={M.coverPurpleTop} />
              <Stop offset="0.5" stopColor={M.coverPurple} />
              <Stop offset="1" stopColor={M.coverPurpleBot} />
            </SvgGradient>
            <SvgGradient id="v2Sheen" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.08} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="1" stopColor="#000000" stopOpacity={0.07} />
            </SvgGradient>
            <RadialGradient id="v2Glow" cx="50%" cy="50%" rx="52%" ry="48%">
              <Stop offset="0" stopColor={M.goldTrim} stopOpacity={0.10} />
              <Stop offset="0.62" stopColor={M.intakeGlow} stopOpacity={0.04} />
              <Stop offset="1" stopColor={M.hingeRail} stopOpacity={0} />
            </RadialGradient>
            <SvgGradient id="v2Spine" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#241A54" />
              <Stop offset="0.5" stopColor="#1A1446" />
              <Stop offset="1" stopColor="#141038" />
            </SvgGradient>
          </Defs>

          <Path d={COVER_REAR} fill={M.hingeRail} />
          <Path d={COVER_PLANE} fill="url(#v2Face)" />
          <Path d={COVER_PLANE} fill="url(#v2Sheen)" />
          <Path d={COVER_PLANE} fill="url(#v2Glow)" />
          <Path d={COVER_PLANE} fill="none" stroke={M.goldTrim} strokeWidth={3} />
          <Path d={COVER_INSET} fill="none" stroke={M.goldTrim} strokeOpacity={0.28} strokeWidth={0.8} />
          <Path d={HINGE_BAND} fill="url(#v2Spine)" />
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

        {/* Deliberately one native Text renderer. No foil-layer duplicates. */}
        <View pointerEvents="none" style={styles.coverContent}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            numberOfLines={1}
            style={[
              styles.word,
              {
                fontSize: 88 * textScale,
                lineHeight: 94 * textScale,
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
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.58,
    shadowRadius: 18,
    elevation: 14,
  },
  cover: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: G.coverHeight,
    backfaceVisibility: 'visible',
    shadowColor: PW.color.shadow,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.48,
    shadowRadius: 13,
    elevation: 10,
  },
  intakeSeam: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    bottom: 4,
    height: 8,
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
    left: '7%',
    right: '7%',
    top: 32,
    bottom: 20,
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
