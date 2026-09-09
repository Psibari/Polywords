import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { resolveParchmentSlices } from '../dailyScrollLayout';

const SCROLL_PAPER = require('../../../assets/images/textures/scroll_paper.png');

type Props = {
  width: number;
  height: number;
};

// The parchment drawn as two clipped windows onto ONE source image.
//
// Previously this was a single <Image resizeMode="stretch"> sized to a fixed
// 160pt height against a floating width, which stretched the drawing
// horizontally by up to x1.48 and smeared the torn edges and grain.
//
// Now the horizontal scale is uniform (width / 799) for both slices, so
// there is no horizontal distortion at all. The torn bottom edge renders at
// that same uniform scale and never stretches vertically. Only the body —
// smooth top-lit gradient and a gentle taper — absorbs vertical stretch,
// which those features tolerate because they carry no fine detail.
export default function ParchmentSurface({ width, height }: Props) {
  if (width <= 0 || height <= 0) return null;

  const slices = resolveParchmentSlices(width, height);

  return (
    <View style={[styles.root, { width, height }]} pointerEvents="none">
      <View style={[styles.clip, { width, height: slices.bodyHeight }]}>
        <Image
          source={SCROLL_PAPER}
          style={{ width, height: slices.bodyImageHeight }}
          resizeMode="stretch"
        />
      </View>
      <View style={[styles.clip, { width, height: slices.edgeHeight }]}>
        <Image
          source={SCROLL_PAPER}
          style={{
            width,
            height: slices.edgeImageHeight,
            marginTop: slices.edgeImageTop,
          }}
          resizeMode="stretch"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  clip: {
    overflow: 'hidden',
  },
});
