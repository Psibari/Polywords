import {
  FLIGHT_LANDING_TOTAL_MS,
  POLLY_FLIGHT_LANDING_CUES,
  POLLY_FLIGHT_LANDING_TIMING,
} from './pollyFlightLandingTimeline';
import { POLLY_FLIGHT_LANDING_MOTION } from './pollyFlightLandingMotion';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const motion = POLLY_FLIGHT_LANDING_MOTION;
const last = motion.inputRange.length - 1;

eq(motion.inputRange[0], 0, 'motion begins at animation progress zero');
eq(motion.inputRange[last], 1, 'motion ends at animation progress one');
eq(motion.translateX[0], 150, 'Polly starts off to the right of the landing point');
eq(motion.translateY[0], -54, 'Polly starts above the landing point');
eq(motion.scale[0], 0.84, 'Polly starts slightly smaller for depth');
eq(motion.rotateDeg[0], -7, 'Polly starts banked into the approach');

eq(
  motion.keyframeMs[1],
  POLLY_FLIGHT_LANDING_CUES.brakeAtMs,
  'second keyframe is the braking cue',
);
eq(
  motion.keyframeMs[2],
  POLLY_FLIGHT_LANDING_CUES.touchdownAtMs,
  'third keyframe is touchdown',
);
eq(
  motion.keyframeMs[3],
  POLLY_FLIGHT_LANDING_CUES.settleAtMs + POLLY_FLIGHT_LANDING_TIMING.settleMs,
  'fourth keyframe is the end of the settle bounce',
);
eq(
  motion.keyframeMs[last],
  FLIGHT_LANDING_TOTAL_MS,
  'final keyframe matches the complete landing timeline',
);

eq(motion.translateX[last], 0, 'rest ends on the landing point horizontally');
eq(motion.translateY[last], 0, 'rest ends on the landing point vertically');
eq(motion.scale[last], 1, 'rest returns to natural scale');
eq(motion.rotateDeg[last], 0, 'rest returns to neutral rotation');

for (let index = 1; index < motion.inputRange.length; index += 1) {
  if (motion.inputRange[index] <= motion.inputRange[index - 1]) {
    throw new Error('motion progress keyframes must be strictly increasing');
  }
}

console.log('pollyFlightLandingMotion tests passed');
