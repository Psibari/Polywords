import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGrad,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { HERO_BOOK_PERSPECTIVE } from '../../ui/heroBookMotion';
import { heroBookMaterial as M } from '../../ui/pwMaterials';

export type HeroBookProps = {
  coverRotateX: Animated.AnimatedInterpolation<string>;
  intakeOpacity: Animated.Value;
  intakeScaleY: Animated.AnimatedInterpolation<number>;
  children: React.ReactNode;
};

const CH = M.coverHeight;

const COVER_PLANE = 'M 12 14 L 354 14 L 354 158 L 12 158 Z';
const COVER_REAR  = 'M 8 10 L 358 10 L 358 162 L 8 162 Z';
const COVER_INSET = 'M 22 24 L 344 24 L 344 150 L 22 150 Z';
const HINGE_BAND  = 'M 8 10 L 358 10 L 358 24 L 8 24 Z';
const HINGE_EDGE  = 'M 8 24 L 358 24';

export default function HeroBook({
  coverRotateX,
  intakeOpacity,
  intakeScaleY,
  children,
}: HeroBookProps) {
  return (
    <View style={styles.book}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 360 ${M.bookHeight}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgGrad id="pageTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={M.pagesCreamTop} />
            <Stop offset="0.55" stopColor={M.pagesCream} />
            <Stop offset="1" stopColor={M.pagesCreamBot} />
          </SvgGrad>
          <SvgGrad id="pageRight" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={M.pagesCreamBot} />
            <Stop offset="0.5" stopColor={M.pagesCream} />
            <Stop offset="1" stopColor="#6A5A48" />
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
          d="M 8 196 L 358 196 L 358 210 L 8 210 Z"
          fill="url(#lowerCover)"
          stroke={M.goldTrim}
          strokeOpacity={0.40}
          strokeWidth={1}
        />

        <Path d="M 354 14 L 360 18 L 360 206 L 354 210 Z" fill="url(#pageRight)" />
        <Path d="M 354 50 L 360 50"   stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 354 90 L 360 90"   stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 354 130 L 360 130" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 354 170 L 360 170" stroke={M.pagesLine} strokeWidth={1} />

        <Path d="M 12 158 L 354 158 L 360 162 L 360 200 L 12 200 Z" fill="url(#pageBottom)" />
        <Path d="M 12 164 L 354 164" stroke={M.pagesLine} strokeOpacity={0.35} strokeWidth={1} />
        <Path d="M 12 170 L 354 170" stroke={M.pagesLine} strokeOpacity={0.30} strokeWidth={1} />
        <Path d="M 12 176 L 354 176" stroke={M.pagesLine} strokeOpacity={0.26} strokeWidth={1} />
        <Path d="M 12 182 L 354 182" stroke={M.pagesLine} strokeOpacity={0.22} strokeWidth={1} />
        <Path d="M 12 188 L 354 188" stroke={M.pagesLine} strokeOpacity={0.18} strokeWidth={1} />
        <Path d="M 12 194 L 354 194" stroke={M.pagesLine} strokeOpacity={0.14} strokeWidth={1} />
        <Path
          d="M 12 200 L 354 200"
          stroke={M.goldTrim}
          strokeOpacity={0.65}
          strokeWidth={2}
        />

        <Path d={COVER_PLANE} fill="url(#pageTop)" />
        <Path d="M 12 36 L 354 36"   stroke={M.pagesLine} strokeOpacity={0.28} strokeWidth={1} />
        <Path d="M 12 58 L 354 58"   stroke={M.pagesLine} strokeOpacity={0.24} strokeWidth={1} />
        <Path d="M 12 80 L 354 80"   stroke={M.pagesLine} strokeOpacity={0.20} strokeWidth={1} />
        <Path d="M 12 102 L 354 102" stroke={M.pagesLine} strokeOpacity={0.16} strokeWidth={1} />
        <Path d="M 12 124 L 354 124" stroke={M.pagesLine} strokeOpacity={0.12} strokeWidth={1} />
        <Path d="M 12 146 L 354 146" stroke={M.pagesLine} strokeOpacity={0.08} strokeWidth={1} />
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
          viewBox={`0 0 360 ${CH}`}
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
          </Defs>

          <Path d={COVER_REAR}  fill={M.hingeRail} />
          <Path d={COVER_PLANE} fill="url(#face)" />
          <Path d={COVER_PLANE} fill="url(#sheen)" />
          <Path d={COVER_PLANE} fill="url(#glow)" />

          <Path d={COVER_PLANE} fill="none" stroke={M.goldTrim} strokeWidth={3} />
          <Path
            d={COVER_INSET}
            fill="none"
            stroke={M.goldTrim}
            strokeOpacity={0.28}
            strokeWidth={0.8}
          />

          <Path d={HINGE_BAND} fill={M.hingeDark} />
          <Path
            d={HINGE_EDGE}
            fill="none"
            stroke={M.goldTrim}
            strokeOpacity={0.70}
            strokeWidth={2}
          />
          <Path d="M 110 12 L 110 22" stroke={M.goldTrim} strokeOpacity={0.28} strokeWidth={1} />
          <Path d="M 180 12 L 180 22" stroke={M.goldTrim} strokeOpacity={0.28} strokeWidth={1} />
          <Path d="M 250 12 L 250 22" stroke={M.goldTrim} strokeOpacity={0.28} strokeWidth={1} />
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
          {children}
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
    height: M.bookHeight,
    overflow: 'visible',
    shadowColor: '#000',
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
    height: M.coverHeight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.50,
    shadowRadius: 12,
    elevation: 10,
  },
  intakeSeam: {
    position: 'absolute',
    left: 14,
    right: 14,
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
    left: 14,
    right: 14,
    top: 26,
    bottom: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
