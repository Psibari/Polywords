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

const SPINE_FACE  = 'M 12 13 L 30 8 L 29 157 L 12 161 Z';
const COVER_PLANE = 'M 30 8 L 352 1 L 355 152 L 29 157 Z';
const COVER_REAR  = 'M 8 11 L 354 0 L 358 153 L 16 161 Z';
const COVER_INSET = 'M 44 19 L 336 12 L 339 141 L 40 148 Z';
const HINGE_BAND  = 'M 12 13 L 352 1 L 354 17 L 14 24 Z';
const HINGE_EDGE  = 'M 14 24 L 354 17';
const SPINE_LINE  = 'M 30 8 L 29 157';

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
            <Stop offset="0.55" stopColor={M.pagesCream} />
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
          <SvgGrad id="spineFace" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={M.spineColor} />
            <Stop offset="1" stopColor={M.hingeDark} />
          </SvgGrad>
        </Defs>

        {/* Lower cover cap — bottommost layer */}
        <Path
          d="M 18 200 L 351 193 L 355 205 L 27 210 L 16 205 Z"
          fill="url(#lowerCover)"
          stroke={M.goldTrim}
          strokeOpacity={0.44}
          strokeWidth={1.5}
        />

        {/* Left spine band — always visible, dark binding edge */}
        <Path d="M 12 8 L 30 3 L 30 206 L 12 204 Z" fill="url(#spineFace)" />
        <Path
          d="M 30 3 L 30 206"
          fill="none"
          stroke={M.goldTrim}
          strokeOpacity={0.50}
          strokeWidth={1.5}
        />

        {/* Right page side plane */}
        <Path d="M 352 1 L 355 152 L 350 206 L 334 50 Z" fill="url(#pageRight)" />
        <Path d="M 340 50 L 354 62" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 338 80 L 353 92" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 336 110 L 352 122" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 335 140 L 351 152" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 334 170 L 350 182" stroke={M.pagesLine} strokeWidth={1} />

        {/* Bottom page plane */}
        <Path d="M 29 157 L 355 152 L 350 206 L 26 208 Z" fill="url(#pageBottom)" />
        <Path d="M 29 164 L 354 159" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 28 171 L 353 166" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 27 178 L 352 173" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 26 185 L 351 180" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 25 192 L 350 187" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 24 199 L 349 194" stroke={M.pagesLine} strokeWidth={1} />
        <Path
          d="M 26 208 L 350 206"
          stroke={M.goldTrim}
          strokeOpacity={0.72}
          strokeWidth={2}
        />

        {/* Parchment top — revealed when cover swings open */}
        <Path d={COVER_PLANE} fill="url(#pageTop)" />
        <Path d="M 30 30 L 352 23" stroke={M.pagesLine} strokeWidth={1} />
        <Path d="M 30 52 L 352 45" stroke={M.pagesLine} strokeOpacity={0.82} strokeWidth={1} />
        <Path d="M 30 74 L 352 67" stroke={M.pagesLine} strokeOpacity={0.65} strokeWidth={1} />
        <Path d="M 30 96 L 352 89" stroke={M.pagesLine} strokeOpacity={0.48} strokeWidth={1} />
        <Path d="M 30 118 L 352 111" stroke={M.pagesLine} strokeOpacity={0.34} strokeWidth={1} />
        <Path d="M 30 140 L 352 133" stroke={M.pagesLine} strokeOpacity={0.22} strokeWidth={1} />
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
            <SvgGrad id="spineCover" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={M.spineColor} />
              <Stop offset="1" stopColor={M.hingeDark} />
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

          {/* Spine face on cover — swings with cover */}
          <Path d={SPINE_FACE} fill="url(#spineCover)" />

          {/* Cover rear, face, sheen, glow */}
          <Path d={COVER_REAR} fill={M.hingeRail} />
          <Path d={COVER_PLANE} fill="url(#face)" />
          <Path d={COVER_PLANE} fill="url(#sheen)" />
          <Path d={COVER_PLANE} fill="url(#glow)" />

          {/* Gold trim follows cover silhouette */}
          <Path d={COVER_PLANE} fill="none" stroke={M.goldTrim} strokeWidth={3} />
          <Path
            d={COVER_INSET}
            fill="none"
            stroke={M.goldTrim}
            strokeOpacity={0.32}
            strokeWidth={1}
          />

          {/* Spine separator — gold line between spine and cover face */}
          <Path
            d={SPINE_LINE}
            fill="none"
            stroke={M.goldTrim}
            strokeOpacity={0.60}
            strokeWidth={1.5}
          />

          {/* Hinge band and rail */}
          <Path d={HINGE_BAND} fill={M.hingeDark} />
          <Path
            d={HINGE_EDGE}
            fill="none"
            stroke={M.goldTrim}
            strokeOpacity={0.55}
            strokeWidth={1.5}
          />

          {/* Hinge binding marks */}
          <Path d="M 119 7 L 120 22" stroke={M.goldTrim} strokeOpacity={0.22} strokeWidth={1} />
          <Path d="M 179 6 L 180 21" stroke={M.goldTrim} strokeOpacity={0.22} strokeWidth={1} />
          <Path d="M 239 5 L 240 20" stroke={M.goldTrim} strokeOpacity={0.22} strokeWidth={1} />
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
