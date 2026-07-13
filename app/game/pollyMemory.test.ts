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
      isComplete: false, allPerfect: false, bossCleared: false, hasMissed: true,
    })?.lineId,
    'resultsTrapsRemember',
    'results.repeatLoss',
  );
}

console.log('OK — pollyMemory: all assertions passed');
