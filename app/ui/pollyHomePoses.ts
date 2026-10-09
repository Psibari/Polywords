import { ImageSourcePropType } from 'react-native';
import { POLLY_POSES, POLLY_POSE_SCALE } from './pollyPoses';

// Pose art for the Home perch. Modeled on pollyScreenPoses.ts (Results and
// Daily). The resting pose is chosen by resolveHomeRestingPose
// (app/game/pollyHomeRestingPose.ts); this file only owns the art.
//
// idle and smug stay on the old sprite4 art at its old scale because Home
// shows the face rig for them (with the life profile's eye, crown tilt, brow
// and mouth), and the rig is cut from sprite4. Both point at the SAME
// POLLY_POSES.idle object: the perch shows the rig when the source ===
// POLLY_POSES.idle, so they must stay that exact reference.
//
// The asleep art has no Z's (the old zzz.png had them drawn in); the perch
// floats the three separate Z images (POLLY_HOME_Z_ART) off her head instead.
const POLLY_HOME_POSES = {
  idle: POLLY_POSES.idle,
  smug: POLLY_POSES.idle,
  fly: require('../../assets/images/polly/master/fly.png'),
  // Post-win resting pose: the closed-beak glare. (The open-beak angryYell is
  // the Hunt's mastery reaction; next to the blinking rig it was jarring.)
  angry: require('../../assets/images/polly/master/angry.png'),
  embarrassed: require('../../assets/images/polly/master/embarrassed.png'),
  asleep: require('../../assets/images/polly/master/asleep.png'),
} as const;

export type PollyHomePoseName = keyof typeof POLLY_HOME_POSES;

// Type-check the values without widening the const map.
const _check: Record<PollyHomePoseName, ImageSourcePropType> = POLLY_HOME_POSES;
void _check;

// The master set shares one canvas and one drawing scale, but it draws her a
// little smaller than the sprite4 rig: master smug (the rig's own pose) is
// 130 x 220 pt in the 246 pt Home box against the rig's 138 x 236. This one
// multiplier brings the resting master poses to the rig's size so she does not
// visibly change size between the rig and them. Tune on the phone.
export const POLLY_HOME_MASTER_SCALE = 1.07;

const POLLY_HOME_POSE_SCALE: Record<PollyHomePoseName, number> = {
  idle: POLLY_POSE_SCALE.idle,
  smug: POLLY_POSE_SCALE.idle,
  fly: 1, // the entrance is a different shape; it keeps its natural size
  angry: POLLY_HOME_MASTER_SCALE,
  embarrassed: POLLY_HOME_MASTER_SCALE,
  asleep: POLLY_HOME_MASTER_SCALE,
};

export function pollyHomePoseArt(pose: PollyHomePoseName): { source: ImageSourcePropType; scale: number } {
  return { source: POLLY_HOME_POSES[pose], scale: POLLY_HOME_POSE_SCALE[pose] };
}

// True for the poses the perch rig replaces (idle and smug, one drawing).
export function pollyHomePoseUsesRig(pose: PollyHomePoseName): boolean {
  return POLLY_HOME_POSES[pose] === POLLY_POSES.idle;
}

// ── Sleeping Z's ────────────────────────────────────────────────────────────
// The three Z images, each at its natural size in master-canvas pixels.
export const POLLY_HOME_Z_ART = [
  { source: require('../../assets/images/polly/master/z_small.png'), width: 65, height: 59 },
  { source: require('../../assets/images/polly/master/z_medium.png'), width: 96, height: 88 },
  { source: require('../../assets/images/polly/master/z_large.png'), width: 140, height: 127 },
] as const;

// Where each Z leaves her head: the bottom-left corner of a Z, in master-canvas
// pixels on asleep.png (792 x 845). Measured from the drawing: the top edge of
// her beak near its tip is at (556, 257) and the tip at (613, 324); the crown
// sits above-left of that. The start is 20 px right of and 10 px above that
// beak edge, so the Z's rise from just above the beak, clear of the crown.
export const POLLY_HOME_Z_START_CANVAS = { x: 576, y: 247 } as const;

const MASTER_CANVAS_W = 792;
const MASTER_CANVAS_H = 845;

/**
 * Converts a master-canvas pixel point to a point in the Home perch box,
 * exactly as the asleep layer draws the canvas: contain-fit into the square
 * box (centred horizontally), then POLLY_HOME_MASTER_SCALE about the box
 * centre. Also returns points-per-canvas-pixel for sizing things on it.
 */
export function homeMasterCanvasToBox(
  x: number,
  y: number,
  boxSize: number,
): { x: number; y: number; ptPerPx: number } {
  const fit = boxSize / MASTER_CANVAS_H;
  const offsetX = (boxSize - MASTER_CANVAS_W * fit) / 2;
  const centre = boxSize / 2;
  const s = POLLY_HOME_MASTER_SCALE;
  return {
    x: centre + (offsetX + x * fit - centre) * s,
    y: centre + (y * fit - centre) * s,
    ptPerPx: fit * s,
  };
}
