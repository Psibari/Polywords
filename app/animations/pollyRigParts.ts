export const POLLY_RIG_PART_NAMES = [
  'body',
  'head',
  'crown',
  'brow',
  'eyeWhite',
  'pupil',
  'beakUpper',
  'beakLower',
  'wingLeft',
  'wingRight',
  'tail',
  'bandana',
  'feet',
] as const;

export type PollyRigPartName = (typeof POLLY_RIG_PART_NAMES)[number];

export const POLLY_RIG_LAYER_ORDER: readonly PollyRigPartName[] = [
  'tail',
  'wingLeft',
  'wingRight',
  'body',
  'head',
  'bandana',
  'crown',
  'brow',
  'eyeWhite',
  'pupil',
  'beakUpper',
  'beakLower',
  'feet',
];

export const POLLY_RIG_PARTS: Record<PollyRigPartName, number> = {
  body: require('../../assets/images/polly/rig/body.png'),
  head: require('../../assets/images/polly/rig/head.png'),
  crown: require('../../assets/images/polly/rig/crown.png'),
  brow: require('../../assets/images/polly/rig/brow.png'),
  eyeWhite: require('../../assets/images/polly/rig/eye_white.png'),
  pupil: require('../../assets/images/polly/rig/pupil.png'),
  beakUpper: require('../../assets/images/polly/rig/beak_upper.png'),
  beakLower: require('../../assets/images/polly/rig/beak_lower.png'),
  wingLeft: require('../../assets/images/polly/rig/wing_left.png'),
  wingRight: require('../../assets/images/polly/rig/wing_right.png'),
  tail: require('../../assets/images/polly/rig/tail.png'),
  bandana: require('../../assets/images/polly/rig/bandana.png'),
  feet: require('../../assets/images/polly/rig/feet.png'),
};
