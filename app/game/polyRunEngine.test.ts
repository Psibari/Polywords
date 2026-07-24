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
  GameState,
} from './polyRunEngine';
import { Mask, SessionStep, WordStep } from './types';

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

console.log('OK');
