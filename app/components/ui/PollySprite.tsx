import React from 'react';
import { Image, ImageStyle } from 'react-native';

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
  flyExcited:      require('../../../assets/images/Polly/polly_fly_excited.png'),
  flyRelaxed:      require('../../../assets/images/Polly/polly_fly_relaxed.png'),
  flyAngry:        require('../../../assets/images/Polly/polly_fly_angry.png'),
  perchNeutral:    require('../../../assets/images/Polly/polly_neutral.png'),
  perchDismissive: require('../../../assets/images/Polly/polly_dismissive.png'),
  perchLaughing:   require('../../../assets/images/Polly/polly_laughing.png'),
  perchSmug:       require('../../../assets/images/Polly/polly_smug.png'),
  perchPointing:   require('../../../assets/images/Polly/polly_pointing.png'),
  perchShocked:    require('../../../assets/images/Polly/polly_shocked.png'),
  perchSulking:    require('../../../assets/images/Polly/polly_sulking.png'),
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
