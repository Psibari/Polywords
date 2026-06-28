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

const COVER_PLANE = 'M 13 9 L 337 3 L 356 125 L 21 135 Z';
const COVER_REAR = 'M 10 7 L 339 0 L 360 127 L 18 139 Z';
const COVER_INSET = 'M 24 18 L 327 12 L 344 117 L 31 127 Z';
const HINGE_BAND = 'M 13 9 L 337 3 L 339 17 L 15 23 Z';
const HINGE_EDGE = 'M 15 23 L 339 17';

export default function HeroBook({
  coverRotateX,
  intakeOpacity,
  intakeScaleY,
  children,
}: HeroBookProps) {
  return (
    <View style={styles.book}>
      {/* Connected page block and lower cover, always behind the swinging cover. */}
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
            <Stop offset="0.58" stopColor={M.pagesCream} />
            <Stop offset="1" stopColor={M.pagesCreamBot} />
          </SvgGrad>
          <SvgGrad id="pageRight" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={M.pagesCreamBot} />
            <Stop offset="0.52" stopColor={M.pagesCream} />
            <Stop offset="1" stopColor="#B8AA8C" />
          </SvgGrad>
          <SvgGrad id="pageBottom" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={M.pagesCreamTop} />
            <Stop offset="0.42" stopColor={M.pagesCream} />
            <Stop offset="1" stopColor={M.pagesCreamBot} />
          </SvgGrad>
          <SvgGrad id="lowerCover" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={M.coverPurple} />
            <Stop offset="1" stopColor={M.coverPurpleBot} />
          </SvgGrad>
        </Defs>

        {/* Purple lower cover: the page block is visibly bound, not floating. */}
        <Path
          d="M 20 178 L 350 165 L 354 176 L 28 190 L 18 184 Z"
          fill="url(#lowerCover)"
          stroke={M.goldTrim}
          strokeOpacity={0.44}
          strokeWidth={1.5}
        />

        {/* Right page side plane, attached to the cover's full right edge. */}
        <Path d="M 337 3 L 356 125 L 350 169 L 331 47 Z" fill="url(#pageRight)" />
        <Path d="M 335.8 12 L 354.8 134" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 334.5 21 L 353.5 143" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 333.2 30 L 352.2 152" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 332 39 L 351 161" stroke={M.pagesLine} strokeWidth={1} />

        {/* Bottom page plane, attached to the cover's complete lower edge. */}
        <Path d="M 21 135 L 356 125 L 350 169 L 27 181 Z" fill="url(#pageBottom)" />
        <Path d="M 22 143 L 355 133" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 23 151 L 354 141" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 24 159 L 353 149" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 25 167 L 352 157" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 26 175 L 351 165" stroke={M.pagesLine} strokeWidth={1} />
        <Path
          d="M 27 181 L 350 169"
          stroke={M.goldTrim}
          strokeOpacity={0.72}
          strokeWidth={2}
        />

        {/* Parchment top block, revealed when the purple cover opens. */}
        <Path d={COVER_PLANE} fill="url(#pageTop)" />
        <Path d="M 18 34 L 340 27" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 19 52 L 343 45" stroke={M.pagesLine} strokeOpacity={0.82} strokeWidth={1} />
        <Path d="M 20 70 L 346 62" stroke={M.pagesLine} strokeOpacity={0.65} strokeWidth={1} />
        <Path d="M 21 88 L 349 80" stroke={M.pagesLine} strokeOpacity={0.48} strokeWidth={1} />
        <Path d="M 22 106 L 352 97" stroke={M.pagesLine} strokeOpacity={0.34} strokeWidth={1} />
        <Path d="M 23 123 L 354 114" stroke={M.pagesLine} strokeOpacity={0.24} strokeWidth={1} />
      </Svg>

      {/* Purple cover swings around its top hinge; all cover anatomy stays in SVG. */}
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
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.07} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="1" stopColor="#000000" stopOpacity={0.06} />
            </SvgGrad>
            <RadialGradient id="glow" cx="50%" cy="50%" rx="52%" ry="48%">
              <Stop offset="0" stopColor={M.goldTrim} stopOpacity={0.13} />
              <Stop offset="0.6" stopColor={M.intakeGlow} stopOpacity={0.05} />
              <Stop offset="1" stopColor="#0F0D2A" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* Rear, face, material sheen, and glow share the perspective silhouette. */}
          <Path d={COVER_REAR} fill={M.hingeRail} />
          <Path d={COVER_PLANE} fill="url(#face)" />
          <Path d={COVER_PLANE} fill="url(#sheen)" />
          <Path d={COVER_PLANE} fill="url(#glow)" />

          {/* Gold trim follows the cover instead of framing a rectangle. */}
          <Path d={COVER_PLANE} fill="none" stroke={M.goldTrim} strokeWidth={3} />
          <Path
            d={COVER_INSET}
            fill="none"
            stroke={M.goldTrim}
            strokeOpacity={0.32}
            strokeWidth={1}
          />

          {/* Spine/hinge band and binding marks follow the skewed top edge. */}
          <Path d={HINGE_BAND} fill={M.hingeDark} />
          <Path
            d={HINGE_EDGE}
            fill="none"
            stroke={M.goldTrim}
            strokeOpacity={0.55}
            strokeWidth={1.5}
          />
          <Path d="M 119 7 L 120 21" stroke={M.goldTrim} strokeOpacity={0.22} strokeWidth={1} />
          <Path d="M 179 6 L 180 20" stroke={M.goldTrim} strokeOpacity={0.22} strokeWidth={1} />
          <Path d="M 239 5 L 240 19" stroke={M.goldTrim} strokeOpacity={0.22} strokeWidth={1} />
        </Svg>

        {/* Intake is an embedded glow seam along the cover's slanted lower edge. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.intakeSeam,
            {
              opacity: intakeOpacity,
              transform: [{ rotate: '-1.7deg' }, { scaleY: intakeScaleY }],
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
    shadowOffset: { width: 1, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
  },
  cover: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: M.coverHeight,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  intakeSeam: {
    position: 'absolute',
    left: 20,
    right: 3,
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
    left: 24,
    right: 16,
    top: 21,
    bottom: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
