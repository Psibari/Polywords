export type PollyFlightLandingPhase =
  | 'approach'
  | 'brake'
  | 'touchdown'
  | 'settle'
  | 'laugh'
  | 'rest';

export type PollyFlightWingFrame = 'up' | 'middle' | 'down';
export type PollyFlightLandingVisiblePose = 'flight' | 'landed' | 'laugh';

export const POLLY_FLIGHT_LANDING_TIMING = {
  approachMs: 1_300,
  brakeMs: 300,
  touchdownMs: 220,
  settleMs: 420,
  settledHoldMs: 320,
  laughMs: 900,
  flapCycleMs: 360,
} as const;

const BRAKE_AT_MS = POLLY_FLIGHT_LANDING_TIMING.approachMs;
const TOUCHDOWN_AT_MS = BRAKE_AT_MS + POLLY_FLIGHT_LANDING_TIMING.brakeMs;
const SETTLE_AT_MS = TOUCHDOWN_AT_MS + POLLY_FLIGHT_LANDING_TIMING.touchdownMs;
const LAUGH_AT_MS =
  SETTLE_AT_MS +
  POLLY_FLIGHT_LANDING_TIMING.settleMs +
  POLLY_FLIGHT_LANDING_TIMING.settledHoldMs;

export const FLIGHT_LANDING_TOTAL_MS =
  LAUGH_AT_MS + POLLY_FLIGHT_LANDING_TIMING.laughMs;

export const POLLY_FLIGHT_LANDING_CUES = {
  brakeAtMs: BRAKE_AT_MS,
  touchdownAtMs: TOUCHDOWN_AT_MS,
  settleAtMs: SETTLE_AT_MS,
  laughAtMs: LAUGH_AT_MS,
  restAtMs: FLIGHT_LANDING_TOTAL_MS,
} as const;

export type PollyFlightLandingFrame = {
  phase: PollyFlightLandingPhase;
  visiblePose: PollyFlightLandingVisiblePose;
  wingFrame: PollyFlightWingFrame;
};

function resolveWingFrame(elapsedMs: number): PollyFlightWingFrame {
  if (elapsedMs >= BRAKE_AT_MS) return 'up';

  const elapsedInCycle = elapsedMs % POLLY_FLIGHT_LANDING_TIMING.flapCycleMs;
  const quarter = Math.floor(
    elapsedInCycle / (POLLY_FLIGHT_LANDING_TIMING.flapCycleMs / 4),
  );
  return (['up', 'middle', 'down', 'middle'] as const)[quarter];
}

export function flightLandingFrameAt(elapsedMs: number): PollyFlightLandingFrame {
  const clampedElapsedMs = Math.max(0, elapsedMs);

  if (clampedElapsedMs < BRAKE_AT_MS) {
    return {
      phase: 'approach',
      visiblePose: 'flight',
      wingFrame: resolveWingFrame(clampedElapsedMs),
    };
  }
  if (clampedElapsedMs < TOUCHDOWN_AT_MS) {
    return { phase: 'brake', visiblePose: 'flight', wingFrame: 'up' };
  }
  if (clampedElapsedMs < SETTLE_AT_MS) {
    return { phase: 'touchdown', visiblePose: 'landed', wingFrame: 'up' };
  }
  if (clampedElapsedMs < LAUGH_AT_MS) {
    return { phase: 'settle', visiblePose: 'landed', wingFrame: 'up' };
  }
  if (clampedElapsedMs < FLIGHT_LANDING_TOTAL_MS) {
    return { phase: 'laugh', visiblePose: 'laugh', wingFrame: 'up' };
  }
  return { phase: 'rest', visiblePose: 'landed', wingFrame: 'up' };
}
