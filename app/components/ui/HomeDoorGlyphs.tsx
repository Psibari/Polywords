import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { heroBookMaterial } from '../../ui/pwMaterials';

// Small emblem glyphs for the Home screen's Daily Challenge / Word Vault
// tiles — icon-first, no copy. Kept separate from QuillScrollPanel and
// BookSpine (their full-scene versions) since these are tiny static marks.

export function DailyQuillGlyph({ size = 26 }: { size?: number }) {
  const w = size;
  const h = size * 1.5;
  return (
    <Svg width={w} height={h} viewBox="0 0 26 39">
      <Defs>
        <LinearGradient id="homeQuillGold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={heroBookMaterial.goldTrim} />
          <Stop offset="1" stopColor={heroBookMaterial.goldPinInner} />
        </LinearGradient>
      </Defs>
      <Path
        d="M13,38 C16,28 19,20 24,2 C18,6 12,13 9,22 C6,31 8,35 13,38 Z"
        fill="url(#homeQuillGold)"
        stroke={heroBookMaterial.goldPinInner}
        strokeWidth={0.6}
      />
      <Path
        d="M13,37 C15,28 18,19 23,3"
        fill="none"
        stroke={heroBookMaterial.goldPinInner}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function VaultSpinesGlyph({ size = 26 }: { size?: number }) {
  const w = size;
  const h = size * 1.3;
  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h} viewBox="0 0 26 30">
        <Defs>
          <LinearGradient id="homeSpineGold" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={heroBookMaterial.goldTrim} />
            <Stop offset="1" stopColor={heroBookMaterial.goldPinInner} />
          </LinearGradient>
        </Defs>
        <Rect x={1} y={6} width={6} height={22} rx={1.5} fill="url(#homeSpineGold)" stroke={heroBookMaterial.coverPurpleTop} strokeWidth={0.8} />
        <Rect x={2} y={12} width={4} height={1.2} fill={heroBookMaterial.coverPurpleTop} />
        <Rect x={9} y={1} width={7} height={27} rx={1.5} fill="url(#homeSpineGold)" stroke={heroBookMaterial.coverPurpleTop} strokeWidth={0.8} />
        <Rect x={10.5} y={8} width={4} height={1.2} fill={heroBookMaterial.coverPurpleTop} />
        <Rect x={18} y={8} width={6} height={20} rx={1.5} fill="url(#homeSpineGold)" stroke={heroBookMaterial.coverPurpleTop} strokeWidth={0.8} />
        <Rect x={19.5} y={14} width={4} height={1.2} fill={heroBookMaterial.coverPurpleTop} />
      </Svg>
    </View>
  );
}
