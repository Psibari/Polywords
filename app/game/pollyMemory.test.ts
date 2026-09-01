import {
  DEFAULT_POLLY_MEMORY,
  hydratePollyMemory,
  rememberDaily,
  rememberHunt,
  rememberPollyLine,
  resolveHomePollyMoment,
  resolveResultsPollyMoment,
} from './pollyMemory';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

{
  const restored = hydratePollyMemory({ huntsRemembered: -4, lastBossWord: ' bank ' });
  eq(restored.huntsRemembered, 0, 'hydrate.count');
  eq(restored.lastBossWord, 'BANK', 'hydrate.word');
}

{
  const afterLoss = rememberHunt(DEFAULT_POLLY_MEMORY, {
    outcome: 'pollyWon', score: 4200, bossWord: 'light', hauntWord: 'bank',
  });
  eq(afterLoss.pollyWinStreak, 1, 'hunt.pollyStreak');
  eq(afterLoss.lastBossWord, 'LIGHT', 'hunt.boss');
  eq(afterLoss.lastHauntWord, 'BANK', 'hunt.haunt');
  const afterWin = rememberHunt(afterLoss, { outcome: 'playerBeatPolly', score: 18000 });
  eq(afterWin.pollyWinStreak, 0, 'hunt.resetPollyStreak');
  eq(afterWin.playerWinStreak, 1, 'hunt.playerStreak');
}

{
  const once = rememberDaily(DEFAULT_POLLY_MEMORY, 'won', '2026-07-13');
  const twice = rememberDaily(once, 'won', '2026-07-13');
  eq(twice.dailyChallengesRemembered, 1, 'daily.idempotent');
}

{
  const remembered = rememberPollyLine(DEFAULT_POLLY_MEMORY, 'homeBackAgain', 'home');
  eq(remembered.homeGreetingCursor, 1, 'line.homeCursor');
  if (resolveHomePollyMoment(remembered).lineId === 'homeBackAgain') {
    throw new Error('home.repetition: recent greeting repeated');
  }
}

{
  const repeatLoss = { ...DEFAULT_POLLY_MEMORY, pollyWinStreak: 1 };
  eq(
    resolveResultsPollyMoment(repeatLoss, {
      isComplete: false, allPerfect: false, bossMastered: false, hasMissed: true,
    }, 0)?.lineId,
    'resultsTrapsRemember',
    'results.repeatLoss',
  );
}

// allPerfect/playerWinStreak/bossMastered now draw from pools (pickFreshLine)
// instead of one fixed line each — roll 0 with no recent history picks each
// pool's first entry; a recent id pushes the pick to the next one.
{
  const complete = { isComplete: true, allPerfect: true, bossMastered: false, hasMissed: false };
  eq(
    resolveResultsPollyMoment(DEFAULT_POLLY_MEMORY, complete, 0)?.lineId,
    'resultsNobodySaw',
    'results.flawless.first',
  );
  eq(
    resolveResultsPollyMoment(
      { ...DEFAULT_POLLY_MEMORY, recentLineIds: ['resultsNobodySaw'] },
      complete,
      0,
    )?.lineId,
    'resultsNeverHappened',
    'results.flawless.avoidsRecent',
  );
}
{
  const complete = { isComplete: true, allPerfect: false, bossMastered: false, hasMissed: false };
  eq(
    resolveResultsPollyMoment({ ...DEFAULT_POLLY_MEMORY, playerWinStreak: 1 }, complete, 0)?.lineId,
    'resultsGettingOld',
    'results.playerStreak.first',
  );
}
{
  const complete = { isComplete: true, allPerfect: false, bossMastered: true, hasMissed: false };
  eq(
    resolveResultsPollyMoment(DEFAULT_POLLY_MEMORY, complete, 0)?.lineId,
    'resultsManyMore',
    'results.mastered.first',
  );
}

// HOME_ROTATION's retired sixth line was replaced by homeYourHighness and
// homeCrown — both now reachable through the rotation cursor (index 5, 6).
{
  eq(
    resolveHomePollyMoment({ ...DEFAULT_POLLY_MEMORY, homeGreetingCursor: 5, huntsRemembered: 1 }).lineId,
    'homeYourHighness',
    'home.rotation.yourHighness',
  );
  eq(
    resolveHomePollyMoment({ ...DEFAULT_POLLY_MEMORY, homeGreetingCursor: 6, huntsRemembered: 1 }).lineId,
    'homeCrown',
    'home.rotation.crown',
  );
}

console.log('OK — pollyMemory: all assertions passed');
