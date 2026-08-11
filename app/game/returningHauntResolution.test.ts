import { applyReturningHauntResolution } from './returningHauntResolution';
import { GhostMeaning } from './types';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const ghost: GhostMeaning = {
  wordId: 'BANK',
  word: 'BANK',
  hiddenMeaningReal: 'THE SIDE OF A RIVER',
  hiddenMeaningTrap: 'A STACK OF CASH',
  runsMissed: 2,
  isGhostedMaster: true,
};

{
  const first = applyReturningHauntResolution([ghost], 'BANK', 'haunted', 'run-1');
  eq(first.changed, true, 'hauntFailure.firstApplicationChangesQueue');
  eq(first.ghosts[0].runsMissed, 3, 'hauntFailure.firstApplicationIncrements');

  const replay = applyReturningHauntResolution(first.ghosts, 'BANK', 'haunted', 'run-1');
  eq(replay.changed, false, 'hauntFailure.sameRunIsIdempotent');
  eq(replay.ghosts[0].runsMissed, 3, 'hauntFailure.sameRunDoesNotDoubleCount');

  const laterRun = applyReturningHauntResolution(replay.ghosts, 'BANK', 'haunted', 'run-2');
  eq(laterRun.changed, true, 'hauntFailure.laterRunCanIncrement');
  eq(laterRun.ghosts[0].runsMissed, 4, 'hauntFailure.laterRunCountsOnce');
}

{
  const first = applyReturningHauntResolution([ghost], 'BANK', 'banished', 'run-1');
  eq(first.changed, true, 'banishment.removesGhost');
  eq(first.ghosts.length, 0, 'banishment.queueEmpty');

  const replay = applyReturningHauntResolution(first.ghosts, 'BANK', 'banished', 'run-1');
  eq(replay.changed, false, 'banishment.replayIsIdempotent');
  eq(replay.ghosts.length, 0, 'banishment.replayKeepsQueueEmpty');
}

{
  const other = { ...ghost, wordId: 'MATCH', word: 'MATCH' };
  const queue = [other];
  const missing = applyReturningHauntResolution(queue, 'BANK', 'haunted', 'run-1');
  eq(missing.changed, false, 'hauntFailure.missingGhostDoesNotCreateOne');
  eq(missing.ghosts, queue, 'hauntFailure.missingGhostKeepsQueueIdentity');
  eq(missing.ghosts[0].wordId, 'MATCH', 'hauntFailure.otherGhostUntouched');
}

console.log('returningHauntResolution tests passed');
