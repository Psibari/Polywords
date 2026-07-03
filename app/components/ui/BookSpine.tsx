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
  hiddenFound?: boolean; // gold pin near the head — hidden meaning cracked
  raised?: boolean;      // slid up out of the row (selected)
  onPress?: () => void;
};

// One reclaimed word as a standing book: leather slab, gold tooling bands,
// foil title reading down the spine. Ghost variant: translucent, purple-
// tinted, faded lavender title, feather claim tag — Polly's grip.
export function BookSpine({ word, kind, isBoss, hiddenFound, raised, onPress }: Props) {
  const { widthTier, leanDeg } = spineVariantFor(word);
  const width = SPINE_WIDTHS[widthTier];
  const isGhost = kind === 'ghost';

  const raiseY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(raiseY, {
      toValue: raised ? RAISE_Y : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [raised, raiseY]);

  // Rotated title track: width = usable spine length (between tooling bands).
  const titleTrack = SPINE_HEIGHT - 40;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Animated.View
        style={[
          styles.root,
          { width, height: SPINE_HEIGHT },
          isGhost && styles.ghostRoot,
          {
            transform: [{ translateY: raiseY }, { rotate: `${leanDeg}deg` }],
          },
        ]}
      >
        <Svg width={width} height={SPINE_HEIGHT}>
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
            height={SPINE_HEIGHT - 1}
            rx={3}
            fill={isGhost ? libraryMaterial.ghostLeather : `url(#leather-${word})`}
            stroke={isGhost ? libraryMaterial.ghostTint : libraryMaterial.spineToolingHairline}
            strokeWidth={1}
          />
          {/* Tooling bands — head and tail */}
          <Rect x={3} y={10} width={width - 6} height={2}
            fill={isGhost ? libraryMaterial.ghostTint : libraryMaterial.spineTooling} />
          <Rect x={3} y={SPINE_HEIGHT - 14} width={width - 6} height={2}
            fill={isGhost ? libraryMaterial.ghostTint : libraryMaterial.spineTooling} />
          {/* Boss books carry a second amber band at head and tail */}
          {isBoss && !isGhost && (
            <>
              <Rect x={3} y={15} width={width - 6} height={1.5} fill={libraryMaterial.spineAmber} />
              <Rect x={3} y={SPINE_HEIGHT - 18} width={width - 6} height={1.5} fill={libraryMaterial.spineAmber} />
            </>
          )}
          {/* Hidden-meaning pin — gold head, amber core */}
          {hiddenFound && !isGhost && (
            <>
              <Path d={`M ${width / 2} 5 a 3 3 0 1 0 0.001 0`} fill={libraryMaterial.spineTooling} />
              <Path d={`M ${width / 2} 6.5 a 1.5 1.5 0 1 0 0.001 0`} fill={libraryMaterial.spineAmber} />
            </>
          )}
          {/* Ghost feather claim tag at the tail — her signature */}
          {isGhost && (
            <Path
              d={`M ${width / 2 - 4} ${SPINE_HEIGHT - 24}
                  q 4 -10 8 -2 q -2 8 -8 10 q 2 -5 0 -8 z`}
              fill={libraryMaterial.ghostTint}
              stroke={libraryMaterial.ghostFeatherEdge}
              strokeWidth={0.6}
            />
          )}
        </Svg>

        {/* Title reading down the spine */}
        <View style={[styles.titleHolder, { width, height: SPINE_HEIGHT }]} pointerEvents="none">
          <View style={[styles.titleTrack, { width: titleTrack, height: width - 6 }]}>
            {isGhost ? (
              <Text style={styles.ghostTitle} numberOfLines={1} adjustsFontSizeToFit>
                {word}
              </Text>
            ) : (
              <FoilWord
                word={word}
                baseStyle={styles.titleBase}
                fontSize={TITLE_FONT_SIZE}
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
    letterSpacing: 1,
    textAlign: 'center',
    maxWidth: '100%',
  },
  ghostTitle: {
    fontSize: 15,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 1,
    textAlign: 'center',
    maxWidth: '100%',
    color: libraryMaterial.ghostTitle,
  },
});
