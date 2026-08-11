import {
  beginDailyCommittedPresentation,
  createDailyClaimPresentation,
  resolveDailyActiveElapsedMs,
  selectDailyDisplaySession,
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
    selectDailyDisplaySession(nextRound, presentation),
    outgoing,
    'claim keeps outgoing round visible after committed state advances',
  );
  eq(
    shouldShowDailyResult(true, presentation),
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
    selectDailyDisplaySession(nextRound, null),
    nextRound,
    'next round appears after presentation releases',
  );
  eq(
    shouldShowDailyResult(true, null),
    true,
    'final result appears after presentation releases',
  );
  eq(
    selectDailyDisplaySession(completed, null),
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

console.log('dailyClaimPresentation tests passed');
