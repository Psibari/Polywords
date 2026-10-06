import type { ImageSourcePropType } from 'react-native';

export const POLLY_ACTING_SPRITES = {
  neutral: require('../../assets/images/polly/perch_poses/polly_perch_neutral.png'),
  smug: require('../../assets/images/polly/perch_poses/polly_perch_smug.png'),
  smirk: require('../../assets/images/polly/perch_poses/polly_perch_smirk.png'),
  blink: require('../../assets/images/polly/perch_poses/polly_perch_blink.png'),
  laugh01: require('../../assets/images/polly/perch_poses/polly_perch_laugh_01.png'),
  laugh02: require('../../assets/images/polly/perch_poses/polly_perch_laugh_02.png'),
  laugh03: require('../../assets/images/polly/perch_poses/polly_perch_laugh_03.png'),
  shocked: require('../../assets/images/polly/perch_poses/polly_perch_shocked.png'),
  sulk: require('../../assets/images/polly/perch_poses/polly_perch_sulk.png'),
  angry: require('../../assets/images/polly/perch_poses/polly_perch_angry.png'),
  bigLaugh: require('../../assets/images/polly/perch_poses/polly_perch_big_laugh.png'),
  embarrassed: require('../../assets/images/polly/perch_poses/polly_perch_embarrassed.png'),
  shockJump: require('../../assets/images/polly/perch_poses/polly_shock_jump.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export type PollyActingSpriteName = keyof typeof POLLY_ACTING_SPRITES;

export const POLLY_ACTING_SPRITE_ORDER: readonly PollyActingSpriteName[] = [
  'neutral',
  'smug',
  'smirk',
  'blink',
  'laugh01',
  'laugh02',
  'laugh03',
  'bigLaugh',
  'shocked',
  'shockJump',
  'embarrassed',
  'sulk',
  'angry',
];

export const POLLY_ACTING_SPRITE_LABELS: Record<PollyActingSpriteName, string> = {
  neutral: 'Neutral',
  smug: 'Smug',
  smirk: 'Smirk',
  blink: 'Blink',
  laugh01: 'Laugh 01',
  laugh02: 'Laugh 02',
  laugh03: 'Laugh 03',
  bigLaugh: 'Big Laugh',
  shocked: 'Shocked',
  shockJump: 'Shock Jump',
  embarrassed: 'Embarrassed',
  sulk: 'Sulk',
  angry: 'Angry / Haunted',
};

export const POLLY_LAUGH_SEQUENCE = [
  POLLY_ACTING_SPRITES.laugh01,
  POLLY_ACTING_SPRITES.laugh02,
  POLLY_ACTING_SPRITES.laugh03,
] as const;

// Short enough to read as one laugh action, slow enough to audit each pose on-device.
export const POLLY_LAUGH_FRAME_MS = 145;
