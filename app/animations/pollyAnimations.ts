export type PollyAnimationState =
  | 'idle'
  | 'tauntPoint'
  | 'laugh'
  | 'bossWarning'
  | 'sulk'
  | 'flyIn'
  | 'masterShock'
  | 'masterAngry'
  | 'hauntTaunt';

export const POLLY_ANIMATIONS: Record<PollyAnimationState, number> = {
  idle: require('../../assets/images/polly/polly_idle.webp'),
  tauntPoint: require('../../assets/images/polly/polly_taunt_point.webp'),
  laugh: require('../../assets/images/polly/polly_laugh.webp'),
  bossWarning: require('../../assets/images/polly/polly_boss_warning.webp'),
  sulk: require('../../assets/images/polly/polly_sulk.webp'),
  flyIn: require('../../assets/images/polly/polly_fly_in.webp'),
  // Mastery celebration set (2026-08-04) — see memory/CLAUDE.md for the
  // locked sequence: word gilds -> Polly reacts -> book closes in background.
  masterShock: require('../../assets/images/polly/polly_shocked.png'),
  masterAngry: require('../../assets/images/polly/polly_angry.png'),
  hauntTaunt: require('../../assets/images/polly/polly_pointing.png'),
};

export const POLLY_BRANCH = require('../../assets/images/polly/polly_branch.png');

export const POLLY_ANIMATION_DURATIONS_MS: Record<PollyAnimationState, number> = {
  idle: 780,
  tauntPoint: 730,
  laugh: 700,
  bossWarning: 690,
  sulk: 800,
  flyIn: 580,
  // Placeholder durations, consistent with the existing range — tune for
  // real feel during the warroom-gated implementation pass, not final.
  masterShock: 700,
  masterAngry: 800,
  hauntTaunt: 700,
};
