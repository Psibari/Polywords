import React from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
} from 'react-native';

const maskCardFace = require('../../../assets/images/mask-card-v1/card-face.png');

type Props = {
  style?: StyleProp<ImageStyle>;
};

export default function MaskCardArtwork({ style }: Props) {
  return (
    <Image
      source={maskCardFace}
      resizeMode="stretch"
      style={[styles.artwork, style]}
    />
  );
}

const styles = StyleSheet.create({
  artwork: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
