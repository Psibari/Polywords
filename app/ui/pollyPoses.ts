import { ImageSourcePropType } from 'react-native';

// Shared Polly pose art (clean transparent full-pose drawings).
// Both Daily and Hunt render these; expression lives in the art,
// life comes from whole-image motion.
export const POLLY_POSES = {
  idle: require('../../assets/images/polly/poses/sprite4.png'),     // smug perched, watchful
  smug: require('../../assets/images/polly/poses/sprite4.png'),     // right-facing smug perch
  laugh: require('../../assets/images/polly/poses/sprite5.png'),    // laughing wide
  point: require('../../assets/images/polly/poses/sprite7.png'),    // pointing taunt
  shocked: require('../../assets/images/polly/poses/sprite8.png'),  // shocked recoil
  sulk: require('../../assets/images/polly/poses/sprite9.png'),     // hunched angry glare
  rattled: require('../../assets/images/polly/poses/rattled.png'), // perched, sweating, forced grin — losing and covering
  asleep: require('../../assets/images/polly/poses/zzz.png'),      // perched, eyes closed, "Zzz" marks — dozing
  fly: require('../../assets/images/polly/poses/sprite2.png'),      // neutral fly
  flyAngry: require('../../assets/images/polly/poses/sprite10.png'),// angry open-beak fly
  flyGrin: require('../../assets/images/polly/poses/sprite1.png'),  // confident grinning fly (reserve)
  masterShock: require('../../assets/images/polly/polly_shocked.png'),  // flying, wide-eyed shock
  masterAngry: require('../../assets/images/polly/polly_angry.png'),    // perched, angry glare
  hauntTaunt: require('../../assets/images/polly/polly_pointing.png'),  // flying, pointing/laughing
} as const;

export type PollyPoseName = keyof typeof POLLY_POSES;

// Type-check the values without widening the const map.
const _check: Record<PollyPoseName, ImageSourcePropType> = POLLY_POSES;
void _check;

// Each drawing has a different canvas aspect ratio, so contain-fitting
// them into one square box renders her at wildly different sizes.
// These multipliers normalize her apparent size, anchored on sprite4
// (idle/smug) because it is the most-seen pose and the drawing the
// perch rig is cut from. Derived from crown width, which is close to
// constant across poses; tune on device, this is one table.
export const POLLY_POSE_SCALE: Record<PollyPoseName, number> = {
  idle: 1,
  smug: 1,
  laugh: 0.82,
  point: 0.91,
  shocked: 0.84,
  sulk: 0.69,
  rattled: 1,
  asleep: 1.3,
  fly: 0.8,
  flyAngry: 0.78,
  flyGrin: 0.81,
  masterShock: 1,
  masterAngry: 0.91,
  hauntTaunt: 0.75,
};

// The perch components hold an image source in state rather than a pose
// name, so they look the scale up by source. idle and smug are the same
// require() and therefore the same key — harmless, both are 1.
const SCALE_BY_SOURCE = new Map<ImageSourcePropType, number>(
  (Object.keys(POLLY_POSES) as PollyPoseName[])
    .map(name => [POLLY_POSES[name], POLLY_POSE_SCALE[name]] as const)
);

export function pollyPoseScale(source: ImageSourcePropType): number {
  return SCALE_BY_SOURCE.get(source) ?? 1;
}
