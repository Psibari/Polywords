// Run with: npx.cmd -y tsx app/game/pollyVisitPolicy.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import { resolveVisit, PollyBudgetState, VisitDecision, VisitSpec } from './pollyVisitPolicy';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const idle: PollyBudgetState = {
  busy: false,
  heckleUsedThisWord: false,
  wrongSeenThisWord: false,
  cleanSweepSeenThisRun: false,
  isSpeedRound: false,
  ghostRunsMissed: 0,
};

function visitSpec(d: VisitDecision, label: string): VisitSpec {
  if (d.action !== 'visit') throw new Error(`${label}: expected a visit, got ${d.action}`);
  return d.spec;
}

// ── Guaranteed beats ────────────────────────────────────────────

// bossEntry: flyAngry → point, line + short squawk, flies out
{
  const s = visitSpec(resolveVisit('bossEntry', idle), 'bossEntry');
  eq(s.kind, 'guaranteed', 'bossEntry.kind');
  eq(s.flyPose, 'flyAngry', 'bossEntry.flyPose');
  eq(s.perchPose, 'point', 'bossEntry.perchPose');
  eq(s.line, 'This word stays mine.', 'bossEntry.line');
  eq(s.sfx, 'pollySqwawkShort', 'bossEntry.sfx');
  eq(s.holdPerch, false, 'bossEntry.holdPerch');
}

// gateMasteredBoss: flyAngry → sulk, silent, holds perch
{
  const s = visitSpec(resolveVisit('gateMasteredBoss', idle), 'gateMasteredBoss');
  eq(s.perchPose, 'sulk', 'gateMasteredBoss.perchPose');
  eq(s.line, null, 'gateMasteredBoss.line');
  eq(s.sfx, null, 'gateMasteredBoss.sfx');
  eq(s.holdPerch, true, 'gateMasteredBoss.holdPerch');
}

// gameOver: laugh, never-change line, holds perch (terminal beat). Silent by
// design — ResultsScreen owns the one reliable pollySqwawkLaugh play; this
// visit used to carry its own copy, which raced ResultsScreen's and could
// double-fire the laugh across replays.
{
  const s = visitSpec(resolveVisit('gameOver', idle), 'gameOver');
  eq(s.perchPose, 'laugh', 'gameOver.perchPose');
  eq(s.line, 'BBBLAAAAHHAHAHA!', 'gameOver.line');
  eq(s.sfx, null, 'gameOver.sfx');
  eq(s.holdPerch, true, 'gameOver.holdPerch');
}

// hauntFailed: same laugh beat, but the run continues — does NOT hold the
// perch. Regression guard for the fix that split this off from gameOver.
{
  const s = visitSpec(resolveVisit('hauntFailed', idle), 'hauntFailed');
  eq(s.kind, 'guaranteed', 'hauntFailed.kind');
  eq(s.perchPose, 'laugh', 'hauntFailed.perchPose');
  eq(s.line, 'BBBLAAAAHHAHAHA!', 'hauntFailed.line');
  eq(s.sfx, 'pollySqwawkLaugh', 'hauntFailed.sfx');
  eq(s.holdPerch, false, 'hauntFailed.holdPerch');
}

// Guaranteed beats fire even when busy, mid-heckle-budget, or in speed rounds
{
  const jammed: PollyBudgetState = {
    busy: true, heckleUsedThisWord: true, wrongSeenThisWord: true,
    cleanSweepSeenThisRun: true, isSpeedRound: true,
    ghostRunsMissed: 0,
  };
  eq(resolveVisit('bossEntry', jammed).action, 'visit', 'bossEntry while jammed');
  eq(resolveVisit('gameOver', jammed).action, 'visit', 'gameOver while jammed');
  eq(resolveVisit('gateMasteredBoss', jammed).action, 'visit', 'gateMasteredBoss while jammed');
}

// ── cleanSweep tiering ──────────────────────────────────────────

// First of the run: guaranteed shocked
{
  const s = visitSpec(resolveVisit('cleanSweep', idle), 'cleanSweep first');
  eq(s.kind, 'guaranteed', 'cleanSweep first.kind');
  eq(s.perchPose, 'shocked', 'cleanSweep first.perchPose');
  eq(s.line, "Bet you can't do that again.", 'cleanSweep first.line');
  eq(s.sfx, null, 'cleanSweep first.sfx'); // shocked recoil is silent — squawk was overused
  eq(s.holdPerch, false, 'cleanSweep first.holdPerch');
}

// Later ones: demoted to heckle (still fires when budget free)
{
  const s = visitSpec(
    resolveVisit('cleanSweep', { ...idle, cleanSweepSeenThisRun: true }),
    'cleanSweep repeat',
  );
  eq(s.kind, 'heckle', 'cleanSweep repeat.kind');
  eq(s.perchPose, 'shocked', 'cleanSweep repeat.perchPose');
  eq(s.sfx, null, 'cleanSweep repeat.sfx');
}

// Later ones are dropped when the word's heckle budget is spent
eq(
  resolveVisit('cleanSweep', { ...idle, cleanSweepSeenThisRun: true, heckleUsedThisWord: true }).action,
  'none',
  'cleanSweep repeat with budget spent',
);

// ── Heckles ─────────────────────────────────────────────────────

// wrong: first of the word → smug "Thought so."
{
  const s = visitSpec(resolveVisit('wrong', idle), 'wrong first');
  eq(s.kind, 'heckle', 'wrong.kind');
  eq(s.perchPose, 'smug', 'wrong.perchPose');
  eq(s.line, 'Thought so.', 'wrong.line');
  eq(s.sfx, null, 'wrong.sfx'); // the wrong swipe itself already squawks in MaskBoard
}

// wrong: second wrong of the same word is ignored
eq(resolveVisit('wrong', { ...idle, wrongSeenThisWord: true }).action, 'none', 'second wrong');

// hesitation6s → point taunt; 3s and 9s are ignored
{
  const s = visitSpec(resolveVisit('hesitation6s', idle), 'hesitation6s');
  eq(s.perchPose, 'point', 'hesitation6s.perchPose');
  eq(s.line, 'YES... NO... MAYBE SO...', 'hesitation6s.line');
  eq(s.sfx, null, 'hesitation6s.sfx');
}
eq(resolveVisit('hesitation3s', idle).action, 'none', 'hesitation3s ignored');
eq(resolveVisit('hesitation9s', idle).action, 'none', 'hesitation9s ignored');

// ghostEntry → smug "Remember me."
{
  const s = visitSpec(resolveVisit('ghostEntry', idle), 'ghostEntry');
  eq(s.perchPose, 'smug', 'ghostEntry.perchPose');
  eq(s.line, 'Remember me.', 'ghostEntry.line');
}

// A repeatedly missed haunt keeps the same scarce line but points instead of
// replaying the same smug pose: memory is visible without adding chatter.
{
  const s = visitSpec(
    resolveVisit('ghostEntry', { ...idle, ghostRunsMissed: 2 }),
    'ghostEntry repeated',
  );
  eq(s.perchPose, 'point', 'ghostEntry repeated.perchPose');
}

// Heckles drop when busy, when budget spent, and in speed rounds
for (const [i, block] of [
  { ...idle, busy: true },
  { ...idle, heckleUsedThisWord: true },
  { ...idle, isSpeedRound: true },
].entries()) {
  eq(resolveVisit('wrong', block).action, 'none', `blocked wrong #${i}`);
  eq(resolveVisit('hesitation6s', block).action, 'none', `blocked hesitation6s #${i}`);
  eq(resolveVisit('ghostEntry', block).action, 'none', `blocked ghostEntry #${i}`);
}

// ── Ignored events + budget reset ───────────────────────────────

eq(resolveVisit('wordEntry', idle).action, 'wordEntry', 'wordEntry resets budget');

for (const ev of [
  'correct', 'streakX10', 'oneHeartLeft', 'oneWrongMove', 'allMasksFound',
  'hiddenFound', 'hesitationCleared', 'ghostFoundLate', 'ghostDissolved',
  'gateMastered', 'hiddenMasterFailed',
] as const) {
  eq(resolveVisit(ev, idle).action, 'none', `${ev} ignored`);
}

console.log('OK — pollyVisitPolicy: all assertions passed');
