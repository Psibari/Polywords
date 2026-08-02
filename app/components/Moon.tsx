import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { MoonPhase } from './ambientSkyLayout';
import { PW } from '../ui/pwTheme';

type Props = {
  phase: MoonPhase;
  skyTint: string;
  tint?: string;
};

const MOON_RADIUS = 22;

// Offset (as a fraction of MOON_RADIUS) of the shadow circle's center from
// the moon's center, per phase. 'full' renders no shadow circle at all.
const PHASE_OFFSET: Record<Exclude<MoonPhase, 'full'>, number> = {
  gibbous: 0.5,
  half: 1.0,
  crescent: 1.5,
};

export default function Moon({ phase, skyTint, tint = PW.color.white }: Props) {
  const size = MOON_RADIUS * 2 + 8;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={MOON_RADIUS} fill={tint} />
      {phase !== 'full' && (
        <Circle
          cx={cx + MOON_RADIUS * PHASE_OFFSET[phase]}
          cy={cy}
          r={MOON_RADIUS}
          fill={skyTint}
        />
      )}
    </Svg>
  );
}
