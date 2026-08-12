import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { FONTS } from '../../constants/fonts';
import { libraryMaterial } from '../../ui/pwMaterials';
import { spineVariantFor } from '../../ui/spineVariants';
import { FoilWord } from './FoilWord';

export const SPINE_HEIGHT = 128;
export const SPINE_WIDTHS = [30, 36, 44] as const;

const TITLE_FONT_SIZE = 15;
const RAISE_Y = -14;

type Props = {
  word: string;
  kind: 'mastered' | 'ghost';
  isBoss?: boolean;
  raised?: boolean;      // slid up out of the row (selected)
  onPress?: () => void;
  height?: number;
};

// One reclaimed word as a standing book: leather slab, gold tooling bands,
// foil title reading down the spine. Ghost variant: translucent, purple-
// tinted, faded lavender title, feather claim tag — Polly's grip.
export function BookSpine({ word, kind, isBoss, raised, onPress, height = SPINE_HEIGHT }: Props) {
  const { widthTier, leanDeg } = spineVariantFor(word);
  const scale = height / SPINE_HEIGHT;
  const width = Math.round(SPINE_WIDTHS[widthTier] * scale);
  const titleFontSize = Math.max(10, Math.round(TITLE_FONT_SIZE * scale));
  const bandHeight = Math.max(1, 2 * scale);
  const isGhost = kind === 'ghost';

  const raiseY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(raiseY, {
      toValue: raised ? RAISE_Y * scale : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [raised, raiseY]);

  // Rotated title track: width = usable spine length (between tooling bands).
  const titleTrack = height - Math.round(34 * scale);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${word}, ${isGhost ? 'haunted' : 'mastered'}${isBoss ? ", Polly's Word" : ''}` : undefined}
    >
      <Animated.View
        style={[
          styles.root,
          { width, height },
          isGhost && styles.ghostRoot,
          {
            transform: [{ translateY: raiseY }, { rotate: `${leanDeg}deg` }],
          },
        ]}
      >
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={`leather-${word}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={libraryMaterial.spineLeatherTop} />
              <Stop offset="0.5" stopColor={libraryMaterial.spineLeather} />
              <Stop offset="1" stopColor={libraryMaterial.spineLeatherBot} />
            </LinearGradient>
          </Defs>
          {/* Leather slab */}
          <Rect
            x={0.5}
            y={0.5}
            width={width - 1}
            height={height - 1}
            rx={3}
            fill={isGhost ? libraryMaterial.ghostLeather : `url(#leather-${word})`}
            stroke={isGhost ? libraryMaterial.ghostTint : libraryMaterial.spineToolingHairline}
            strokeWidth={1}
          />
          {/* Tooling bands — head and tail */}
          <Rect x={3} y={Math.round(10 * scale)} width={width - 6} height={bandHeight}
            fill={isGhost ? libraryMaterial.ghostTint : libraryMaterial.spineTooling} />
          <Rect x={3} y={height - Math.round(14 * scale)} width={width - 6} height={bandHeight}
            fill={isGhost ? libraryMaterial.ghostTint : libraryMaterial.spineTooling} />
          {/* Boss books carry a second amber band at head and tail */}
          {isBoss && !isGhost && (
            <>
              <Rect x={3} y={Math.round(15 * scale)} width={width - 6} height={Math.max(1, 1.5 * scale)} fill={libraryMaterial.spineAmber} />
              <Rect x={3} y={height - Math.round(18 * scale)} width={width - 6} height={Math.max(1, 1.5 * scale)} fill={libraryMaterial.spineAmber} />
            </>
          )}
          {/* Ghost feather claim tag at the tail — her signature */}
          {isGhost && (
            <Path
              d={`M ${width / 2 - 4 * scale} ${height - 24 * scale}
                  q ${4 * scale} ${-10 * scale} ${8 * scale} ${-2 * scale}
                  q ${-2 * scale} ${8 * scale} ${-8 * scale} ${10 * scale}
                  q ${2 * scale} ${-5 * scale} 0 ${-8 * scale} z`}
              fill={libraryMaterial.ghostTint}
              stroke={libraryMaterial.ghostFeatherEdge}
              strokeWidth={0.6}
            />
          )}
        </Svg>

        {/* Title reading down the spine */}
        <View style={[styles.titleHolder, { width, height }]} pointerEvents="none">
          <View style={[styles.titleTrack, { width: titleTrack, height: width - 6 }]}>
            {isGhost ? (
              <Text style={[styles.ghostTitle, { fontSize: titleFontSize }]} numberOfLines={1} adjustsFontSizeToFit>
                {word}
              </Text>
            ) : (
              <FoilWord
                word={word}
                baseStyle={styles.titleBase}
                fontSize={titleFontSize}
              />
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostRoot: {
    opacity: 0.55,
  },
  titleHolder: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTrack: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '90deg' }],
  },
  titleBase: {
    fontSize: 15,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    letterSpacing: 1,
    textAlign: 'center',
    maxWidth: '100%',
  },
  ghostTitle: {
    fontSize: 15,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    letterSpacing: 1,
    textAlign: 'center',
    maxWidth: '100%',
    color: libraryMaterial.ghostTitle,
  },
});
