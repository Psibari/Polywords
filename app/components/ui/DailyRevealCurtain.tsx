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

// sealSvg's OWN box is height:'34%' of this component's `height` prop, with
// aspectRatio 1 — but that box is not the drawn circle. Inside
// viewBox="0 0 40 40" the seal is `r={17}`, a diameter of 34 of the
// viewBox's 40 units, i.e. 85% of the box. So the seal's true rendered
// radius is (17/40) of the box's own radius: (17/40) * 0.34 * height =
// 0.1445 * height, not 0.17 * height (which was the box's radius, not the
// circle's — ~18% oversized). Each feather group's inner edge is held at
// least that radius (plus a small breathing gap) away from the horizontal
// center, so a feather can never land on the seal.
const SEAL_RADIUS_RATIO = 0.1445;
const FEATHER_SEAL_GAP = 6;

// The seal-clearance math above only keeps feathers off the wax seal — it
// says nothing about the parchment's own edge. ParchmentSurface draws
// scroll_paper.png, and dailyScrollLayout.ts's own header comment records
// its opaque width tapering 89.1% -> 98.5% of the drawn width (narrowest at
// the top, widening going down). 89.1% is the documented floor across that
// taper, so using it (rather than measuring a new number) is the safe
// choice regardless of exactly where a given curtain height puts the
// feather row within that taper. OPAQUE_EDGE_MARGIN keeps the outer
// feather inside that field rather than touching its boundary exactly.
const OPAQUE_WIDTH_FRACTION = 0.891;
const OPAQUE_EDGE_MARGIN = 2;

// Feather sizing/spacing, most-preferred first. A 2-feather group (the
// widest case, at 3 or 4 correct) is fit against the opaque budget by
// shrinking the inter-feather gap toward GAP_MIN before shrinking the
// feather itself, and only shrinks the feather as a last resort — see
// resolveFeatherFit. FEATHER_W_MIN is a defensive floor; at every
// currently supported device width (320/375/430pt) the fit never needs it.
const FEATHER_W_MAX = 44;
const FEATHER_H_MAX = 70;
const FEATHER_ASPECT = FEATHER_W_MAX / FEATHER_H_MAX;
const GAP_MAX = 8;
const GAP_MIN = 4;
const FEATHER_W_MIN = 30;

type FeatherFit = { gap: number; width: number; height: number };

// outerBudget is the max value of (2 * featherWidth + gap) — a 2-feather
// group's own footprint, not counting sealClearance — that still lands its
// outer edge inside the opaque field. Pure/RN-free so it can be reasoned
// about (and tested) independent of layout.
function resolveFeatherFit(outerBudget: number): FeatherFit {
  const neededAtMaxGap = 2 * FEATHER_W_MAX + GAP_MAX;
  if (outerBudget >= neededAtMaxGap) {
    return { gap: GAP_MAX, width: FEATHER_W_MAX, height: FEATHER_H_MAX };
  }
  const neededAtMinGap = 2 * FEATHER_W_MAX + GAP_MIN;
  if (outerBudget >= neededAtMinGap) {
    return { gap: outerBudget - 2 * FEATHER_W_MAX, width: FEATHER_W_MAX, height: FEATHER_H_MAX };
  }
  const width = Math.max(FEATHER_W_MIN, (outerBudget - GAP_MIN) / 2);
  return { gap: GAP_MIN, width, height: width / FEATHER_ASPECT };
}

type Props = {
  // The space this layer grows into — QuillScrollPanel's unroll target
  // (VIEW_H, the old hardcoded 190, is gone) minus the
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
  // The only caller (QuillScrollPanel.tsx) passes 1-4 or undefined —
  // exactly 5 correct routes through revealPerfect and never reaches this
  // branch. That contract isn't enforced by the prop's type, so clamp
  // defensively rather than let a stray out-of-range value render an
  // unbalanced or oversized row.
  const feathers = Math.max(0, Math.min(4, revealFeatherCount ?? 0));
  const leftCount = Math.ceil(feathers / 2);
  const rightCount = Math.floor(feathers / 2);

  const [curtainWidth, setCurtainWidth] = useState(0);
  const handleLayout = (e: LayoutChangeEvent) => setCurtainWidth(e.nativeEvent.layout.width);

  // Clearance each group's inner edge keeps from center: the seal's own
  // (corrected) radius plus a small breathing gap.
  const sealClearance = height * SEAL_RADIUS_RATIO + FEATHER_SEAL_GAP;

  // Room left, past sealClearance, for a 2-feather group's own footprint
  // before its outer edge leaves the parchment's opaque field. Infinity
  // before curtainWidth is known (first render) — ParchmentSurface itself
  // renders nothing until then, so oversizing on that transient frame is
  // invisible.
  const opaqueHalfWidth = curtainWidth > 0 ? (curtainWidth * OPAQUE_WIDTH_FRACTION) / 2 : Infinity;
  const outerBudget = opaqueHalfWidth - OPAQUE_EDGE_MARGIN - sealClearance;
  const featherFit = resolveFeatherFit(outerBudget);

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
              style={[
                styles.featherGroup,
                styles.featherGroupLeft,
                { marginRight: sealClearance, gap: featherFit.gap },
              ]}
              pointerEvents="none"
            >
              {Array.from({ length: leftCount }).map((_, i) => (
                <Image
                  key={i}
                  source={FEATHER_WHITE}
                  style={{ width: featherFit.width, height: featherFit.height }}
                  resizeMode="contain"
                />
              ))}
            </View>
          )}
          {rightCount > 0 && (
            <View
              style={[
                styles.featherGroup,
                styles.featherGroupRight,
                { marginLeft: sealClearance, gap: featherFit.gap },
              ]}
              pointerEvents="none"
            >
              {Array.from({ length: rightCount }).map((_, i) => (
                <Image
                  key={i}
                  source={FEATHER_WHITE}
                  style={{ width: featherFit.width, height: featherFit.height }}
                  resizeMode="contain"
                />
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
    // gap is set inline per-render from featherFit.gap (see
    // resolveFeatherFit) — no static default here, so there is nothing to
    // drift out of sync with it.
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
