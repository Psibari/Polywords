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
  const shared: TextStyle = {
    fontFamily,
    includeFontPadding: false,
    fontSize,
    lineHeight,
    fontWeight: '900',
    letterSpacing: 0.25,
    textAlign: 'center',
  };

  const fitProps = {
    numberOfLines,
    adjustsFontSizeToFit,
    minimumFontScale,
  } as const;

  return (
    <View style={[styles.root, { minHeight: lineHeight + 5 }, containerStyle]} accessible accessibilityLabel={accessibilityLabel ?? text}>
      <Text
        {...fitProps}
        pointerEvents="none"
        style={[
          styles.layer,
          shared,
          textStyle,
          {
            color: palette.depth,
            transform: [{ translateX: 1.2 }, { translateY: 2.2 }],
            textShadowColor: palette.shadow,
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 1.2,
          },
        ]}
      >
        {text}
      </Text>
      <Text
        {...fitProps}
        pointerEvents="none"
        style={[
          styles.layer,
          shared,
          textStyle,
          {
            color: palette.highlight,
            opacity: 0.34,
            transform: [{ translateX: -0.7 }, { translateY: -0.9 }],
          },
        ]}
      >
        {text}
      </Text>
      <Text
        {...fitProps}
        style={[
          shared,
          textStyle,
          {
            color: palette.face,
            textShadowColor: palette.shadow,
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 0.8,
          },
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
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
