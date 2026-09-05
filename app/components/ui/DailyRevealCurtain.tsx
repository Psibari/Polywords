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
import { useDailyScrollTuning } from '../../dev/dailyScrollTuning';

const FEATHER_WHITE = require('../../../assets/ui/feather-life-filled.png');
const FEATHER_GOLD = require('../../../assets/ui/feather-gold-reward.png');
const SCROLL_PAPER = require('../../../assets/images/textures/scroll_paper.png');

// revealFeatherCount (1-4) -> [left group count, right group count]
const FEATHER_SPLITS: Record<number, readonly [number, number]> = {
  1: [1, 0],
  2: [2, 0],
  3: [2, 1],
  4: [2, 2],
};

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
  const [leftCount, rightCount] = FEATHER_SPLITS[revealFeatherCount ?? 0] ?? [0, 0];

  const [curtainWidth, setCurtainWidth] = useState(0);
  const handleLayout = (e: LayoutChangeEvent) => setCurtainWidth(e.nativeEvent.layout.width);
  const paper = useDailyScrollTuning((s) => s.paper);

  // Unlike DailyPanelFrame's paper, this one does NOT apply paper.offsetY
  // to its own top position — DailyPanelFrame's offsetY exists to leave
  // room for a rod sitting inside its own space, but the shared rod now
  // lives entirely outside this component (see QuillScrollPanel.tsx), so
  // this region has nothing to leave room for. Applying the same offset
  // here would leave a permanent empty gap between the rod and where this
  // paper starts (device-confirmed 2026-08-23). `paper`'s X/width/height
  // tuning is still shared and applies normally.
  const paperWidth = curtainWidth > 0 ? curtainWidth * paper.scaleX : undefined;
  const paperHeight = curtainWidth > 0 ? height * paper.scaleY : undefined;
  const paperLeft =
    paperWidth !== undefined ? (curtainWidth - paperWidth) / 2 + paper.offsetX : undefined;
  const paperTop = 0;

  return (
    <View style={[styles.root, { height }]} onLayout={handleLayout}>
      <Image
        source={SCROLL_PAPER}
        style={
          paperWidth !== undefined
            ? { position: 'absolute', width: paperWidth, height: paperHeight, left: paperLeft, top: paperTop }
            : StyleSheet.absoluteFill
        }
        resizeMode="stretch"
      />

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
            <View style={[styles.featherGroup, styles.featherGroupLeft]} pointerEvents="none">
              {Array.from({ length: leftCount }).map((_, i) => (
                <Image key={i} source={FEATHER_WHITE} style={styles.featherSmall} resizeMode="contain" />
              ))}
            </View>
          )}
          {rightCount > 0 && (
            <View style={[styles.featherGroup, styles.featherGroupRight]} pointerEvents="none">
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
    left: 18,
  },
  featherGroupRight: {
    right: 18,
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
