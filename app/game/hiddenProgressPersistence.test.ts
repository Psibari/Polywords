import { upsertGhostRecord, upsertMasteredRecord } from './hiddenProgressPersistence';
import type { GhostMeaning, HiddenPair, PlayerProgress, WordStep } from './types';

function equal<T>(actual: T, expected: T, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const pair: HiddenPair = { id: 'horn_h02', real: 'CURRENT REAL', trap: 'CURRENT TRAP' };
const step = { word: 'HORN', eventType: 'bossWord' } as WordStep;

{
  const ghosts = upsertGhostRecord([], step, pair);
  equal(ghosts[0].hiddenPairId, 'horn_h02', 'failed boss stores pair ID');
  equal(ghosts[0].hiddenMeaningReal, 'CURRENT REAL', 'failed boss keeps REAL fallback');
  equal(ghosts[0].hiddenMeaningTrap, 'CURRENT TRAP', 'failed boss keeps trap fallback');
}

{
  const legacy: GhostMeaning = {
    wordId: 'HORN', word: 'HORN', hiddenMeaningReal: 'OLD REAL', hiddenMeaningTrap: 'OLD TRAP', runsMissed: 1,
  };
  const ghosts = upsertGhostRecord([legacy], step, pair);
  equal(ghosts[0].hiddenPairId, 'horn_h02', 'explicit pair upgrades an ID-less ghost');
  equal(ghosts[0].runsMissed, 2, 'existing miss count behavior remains');
}

{
  const progress: PlayerProgress = {
    masteredWords: [], personalBest: 0, runsCompleted: 0, currentStreak: 0, longestStreak: 0, lastStreakDate: null,
  };
  const next = upsertMasteredRecord(progress, 'HORN', true, [pair], true, 2, '2026-08-13T00:00:00.000Z');
  equal(next.masteredWords[0].hiddenPairIds, ['horn_h02'], 'mastery stores pair IDs');
  equal(next.masteredWords[0].hiddenMeaningsFound, ['CURRENT REAL'], 'mastery keeps REAL fallbacks');
}

console.log('hiddenProgressPersistence tests passed');
