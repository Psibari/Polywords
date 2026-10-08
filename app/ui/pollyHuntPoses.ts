import { ImageSourcePropType } from 'react-native';
import { POLLY_POSES, POLLY_POSE_SCALE, PollyPoseName } from './pollyPoses';

// Hunt-visit-only pose art. PollyHuntVisit is the only reader.
// The master set shares one canvas (792x845) and one drawing scale, so every
// pose renders at multiplier 1 — no per-pose normalization table.
// Home, Daily, Results and DailyChallengeScreen stay on POLLY_POSES until
// they move too.
const POLLY_HUNT_MASTER_POSES = {
  smug: require('../../assets/images/polly/master/smug.png'),
  laugh: require('../../assets/images/polly/master/bigLaugh.png'),
  laugh03: require('../../assets/images/polly/master/laugh03.png'),
  point: require('../../assets/images/polly/master/point.png'),
  shocked: require('../../assets/images/polly/master/shocked.png'),
  sulk: require('../../assets/images/polly/master/sulk.png'),
  asleep: require('../../assets/images/polly/master/asleep.png'),
  embarrassed: require('../../assets/images/polly/master/embarrassed.png'),
  fly: require('../../assets/images/polly/master/fly.png'),
  flyAngry: require('../../assets/images/polly/master/flyAngry.png'),
  flyGrin: require('../../assets/images/polly/master/flyGrin.png'),
  jumpAngry: require('../../assets/images/polly/master/jumpAngry.png'),
  masterShock: require('../../assets/images/polly/master/masterShock.png'),
  hauntTaunt: require('../../assets/images/polly/master/hauntTaunt.png'),
  masterAngry: require('../../assets/images/polly/master/angry.png'),
  angryYell: require('../../assets/images/polly/master/angryYell.png'),
} as const;

export type PollyHuntMasterPoseName = keyof typeof POLLY_HUNT_MASTER_POSES;

// Every pose a Hunt visit can show: the shared names plus master-only ones
// (jumpAngry, embarrassed, laugh03, angryYell) that have no old-art equivalent.
export type PollyHuntPoseName = PollyPoseName | PollyHuntMasterPoseName;

// Type-check the values without widening the const map.
const _check: Record<PollyHuntMasterPoseName, ImageSourcePropType> = POLLY_HUNT_MASTER_POSES;
void _check;

function isMasterPose(pose: string): pose is PollyHuntMasterPoseName {
  return Object.prototype.hasOwnProperty.call(POLLY_HUNT_MASTER_POSES, pose);
}

// Poses with no master drawing yet (rattled) keep their old art and old
// scale, so they look exactly as they did before the swap.
export function pollyHuntPoseArt(pose: PollyHuntPoseName): { source: ImageSourcePropType; scale: number } {
  if (isMasterPose(pose)) return { source: POLLY_HUNT_MASTER_POSES[pose], scale: 1 };
  return { source: POLLY_POSES[pose], scale: POLLY_POSE_SCALE[pose] };
}
