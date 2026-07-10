import React from 'react';
import { Image } from 'expo-image';

const HOME_WORDMARK_ASPECT_RATIO = 220 / 900;

type Props = {
  width: number;
};

// Home masthead, rasterized from HOME_MASTHEAD_WORDMARK_SVG in pwBrandAssets.
// It is intentionally separate from BrandWordmark: the Home screen needs a
// large readable title, while icon/splash assets can keep their own lockup.
export function HomeWordmark({ width }: Props) {
  return (
    <Image
      source={require('../../../assets/images/brand/home-wordmark.png')}
      style={{ width, height: width * HOME_WORDMARK_ASPECT_RATIO }}
      contentFit="contain"
    />
  );
}
