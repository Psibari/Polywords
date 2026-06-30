import React from 'react';
import { Image, ImageStyle } from 'react-native';

export type PollyPose =
  | 'smug'
  | 'angry'
  | 'shocked'
  | 'shockedAlt'
  | 'shockedStartle'
  | 'neutral'
  | 'furious'
  | 'sulking'
  | 'dismissive'
  | 'guarding'
  | 'pointing'
  | 'laughing';

const POLLY_IMAGES: Record<PollyPose, ReturnType<typeof require>> = {
  smug:           require('../../../assets/images/Polly/polly_smug.png'),
  angry:          require('../../../assets/images/Polly/polly_angry.png'),
  shocked:        require('../../../assets/images/Polly/polly_shocked.png'),
  shockedAlt:     require('../../../assets/images/Polly/polly_shocked_alt.png'),
  shockedStartle: require('../../../assets/images/Polly/polly_shocked_startle.png'),
  neutral:        require('../../../assets/images/Polly/polly_neutral.png'),
  furious:        require('../../../assets/images/Polly/polly_furious.png'),
  sulking:        require('../../../assets/images/Polly/polly_sulking.png'),
  dismissive:     require('../../../assets/images/Polly/polly_dismissive.png'),
  guarding:       require('../../../assets/images/Polly/polly_guarding.png'),
  pointing:       require('../../../assets/images/Polly/polly_pointing.png'),
  laughing:       require('../../../assets/images/Polly/polly_laughing.png'),
};

// Branch bottom-edge sits at a locked, measured 77.5% down each sprite's
// canvas height (verified via pixel analysis, 480x460 canvas, all 12 poses).
export const POLLY_BRANCH_BOTTOM_FRACTION = 0.775;

const ASPECT_RATIO = 480 / 460;

interface PollySpriteProps {
  pose: PollyPose;
  size: number;
  style?: ImageStyle;
}

export default function PollySprite({ pose, size, style }: PollySpriteProps) {
  return (
    <Image
      source={POLLY_IMAGES[pose]}
      style={[{ width: size * ASPECT_RATIO, height: size }, style]}
      resizeMode="contain"
    />
  );
}
