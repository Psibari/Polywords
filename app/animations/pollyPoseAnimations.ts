import type { PollyPoseName } from '../ui/pollyPoses';

export type PollyPoseAnimationName =
  | 'idle'
  | 'angry'
  | 'point'
  | 'surprised'
  | 'flying';

type PollyPoseAnimationPreset = {
  pose: PollyPoseName;
  durationMs: number;
  inputRange: number[];
  translateX: number[];
  translateY: number[];
  scale: number[];
  rotateDeg: number[];
};

// Whole-image motion only. The approved transparent pose art stays untouched;
// these keyframes supply reusable character motion without reviving the rig.
export const POLLY_POSE_ANIMATIONS: Record<
  PollyPoseAnimationName,
  PollyPoseAnimationPreset
> = {
  idle: {
    pose: 'idle',
    durationMs: 1800,
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    translateX: [0, 0.5, 1, 0.5, 0],
    translateY: [0, -2, -4, -2, 0],
    scale: [1, 1.01, 1.018, 1.01, 1],
    rotateDeg: [0, -0.35, 0, 0.3, 0],
  },
  angry: {
    pose: 'sulk',
    durationMs: 1100,
    inputRange: [0, 0.18, 0.32, 0.48, 0.68, 1],
    translateX: [0, -5, 7, -6, 4, 0],
    translateY: [0, -3, 1, -2, 0, 0],
    scale: [1, 1.04, 1.03, 1.02, 1, 1],
    rotateDeg: [0, -4, 4, -3, 2, 0],
  },
  point: {
    pose: 'point',
    durationMs: 1600,
    inputRange: [0, 0.12, 0.25, 0.42, 0.76, 1],
    translateX: [0, -5, 14, 10, 10, 0],
    translateY: [0, -2, -1, 0, 0, 0],
    scale: [1, 0.98, 1.05, 1.02, 1.02, 1],
    rotateDeg: [0, -2, 1, 0, 0, 0],
  },
  surprised: {
    pose: 'shocked',
    durationMs: 1350,
    inputRange: [0, 0.14, 0.28, 0.46, 0.72, 1],
    translateX: [0, 0, -3, 2, 0, 0],
    translateY: [0, 2, -14, -8, 0, 0],
    scale: [1, 0.95, 1.12, 1.06, 1, 1],
    rotateDeg: [0, 0, -6, 4, 0, 0],
  },
  flying: {
    pose: 'fly',
    durationMs: 1200,
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    translateX: [-4, 0, 4, 0, -4],
    translateY: [1, -4, 0, 4, 1],
    scale: [1, 0.98, 1.02, 1.01, 1],
    rotateDeg: [-3, 2, 0, -2, -3],
  },
};
