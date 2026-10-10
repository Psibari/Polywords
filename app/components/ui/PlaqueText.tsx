import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { FONTS } from '../../constants/fonts';
import { PLAQUE_TEXT_MATERIALS, type PlaqueTextMaterialName } from '../../ui/plaqueTextMaterial';

type Props = {
  text: string;
  material: PlaqueTextMaterialName;
  fontSize: number;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fontFamily?: string;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  accessibilityLabel?: string;
};

/**
 * Dynamic plaque lettering that reads as part of the illustrated object.
 *
 * IMPORTANT: this intentionally renders ONE Text node. The earlier three-node
 * depth/highlight/face stack could separate vertically on-device when React
 * Native resolved absolute text bounds, exposing the construction layers as
 * three copies of the word. A single face plus a tight material shadow is more
 * robust and still gives the plaque a raised/pressed-metal read.
 */
export default function PlaqueText({
  text,
  material,
  fontSize,
  containerStyle,
  textStyle,
  fontFamily = FONTS.wordDisplay,
  numberOfLines = 1,
  adjustsFontSizeToFit = true,
  minimumFontScale = 0.58,
  accessibilityLabel,
}: Props) {
  const palette = PLAQUE_TEXT_MATERIALS[material];
  const lineHeight = Math.round(fontSize * 1.08);

  return (
    <View
      style={[styles.root, { minHeight: lineHeight + 5 }, containerStyle]}
      accessible
      accessibilityLabel={accessibilityLabel ?? text}
    >
      <Text
        numberOfLines={numberOfLines}
        adjustsFontSizeToFit={adjustsFontSizeToFit}
        minimumFontScale={minimumFontScale}
        style={[
          styles.text,
          {
            fontFamily,
            fontSize,
            lineHeight,
            color: palette.face,
            textShadowColor: palette.depth,
            textShadowOffset: { width: 1.25, height: 1.9 },
            textShadowRadius: 1.15,
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    justifyContent: 'center',
  },
  text: {
    includeFontPadding: false,
    fontWeight: '900',
    letterSpacing: 0.25,
    textAlign: 'center',
  },
});
