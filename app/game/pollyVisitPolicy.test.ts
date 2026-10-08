// Run with: npx.cmd -y tsx app/game/pollyVisitPolicy.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import { resolveVisit, PollyBudgetState, VisitDecision, VisitSpec } from './pollyVisitPolicy';
import { PollyLineId } from './pollyCharacter';

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
  recentLineIds: [],
  lineRoll: 0,
};

function visitSpec(d: VisitDecision, label: string): VisitSpec {
  if (d.action !== 'visit') throw new Error(`${label}: expected a visit, got ${d.action}`);
  return d.spec;
}

// ── Guaranteed beats ────────────────────────────────────────────

// bossEntry: fly → point, line + short squawk, bigger — pops in for the
// line then flies back out (does NOT hold perch; holding through the visible
// tiles + gauntlet caused her to overlap/hide gauntlet card text — device
// test 2026-07-31). She does NOT come back for the gauntlet — the throw beat
// that used to bring her back was cut (2026-09-10); see allMasksFound below.
// Line now draws from a 5-line pool (pickFreshLine) same as WRONG_SMUG;
// lineRoll 0 with no recent history picks the pool's first entry.
{
  const s = visitSpec(resolveVisit('bossEntry', idle), 'bossEntry');
  eq(s.kind, 'guaranteed', 'bossEntry.kind');
  eq(s.flyPose, 'fly', 'bossEntry.flyPose');
  eq(s.perchPose, 'point', 'bossEntry.perchPose');
  eq(s.lineId, 'bossCage', 'bossEntry.lineId');
  eq(s.line, 'I was still in the cage when I learned that one.', 'bossEntry.line');
  eq(s.sfx, 'pollySqwawkShort', 'bossEntry.sfx');
  eq(s.holdPerch, false, 'bossEntry.holdPerch');
  eq(s.perchMs, 4200, 'bossEntry.perchMs');
  eq(s.perchScale, 1.05, 'bossEntry.perchScale');
}

// bossEntry avoids a recently-used line from the pool, same mechanism as
// wrong/streakX10 below — proves the pool is live, not a single fixed line.
{
  const s = visitSpec(
    resolveVisit('bossEntry', { ...idle, recentLineIds: ['bossCage'] }),
    'bossEntry avoids recent',
  );
  if (s.lineId === 'bossCage') throw new Error('bossEntry avoids recent: repeated a recent line');
}

// allMasksFound: only ever fired on the boss final-gate step, once the
// visible tiles clear and the hidden gauntlet is about to begin. She used to
// fly in here to throw the gauntlet cards; that beat was cut (Pete,
// 2026-09-10) because the wall now delivers the bricks itself.
//
// These assertions were rewritten, not deleted. Their point was never "she
// throws" — it was that this event is handled deliberately and cannot drift
// into some other visit. That matters MORE now that the answer is silence,
// because silence is also what an accidental fall-through looks like.
{
  eq(resolveVisit('allMasksFound', idle).action, 'none',
    'allMasksFound is silent (gauntlet throw cut 2026-09-10)');
}

// ...and it stays silent with the heckle budget wide open. This pins it
// against the heckle block below the early return: if a future heckle rule
// ever matched this event, it would turn into a visit here and fail. The
// control first proves the state genuinely lets a heckle through, so the
// silence cannot be the heckle gate quietly blocking it.
//
// What no outcome test can do is tell the explicit early return apart from
// the final fall-through `return NONE` — both are silent. The early return
// is structural protection; this test is what catches it being overridden.
{
  const heckleOpen: PollyBudgetState = {
    ...idle, busy: false, heckleUsedThisWord: false, isSpeedRound: false,
  };
  eq(visitSpec(resolveVisit('wrong', heckleOpen), 'control: wrong, heckle budget open').kind,
    'heckle', 'control: the heckle budget really is open');
  eq(resolveVisit('allMasksFound', heckleOpen).action, 'none',
    'allMasksFound stays silent with the heckle budget open');
}

// gateMastered + gateMasteredBoss: plain fly-in, upright angry yell
// landing, one line, flies away furious (does not hold perch).
{
  const s = visitSpec(resolveVisit('gateMasteredBoss', idle), 'gateMasteredBoss');
  eq(s.flyPose, 'fly', 'gateMasteredBoss.flyPose');
  eq(s.perchPose, 'angryYell', 'gateMasteredBoss.perchPose');
  eq(s.exitPose, 'flyAngry', 'gateMasteredBoss.exitPose');
  eq(s.line, 'Next time, the traps will be different.', 'gateMasteredBoss.line');
  eq(s.sfx, null, 'gateMasteredBoss.sfx');
  eq(s.holdPerch, false, 'gateMasteredBoss.holdPerch');
  eq(s.perchMs, 1600, 'gateMasteredBoss.perchMs');
}
{
  const s = visitSpec(resolveVisit('gateMastered', idle), 'gateMastered');
  eq(s.flyPose, 'fly', 'gateMastered.flyPose');
  eq(s.perchPose, 'angryYell', 'gateMastered.perchPose');
  eq(s.exitPose, 'flyAngry', 'gateMastered.exitPose');
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

// hiddenMasterFailed keeps the boss hidden-failure gloat sound. She flies in
// plain (she cannot know the result yet) and leaves grinning.
{
  const s = visitSpec(resolveVisit('hiddenMasterFailed', idle), 'hiddenMasterFailed');
  eq(s.sfx, 'pollySqwawkLaugh', 'hiddenMasterFailed.sfx');
  eq(s.flyPose, 'fly', 'hiddenMasterFailed.flyPose');
  eq(s.perchPose, 'hauntTaunt', 'hiddenMasterFailed.perchPose');
  eq(s.exitPose, 'flyGrin', 'hiddenMasterFailed.exitPose');
}

// Returning Haunt's first failure beat is silent; the final hauntFailed beat
// owns the one favorite chuckle, and the run continues afterward. Its poses
// must not inherit the boss gloat's fly/exit change through the spread.
{
  const s = visitSpec(resolveVisit('hauntMasterFailed', idle), 'hauntMasterFailed');
  eq(s.sfx, null, 'hauntMasterFailed.sfx');
  eq(s.flyPose, 'hauntTaunt', 'hauntMasterFailed.flyPose');
  eq(s.perchPose, 'hauntTaunt', 'hauntMasterFailed.perchPose');
  eq(s.exitPose, 'fly', 'hauntMasterFailed.exitPose');
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
    ghostRunsMissed: 0, recentLineIds: [], lineRoll: 0,
  };
  eq(resolveVisit('bossEntry', jammed).action, 'visit', 'bossEntry while jammed');
  eq(resolveVisit('allMasksFound', jammed).action, 'none', 'allMasksFound silent while jammed');
  eq(resolveVisit('gameOver', jammed).action, 'visit', 'gameOver while jammed');
  eq(resolveVisit('gateMasteredBoss', jammed).action, 'visit', 'gateMasteredBoss while jammed');
}

// ── cleanSweep tiering ──────────────────────────────────────────
{
  const s = visitSpec(resolveVisit('cleanSweep', idle), 'cleanSweep first');
  eq(s.kind, 'guaranteed', 'cleanSweep first.kind');
  eq(s.perchPose, 'shocked', 'cleanSweep first.perchPose');
  eq(s.line, "Bet you can't do that again.", 'cleanSweep first.line');
  eq(s.sfx, null, 'cleanSweep first.sfx');
  eq(s.holdPerch, false, 'cleanSweep first.holdPerch');
}
{
  const s = visitSpec(resolveVisit('cleanSweep', { ...idle, cleanSweepSeenThisRun: true }), 'cleanSweep repeat');
  eq(s.kind, 'heckle', 'cleanSweep repeat.kind');
  eq(s.perchPose, 'shocked', 'cleanSweep repeat.perchPose');
  eq(s.sfx, null, 'cleanSweep repeat.sfx');
}
eq(resolveVisit('cleanSweep', { ...idle, cleanSweepSeenThisRun: true, heckleUsedThisWord: true }).action, 'none', 'cleanSweep repeat with budget spent');

// ── Heckles ─────────────────────────────────────────────────────
{
  const s = visitSpec(resolveVisit('wrong', idle), 'wrong first');
  eq(s.kind, 'heckle', 'wrong.kind');
  eq(s.perchPose, 'smug', 'wrong.perchPose');
  eq(s.line, 'Thought so.', 'wrong.line');
  eq(s.sfx, null, 'wrong.sfx');
}
eq(resolveVisit('wrong', { ...idle, wrongSeenThisWord: true }).action, 'none', 'second wrong');

const streak = visitSpec(resolveVisit('streakX10', idle), 'streakX10');
eq(streak.perchPose, 'embarrassed', 'streakX10 perches embarrassed');
eq(streak.kind, 'heckle', 'streakX10 is a heckle');

// hesitation6s → point taunt; 3s and 9s are ignored.
{
  const s = visitSpec(resolveVisit('hesitation6s', idle), 'hesitation6s');
  eq(s.perchPose, 'point', 'hesitation6s.perchPose');
  eq(s.lineId, 'huntHesitation', 'hesitation6s.lineId');
  eq(s.line, 'YES... NO... MAYBE SO...', 'hesitation6s.line');
  eq(s.sfx, null, 'hesitation6s.sfx');
}
{
  const s = visitSpec(resolveVisit('hesitation6s', { ...idle, recentLineIds: ['huntHesitation'] }), 'hesitation6s avoids recent');
  eq(s.lineId, 'huntAreYouSure', 'hesitation6s avoids recent.lineId');
}
eq(resolveVisit('hesitation3s', idle).action, 'none', 'hesitation3s ignored');
eq(resolveVisit('hesitation9s', idle).action, 'none', 'hesitation9s ignored');

// ghostEntry → smug "Remember me."
{
  const s = visitSpec(resolveVisit('ghostEntry', idle), 'ghostEntry');
  eq(s.perchPose, 'smug', 'ghostEntry.perchPose');
  eq(s.line, 'Remember me.', 'ghostEntry.line');
}
{
  const s = visitSpec(resolveVisit('ghostEntry', { ...idle, ghostRunsMissed: 2 }), 'ghostEntry repeated');
  eq(s.perchPose, 'point', 'ghostEntry repeated.perchPose');
}

for (const [i, block] of [
  { ...idle, busy: true },
  { ...idle, heckleUsedThisWord: true },
  { ...idle, isSpeedRound: true },
].entries()) {
  eq(resolveVisit('wrong', block).action, 'none', `blocked wrong #${i}`);
  eq(resolveVisit('hesitation6s', block).action, 'none', `blocked hesitation6s #${i}`);
  eq(resolveVisit('ghostEntry', block).action, 'none', `blocked ghostEntry #${i}`);
}

eq(resolveVisit('wordEntry', idle).action, 'wordEntry', 'wordEntry resets budget');
for (const ev of ['correct', 'oneWrongMove', 'hiddenFound', 'hesitationCleared', 'ghostFoundLate', 'ghostDissolved'] as const) {
  eq(resolveVisit(ev, idle).action, 'none', `${ev} ignored`);
}

// ── oneHeartLeft ─────────────────────────────────────────────────
{
  const jammed: PollyBudgetState = {
    busy: true, heckleUsedThisWord: true, wrongSeenThisWord: true,
    cleanSweepSeenThisRun: true, isSpeedRound: true,
    ghostRunsMissed: 0, recentLineIds: [], lineRoll: 0,
  };
  const s = visitSpec(resolveVisit('oneHeartLeft', jammed), 'oneHeartLeft while jammed');
  eq(s.kind, 'guaranteed', 'oneHeartLeft.kind');
  eq(s.sfx, null, 'oneHeartLeft.sfx');
}
{
  const rolls: [number, PollyLineId, 'smug' | 'laugh03'][] = [
    [0.05, 'featherOneLookAtMine', 'smug'],
    [0.25, 'featherOnePlucked', 'laugh03'],
    [0.45, 'featherOneAroundHere', 'smug'],
    [0.65, 'featherOneWait', 'laugh03'],
    [0.85, 'featherOneCheck', 'smug'],
  ];
  for (const [roll, expectedLineId, expectedPose] of rolls) {
    const s = visitSpec(resolveVisit('oneHeartLeft', { ...idle, lineRoll: roll }), `oneHeartLeft roll ${roll}`);
    eq(s.lineId, expectedLineId, `oneHeartLeft roll ${roll}.lineId`);
    eq(s.perchPose, expectedPose, `oneHeartLeft roll ${roll}.perchPose`);
  }
}
{
  const s = visitSpec(resolveVisit('oneHeartLeft', { ...idle, lineRoll: 0, recentLineIds: ['featherOneLookAtMine'] }), 'oneHeartLeft avoids recent');
  if (s.lineId === 'featherOneLookAtMine') throw new Error('oneHeartLeft avoids recent: repeated a recent line');
}

console.log('OK — pollyVisitPolicy: all assertions passed');
