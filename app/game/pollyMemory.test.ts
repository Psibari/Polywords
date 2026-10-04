import {
  DEFAULT_POLLY_MEMORY,
  hydratePollyMemory,
  rememberDaily,
  rememberHunt,
  rememberHauntCreated,
  rememberHauntResolution,
  rememberPollyLine,
  rememberVisit,
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


// V1 migration keeps only historical peaks it can prove: the current streak.
{
  const migrated = hydratePollyMemory({
    version: 1,
    playerWinStreak: 3,
    pollyWinStreak: 0,
    huntsRemembered: 9,
  });
  eq(migrated.version, 2, 'v2.version');
  eq(migrated.longestPlayerWinStreak, 3, 'v2.migrateKnownPlayerPeak');
  eq(migrated.longestPollyWinStreak, 0, 'v2.noInventedPollyPeak');
  eq(Object.keys(migrated.wordRivalries).length, 0, 'v2.noInventedWordHistory');
}

// Hunt streak peaks survive later losses.
{
  let memory = rememberHunt(DEFAULT_POLLY_MEMORY, { outcome: 'playerBeatPolly', score: 1 });
  memory = rememberHunt(memory, { outcome: 'playerBeatPolly', score: 1 });
  memory = rememberHunt(memory, { outcome: 'pollyWon', score: 1 });
  eq(memory.playerWinStreak, 0, 'v2.currentPlayerStreakResets');
  eq(memory.longestPlayerWinStreak, 2, 'v2.playerPeakPersists');
  eq(memory.longestPollyWinStreak, 1, 'v2.pollyPeakRecorded');
}

// Word rivalry persists after a Haunt is banished and cannot be resurrected.
{
  let memory = rememberHauntCreated(DEFAULT_POLLY_MEMORY, ' bank ', '2026-10-04');
  memory = rememberHauntResolution(memory, 'BANK', 'haunted', '2026-10-05');
  memory = rememberHauntResolution(memory, 'BANK', 'banished', '2026-10-06');
  const afterStaleFailure = rememberHauntResolution(memory, 'BANK', 'haunted', '2026-10-07');
  eq(afterStaleFailure.wordRivalries.BANK.hauntHolds, 1, 'v2.hauntHoldCount');
  eq(afterStaleFailure.wordRivalries.BANK.banished, true, 'v2.banishPermanent');
  eq(afterStaleFailure.wordRivalries.BANK.banishedAt, '2026-10-06', 'v2.banishDate');
}

// Visit memory rejects invalid timestamps and keeps a real one.
{
  const invalid = rememberVisit(DEFAULT_POLLY_MEMORY, Number.NaN);
  eq(invalid.lastVisitAt, null, 'v2.invalidVisitIgnored');
  const visited = rememberVisit(invalid, 1_800_000_000_000);
  eq(visited.lastVisitAt, 1_800_000_000_000, 'v2.visitRecorded');
}
