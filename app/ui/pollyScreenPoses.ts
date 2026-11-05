import { ImageSourcePropType } from 'react-native';
import { POLLY_POSES, POLLY_POSE_SCALE } from './pollyPoses';

// Pose art for the Results perch (Daily moves here later). Modeled on
// pollyHuntPoses.ts. Reaction poses use the master set: one 792x845 canvas
// and one drawing scale, so they render at multiplier 1.
// idle and smug stay on the old sprite4 art at its old scale because these
// screens show the face rig for them, and the rig is cut from sprite4. Both
// point at the SAME POLLY_POSES.idle object: the perch shows the rig when
// the source === POLLY_POSES.idle, so they must stay that exact reference.
const POLLY_SCREEN_POSES = {
  idle: POLLY_POSES.idle,
  smug: POLLY_POSES.idle,
  fly: require('../../assets/images/polly/master/fly.png'),
  laugh: require('../../assets/images/polly/master/bigLaugh.png'),
  sulk: require('../../assets/images/polly/master/sulk.png'),
  point: require('../../assets/images/polly/master/point.png'),
  shocked: require('../../assets/images/polly/master/shocked.png'),
  embarrassed: require('../../assets/images/polly/master/embarrassed.png'),
  flyAngry: require('../../assets/images/polly/master/flyAngry.png'),
  flyGrin: require('../../assets/images/polly/master/flyGrin.png'),
  // For the Daily breach (CONTEXT.md "THE BREACH"); not used by any perch yet. masterShock here is the
  // MASTER art, not the older polly_shocked.png that pollyPoses.ts calls masterShock.
  masterShock: require('../../assets/images/polly/master/masterShock.png'),
  angryYell: require('../../assets/images/polly/master/angryYell.png'),
  angry: require('../../assets/images/polly/master/angry.png'),
  jumpAngry: require('../../assets/images/polly/master/jumpAngry.png'),
  laugh01: require('../../assets/images/polly/master/laugh01.png'),
  laugh03: require('../../assets/images/polly/master/laugh03.png'),
  hauntTaunt: require('../../assets/images/polly/master/hauntTaunt.png'),
} as const;

export type PollyScreenPoseName = keyof typeof POLLY_SCREEN_POSES;

// Type-check the values without widening the const map.
const _check: Record<PollyScreenPoseName, ImageSourcePropType> = POLLY_SCREEN_POSES;
void _check;

const POLLY_SCREEN_POSE_SCALE: Record<PollyScreenPoseName, number> = {
  idle: POLLY_POSE_SCALE.idle,
  smug: POLLY_POSE_SCALE.idle,
  fly: 1,
  laugh: 1,
  sulk: 1,
  point: 1,
  shocked: 1,
  embarrassed: 1,
  flyAngry: 1,
  flyGrin: 1,
  masterShock: 1,
  angryYell: 1,
  angry: 1,
  jumpAngry: 1,
  laugh01: 1,
  laugh03: 1,
  hauntTaunt: 1,
};

export function pollyScreenPoseArt(pose: PollyScreenPoseName): { source: ImageSourcePropType; scale: number } {
  return { source: POLLY_SCREEN_POSES[pose], scale: POLLY_SCREEN_POSE_SCALE[pose] };
}

// True for the poses the perch rig replaces (idle and smug, one drawing).
export function pollyScreenPoseUsesRig(pose: PollyScreenPoseName): boolean {
  return POLLY_SCREEN_POSES[pose] === POLLY_POSES.idle;
}
