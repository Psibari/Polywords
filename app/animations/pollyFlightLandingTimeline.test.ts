import {
  FLIGHT_LANDING_TOTAL_MS,
  flightLandingFrameAt,
} from './pollyFlightLandingTimeline';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const phaseCases = [
  { elapsedMs: 0, phase: 'approach', visible: 'flight' },
  { elapsedMs: 1_300, phase: 'brake', visible: 'flight' },
  { elapsedMs: 1_600, phase: 'touchdown', visible: 'landed' },
  { elapsedMs: 1_820, phase: 'settle', visible: 'landed' },
  { elapsedMs: 2_560, phase: 'laugh', visible: 'laugh' },
  { elapsedMs: FLIGHT_LANDING_TOTAL_MS, phase: 'rest', visible: 'landed' },
] as const;

for (const testCase of phaseCases) {
  const frame = flightLandingFrameAt(testCase.elapsedMs);
  eq(frame.phase, testCase.phase, `${testCase.elapsedMs}ms resolves the intended phase`);
  eq(frame.visiblePose, testCase.visible, `${testCase.elapsedMs}ms renders the intended artwork`);
}

eq(flightLandingFrameAt(0).wingFrame, 'up', 'flight starts on an upstroke');
eq(flightLandingFrameAt(90).wingFrame, 'middle', 'first quarter-cycle crosses the middle');
eq(flightLandingFrameAt(180).wingFrame, 'down', 'half-cycle reaches the downstroke');
eq(flightLandingFrameAt(270).wingFrame, 'middle', 'third quarter-cycle crosses the middle');
eq(flightLandingFrameAt(360).wingFrame, 'up', 'full flap cycle returns to upstroke');
eq(flightLandingFrameAt(1_300).wingFrame, 'up', 'braking holds both wings raised');
eq(flightLandingFrameAt(-200).phase, 'approach', 'negative elapsed time clamps to the opening');
eq(
  flightLandingFrameAt(FLIGHT_LANDING_TOTAL_MS + 5_000).phase,
  'rest',
  'elapsed time after completion remains on the perch',
);

console.log('pollyFlightLandingTimeline tests passed');
