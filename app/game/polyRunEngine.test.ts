// Run with: npx.cmd -y tsx app/game/polyRunEngine.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import {
  createGame,
  applyGoldFeather,
  consumeMercy,
  consumeArmor,
  isArmored,
  chainMultiplierForStreak,
  UNTRAPPABLE_MULTIPLIER,
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
  fellOffSeverityFromMultiplier,
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

function freshHaunt(): GameState {
  const haunt = {
    ...mkWord('BANK', STANDARD_MASKS),
    isHauntReturn: true,
    hiddenMeaning: 'THE SIDE OF A RIVER',
    hiddenTrap: 'A STACK OF CASH',
  } satisfies WordStep;
  return createGame([haunt, mkWord('OMEGA', STANDARD_MASKS, true)]);
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

// ── FELL OFF severity: null below 1.5x, escalating at each real tier ───

{
  eq(fellOffSeverityFromMultiplier(1), null, 'fellOff.steadyIsNull');
  eq(fellOffSeverityFromMultiplier(1.49), null, 'fellOff.justBelowSharpIsNull');
  eq(fellOffSeverityFromMultiplier(1.5), 1, 'fellOff.sharp');
  eq(fellOffSeverityFromMultiplier(1.99), 1, 'fellOff.justBelowRazorSharp');
  eq(fellOffSeverityFromMultiplier(2.0), 2, 'fellOff.razorSharp');
  eq(fellOffSeverityFromMultiplier(2.49), 2, 'fellOff.justBelowUntrappable');
  eq(fellOffSeverityFromMultiplier(2.5), 3, 'fellOff.untrappable');
  eq(fellOffSeverityFromMultiplier(3.0), 3, 'fellOff.cappedMultiplierStillBiggest');
}

// A wrong swipe from a real chain sets fellOffSeverity; the state is at
// 1.5x (streak 3) going into this swipe, so breaking it is a severity-1 fall.
{
  let s = fresh();
  s = submitSwipeUp(s, 'r1');
  s = submitSwipeUp(s, 'r2');
  s = submitSwipeDown(s, 't1');
  eq(s.chainMultiplier, 1.5, 'fellOff.setupAt1.5x');
  s = submitSwipeUp(s, 't2'); // wrong: claims a trap as real
  eq(s.chainMultiplier, 1, 'fellOff.resetsTo1x');
  eq(s.fellOffSeverity, 1, 'fellOff.severityFromBrokenSharp');
}

// A wrong swipe from steady (never built a real chain) sets no severity.
{
  let s = fresh();
  eq(s.chainMultiplier, 1, 'fellOff.startsSteady');
  s = submitSwipeUp(s, 't1'); // wrong: claims a trap as real, from streak 0
  eq(s.fellOffSeverity, null, 'fellOff.noLossFromSteady');
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
  eq(s.lossCause, 'trap', 'wrong.upTrap.lossCause');
  s = submitSwipeDown(s, 'r2');
  eq(s.lives, 4, 'wrong.downReal.lifeLost');
  eq(s.feedback, 'Actually a meaning', 'wrong.downReal.feedback');
  eq(s.lossCause, 'rejectedReal', 'wrong.downReal.lossCause');
  s = submitWrongSwipe(s);
  eq(s.lives, 3, 'wrong.direction.lifeLost');
  eq(s.lossCause, 'wrongCall', 'wrong.direction.lossCause');
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
  eq(s.lossCause, 'trap', 'goldFeather.before.lossCause');
  s = applyGoldFeather(s);
  eq(s.status, 'playing', 'goldFeather.revived.status');
  eq(s.lives, 1, 'goldFeather.revived.oneLife');
  eq(s.lossCause, null, 'goldFeather.revived.lossCauseCleared');
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
  // Returning Haunt terminal truth is persisted separately from Polly's boss
  // verdict and never awards boss mastery score.
  let s = freshHaunt();
  s = beginMysteryGauntlet(s, [true]);
  const scoreBefore = s.score;
  s = resolveMysteryTile(s, {
    correct: true,
    visiblePerfect: true,
    pairIndex: 0,
  });
  eq(s.hauntOutcome, 'banished', 'haunt.correct.outcomePersisted');
  eq(s.bossOutcome, 'pending', 'haunt.correct.bossOutcomeUntouched');
  eq(s.score, scoreBefore, 'haunt.correct.noBossMasteryScore');
  eq(s.mysteryResolved, 1, 'haunt.correct.resolutionPersisted');
  eq(isMysteryTerminal(s, true), false, 'haunt.correct.noSecondTerminalEvent');

  const terminal = s;
  s = resolveMysteryTile(s, {
    correct: false,
    visiblePerfect: false,
    pairIndex: 0,
  });
  eq(s, terminal, 'haunt.correct.duplicateSubmissionIgnored');

  s = completeWord(s);
  eq(s.stepIndex, 1, 'haunt.correct.continueAdvances');
  eq(s.hauntOutcome, 'pending', 'haunt.correct.outcomeClearsAfterAdvance');
  eq(s.mysteryResolved, 0, 'haunt.correct.gauntletProgressClearsAfterAdvance');
}

{
  let s = freshHaunt();
  s = beginMysteryGauntlet(s, [false]);
  const scoreBefore = s.score;
  s = resolveMysteryTile(s, {
    correct: false,
    visiblePerfect: false,
    pairIndex: 0,
  });
  eq(s.hauntOutcome, 'haunted', 'haunt.wrong.outcomePersisted');
  eq(s.bossOutcome, 'pending', 'haunt.wrong.bossOutcomeUntouched');
  eq(s.score, scoreBefore, 'haunt.wrong.noScoreChange');

  const terminal = s;
  s = resolveMysteryTile(s, {
    correct: false,
    visiblePerfect: false,
    pairIndex: 0,
  });
  eq(s, terminal, 'haunt.wrong.duplicateSubmissionIgnored');
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
  eq(s.hauntOutcome, 'pending', 'goldFeather.gauntlet.resetsHauntOutcome');
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

// ── ARMOR: an UNTRAPPABLE chain (multiplier >= 2.5, streak >= 9) protects the feathers ──

function untrappable(base: GameState): GameState {
  return { ...base, streak: 9, chainMultiplier: chainMultiplierForStreak(9) };
}

{
  eq(chainMultiplierForStreak(9), UNTRAPPABLE_MULTIPLIER, 'armor.streak9IsUntrappable');
  eq(chainMultiplierForStreak(8) < UNTRAPPABLE_MULTIPLIER, true, 'armor.streak8IsNot');
  eq(isArmored(fresh()), false, 'armor.offAtSteady');
  eq(fresh().armorUsed, 0, 'armor.startsAtZero');
  eq(fresh().armorAbsorbed, false, 'armor.flagStartsOff');
}

// A trap claimed as real (swipe up) while armored: no feather, but everything else is a normal miss.
{
  let s = untrappable(fresh());
  eq(isArmored(s), true, 'armor.up.on');
  const livesBefore = s.lives;
  s = submitSwipeUp(s, 't1');
  eq(s.lives, livesBefore, 'armor.up.noFeatherLost');
  eq(s.status, 'playing', 'armor.up.stillPlaying');
  eq(s.streak, 0, 'armor.up.streakResets');
  eq(s.chainMultiplier, 1, 'armor.up.backToSteady');
  eq(s.combo, 0, 'armor.up.comboResets');
  eq(s.fellOffSeverity, 3, 'armor.up.fellOffStillFires');
  eq(s.mistakesOnWord, 1, 'armor.up.wordStillImperfect');
  eq(s.armorAbsorbed, true, 'armor.up.flagSet');
  eq(s.armorUsed, 1, 'armor.up.counted');
  eq(isArmored(s), false, 'armor.up.spentUntilEarnedAgain');
  s = consumeArmor(s);
  eq(s.armorAbsorbed, false, 'armor.up.flagConsumed');
  eq(s.armorUsed, 1, 'armor.up.countSurvivesConsume');
}

// A real meaning rejected (swipe down) while armored: same.
{
  let s = untrappable(fresh());
  const livesBefore = s.lives;
  s = submitSwipeDown(s, 'r1');
  eq(s.lives, livesBefore, 'armor.down.noFeatherLost');
  eq(s.mistakesOnWord, 1, 'armor.down.wordStillImperfect');
  eq(s.armorUsed, 1, 'armor.down.counted');
  eq(s.fellOffSeverity, 3, 'armor.down.fellOffStillFires');
}

// The generic wrong swipe: same.
{
  let s = untrappable(fresh());
  const livesBefore = s.lives;
  s = submitWrongSwipe(s);
  eq(s.lives, livesBefore, 'armor.generic.noFeatherLost');
  eq(s.armorUsed, 1, 'armor.generic.counted');
}

// Just below UNTRAPPABLE (streak 6 = 2.0x, RAZOR SHARP): a miss costs a feather as before.
{
  let s: GameState = { ...fresh(), streak: 6, chainMultiplier: chainMultiplierForStreak(6) };
  eq(isArmored(s), false, 'armor.razorSharpIsNotArmored');
  const livesBefore = s.lives;
  s = submitSwipeUp(s, 't1');
  eq(s.lives, livesBefore - 1, 'armor.razorSharp.losesFeather');
  eq(s.armorUsed, 0, 'armor.razorSharp.notCounted');
  eq(s.armorAbsorbed, false, 'armor.razorSharp.flagStaysOff');
}

// Armor comes back every time UNTRAPPABLE is reached again: no cap, no counter to spend.
{
  let s = fresh();
  const livesBefore = s.lives;
  for (let i = 1; i <= 3; i += 1) {
    s = untrappable(s);
    s = submitWrongSwipe(s);
    eq(s.armorUsed, i, `armor.returns.absorbed${i}`);
  }
  eq(s.lives, livesBefore, 'armor.returns.noFeatherEverLost');
  // ...and the next miss from STEADY (armor spent, chain gone) costs a feather.
  s = submitWrongSwipe(s);
  eq(s.lives, livesBefore - 1, 'armor.returns.unarmoredMissCosts');
}

// On the last feather: armor saves it, and Mercy is not spent on an absorbed miss.
{
  let s = untrappable({ ...fresh(3), lives: 1 });
  s = submitSwipeUp(s, 't1');
  eq(s.lives, 1, 'armor.lastFeather.kept');
  eq(s.status, 'playing', 'armor.lastFeather.alive');
  eq(s.mercyTriggered, false, 'armor.lastFeather.mercyNotTriggered');
  eq(s.mercyReviveLives, 3, 'armor.lastFeather.mercyNotSpent');
  eq(s.mercyUsed, 0, 'armor.lastFeather.mercyNotCounted');
}

// Works on the boss word (feathers still matter there until the gauntlet starts).
{
  let s = untrappable({ ...fresh(), stepIndex: 1, lives: 1 });
  s = submitSwipeUp(s, 't1');
  eq(s.status, 'playing', 'armor.bossWord.survives');
  eq(s.bossOutcome, 'pending', 'armor.bossWord.notHaunted');
  eq(s.lives, 1, 'armor.bossWord.featherKept');
}

// NOT in the gauntlet: feathers mean nothing there, so armor is off while it runs.
{
  const s: GameState = { ...untrappable({ ...fresh(), stepIndex: 1 }), gauntletActive: true };
  eq(isArmored(s), false, 'armor.gauntlet.off');
}

// Saves from before armor existed carry no armor fields; the engine reads them as 0 / off.
{
  const legacy = { ...untrappable(fresh()) } as Partial<GameState>;
  delete legacy.armorUsed;
  delete legacy.armorAbsorbed;
  const s = submitSwipeUp(legacy as GameState, 't1');
  eq(s.armorUsed, 1, 'armor.legacySave.countsFromZero');
  eq(s.armorAbsorbed, true, 'armor.legacySave.flagSet');
}

console.log('OK');


// Multi-persona, real-engine synthetic playthroughs. These are sensitivity
// scenarios, not measured human skill or retention forecasts.
{
  const profiles = [
    { name: 'struggling', accuracy: 0.65, hiddenAccuracy: 0.55 },
    { name: 'developing', accuracy: 0.82, hiddenAccuracy: 0.72 },
    { name: 'experienced', accuracy: 0.95, hiddenAccuracy: 0.90 },
  ] as const;
  const runsPerProfile = 150;
  const summary: Record<string, { runs: number; deaths: number; bossReached: number; mastered: number; haunted: number; livesLost: number; decisions: number; mistakes: number }> = {};

  for (const profile of profiles) {
    const counts = { runs: 0, deaths: 0, bossReached: 0, mastered: 0, haunted: 0, livesLost: 0, decisions: 0, mistakes: 0 };
    for (let run = 0; run < runsPerProfile; run += 1) {
      const seed = 140001 + run * 7919 + profiles.indexOf(profile) * 1000003;
      let rngState = seed >>> 0;
      const draw = () => {
        rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
        return rngState / 4294967296;
      };
      const steps = generateHunt({ seed, ...(run < 3 ? { length: 8, gentle: true } : {}) });
      let state = createGame(steps, 0, seed);
      counts.runs++;
      let guard = 0;
      while (state.status === 'playing') {
        if (++guard > 20) throw new Error('simulation did not advance through the Hunt');
        const step = state.session[state.stepIndex];
        if (step.kind !== 'word') throw new Error('unexpected non-word Hunt step');
        if (step.eventType === 'bossWord') counts.bossReached++;
        for (const mask of state.shuffledMasks[state.stepIndex]) {
          if (state.status !== 'playing') break;
          const correct = draw() < profile.accuracy;
          counts.decisions++;
          if (!correct) counts.mistakes++;
          const beforeLives = state.lives;
          const swipeUp = correct ? mask.isReal : !mask.isReal;
          state = swipeUp ? submitSwipeUp(state, mask.id) : submitSwipeDown(state, mask.id);
          counts.livesLost += Math.max(0, beforeLives - state.lives);
          if (state.lives < 0 || state.lives > 6) throw new Error('invalid feather count');
        }
        if (state.status !== 'playing') break;
        if (step.eventType === 'bossWord') {
          state = beginMysteryGauntlet(state, [true, false, true]);
          for (let pair = 0; pair < 3 && state.bossOutcome === 'pending'; pair++) {
            const before = state;
            state = resolveMysteryTile(state, {
              correct: draw() < profile.hiddenAccuracy,
              visiblePerfect: state.mistakesOnWord === 0,
              pairIndex: pair,
            });
            if (state.mysteryResolved !== before.mysteryResolved + 1) throw new Error('hidden judgment did not advance');
            const replay = resolveMysteryTile(state, { correct: true, visiblePerfect: true, pairIndex: pair });
            if (replay !== state) throw new Error('hidden judgment replay changed outcome');
          }
          if (state.bossOutcome === 'mastered') counts.mastered++;
          else if (state.bossOutcome === 'haunted') counts.haunted++;
          else throw new Error('boss outcome unresolved after three judgments');
        }
        const prior = state.stepIndex;
        state = completeWord(state);
        if (state.status === 'playing' && state.stepIndex !== prior + 1) throw new Error('word did not advance');
      }
      if (state.status === 'gameOver') counts.deaths++;
      else if (state.status !== 'complete') throw new Error('invalid terminal state');
    }
    summary[profile.name] = counts;
  }
  if (!(summary.struggling.deaths > summary.developing.deaths &&
        summary.developing.deaths > summary.experienced.deaths)) {
    throw new Error('persona difficulty sensitivity failed: ' + JSON.stringify(summary));
  }
  console.log('synthetic player decision simulation:', JSON.stringify(summary));
}


// Persistence/resume simulation: serialize mid-word and mid-hidden-gauntlet,
// then replay against uninterrupted engine state without double judgments.
{
  const steps = generateHunt({ seed: 991177 });
  let uninterrupted = createGame(steps, 0, 991177);
  const first = uninterrupted.shuffledMasks[0][0];
  uninterrupted = first.isReal
    ? submitSwipeUp(uninterrupted, first.id)
    : submitSwipeDown(uninterrupted, first.id);
  let resumed = JSON.parse(JSON.stringify(uninterrupted)) as GameState;
  const next = resumed.shuffledMasks[0][1];
  uninterrupted = next.isReal
    ? submitSwipeUp(uninterrupted, next.id)
    : submitSwipeDown(uninterrupted, next.id);
  resumed = next.isReal
    ? submitSwipeUp(resumed, next.id)
    : submitSwipeDown(resumed, next.id);
  eq(resumed.score, uninterrupted.score, 'resume.scoreMatches');
  eq(resumed.lives, uninterrupted.lives, 'resume.livesMatch');
  eq(resumed.streak, uninterrupted.streak, 'resume.streakMatches');
  eq(resumed.swipedUpIds.join(','), uninterrupted.swipedUpIds.join(','), 'resume.upHistoryMatches');
  eq(resumed.swipedDownIds.join(','), uninterrupted.swipedDownIds.join(','), 'resume.downHistoryMatches');

  let boss = createGame(steps, 0, 991177);
  boss = { ...boss, stepIndex: steps.length - 1 };
  boss = beginMysteryGauntlet(boss, [true, false, true]);
  boss = resolveMysteryTile(boss, { correct: true, visiblePerfect: true, pairIndex: 0 });
  const recovered = JSON.parse(JSON.stringify(boss)) as GameState;
  const remounted = beginMysteryGauntlet(recovered, [true, false, true]);
  eq(remounted.mysteryResolved, 1, 'resume.hiddenProgressPreserved');
  eq(remounted.bossOutcome, 'pending', 'resume.bossStillPending');
  const twice = resolveMysteryTile(remounted, { correct: true, visiblePerfect: true, pairIndex: 0 });
  eq(twice, remounted, 'resume.hiddenReplayNoop');
  let finished = resolveMysteryTile(twice, { correct: true, visiblePerfect: true, pairIndex: 1 });
  finished = resolveMysteryTile(finished, { correct: true, visiblePerfect: true, pairIndex: 2 });
  eq(finished.bossOutcome, 'mastered', 'resume.hiddenCanMaster');
  const duplicateTerminal = resolveMysteryTile(finished, { correct: false, visiblePerfect: false, pairIndex: 2 });
  eq(duplicateTerminal, finished, 'resume.terminalVerdictCannotReverse');
  console.log('engine save/resume simulation: passed');
}


// Controlled 8-vs-10 sensitivity comparison. Same player seeds and accuracy
// assumptions, same six starting feathers, same engine. Different layouts and
// word draws mean these are matched scenarios, not identical tile sequences.
// Not a retention experiment or a recommendation to change live settings.
{
  const profiles = [
    { name: 'struggling', accuracy: 0.65, hiddenAccuracy: 0.55 },
    { name: 'developing', accuracy: 0.82, hiddenAccuracy: 0.72 },
    { name: 'experienced', accuracy: 0.95, hiddenAccuracy: 0.90 },
  ] as const;
  const runsPerCell = 400;
  const results: Record<string, Record<string, {
    hunts: number; bossReached: number; completed: number; mastered: number;
    haunted: number; deaths: number; feathersLost: number; decisions: number;
    mistakes: number; scoreTotal: number; roundsReached: number;
  }>> = {};
  for (const profile of profiles) {
    results[profile.name] = {};
    for (const length of [8, 10]) {
      const counts = {
        hunts: 0, bossReached: 0, completed: 0, mastered: 0, haunted: 0,
        deaths: 0, feathersLost: 0, decisions: 0, mistakes: 0,
        scoreTotal: 0, roundsReached: 0,
      };
      for (let run = 0; run < runsPerCell; run++) {
        const seed = 220011 + run * 7907 + profiles.indexOf(profile) * 1000003;
        let randomState = (seed ^ 0x9e3779b9) >>> 0;
        const random = () => {
          randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
          return randomState / 4294967296;
        };
        const steps = generateHunt({ seed, length });
        let state = createGame(steps, 0, seed);
        counts.hunts++;
        while (state.status === 'playing') {
          const step = state.session[state.stepIndex];
          if (step.kind !== 'word') throw new Error('comparison: unexpected step');
          counts.roundsReached++;
          if (step.eventType === 'bossWord') counts.bossReached++;
          for (const mask of state.shuffledMasks[state.stepIndex]) {
            if (state.status !== 'playing') break;
            const correct = random() < profile.accuracy;
            counts.decisions++;
            if (!correct) counts.mistakes++;
            const before = state.lives;
            state = (correct ? mask.isReal : !mask.isReal)
              ? submitSwipeUp(state, mask.id)
              : submitSwipeDown(state, mask.id);
            counts.feathersLost += Math.max(0, before - state.lives);
          }
          if (state.status !== 'playing') break;
          if (step.eventType === 'bossWord') {
            state = beginMysteryGauntlet(state, [true, false, true]);
            for (let i = 0; i < 3 && state.bossOutcome === 'pending'; i++) {
              state = resolveMysteryTile(state, {
                correct: random() < profile.hiddenAccuracy,
                visiblePerfect: state.mistakesOnWord === 0,
                pairIndex: i,
              });
            }
            if (state.bossOutcome === 'mastered') counts.mastered++;
            else if (state.bossOutcome === 'haunted') counts.haunted++;
            else throw new Error('comparison: unresolved Boss');
          }
          state = completeWord(state);
        }
        if (state.status === 'complete') counts.completed++;
        else if (state.status === 'gameOver') counts.deaths++;
        else throw new Error('comparison: invalid terminal status');
        counts.scoreTotal += state.score;
      }
      eq(counts.completed + counts.deaths, runsPerCell, 'comparison.everyRunTerminates');
      if (counts.mastered + counts.haunted > counts.bossReached) {
        throw new Error('comparison: more Boss outcomes than Boss encounters');
      }
      results[profile.name][String(length)] = counts;
    }
  }
  console.log('controlled Hunt length comparison:', JSON.stringify({
    runsPerCell, sixStartingFeathers: true, mercy: false,
    assumption: 'independent per-card accuracy, no real-player calibration',
    results,
  }));
}
