import { canOpenDailyPause } from './dailyPause';
import {
  DailyClaimPresentationPhase,
  resolveDailyActiveElapsedMs,
} from './dailyClaimPresentation';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

// Nothing in flight: the card may open.
const settled = {
  sessionActive: true,
  inputLocked: false,
  claimPhase: 'idle' as DailyClaimPresentationPhase,
  presentationActive: false,
  pollyReacting: false,
  pollyExitPending: false,
  paused: false,
};

// ── canOpenDailyPause: every gate on its own ──────────────────────
{
  eq(canOpenDailyPause(settled), true, 'a settled active Daily can pause');
  eq(canOpenDailyPause({ ...settled, sessionActive: false }), false, 'no session in play: no pause');
  eq(canOpenDailyPause({ ...settled, inputLocked: true }), false, 'locked input (claim start, blocks punching out): no pause');
  eq(canOpenDailyPause({ ...settled, presentationActive: true }), false, 'a claim presentation running: no pause');
  eq(canOpenDailyPause({ ...settled, pollyReacting: true }), false, "Polly's reaction in flight: no pause");
  eq(canOpenDailyPause({ ...settled, pollyExitPending: true }), false, 'Polly flying out before Results: no pause');
  eq(canOpenDailyPause({ ...settled, paused: true }), false, 'already paused: a second open is ignored');

  const phases: DailyClaimPresentationPhase[] = [
    'settling',
    'landed',
    'inking',
    'covering',
    'reward',
    'revealing',
  ];
  for (const claimPhase of phases) {
    eq(canOpenDailyPause({ ...settled, claimPhase }), false, `claim phase ${claimPhase}: no pause`);
  }
}

// ── The clock is frozen while paused ──────────────────────────────
// Opened at 3.2 s into the round: the saved value is 3200. Time passing with
// the card open (leaving, backgrounding) must not add to it.
{
  const roundStartedAtMs = 10_000;
  const openedAtMs = 13_200;
  const frozen = {
    presentationActive: false,
    paused: true,
    committedRoundElapsedMs: 3_200,
    presentationRoundElapsedMs: 3_200,
    roundStartedAtMs,
  };
  eq(resolveDailyActiveElapsedMs({ ...frozen, nowMs: openedAtMs }), 3_200, 'paused: the saved value');
  eq(resolveDailyActiveElapsedMs({ ...frozen, nowMs: openedAtMs + 60_000 }), 3_200, 'paused a minute: still the saved value');
  // Even a stale anchor (re-set by a focus or AppState return) does not move it.
  eq(
    resolveDailyActiveElapsedMs({ ...frozen, roundStartedAtMs: 0, nowMs: openedAtMs + 60_000 }),
    3_200,
    'paused with a re-anchored clock: still the saved value',
  );
  // Running again: the clock counts from the anchor CONTINUE sets.
  const resumedAtMs = openedAtMs + 60_000;
  eq(
    resolveDailyActiveElapsedMs({
      ...frozen,
      paused: false,
      roundStartedAtMs: resumedAtMs - 3_200,
      nowMs: resumedAtMs + 500,
    }),
    3_700,
    'after CONTINUE the round resumes from the saved value, no time lost or gained',
  );
  // Without the flag the open time would have counted.
  eq(
    resolveDailyActiveElapsedMs({ ...frozen, paused: false, nowMs: openedAtMs + 60_000 }),
    63_200,
    'unpaused, the stale anchor would count the open time',
  );
}

console.log('dailyPause tests passed');
