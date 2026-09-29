import {
  beginDailyCommittedPresentation,
  canBeginDailyClaim,
  canUnlockDailyRound,
  createDailyClaimPresentation,
  DailyClaimPresentationPhase,
  isDailyClaimInputLocked,
  resolveDailyActiveElapsedMs,
  selectDailyDisplaySession,
  shouldHideCompletedDailyClue,
  shouldShowDailyResult,
} from './dailyClaimPresentation';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

type TestSession = {
  round: number;
  status: 'active' | 'won' | 'lost';
  elapsedMs: number;
};

const outgoing: TestSession = { round: 2, status: 'active', elapsedMs: 4_000 };
const nextRound: TestSession = { round: 3, status: 'active', elapsedMs: 0 };
const completed: TestSession = { round: 4, status: 'won', elapsedMs: 8_000 };

const transitionPhases: DailyClaimPresentationPhase[] = [
  'settling',
  'landed',
  'covering',
  'reward',
  'revealing',
];

{
  eq(canBeginDailyClaim(false, false), true, 'stable idle state accepts one claim');
  eq(canBeginDailyClaim(false, true), false, 'synchronous input lock rejects a second claim');
  eq(canBeginDailyClaim(true, false), false, 'completed round rejects a stale claim');
}

{
  const open = {
    audioReady: true,
    roundActive: true,
    roundCompleted: false,
    plaquesPresenting: false,
  };
  eq(canUnlockDailyRound(open), true, 'settled blocks in an active round take input');
  eq(
    canUnlockDailyRound({ ...open, plaquesPresenting: true }),
    false,
    'blocks still punching out of the wall stay locked',
  );
  eq(canUnlockDailyRound({ ...open, audioReady: false }), false, 'no input before audio is ready');
  eq(canUnlockDailyRound({ ...open, roundActive: false }), false, 'no input once the Daily is over');
  eq(canUnlockDailyRound({ ...open, roundCompleted: true }), false, 'a solved round stays locked');
}

{
  const events: string[] = [];
  beginDailyCommittedPresentation(
    outgoing,
    'BANK',
    'correct',
    4_250,
    () => events.push('presentation'),
    () => events.push('commit'),
  );
  eq(
    events.join(','),
    'presentation,commit',
    'presentation snapshot publishes before immediate state commit',
  );
}

{
  const presentation = createDailyClaimPresentation(
    outgoing,
    'BANK',
    'correct',
    4_250,
  );

  eq(
    selectDailyDisplaySession(nextRound, presentation, 'settling'),
    outgoing,
    'submitted card settles over the outgoing clue',
  );
  eq(
    selectDailyDisplaySession(nextRound, presentation, 'landed'),
    outgoing,
    'landed readability beat keeps the outgoing clue visible',
  );
  eq(
    selectDailyDisplaySession(nextRound, presentation, 'covering'),
    outgoing,
    'cover-down keeps the outgoing clue until it is fully hidden',
  );
  eq(
    selectDailyDisplaySession(nextRound, presentation, 'reward'),
    nextRound,
    'full reward cover puts the committed next clue underneath',
  );
  eq(
    selectDailyDisplaySession(nextRound, presentation, 'revealing'),
    nextRound,
    'roll-up reveals the committed next clue instead of the previous clue',
  );
  eq(
    shouldShowDailyResult(true, presentation, 'covering'),
    false,
    'final result waits for outgoing claim presentation',
  );
  eq(
    resolveDailyActiveElapsedMs({
      presentationActive: true,
      committedRoundElapsedMs: nextRound.elapsedMs,
      presentationRoundElapsedMs: 0,
      roundStartedAtMs: 1_000,
      nowMs: 20_000,
    }),
    0,
    'next round clock does not run behind outgoing presentation',
  );
}

{
  for (const phase of transitionPhases) {
    eq(
      isDailyClaimInputLocked(phase),
      true,
      `${phase} phase keeps answer input locked`,
    );
  }
  eq(isDailyClaimInputLocked('idle'), false, 'idle phase restores answer input');

  eq(
    shouldShowDailyResult(true, null, 'reward'),
    false,
    'final result cannot replace the fully covered reward face',
  );
  eq(
    shouldShowDailyResult(true, null, 'revealing'),
    false,
    'final result cannot interrupt reward roll-up',
  );
  eq(
    shouldHideCompletedDailyClue(true, 'reward'),
    true,
    'final reward cover removes the old clue underneath',
  );
  eq(
    shouldHideCompletedDailyClue(true, 'revealing'),
    true,
    'final roll-up cannot uncover the previous clue',
  );
  eq(
    shouldHideCompletedDailyClue(false, 'revealing'),
    false,
    'non-final roll-up keeps the committed next clue underneath',
  );
  eq(
    shouldShowDailyResult(true, null, 'idle'),
    true,
    'final result appears only after the physical transition is stable',
  );
}

{
  eq(
    resolveDailyActiveElapsedMs({
      presentationActive: true,
      committedRoundElapsedMs: 0,
      presentationRoundElapsedMs: 4_250,
      roundStartedAtMs: 1_000,
      nowMs: 20_000,
    }),
    4_250,
    'wrong-claim presentation preserves elapsed time from the same round',
  );
}

{
  eq(
    selectDailyDisplaySession(nextRound, null, 'idle'),
    nextRound,
    'next round appears after presentation releases',
  );
  eq(
    shouldShowDailyResult(true, null, 'idle'),
    true,
    'final result appears after presentation releases',
  );
  eq(
    selectDailyDisplaySession(completed, null, 'idle'),
    completed,
    'completed session remains authoritative after release',
  );
  eq(
    resolveDailyActiveElapsedMs({
      presentationActive: false,
      committedRoundElapsedMs: nextRound.elapsedMs,
      presentationRoundElapsedMs: 0,
      roundStartedAtMs: 5_000,
      nowMs: 8_250,
    }),
    3_250,
    'visible active round uses wall-clock elapsed time',
  );
}

// ── The inking phase ──────────────────────────────────────────────
// Inking sits between 'landed' and 'covering'. It is part of the OUTGOING
// round: the clue and cards on screen still belong to the round just won,
// so it must use the outgoing snapshot, and input must stay locked.
{
  eq(isDailyClaimInputLocked('inking'), true, 'inking keeps input locked');
  eq(
    selectDailyDisplaySession(nextRound, { session: outgoing, candidate: 'X', outcome: 'correct', roundElapsedMsAtClaim: 0 }, 'inking'),
    outgoing,
    'inking shows the outgoing round',
  );
  eq(
    shouldShowDailyResult(true, { session: completed, candidate: 'X', outcome: 'correct', roundElapsedMsAtClaim: 0 }, 'inking'),
    false,
    'inking never shows Results early',
  );
  eq(
    shouldHideCompletedDailyClue(true, 'inking'),
    true,
    'the final round hides its completed clue through inking',
  );
}

console.log('dailyClaimPresentation tests passed');
