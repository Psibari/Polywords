import React from 'react';
import { Image } from 'expo-image';

const WORDMARK_ASPECT_RATIO = 165 / 700;

type Props = {
  width: number;
};

// Static image, not a live SvgXml render — react-native-svg's SvgXml proved
// unreliable on-device (clipped to raw viewBox pixel size regardless of the
// width/height props). The source SVG (app/ui/pwBrandAssets.ts) is still the
// single source of truth; this PNG is generated from it by
// scripts/generate-brand-icons.ts.
export function BrandWordmark({ width }: Props) {
  return (
    <Image
      source={require('../../../assets/images/brand/wordmark.png')}
      style={{ width, height: width * WORDMARK_ASPECT_RATIO }}
      contentFit="contain"
    />
  );
}
