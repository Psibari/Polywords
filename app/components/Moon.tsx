import React, { useId } from 'react';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import { MoonPhase } from './ambientSkyLayout';
import { PW } from '../ui/pwTheme';

type Props = {
  phase: MoonPhase;
  tint?: string;
};

const MOON_RADIUS = 22;

// Offset (as a fraction of MOON_RADIUS) of the mask-cutout circle's center
// from the moon's center, per phase. 'full' renders no cutout at all. Note:
// this technique always produces a lune (crescent-like curve), including for
// 'half' — a true straight-edge terminator isn't achievable this way. That's
// an accepted limitation, not a bug.
const PHASE_OFFSET: Record<Exclude<MoonPhase, 'full'>, number> = {
  gibbous: 1.5,
  half: 1.0,
  crescent: 0.5,
};

export default function Moon({ phase, tint = PW.color.white }: Props) {
  const id = useId();
  const maskId = `moonMask-${id}`;
  const size = MOON_RADIUS * 2 + 8;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <Mask id={maskId}>
          <Rect x={0} y={0} width={size} height={size} fill="white" />
          {phase !== 'full' && (
            <Circle
              cx={cx + MOON_RADIUS * PHASE_OFFSET[phase]}
              cy={cy}
              r={MOON_RADIUS}
              fill="black"
            />
          )}
        </Mask>
      </Defs>
      <Circle cx={cx} cy={cy} r={MOON_RADIUS} fill={tint} mask={`url(#${maskId})`} />
    </Svg>
  );
}
