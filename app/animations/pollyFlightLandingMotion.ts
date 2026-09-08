import {
  FLIGHT_LANDING_TOTAL_MS,
  POLLY_FLIGHT_LANDING_CUES,
  POLLY_FLIGHT_LANDING_TIMING,
} from './pollyFlightLandingTimeline';

const settledAtMs =
  POLLY_FLIGHT_LANDING_CUES.settleAtMs + POLLY_FLIGHT_LANDING_TIMING.settleMs;

const keyframeMs = [
  0,
  POLLY_FLIGHT_LANDING_CUES.brakeAtMs,
  POLLY_FLIGHT_LANDING_CUES.touchdownAtMs,
  settledAtMs,
  POLLY_FLIGHT_LANDING_CUES.laughAtMs,
  FLIGHT_LANDING_TOTAL_MS,
];

export const POLLY_FLIGHT_LANDING_MOTION = {
  keyframeMs,
  inputRange: keyframeMs.map(ms => ms / FLIGHT_LANDING_TOTAL_MS),
  // Approach from the upper-right, brake just above the perch, then give the
  // touchdown enough overshoot to feel like a bird actually carrying weight.
  translateX: [150, 18, 0, 0, 0, 0],
  translateY: [-54, -18, 4, -3, 0, 0],
  scale: [0.84, 0.98, 1.03, 1.01, 1, 1],
  rotateDeg: [-7, 5, -1.5, 0.8, 0, 0],
};
