import React from 'react';
import { Image, ImageStyle } from 'react-native';
import { POLLY_ANIMATIONS } from '../../animations/pollyAnimations';

export type PollyPose =
  | 'flyExcited'       // polly_fly_excited — big reaction launch
  | 'flyRelaxed'       // polly_fly_relaxed — wander transition
  | 'flyAngry'         // polly_fly_angry   — beat Polly
  | 'perchNeutral'     // polly_neutral      — default idle
  | 'perchDismissive'  // polly_dismissive   — first correct swipe
  | 'perchLaughing'    // polly_laughing     — Polly wins
  | 'perchSmug'        // polly_smug         — wrong x1
  | 'perchPointing'    // polly_pointing     — hesitation taunts
  | 'perchShocked'     // polly_shocked      — perfect clear
  | 'perchSulking';    // polly_sulking      — player masters word

// Canvas: 460w × 500h. Branch top sits at 73% down the canvas.
const W_RATIO = 460 / 500;
export const POLLY_BRANCH_BOTTOM_FRACTION = 0.73;

// Flying poses — used to conditionally hide the fixed branch in MaskBoard
export const FLYING_POSES = new Set<PollyPose>([
  'flyExcited', 'flyRelaxed', 'flyAngry',
]);

const POSE_IMAGES: Record<PollyPose, ReturnType<typeof require>> = {
  flyExcited: POLLY_ANIMATIONS.flyIn,
  flyRelaxed: POLLY_ANIMATIONS.flyIn,
  flyAngry: POLLY_ANIMATIONS.flyIn,
  perchNeutral: POLLY_ANIMATIONS.idle,
  perchDismissive: POLLY_ANIMATIONS.sulk,
  perchLaughing: POLLY_ANIMATIONS.laugh,
  perchSmug: POLLY_ANIMATIONS.idle,
  perchPointing: POLLY_ANIMATIONS.tauntPoint,
  perchShocked: POLLY_ANIMATIONS.bossWarning,
  perchSulking: POLLY_ANIMATIONS.sulk,
};

interface PollySpriteProps {
  pose: PollyPose;
  size: number;
  style?: ImageStyle;
}

export default function PollySprite({ pose, size, style }: PollySpriteProps) {
  return (
    <Image
      source={POSE_IMAGES[pose]}
      style={[{ width: size * W_RATIO, height: size }, style]}
      resizeMode="contain"
    />
  );
}
