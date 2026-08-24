import {
  beginDailyCommittedPresentation,
  canBeginDailyClaim,
  createDailyClaimPresentation,
  DailyClaimPresentationPhase,
  isDailyClaimInputLocked,
  resolveDailyActiveElapsedMs,
  selectDailyDisplaySession,
  shouldHideCompletedDailyClue,
  shouldShowDailyResult,
} from './dailyClaimPresentation';
import { createDailySubmittedAnswerLayout } from '../components/dailySubmittedAnswerLayout';

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
  const layout = createDailySubmittedAnswerLayout(
    { x: 64, y: 540, width: 148, height: 64 },
    { x: 20, y: 160, width: 335, height: 190 },
  );
  eq(layout.startX, 44, 'submitted card preserves its window X at scroll handoff');
  eq(layout.startY, 380, 'submitted card preserves its window Y at scroll handoff');
  eq(layout.width, 148, 'submitted card preserves its rendered width');
  eq(layout.height, 64, 'submitted card preserves its rendered height');
}

{
  const layout = createDailySubmittedAnswerLayout(
    null,
    { x: 20, y: 160, width: 300, height: 190 },
  );
  eq(layout.startX, 79.5, 'accessibility fallback starts centered below the scroll');
  eq(layout.startY, 280, 'accessibility fallback starts below the scroll');
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

console.log('dailyClaimPresentation tests passed');
