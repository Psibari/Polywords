import React from 'react';
import { Image } from 'expo-image';
import { ImageStyle, StyleProp, StyleSheet } from 'react-native';

const maskCardFace = require('../../../assets/images/mask-card-v1/card-face.png');

type Props = {
  style?: StyleProp<ImageStyle>;
};

export default function MaskCardArtwork({ style }: Props) {
  return (
    <Image
      source={maskCardFace}
      contentFit="fill"
      style={[styles.artwork, style]}
    />
  );
}

const styles = StyleSheet.create({
  artwork: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
});
