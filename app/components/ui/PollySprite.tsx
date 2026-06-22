import React from 'react';
import { Image, ImageStyle } from 'react-native';

export type PollyPose =
  | 'flyExcited'       // polly_01 — mid-round fly-in entrance
  | 'flyRelaxed'       // polly_02 — end-of-round fly-in
  | 'perchNeutral'     // polly_03 — default perch / idle
  | 'perchDismissive'  // polly_04 — trap rejected, Polly annoyed
  | 'perchLaughing'    // polly_05 — haunt created / run clipped, Polly wins
  | 'perchSmug'        // polly_06 — wrong swipe, "Thought so."
  | 'perchPointing'    // polly_07 — boss word throw, master tile drops
  | 'perchShocked'     // polly_08 — player perfect clear, Polly surprised
  | 'perchSulking'     // polly_09 — player masters word, Polly loses
  | 'flyAngry'         // polly_10 — "YOU BEAT POLLY"

const POSE_IMAGES: Record<PollyPose, ReturnType<typeof require>> = {
  flyExcited:      require('../../../assets/images/Polly/polly_01.png'),
  flyRelaxed:      require('../../../assets/images/Polly/polly_02.png'),
  perchNeutral:    require('../../../assets/images/Polly/polly_03.png'),
  perchDismissive: require('../../../assets/images/Polly/polly_04.png'),
  perchLaughing:   require('../../../assets/images/Polly/polly_05.png'),
  perchSmug:       require('../../../assets/images/Polly/polly_06.png'),
  perchPointing:   require('../../../assets/images/Polly/polly_07.png'),
  perchShocked:    require('../../../assets/images/Polly/polly_08.png'),
  perchSulking:    require('../../../assets/images/Polly/polly_09.png'),
  flyAngry:        require('../../../assets/images/Polly/polly_10.png'),
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
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
