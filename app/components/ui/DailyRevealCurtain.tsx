import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient as SvgGrad,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { dailyRevealMaterial as M } from '../../ui/pwDailyMaterials';
import { PW } from '../../ui/pwTheme';

const FEATHER_WHITE = require('../../../assets/ui/feather-life-filled.png');
const FEATHER_GOLD = require('../../../assets/ui/feather-gold-reward.png');

// revealFeatherCount (1-4) -> [left group count, right group count]
const FEATHER_SPLITS: Record<number, readonly [number, number]> = {
  1: [1, 0],
  2: [2, 0],
  3: [2, 1],
  4: [2, 2],
};

type Props = {
  revealFeatherCount?: number;
  revealPerfect?: boolean;
};

export default function DailyRevealCurtain({ revealFeatherCount, revealPerfect }: Props) {
  const [leftCount, rightCount] = FEATHER_SPLITS[revealFeatherCount ?? 0] ?? [0, 0];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[M.fillTop, M.fillMid, M.fillBot]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
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

      <View style={styles.rollShadow} pointerEvents="none" />
      <Svg viewBox="0 0 360 22" preserveAspectRatio="none" style={styles.rollSvg}>
        <Defs>
          <SvgGrad id="rollBody" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={M.rollTop} />
            <Stop offset="0.35" stopColor={M.rollMid} />
            <Stop offset="0.7" stopColor={M.rollLowerMid} />
            <Stop offset="1" stopColor={M.rollBottom} />
          </SvgGrad>
          <SvgGrad id="rollHighlight" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </SvgGrad>
          <RadialGradient id="rollEndCap" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={M.rollEndCapNear} />
            <Stop offset="1" stopColor={M.rollEndCapFar} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={8} width={360} height={14} rx={7} fill="url(#rollBody)" />
        <Rect x={0} y={8} width={360} height={5} rx={2.5} fill="url(#rollHighlight)" />
        <Ellipse cx={6} cy={15} rx={6} ry={7} fill="url(#rollEndCap)" />
        <Ellipse cx={354} cy={15} rx={6} ry={7} fill="url(#rollEndCap)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    borderTopWidth: 0,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderLeftColor: M.border,
    borderRightColor: M.border,
    borderBottomColor: M.border,
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
    ...StyleSheet.absoluteFillObject,
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
  rollShadow: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    bottom: 2,
    height: 10,
    borderRadius: 999,
    backgroundColor: M.rollShadow,
  },
  rollSvg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
  },
});
