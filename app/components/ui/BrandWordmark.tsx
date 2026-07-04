import React from 'react';
import { SvgXml } from 'react-native-svg';
import { WORDMARK_LOCKUP_SVG } from '../../ui/pwBrandAssets';

const WORDMARK_ASPECT_RATIO = 170 / 460;

type Props = {
  width: number;
};

export function BrandWordmark({ width }: Props) {
  return (
    <SvgXml
      xml={WORDMARK_LOCKUP_SVG}
      width={width}
      height={width * WORDMARK_ASPECT_RATIO}
    />
  );
}
