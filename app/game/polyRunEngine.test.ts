// Run with: npx.cmd -y tsx app/game/polyRunEngine.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import {
  createGame,
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

function fresh(fledgling = false): GameState {
  return createGame([], session(), fledgling);
}

// ── Scoring: correct swipes ──────────────────────────────────────

{
  let s = fresh();
  s = submitSwipeUp(s, 'r1');
  eq(s.score, 100, 'up.real.score');
  eq(s.combo, 1, 'up.real.combo');
  eq(s.streak, 1, 'up.real.streak');
  eq(s.lives, 5, 'up.real.livesUntouched');
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
  eq(s.lives, 4, 'wrong.upTrap.lifeLost');
  eq(s.streak, 0, 'wrong.upTrap.streakReset');
  eq(s.chainMultiplier, 1, 'wrong.upTrap.chainReset');
  eq(s.feedback, 'Not a meaning', 'wrong.upTrap.feedback');
  s = submitSwipeDown(s, 'r2');
  eq(s.lives, 3, 'wrong.downReal.lifeLost');
  eq(s.feedback, 'Actually a meaning', 'wrong.downReal.feedback');
  s = submitWrongSwipe(s);
  eq(s.lives, 2, 'wrong.direction.lifeLost');
}

// ── Feather milestone: crossing 3000 grants a life, capped at 6 ──

{
  let s = fresh();
  s = { ...s, score: 2950 };
  s = submitSwipeUp(s, 'r1');
  eq(s.score, 3050, 'milestone.scoreCrossed');
  eq(s.lives, 6, 'milestone.lifeGranted');
  eq(s.featherMilestone, 3000 as const, 'milestone.flagSet');
  eq(s.featherMilestonesHit.includes(3000), true, 'milestone.recorded');
  // crossing again must not re-grant
  s = { ...s, score: 2950, featherMilestone: null };
  s = submitSwipeUp(s, 'r2');
  eq(s.lives, 6, 'milestone.noDoubleGrant');
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

// ── Fledgling Mercy: one revive at 3 feathers, then real death ───

{
  let s = fresh(true);
  eq(s.fledglingMercyAvailable, true, 'mercy.availableAtStart');
  s = { ...s, lives: 1 };
  s = submitSwipeUp(s, 't1');
  eq(s.status, 'playing', 'mercy.runSurvives');
  eq(s.lives, 3, 'mercy.revivedAt3');
  eq(s.mercyTriggered, true, 'mercy.flagSet');
  eq(s.fledglingMercyAvailable, false, 'mercy.spent');
  s = consumeMercy(s);
  eq(s.mercyTriggered, false, 'mercy.consumed');
  s = { ...s, lives: 1 };
  s = submitSwipeUp(s, 't2');
  eq(s.status, 'gameOver', 'mercy.secondDeathIsReal');
}

{
  // non-fledgling games never get mercy
  let s = fresh(false);
  eq(s.fledglingMercyAvailable, false, 'mercy.offForStandardRuns');
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
