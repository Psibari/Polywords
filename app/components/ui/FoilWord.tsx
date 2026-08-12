import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { foilMaterial } from '../../ui/pwMaterials';

type Props = {
  word: string;
  // Font family/size/letterSpacing/textAlign/layout. Color and text-shadow
  // are owned by the foil layers and override anything in baseStyle.
  baseStyle: StyleProp<TextStyle>;
  // Drives layer offsets so the recipe scales with the set size.
  fontSize: number;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
};

// The trophy-word treatment: gold-foil stamping, three layers.
// At 96px this is byte-identical to the hero word's original recipe:
// deboss +4px, catch-light -2.5px, fill edge radius 2.
export function FoilWord({
  word,
  baseStyle,
  fontSize,
  // Android's adjustsFontSizeToFit is known-unreliable at shrinking custom-font
  // text far enough to fit a single line (RN/Android platform limitation, not
  // something this app controls) — when it under-shrinks, numberOfLines={1}
  // was silently clipping whole trailing letters ("CRAFT" rendering as "CRA")
  // instead of the word actually shrinking. Allowing a 2nd line as a fallback
  // means a failed shrink wraps instead of losing letters; it never forces a
  // 2nd line for words that already fit on one.
  numberOfLines = 2,
  adjustsFontSizeToFit = true,
  minimumFontScale,
}: Props) {
  const debossY = Math.max(1, Math.round(fontSize * (4 / 96)));
  const catchLightY = -Math.max(1, fontSize * (2.5 / 96));
  const edgeRadius = Math.max(1, Math.round(fontSize / 48));

  const textProps = { numberOfLines, adjustsFontSizeToFit, minimumFontScale };

  return (
    <>
      <Text
        {...textProps}
        style={[baseStyle, styles.deboss, { transform: [{ translateY: debossY }] }]}
      >
        {word}
      </Text>
      <Text
        {...textProps}
        style={[baseStyle, styles.catchLight, { transform: [{ translateY: catchLightY }] }]}
      >
        {word}
      </Text>
      <Text
        {...textProps}
        style={[baseStyle, styles.fill, { textShadowRadius: edgeRadius }]}
      >
        {word}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  deboss: {
    position: 'absolute',
    color: foilMaterial.deboss,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  catchLight: {
    position: 'absolute',
    color: foilMaterial.catchLight,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  fill: {
    color: foilMaterial.fill,
    textShadowColor: foilMaterial.edge,
    textShadowOffset: { width: 0, height: 1 },
  },
});
