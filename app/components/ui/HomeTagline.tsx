import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FONTS } from '../../constants/fonts';
import { PW } from '../../ui/pwTheme';
import { HOME_TAGLINE, homeType } from '../../ui/pwHomeMaterials';

type Props = {
  // Matches the title lockup's rendered width so the tagline can never run
  // wider than POLYWORDS above it; shrinks to fit instead of overflowing.
  maxWidth: number;
};

export function HomeTagline({ maxWidth }: Props) {
  return (
    <Text
      style={[styles.text, { maxWidth }]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
    >
      {HOME_TAGLINE}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    marginTop: 4,
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: homeType.tagline,
    textAlign: 'center',
    textShadowColor: PW.color.textShadowStrong,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
