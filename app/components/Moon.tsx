import React from 'react';
import { Image } from 'react-native';
import { MoonPhase } from './ambientSkyLayout';

type Props = {
  phase: MoonPhase;
};

const MOON_HEIGHT = 64;

// Cropped from Pete's 9-phase sprite sheet (assets/images/moons/moons.png).
// Real shaded art replaces the old SVG mask+flat-tint circle — these render
// as-is, no recoloring, so the shading stays intact.
const MOON_SOURCES: Record<MoonPhase, number> = {
  crescent: require('../../assets/images/moons/moon-r0-c0.png'),
  half: require('../../assets/images/moons/moon-r1-c0.png'),
  gibbous: require('../../assets/images/moons/moon-r1-c1.png'),
  full: require('../../assets/images/moons/moon-r2-c2.png'),
};

// Native crop dimensions, used to hold a consistent apparent diameter
// (MOON_HEIGHT) across phases despite crescent crops being much narrower
// than full-moon crops.
const MOON_NATIVE_SIZE: Record<MoonPhase, { width: number; height: number }> = {
  crescent: { width: 107, height: 244 },
  half: { width: 159, height: 245 },
  gibbous: { width: 197, height: 245 },
  full: { width: 244, height: 244 },
};

export default function Moon({ phase }: Props) {
  const native = MOON_NATIVE_SIZE[phase];
  const width = MOON_HEIGHT * (native.width / native.height);

  return (
    <Image
      source={MOON_SOURCES[phase]}
      style={{ width, height: MOON_HEIGHT }}
      resizeMode="contain"
    />
  );
}
