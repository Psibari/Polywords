import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGrad, Rect, Stop, Path, RadialGradient } from 'react-native-svg';
import { HERO_BOOK_PERSPECTIVE } from '../../ui/heroBookMotion';
import { heroBookMaterial as M } from '../../ui/pwMaterials';

export type HeroBookProps = {
  coverRotateX: Animated.AnimatedInterpolation<string>;
  intakeOpacity: Animated.Value;
  intakeScaleY: Animated.AnimatedInterpolation<number>;
  children: React.ReactNode;
};

const CH = M.coverHeight;   // 138 — cover height

export default function HeroBook({
  coverRotateX,
  intakeOpacity,
  intakeScaleY,
  children,
}: HeroBookProps) {
  return (
    /*
     * .book equivalent — the page body, always visible behind the cover.
     * perspective lives here so the cover's rotateX has 3D depth.
     * Background = cream pages showing through when cover opens.
     */
    <View style={styles.book}>

      {/* ── PAGE BODY (always visible, revealed when cover opens) ── */}
      <View style={styles.pageBody}>
        <LinearGradient
          colors={[M.pagesCreamTop, M.pagesCream, M.pagesCreamBot]}
          style={StyleSheet.absoluteFill}
        />
        {/* Page lines */}
        <View style={[styles.pageLine, { top: '20%' }]} />
        <View style={[styles.pageLine, { top: '38%', opacity: 0.7 }]} />
        <View style={[styles.pageLine, { top: '56%', opacity: 0.55 }]} />
        <View style={[styles.pageLine, { top: '74%', opacity: 0.4 }]} />
        <View style={[styles.pageLine, { top: '88%', opacity: 0.28 }]} />
        {/* Gold top frame */}
        <View style={styles.pageTopGold} />
        {/* Gold bottom frame */}
        <View style={styles.pageBottomGold} />
      </View>

      {/* Cream page interior — revealed when cover opens */}
      <View style={styles.pageInterior}>
        <LinearGradient
          colors={[M.pagesCreamTop, M.pagesCream, M.pagesCreamBot]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.pageLine, { top: '15%' }]} />
        <View style={[styles.pageLine, { top: '30%', opacity: 0.75 }]} />
        <View style={[styles.pageLine, { top: '45%', opacity: 0.60 }]} />
        <View style={[styles.pageLine, { top: '60%', opacity: 0.45 }]} />
        <View style={[styles.pageLine, { top: '75%', opacity: 0.30 }]} />
        <View style={[styles.pageLine, { top: '88%', opacity: 0.20 }]} />
      </View>

      {/*
       * .cover equivalent — absolute over the book body.
       * transform-origin: top  →  translateY(-CH/2) + rotateX + translateY(+CH/2)
       * rotateX(80deg)         →  bottom edge swings toward the viewer
       *                            (equivalent to CSS rotateY(-80deg) from left)
       */}
      <Animated.View
        style={[
          styles.cover,
          {
            transform: [
              { perspective: HERO_BOOK_PERSPECTIVE },
              { translateY: -(CH / 2) },   // set pivot to top edge
              { rotateX: coverRotateX },    // open from bottom
              { translateY: CH / 2 },       // restore position
            ],
          },
        ]}
      >
        {/* Cover SVG — purple face + gold trim */}
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 360 ${CH}`}
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <SvgGrad id="face" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"   stopColor={M.coverPurpleTop} />
              <Stop offset="0.5" stopColor={M.coverPurple} />
              <Stop offset="1"   stopColor={M.coverPurpleBot} />
            </SvgGrad>
            <SvgGrad id="sheen" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"   stopColor="#FFFFFF" stopOpacity={0.07} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="1"   stopColor="#000000" stopOpacity={0.06} />
            </SvgGrad>
            <RadialGradient id="glow" cx="50%" cy="50%" rx="52%" ry="48%">
              <Stop offset="0"   stopColor={M.goldTrim}    stopOpacity={0.13} />
              <Stop offset="0.6" stopColor={M.intakeGlow}  stopOpacity={0.05} />
              <Stop offset="1"   stopColor="#0F0D2A"        stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* Cover rear face (dark, shows when open) */}
          <Rect x={0} y={0} width={360} height={CH} fill={M.hingeRail} />

          {/* Cover front face */}
          <Rect x={3} y={0} width={354} height={CH} fill="url(#face)" />
          <Rect x={3} y={0} width={354} height={CH} fill="url(#sheen)" />
          <Rect x={3} y={0} width={354} height={CH} fill="url(#glow)" />

          {/* Outer gold trim */}
          <Rect x={3} y={0} width={354} height={CH}
            fill="none" stroke={M.goldTrim} strokeWidth={3} />

          {/* Inner gold hairline */}
          <Rect x={12} y={8} width={336} height={CH - 16}
            fill="none" stroke={M.goldTrim} strokeOpacity={0.32} strokeWidth={1} />

          {/* Spine band at top of cover */}
          <Rect x={3} y={0} width={354} height={14} fill={M.hingeDark} />
          <Path d={`M 3 14 L 357 14`}
            stroke={M.goldTrim} strokeOpacity={0.55} strokeWidth={1.5} />
          {/* Spine binding marks */}
          <Path d="M 120 2 L 120 12" stroke={M.goldTrim} strokeOpacity={0.22} strokeWidth={1} />
          <Path d="M 180 2 L 180 12" stroke={M.goldTrim} strokeOpacity={0.22} strokeWidth={1} />
          <Path d="M 240 2 L 240 12" stroke={M.goldTrim} strokeOpacity={0.22} strokeWidth={1} />
        </Svg>

        {/* Hero word content */}
        <View pointerEvents="none" style={styles.coverContent}>
          {children}
        </View>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  /*
   * .book — the page body container.
   * Width: full container. Height: cover + pages below.
   * No perspective here — perspective is on the cover transform directly.
   */
  book: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: M.bookHeight,          // 190 total
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
  },

  /*
   * Page body — sits at the bottom of the book zone.
   * Cream, always visible. Revealed when cover lifts.
   */
  pageBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: M.coverHeight,            // sits below the cover
    height: M.pageHeight,          // 36px of page edges
    overflow: 'hidden',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  pageInterior: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: M.coverHeight,
    overflow: 'hidden',
  },

  pageLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 1,
    backgroundColor: M.pagesLine,
  },

  pageTopGold: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: M.pagesCreamTop,
  },

  pageBottomGold: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: M.goldTrim,
    opacity: 0.8,
  },

  /*
   * Intake seam — the gap between cover bottom and pages.
   * Purple-gold glow visible during tile absorption (Pass 2).
   */
  /*
   * .cover equivalent — absolute, same size as the whole book top zone.
   * transform-origin: top replicated via translateY trick.
   */
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

  coverContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 14,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
