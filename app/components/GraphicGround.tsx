// app/components/GraphicGround.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import GroundTorch from './GroundTorch';
import { PW } from '../ui/pwTheme';

type Props = {
  skyTint: string;
};

const OUTLINE = '#050410';
const TILE_DARK = '#1c1436';
const TILE_MID = '#241a3e';
const PILLAR = '#2f2050';
const PILLAR_MID = '#281c46';
const VINE = '#20183c';

// Flat, bold-graphic ground: a continuous gradient (starts at the sky's own
// tint so there's no seam), chunky flagstone tiles, two low pillar/rubble
// stacks, vine silhouettes at the top corners only, and two torches. The
// space between the torches is deliberately left empty — Polly's spot, not
// a decorated focal point (an earlier gold-seal design was rejected).
export default function GraphicGround({ skyTint }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 420" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="groundBase" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={skyTint} />
            <Stop offset="18%" stopColor={PW.color.bg} />
            <Stop offset="55%" stopColor="#120f2c" />
            <Stop offset="100%" stopColor={PW.color.bgDeep} />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="390" height="420" fill="url(#groundBase)" />

        {/* chunky flagstone floor */}
        <G stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round">
          <Rect x="-10" y="300" width="130" height="70" rx="14" fill={TILE_MID} />
          <Rect x="112" y="290" width="150" height="80" rx="14" fill="#2a1e46" />
          <Rect x="254" y="300" width="150" height="70" rx="14" fill={TILE_MID} />
          <Rect x="-10" y="360" width="150" height="80" rx="14" fill={TILE_DARK} />
          <Rect x="132" y="355" width="130" height="85" rx="14" fill="#20183c" />
          <Rect x="254" y="358" width="150" height="82" rx="14" fill={TILE_DARK} />
        </G>
        <G stroke="rgba(180,140,220,0.28)" strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M -6 302 H 116" />
          <Path d="M 116 292 H 258" />
          <Path d="M 258 302 H 400" />
        </G>

        {/* left pillar stack */}
        <G stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round">
          <Rect x="10" y="150" width="52" height="60" rx="10" fill={PILLAR} />
          <Rect x="2" y="200" width="70" height="55" rx="12" fill={PILLAR_MID} />
          <Rect x="14" y="248" width="58" height="60" rx="10" fill={TILE_MID} />
        </G>

        {/* right pillar stack */}
        <G stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round">
          <Rect x="322" y="140" width="54" height="62" rx="10" fill={PILLAR} />
          <Rect x="316" y="192" width="70" height="56" rx="12" fill={PILLAR_MID} />
          <Rect x="320" y="242" width="58" height="60" rx="10" fill={TILE_MID} />
        </G>

        {/* vine clusters, top corners only */}
        <G fill={VINE} stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round">
          <Path d="M 0 130 C 20 145 26 165 14 185 C 30 178 40 190 34 208 L 0 208 Z" />
          <Path d="M 390 120 C 368 138 364 158 378 176 C 360 172 350 186 358 204 L 390 204 Z" />
        </G>
      </Svg>

      {/* torches sit above the SVG, positioned to match the pillar stacks */}
      <View style={{ position: 'absolute', left: '4%', top: '30%' }}>
        <GroundTorch size={56} delayMs={0} />
      </View>
      <View style={{ position: 'absolute', right: '4%', top: '28%' }}>
        <GroundTorch size={56} delayMs={400} />
      </View>
    </View>
  );
}
