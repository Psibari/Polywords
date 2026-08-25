import {
  upsertGhostRecord,
  upsertMasteredRecord,
  addHiddenPairIdFound,
  addRealMaskIdFound,
  backfillHiddenPairIdsFound,
} from './hiddenProgressPersistence';
import { createGame, beginMysteryGauntlet, resolveMysteryTile, mysteryMasteryPoints } from './polyRunEngine';
import type { GhostMeaning, HiddenPair, MasteredWordRecord, PlayerProgress, WordStep } from './types';

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

// ── Per-pair progress: a hidden meaning is remembered the instant it's ──
// ── answered correctly, independent of whether the gauntlet is won ──────

const bossPairs: HiddenPair[] = [
  { id: 'kernel_h00', real: 'REAL ZERO', trap: 'TRAP ZERO' },
  { id: 'kernel_h01', real: 'REAL ONE', trap: 'TRAP ONE' },
  { id: 'kernel_h02', real: 'REAL TWO', trap: 'TRAP TWO' },
];

const bossStep: WordStep = {
  kind: 'word',
  word: 'KERNEL',
  emotionalRole: 'finalBoss',
  eventType: 'bossWord',
  meanings: [],
  masks: [],
  hiddenPairs: bossPairs,
};

function emptyProgress(): PlayerProgress {
  return {
    masteredWords: [], personalBest: 0, runsCompleted: 0, currentStreak: 0, longestStreak: 0, lastStreakDate: null,
  };
}

// Mirrors what useGameStore's resolveMystery action does around each
// resolveMysteryTile call: record the pair id on correct, then run the
// same terminal-branch mastery/ghost bookkeeping the store already does.
function resolveTile(
  game: ReturnType<typeof createGame>,
  progress: PlayerProgress,
  ghosts: GhostMeaning[],
  pairIndex: number,
  correct: boolean,
) {
  const next = resolveMysteryTile(game, { correct, visiblePerfect: correct, pairIndex });
  let nextProgress = progress;
  if (correct) {
    const pairId = bossPairs[pairIndex]?.id;
    if (pairId) nextProgress = addHiddenPairIdFound(nextProgress, pairId);
  }
  let nextGhosts = ghosts;
  if (next.bossOutcome === 'haunted' && game.bossOutcome !== 'haunted') {
    nextGhosts = upsertGhostRecord(ghosts, bossStep, bossPairs[pairIndex]);
  }
  if (next.bossOutcome === 'mastered' && game.bossOutcome !== 'mastered') {
    nextProgress = upsertMasteredRecord(nextProgress, bossStep.word, true, bossPairs, correct, 0);
  }
  return { game: next, progress: nextProgress, ghosts: nextGhosts };
}

{
  // Two correct tiles then a wrong third: both correct ids survive the loss.
  let game = beginMysteryGauntlet(createGame([bossStep], 0), 3);
  let progress = emptyProgress();
  let ghosts: GhostMeaning[] = [];

  ({ game, progress, ghosts } = resolveTile(game, progress, ghosts, 0, true));
  ({ game, progress, ghosts } = resolveTile(game, progress, ghosts, 1, true));
  ({ game, progress, ghosts } = resolveTile(game, progress, ghosts, 2, false));

  equal(progress.hiddenPairIdsFound, ['kernel_h00', 'kernel_h01'], 'two correct tiles persist their ids on a failed gauntlet');
  equal(game.bossOutcome, 'haunted', 'a wrong third tile still haunts the word');
  equal(ghosts.length, 1, 'a failed gauntlet still creates a ghost');
  equal(ghosts[0].wordId, 'KERNEL', 'the ghost is for the failed word');
}

{
  // All three correct: every id persists AND the word masters.
  let game = beginMysteryGauntlet(createGame([bossStep], 0), 3);
  let progress = emptyProgress();
  let ghosts: GhostMeaning[] = [];

  [0, 1, 2].forEach((pairIndex) => {
    ({ game, progress, ghosts } = resolveTile(game, progress, ghosts, pairIndex, true));
  });

  equal(progress.hiddenPairIdsFound, ['kernel_h00', 'kernel_h01', 'kernel_h02'], 'mastering all three tiles persists all three ids');
  equal(game.bossOutcome, 'mastered', 'clearing the gauntlet masters the word');
  equal(progress.masteredWords.map(m => m.word), ['KERNEL'], 'the word graduates into masteredWords');
}

{
  // Recording the same id twice never duplicates it.
  let progress = emptyProgress();
  progress = addHiddenPairIdFound(progress, 'kernel_h00');
  progress = addHiddenPairIdFound(progress, 'kernel_h00');
  equal(progress.hiddenPairIdsFound, ['kernel_h00'], 'recording the same id twice leaves the array unchanged');
}

{
  // Backfill recovers ids from mastered-word records saved before this
  // field existed, and doing it again on a later load changes nothing.
  const legacyMastered: MasteredWordRecord = {
    word: 'HORN', isBoss: true, hiddenPairIds: ['horn_h01', 'horn_h02'],
    hiddenMeaningFound: 'OLD REAL', dateMastered: '2026-08-01',
  };
  const legacyProgress: PlayerProgress = { ...emptyProgress(), masteredWords: [legacyMastered] };

  const backfilled = backfillHiddenPairIdsFound(legacyProgress);
  equal(backfilled.hiddenPairIdsFound, ['horn_h01', 'horn_h02'], 'backfill recovers ids from a legacy mastered word');

  const backfilledAgain = backfillHiddenPairIdsFound(backfilled);
  equal(backfilledAgain.hiddenPairIdsFound, ['horn_h01', 'horn_h02'], 'backfill is idempotent on repeat load');
}

{
  // A found pair awards zero score — recording ids never changes the run score.
  let withRecording = beginMysteryGauntlet(createGame([bossStep], 0), 3);
  let progress = emptyProgress();
  [0, 1, 2].forEach((pairIndex) => {
    ({ game: withRecording, progress } = resolveTile(withRecording, progress, [], pairIndex, true));
  });

  let withoutRecording = beginMysteryGauntlet(createGame([bossStep], 0), 3);
  [0, 1, 2].forEach((pairIndex) => {
    withoutRecording = resolveMysteryTile(withoutRecording, { correct: true, visiblePerfect: true, pairIndex });
  });

  equal(withRecording.score, withoutRecording.score, 'recording hidden-pair ids never changes run score');
  eqNum(withRecording.score, mysteryMasteryPoints(1), 'sanity: mastery score landed as expected');
}

function eqNum(actual: number, expected: number, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

// ── addRealMaskIdFound ───────────────────────────────────────────────────

{
  // Adds a new id to an absent field.
  const progress = emptyProgress();
  const next = addRealMaskIdFound(progress, 'abstract_r0');
  equal(next.realMaskIdsFound, ['abstract_r0'], 'adds a new id to an absent field');
}

{
  // Appends a second id and keeps the array sorted.
  let progress = emptyProgress();
  progress = addRealMaskIdFound(progress, 'zebra_r0');
  progress = addRealMaskIdFound(progress, 'abstract_r0');
  equal(progress.realMaskIdsFound, ['abstract_r0', 'zebra_r0'], 'appends a second id and keeps the array sorted');
}

{
  // Recording the same id twice returns the same object, not a new one.
  let progress = emptyProgress();
  progress = addRealMaskIdFound(progress, 'abstract_r0');
  const again = addRealMaskIdFound(progress, 'abstract_r0');
  if (again !== progress) throw new Error('recording the same id twice must return the same object');
}

{
  // Leaves masteredWords, hiddenPairIdsFound, and every other progress field untouched.
  const progress: PlayerProgress = {
    ...emptyProgress(),
    masteredWords: [{
      word: 'HORN', isBoss: true, hiddenPairIds: ['horn_h00'], hiddenMeaningFound: 'REAL', dateMastered: '2026-08-01',
    }],
    hiddenPairIdsFound: ['horn_h00'],
    personalBest: 42,
    runsCompleted: 3,
  };
  const next = addRealMaskIdFound(progress, 'abstract_r0');
  equal(next.masteredWords, progress.masteredWords, 'leaves masteredWords untouched');
  equal(next.hiddenPairIdsFound, progress.hiddenPairIdsFound, 'leaves hiddenPairIdsFound untouched');
  eqNum(next.personalBest, progress.personalBest, 'leaves personalBest untouched');
  eqNum(next.runsCompleted, progress.runsCompleted, 'leaves runsCompleted untouched');
  equal(next.realMaskIdsFound, ['abstract_r0'], 'sets realMaskIdsFound to the new id');
}

console.log('hiddenProgressPersistence tests passed');
