// Run with: npx.cmd -y tsx app/game/polyRunEngine.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import {
  createGame,
  applyGoldFeather,
  consumeMercy,
  completeWord,
  submitBossMastery,
  submitSwipeDown,
  submitSwipeUp,
  submitWrongSwipe,
  beginMysteryGauntlet,
  resolveMysteryTile,
  isMysteryTerminal,
  isGauntletTilePickable,
  isLastRemainingGauntletTile,
  isMaskResolved,
  getUnresolvedMaskIds,
  mysteryMasteryPoints,
  GameState,
} from './polyRunEngine';
import { Mask, SessionStep, WordStep } from './types';
import { generateHunt } from './huntGenerator';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function mkWord(word: string, masks: Mask[], boss = false): WordStep {
  return {
    kind: 'word',
    word,
    emotionalRole: boss ? 'finalBoss' : 'confidence',
    eventType: boss ? 'bossWord' : 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    meanings: [],
    masks,
    ...(boss ? { bossModifier: true as const } : {}),
  };
}

const STANDARD_MASKS: Mask[] = [
  { id: 'r1', phrase: 'REAL ONE', isReal: true },
  { id: 'r2', phrase: 'REAL TWO', isReal: true },
  { id: 'rare1', phrase: 'RARE REAL', isReal: true, isRare: true },
  { id: 't1', phrase: 'TRAP ONE', isReal: false },
  { id: 't2', phrase: 'TRAP TWO', isReal: false },
];

function session(): SessionStep[] {
  return [
    mkWord('ALPHA', STANDARD_MASKS),
    mkWord('OMEGA', STANDARD_MASKS.map(m => ({ ...m })), true),
  ];
}

function fresh(mercyReviveLives = 0): GameState {
  return createGame(session(), mercyReviveLives);
}

// ── Scoring: correct swipes ──────────────────────────────────────

{
  let s = fresh();
  s = submitSwipeUp(s, 'r1');
  eq(s.score, 100, 'up.real.score');
  eq(s.combo, 1, 'up.real.combo');
  eq(s.streak, 1, 'up.real.streak');
  eq(s.lives, 6, 'up.real.livesUntouched');
}

{
  let s = fresh();
  s = submitSwipeUp(s, 'rare1');
  eq(s.score, 300, 'up.rare.score');
}

{
  let s = fresh();
  s = submitSwipeDown(s, 't1');
  eq(s.score, 50, 'down.trap.score');
  eq(s.streak, 1, 'down.trap.streak');
}

// Resolved cards are committed once. This protects scoring, lives, and
// resumed/revived boards even if a presenter submits the same ID again.
{
  let s = fresh();
  s = submitSwipeUp(s, 'r1');
  const afterFirstResolution = s;

  s = submitSwipeUp(s, 'r1');
  eq(s, afterFirstResolution, 'resolved.sameDirection.noop');

  s = submitSwipeDown(s, 'r1');
  eq(s, afterFirstResolution, 'resolved.oppositeDirection.noop');
  eq(s.score, 100, 'resolved.noDuplicateScore');
  eq(s.streak, 1, 'resolved.noDuplicateStreak');
  eq(s.swipedUpIds.length, 1, 'resolved.noDuplicateHistory');
}

{
  let s = fresh();
  s = { ...s, lives: 3 };
  s = submitSwipeUp(s, 't1');
  const afterWrongResolution = s;

  s = submitSwipeUp(s, 't1');
  eq(s, afterWrongResolution, 'resolved.wrongSameDirection.noop');

  s = submitSwipeDown(s, 't1');
  eq(s, afterWrongResolution, 'resolved.wrongOppositeDirection.noop');
  eq(s.lives, 2, 'resolved.noDuplicateLifeLoss');
  eq(s.mistakesOnWord, 1, 'resolved.noDuplicateMistake');
}

{
  let s = fresh();
  s = submitSwipeUp(s, 'r1');
  s = submitSwipeDown(s, 't1');

  const resumed = JSON.parse(JSON.stringify(s)) as GameState;
  const visibleMasks = resumed.shuffledMasks[resumed.stepIndex];
  const remaining = getUnresolvedMaskIds(resumed, visibleMasks);

  eq(isMaskResolved(resumed, 'r1'), true, 'resume.realIsResolved');
  eq(isMaskResolved(resumed, 't1'), true, 'resume.trapIsResolved');
  eq(remaining.includes('r1'), false, 'resume.realRemovedFromDeck');
  eq(remaining.includes('t1'), false, 'resume.trapRemovedFromDeck');
  eq(remaining.length, visibleMasks.length - 2, 'resume.onlyUnresolvedRemain');
}

// ── Chain multiplier: 1.5x at streak 3 ──────────────────────────

{
  let s = fresh();
  s = submitSwipeUp(s, 'r1');
  s = submitSwipeUp(s, 'r2');
  s = submitSwipeDown(s, 't1');
  eq(s.chainMultiplier, 1.5, 'chain.at3');
  eq(s.streakMilestone, 3 as const, 'chain.milestone3');
  // the swipe that reaches streak 3 already scores at 1.5x (50 → 75)
  eq(s.score, 100 + 100 + 75, 'chain.thirdScoresAt1.5x');
  s = submitSwipeDown(s, 't2');
  eq(s.score, 100 + 100 + 75 + 75, 'chain.fourthScoresAt1.5x');
}

// ── Boss word: doubled reals, 100-point trap catches, mastery ───

{
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = submitSwipeUp(s, 'r1');
  eq(s.score, 200, 'boss.realDoubled');
  s = submitSwipeDown(s, 't1');
  eq(s.score, 300, 'boss.trapCatch100');
  const before = s.score;
  s = submitBossMastery(s);
  eq(s.score, before + 600, 'boss.mastery600AtChain1');
  eq(s.pollyTrigger, 'bossMastery', 'boss.masteryTrigger');
}

// ── Wrong swipes: life loss, streak reset ────────────────────────

{
  let s = fresh();
  s = submitSwipeUp(s, 'r1');
  s = submitSwipeUp(s, 't1');
  eq(s.lives, 5, 'wrong.upTrap.lifeLost');
  eq(s.streak, 0, 'wrong.upTrap.streakReset');
  eq(s.chainMultiplier, 1, 'wrong.upTrap.chainReset');
  eq(s.feedback, 'Not a meaning', 'wrong.upTrap.feedback');
  s = submitSwipeDown(s, 'r2');
  eq(s.lives, 4, 'wrong.downReal.lifeLost');
  eq(s.feedback, 'Actually a meaning', 'wrong.downReal.feedback');
  s = submitWrongSwipe(s);
  eq(s.lives, 3, 'wrong.direction.lifeLost');
}

// ── Feather milestone: fires for FX, no longer grants a life ─────
// Economy lock: the score->life net was regressive and was removed.

{
  let s = fresh();
  s = { ...s, score: 2950 };
  s = submitSwipeUp(s, 'r1');
  eq(s.score, 3050, 'milestone.scoreCrossed');
  eq(s.lives, 6, 'milestone.noLifeGranted');
  eq(s.featherMilestone, 3000 as const, 'milestone.flagSet');
  eq(s.featherMilestonesHit.includes(3000), true, 'milestone.recorded');
}

// ── Game over: non-fledgling dies at 0, word result recorded ─────

{
  let s = fresh();
  s = { ...s, lives: 1 };
  s = submitSwipeUp(s, 't1');
  eq(s.status, 'gameOver', 'death.status');
  eq(s.lives, 0, 'death.lives');
  eq(s.wordResults.length, 1, 'death.wordResultRecorded');
  eq(s.wordResults[0].word, 'ALPHA', 'death.wordResultWord');
}

{
  // wrong-direction death also records the in-progress word
  let s = fresh();
  s = { ...s, lives: 1 };
  s = submitWrongSwipe(s);
  eq(s.status, 'gameOver', 'death.wrongDirection.status');
  eq(s.wordResults.length, 1, 'death.wrongDirection.wordResultRecorded');
}

{
  let s = fresh();
  s = { ...s, lives: 1 };
  s = submitSwipeUp(s, 't1');
  eq(s.status, 'gameOver', 'goldFeather.before.status');
  eq(s.wordResults.length, 1, 'goldFeather.before.fatalResultRecorded');
  s = applyGoldFeather(s);
  eq(s.status, 'playing', 'goldFeather.revived.status');
  eq(s.lives, 1, 'goldFeather.revived.oneLife');
  eq(s.stepIndex, 0, 'goldFeather.revived.sameWord');
  eq(s.swipedUpIds.includes('t1'), true, 'goldFeather.revived.keepsFatalSwipe');
  eq(s.wordResults.length, 0, 'goldFeather.revived.removesFatalResult');
  const revivedRemaining = getUnresolvedMaskIds(
    s,
    s.shuffledMasks[s.stepIndex],
  );
  eq(revivedRemaining.includes('t1'), false, 'goldFeather.revived.removesCommittedCardFromDeck');
  const beforeDuplicateFatalSwipe = s;
  s = submitSwipeDown(s, 't1');
  eq(s, beforeDuplicateFatalSwipe, 'goldFeather.revived.committedCardCannotReplay');
  s = submitSwipeUp(s, 'r1');
  s = completeWord(s);
  eq(s.wordResults.length, 1, 'goldFeather.after.finalizesWordOnce');
  eq(s.wordResults[0].wrongSwipes, 1, 'goldFeather.after.preservesMistake');
}

{
  const s = fresh();
  eq(applyGoldFeather(s), s, 'goldFeather.noopWhilePlaying');
}

// ── Mercy: one revive at the configured life count, then real death ─

{
  let s = fresh(3); // fledgling tier
  eq(s.mercyReviveLives, 3, 'mercy.availableAtStart');
  s = { ...s, lives: 1 };
  s = submitSwipeUp(s, 't1');
  eq(s.status, 'playing', 'mercy.runSurvives');
  eq(s.lives, 3, 'mercy.revivedAt3');
  eq(s.mercyTriggered, true, 'mercy.flagSet');
  eq(s.mercyReviveLives, 0, 'mercy.spent');
  s = consumeMercy(s);
  eq(s.mercyTriggered, false, 'mercy.consumed');
  s = { ...s, lives: 1 };
  s = submitSwipeUp(s, 't2');
  eq(s.status, 'gameOver', 'mercy.secondDeathIsReal');
}

{
  // grace tier revives to a lower life count than fledgling
  let s = fresh(2);
  s = { ...s, lives: 1 };
  s = submitSwipeUp(s, 't1');
  eq(s.status, 'playing', 'mercy.grace.runSurvives');
  eq(s.lives, 2, 'mercy.grace.revivedAt2');
}

{
  // full-stakes games (mercyReviveLives = 0) never get a revive
  let s = fresh(0);
  eq(s.mercyReviveLives, 0, 'mercy.offForStandardRuns');
  s = { ...s, lives: 1 };
  s = submitSwipeUp(s, 't1');
  eq(s.status, 'gameOver', 'mercy.offForStandardRuns.diesForReal');
}

// ── completeWord: advance, then complete on last step ────────────

{
  let s = fresh();
  s = submitSwipeUp(s, 'r1');
  s = submitSwipeUp(s, 't1'); // one mistake
  s = completeWord(s);
  eq(s.stepIndex, 1, 'advance.stepIndex');
  eq(s.status, 'playing', 'advance.status');
  eq(s.mistakesOnWord, 0, 'advance.mistakesReset');
  eq(s.combo, 0, 'advance.comboResetOnImperfect');
  eq(s.wordResults.length, 1, 'advance.resultRecorded');
  eq(s.wordResults[0].wrongSwipes, 1, 'advance.mistakeCounted');
  s = completeWord(s);
  eq(s.status, 'complete', 'complete.status');
  eq(s.wordResults.length, 2, 'complete.allResultsRecorded');
}

// ── Route C mystery gauntlet: multi-tile boss resolution ─────────

{
  // beginMysteryGauntlet sets total, resets resolved
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = beginMysteryGauntlet(s, 3);
  eq(s.mysteryTotal, 3, 'gauntlet.beginSetsTotal');
  eq(s.mysteryResolved, 0, 'gauntlet.beginResetsResolved');
}

{
  // 3-tile clear: pending through tiles 1-2, mastered only on tile 3;
  // mastery score awarded exactly once (not per tile)
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = beginMysteryGauntlet(s, 3);
  const scoreBefore = s.score;
  const chainAtStart = s.chainMultiplier;

  s = resolveMysteryTile(s, { correct: true, visiblePerfect: true });
  eq(s.mysteryResolved, 1, 'gauntlet.clear.tile1Resolved');
  eq(s.bossOutcome, 'pending', 'gauntlet.clear.tile1StillPending');
  eq(s.score, scoreBefore, 'gauntlet.clear.tile1NoScore');

  s = resolveMysteryTile(s, { correct: true, visiblePerfect: true });
  eq(s.mysteryResolved, 2, 'gauntlet.clear.tile2Resolved');
  eq(s.bossOutcome, 'pending', 'gauntlet.clear.tile2StillPending');
  eq(s.score, scoreBefore, 'gauntlet.clear.tile2NoScore');

  s = resolveMysteryTile(s, { correct: true, visiblePerfect: true });
  eq(s.mysteryResolved, 3, 'gauntlet.clear.tile3Resolved');
  eq(s.bossOutcome, 'mastered', 'gauntlet.clear.tile3Mastered');
  eq(s.score, scoreBefore + mysteryMasteryPoints(chainAtStart), 'gauntlet.clear.scoredExactlyOnce');
}

{
  // wrong on tile 2 of 3 ends the gauntlet immediately
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = beginMysteryGauntlet(s, 3);
  s = resolveMysteryTile(s, { correct: true, visiblePerfect: true });
  s = resolveMysteryTile(s, { correct: false, visiblePerfect: false });
  eq(s.bossOutcome, 'haunted', 'gauntlet.wrongTile2.hauntedImmediately');
  eq(s.mysteryResolved, 2, 'gauntlet.wrongTile2.resolvedCount');
}

{
  const fledgling = generateHunt({ length: 8, gentle: true });
  const roles = fledgling
    .filter((step): step is WordStep => step.kind === 'word')
    .map(step => step.emotionalRole);
  eq(roles.filter(role => role === 'confidence').length, 2, 'fledgling.twoConfidenceRounds');
  eq(roles.filter(role => role === 'panic' || role === 'adrenaline').length, 1, 'fledgling.onePanicRound');
  eq(roles[roles.length - 1], 'finalBoss', 'fledgling.bossStillLast');
}

{
  // A persisted plan survives a presenter remount and already-resolved pair
  // indexes cannot score or advance twice.
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = beginMysteryGauntlet(s, [true, false, true]);
  eq(s.mysteryTileTruths.length, 3, 'gauntlet.resume.planStored');
  eq(s.mysteryTileTruths[1], false, 'gauntlet.resume.planTruthStored');

  s = resolveMysteryTile(s, {
    correct: true,
    visiblePerfect: true,
    pairIndex: 1,
  });
  const afterFirst = s;
  s = beginMysteryGauntlet(s, [false, false, false]);
  eq(s.mysteryResolved, 1, 'gauntlet.resume.beginDoesNotResetProgress');
  eq(s.mysteryTileTruths[0], true, 'gauntlet.resume.beginKeepsOriginalPlan');

  s = resolveMysteryTile(s, {
    correct: true,
    visiblePerfect: true,
    pairIndex: 1,
  });
  eq(s.mysteryResolved, afterFirst.mysteryResolved, 'gauntlet.resume.duplicatePairIgnored');
  eq(s.score, afterFirst.score, 'gauntlet.resume.duplicatePairNoScore');
}

{
  // A terminal outcome is immutable even if a stale presenter submits again.
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = beginMysteryGauntlet(s, [true]);
  s = resolveMysteryTile(s, {
    correct: true,
    visiblePerfect: true,
    pairIndex: 0,
  });
  const terminalScore = s.score;
  const terminalResolved = s.mysteryResolved;
  s = resolveMysteryTile(s, {
    correct: false,
    visiblePerfect: false,
    pairIndex: 0,
  });
  eq(s.bossOutcome, 'mastered', 'gauntlet.terminal.outcomeImmutable');
  eq(s.score, terminalScore, 'gauntlet.terminal.scoreImmutable');
  eq(s.mysteryResolved, terminalResolved, 'gauntlet.terminal.countImmutable');
  eq(isMysteryTerminal(s, false), false, 'gauntlet.terminal.noSecondTerminalEvent');
}

{
  // 1-tile gauntlet behaves exactly as the old single-mystery-tile rule
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = beginMysteryGauntlet(s, 1);
  const scoreBefore = s.score;
  const chainAtStart = s.chainMultiplier;
  s = resolveMysteryTile(s, { correct: true, visiblePerfect: true });
  eq(s.mysteryResolved, 1, 'gauntlet.single.resolved');
  eq(s.bossOutcome, 'mastered', 'gauntlet.single.mastered');
  eq(s.score, scoreBefore + mysteryMasteryPoints(chainAtStart), 'gauntlet.single.scoredOnce');
}

{
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = beginMysteryGauntlet(s, 1);
  s = resolveMysteryTile(s, { correct: false, visiblePerfect: false });
  eq(s.bossOutcome, 'haunted', 'gauntlet.single.wrongHaunted');
}

{
  // mysteryTotal 0 (e.g. never begun) is treated as 1, not a divide-by-zero/hang
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  eq(s.mysteryTotal, 0, 'gauntlet.zeroTotal.defaultsToZero');
  const scoreBefore = s.score;
  const chainAtStart = s.chainMultiplier;
  s = resolveMysteryTile(s, { correct: true, visiblePerfect: true });
  eq(s.bossOutcome, 'mastered', 'gauntlet.zeroTotal.treatedAsOne');
  eq(s.score, scoreBefore + mysteryMasteryPoints(chainAtStart), 'gauntlet.zeroTotal.scoredOnce');
}

{
  // isMysteryTerminal: any wrong is terminal; only the LAST correct is terminal
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = beginMysteryGauntlet(s, 3);
  eq(isMysteryTerminal(s, false), true, 'terminal.anyWrongIsTerminal');
  eq(isMysteryTerminal(s, true), false, 'terminal.firstCorrectNotTerminal');
  s = { ...s, mysteryResolved: 2 };
  eq(isMysteryTerminal(s, true), true, 'terminal.lastCorrectIsTerminal');
}

{
  // applyGoldFeather resets the gauntlet alongside bossOutcome
  let s = fresh();
  s = { ...s, stepIndex: 1 };
  s = beginMysteryGauntlet(s, 3);
  s = resolveMysteryTile(s, { correct: true, visiblePerfect: true });
  eq(s.mysteryResolved, 1, 'goldFeather.gauntlet.preResolvedOne');
  s = { ...s, status: 'gameOver', lives: 0 };
  s = applyGoldFeather(s);
  eq(s.mysteryTotal, 0, 'goldFeather.gauntlet.resetsTotal');
  eq(s.mysteryResolved, 0, 'goldFeather.gauntlet.resetsResolved');
}

// ── gauntlet order-tracking (Pick Your Trap) ────────────────────────────
{
  const ids = ['a', 'b', 'c'];
  const allIdle = new Map<string, string>([['a', 'idle'], ['b', 'idle'], ['c', 'idle']]);

  eq(isGauntletTilePickable(ids, allIdle, 0), true, 'idle tile is pickable');
  eq(isGauntletTilePickable(ids, allIdle, 3), false, 'out-of-range index is not pickable');

  const oneResolved = new Map<string, string>([['a', 'correct'], ['b', 'idle'], ['c', 'idle']]);
  eq(isGauntletTilePickable(ids, oneResolved, 0), false, 'resolved (correct) tile is not pickable');
  eq(isGauntletTilePickable(ids, oneResolved, 1), true, 'still-idle tile remains pickable');

  // Missing map entry defaults to idle (a freshly-dealt tile with no state yet).
  const empty = new Map<string, string>();
  eq(isGauntletTilePickable(ids, empty, 0), true, 'tile with no recorded state defaults to pickable');
}

{
  const ids = ['a', 'b', 'c'];

  // Resolving 'a' when 'b' and 'c' are both still idle: not the last one.
  const twoLeft = new Map<string, string>([['a', 'idle'], ['b', 'idle'], ['c', 'idle']]);
  eq(isLastRemainingGauntletTile(ids, twoLeft, 'a'), false, 'two other tiles still idle: not last');

  // 'b' already correct, 'c' still idle, resolving 'a' now: not last (c remains).
  const oneLeft = new Map<string, string>([['a', 'idle'], ['b', 'correct'], ['c', 'idle']]);
  eq(isLastRemainingGauntletTile(ids, oneLeft, 'a'), false, 'one other tile still idle: not last');

  // 'b' and 'c' both already resolved, resolving 'a' now: this is the last one.
  const noneLeft = new Map<string, string>([['a', 'idle'], ['b', 'correct'], ['c', 'trap-caught']]);
  eq(isLastRemainingGauntletTile(ids, noneLeft, 'a'), true, 'both others resolved: this is last');

  // Single-tile gauntlet (Returning Haunt): resolving the only tile is always last.
  eq(isLastRemainingGauntletTile(['a'], new Map(), 'a'), true, 'single-tile gauntlet: always last');
}

console.log('OK');
