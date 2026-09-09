import React, { useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { dailyRevealMaterial as M } from '../../ui/pwDailyMaterials';
import { PW } from '../../ui/pwTheme';
import ParchmentSurface from './ParchmentSurface';

const FEATHER_WHITE = require('../../../assets/ui/feather-life-filled.png');
const FEATHER_GOLD = require('../../../assets/ui/feather-gold-reward.png');

// The seal (sealSvg below) renders at height:'34%' of this component's own
// `height` prop with aspectRatio 1, so its rendered diameter is exactly
// 0.34 * height and its radius is 0.17 * height — not an estimate, the
// same math the seal's own style performs. Each feather group's inner
// edge is held at least that radius (plus a small breathing gap) away
// from the horizontal center, so a feather can never land on the seal.
const SEAL_RADIUS_RATIO = 0.17;
const FEATHER_SEAL_GAP = 6;

type Props = {
  // The space this layer grows into — QuillScrollPanel's VIEW_H minus the
  // shared rod's own height, since the rod now lives once, fixed, one level
  // up (see QuillScrollPanel.tsx), not duplicated here. This component no
  // longer owns any rod at all — Pete: "you need one piece, not two rods
  // that might not line up" (2026-08-23). Growing from directly under that
  // one rod, instead of sliding in from off-screen, is what makes this read
  // as the same scroll continuing to unroll rather than a second object.
  height: number;
  revealFeatherCount?: number;
  revealPerfect?: boolean;
};

export default function DailyRevealCurtain({ height, revealFeatherCount, revealPerfect }: Props) {
  // A centred single row shares one center point with the seal (both use
  // absoluteFill + alignItems/justifyContent 'center'), so a lone middle
  // feather at odd counts would sit exactly on top of it regardless of any
  // gap value — gap only spaces items apart, it can't relocate a lone
  // center item. Splitting into two groups that straddle the seal avoids
  // that, and balancing the counts (instead of the old table, which put
  // both feathers of a 2-count on the left) is what actually fixes the
  // "whole right half empty" read.
  const feathers = revealFeatherCount ?? 0;
  const leftCount = Math.ceil(feathers / 2);
  const rightCount = Math.floor(feathers / 2);

  const [curtainWidth, setCurtainWidth] = useState(0);
  const handleLayout = (e: LayoutChangeEvent) => setCurtainWidth(e.nativeEvent.layout.width);

  // Clearance each group's inner edge keeps from center: the seal's own
  // radius plus a small gap, capped against the curtain's actual measured
  // width so a wide worst-case clue stack (tall curtain, large seal) on a
  // narrow device can't push the outer feather of a 3- or 4-count group
  // off the edge of the parchment before curtainWidth is known (first
  // render), fall back to the uncapped value.
  const rawSealClearance = height * SEAL_RADIUS_RATIO + FEATHER_SEAL_GAP;
  const sealClearance =
    curtainWidth > 0 ? Math.min(rawSealClearance, curtainWidth * 0.14) : rawSealClearance;

  return (
    <View style={[styles.root, { height }]} onLayout={handleLayout}>
      <ParchmentSurface width={curtainWidth} height={height} />

      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <Pattern id="curtainGrain" patternUnits="userSpaceOnUse" width={5} height={5}>
            <Line x1={0} y1={0} x2={5} y2={0} stroke={M.grain} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#curtainGrain)" />
      </Svg>

      <LinearGradient
        colors={['transparent', M.foldShadow, M.foldHighlight, M.foldShadow, 'transparent']}
        locations={[0, 0.35, 0.5, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.centerFold}
      />

      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="curtainGlow" cx="50%" cy="50%" rx="60%" ry="60%">
            <Stop offset="0" stopColor={PW.color.gold} stopOpacity={0.20} />
            <Stop offset="0.6" stopColor={PW.color.gold} stopOpacity={0.06} />
            <Stop offset="1" stopColor={PW.color.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#curtainGlow)" />
      </Svg>

      <View style={styles.sealWrap} pointerEvents="none">
        <Svg viewBox="0 0 40 40" style={styles.sealSvg}>
          <Circle cx={20} cy={20} r={17} fill={M.sealBg} stroke={M.sealRing} strokeWidth={1.2} />
          <Circle cx={20} cy={20} r={12} fill="none" stroke={M.sealRingInner} strokeWidth={0.8} />
          <Path
            d="M8,25 L8,15 L11,20 L14,11 L17,20 L20,7 L23,20 L26,11 L29,20 L32,15 L32,25 Z"
            fill={M.sealGoldFill}
            stroke={M.sealGoldStroke}
            strokeWidth={0.6}
          />
          <Circle cx={8} cy={15} r={1.3} fill={M.sealGoldFinial} />
          <Circle cx={14} cy={11} r={1.3} fill={M.sealGoldFinial} />
          <Circle cx={20} cy={7} r={1.5} fill={M.sealGoldFinial} />
          <Circle cx={26} cy={11} r={1.3} fill={M.sealGoldFinial} />
          <Circle cx={32} cy={15} r={1.3} fill={M.sealGoldFinial} />
          <Rect
            x={8}
            y={25}
            width={24}
            height={3.4}
            rx={0.8}
            fill={M.sealBand}
            stroke={M.sealBandStroke}
            strokeWidth={0.5}
          />
          <Ellipse cx={14} cy={26.7} rx={1.3} ry={1} fill={M.sealJewel} />
          <Ellipse cx={20} cy={26.7} rx={1.4} ry={1.1} fill={M.sealJewel} />
          <Ellipse cx={26} cy={26.7} rx={1.3} ry={1} fill={M.sealJewel} />
        </Svg>
      </View>

      {revealPerfect ? (
        <Image source={FEATHER_GOLD} style={styles.featherGold} resizeMode="contain" />
      ) : (
        <>
          {leftCount > 0 && (
            <View
              style={[styles.featherGroup, styles.featherGroupLeft, { marginRight: sealClearance }]}
              pointerEvents="none"
            >
              {Array.from({ length: leftCount }).map((_, i) => (
                <Image key={i} source={FEATHER_WHITE} style={styles.featherSmall} resizeMode="contain" />
              ))}
            </View>
          )}
          {rightCount > 0 && (
            <View
              style={[styles.featherGroup, styles.featherGroupRight, { marginLeft: sealClearance }]}
              pointerEvents="none"
            >
              {Array.from({ length: rightCount }).map((_, i) => (
                <Image key={i} source={FEATHER_WHITE} style={styles.featherSmall} resizeMode="contain" />
              ))}
            </View>
          )}
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Removed the flat colored border 2026-08-23 — same "box" issue as
    // QuillScrollPanel's dropped background/shadow: it was tuned for the old
    // solid-color curtain and reads as a rectangular frame around the
    // parchment art now that the curtain has its own painted, torn edge.
  },
  centerFold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    marginLeft: -17,
    width: 34,
  },
  sealWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealSvg: {
    height: '34%',
    aspectRatio: 1,
  },
  featherGroup: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featherGroupLeft: {
    // right: '50%' anchors this group's right edge to the curtain's
    // horizontal center; the marginRight applied inline (sealClearance)
    // then pushes the group's actual content that far left of center, so
    // it clears the seal instead of sitting pinned to the far edge.
    right: '50%',
    justifyContent: 'flex-end',
  },
  featherGroupRight: {
    left: '50%',
    justifyContent: 'flex-start',
  },
  featherSmall: {
    width: 44,
    height: 70,
  },
  featherGold: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 150,
    marginLeft: -50,
    marginTop: -75,
  },
});
