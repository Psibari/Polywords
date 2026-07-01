export type PollyAnimationState =
  | 'idle'
  | 'tauntPoint'
  | 'laugh'
  | 'bossWarning'
  | 'sulk'
  | 'flyIn';

export const POLLY_ANIMATIONS: Record<PollyAnimationState, number> = {
  idle: require('../../assets/images/polly/polly_idle.webp'),
  tauntPoint: require('../../assets/images/polly/polly_taunt_point.webp'),
  laugh: require('../../assets/images/polly/polly_laugh.webp'),
  bossWarning: require('../../assets/images/polly/polly_boss_warning.webp'),
  sulk: require('../../assets/images/polly/polly_sulk.webp'),
  flyIn: require('../../assets/images/polly/polly_fly_in.webp'),
};

export const POLLY_BRANCH = require('../../assets/images/polly/polly_branch.png');

export const POLLY_ANIMATION_DURATIONS_MS: Record<PollyAnimationState, number> = {
  idle: 780,
  tauntPoint: 730,
  laugh: 700,
  bossWarning: 690,
  sulk: 800,
  flyIn: 580,
};
