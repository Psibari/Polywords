import assert from 'node:assert/strict';

import {
  resolveClaimHapticCue,
  resolveFXAccessibility,
  resolvePressHapticCue,
  resolveTierUpHapticCue,
  resolveTrapRejectHapticCue,
  resolveScreenFlash,
  resolvePollySquawkOnWrong,
  resolveWrongSwipeSfx,
  shouldPlayRazorStartle,
  WRONG_FALL_WHISTLE_DELAY_MS,
} from './huntFeedbackPolicy';

assert.deepEqual(
  resolveWrongSwipeSfx(),
  { first: 'wrongSlap', fall: 'wrongImpact', fallDelayMs: 125 },
  'every wrong swipe, broken chain or not, plays the slap at judgement and the whistle 125 ms later as the card falls',
);
assert.equal(
  WRONG_FALL_WHISTLE_DELAY_MS,
  125,
  'the whistle waits for the card buzz (70 ms + 55 ms) so it starts with the fall',
);

assert.equal(
  resolveScreenFlash('routineReal'),
  null,
  'an ordinary REAL claim keeps feedback local instead of flashing the screen',
);
assert.equal(
  resolveScreenFlash('routineTrap'),
  null,
  'an ordinary trap rejection keeps feedback local instead of flashing the screen',
);
assert.deepEqual(
  resolveScreenFlash('gauntletCorrect'),
  { tier: 'gauntlet', color: '#F5C842', peakOpacity: 0.16, attackMs: 50, decayMs: 170 },
  'a correct gauntlet tile gets a restrained gold confirmation',
);
assert.deepEqual(
  resolveScreenFlash('mastery'),
  { tier: 'mastery', color: '#F5C842', peakOpacity: 0.38, attackMs: 65, decayMs: 260 },
  'mastery owns the strongest full-screen success flash',
);

assert.deepEqual(
  resolveFXAccessibility(null, false),
  { mode: 'static', showImpactGlow: false },
  'an unresolved motion preference fails safe to static feedback',
);
assert.deepEqual(
  resolveFXAccessibility(true, false),
  { mode: 'static', showImpactGlow: false },
  'Reduce Motion replaces traveling particles with a fixed-position acknowledgement',
);
assert.deepEqual(
  resolveFXAccessibility(false, false),
  { mode: 'animated', showImpactGlow: true },
  'standard preferences keep animated particles and their impact glow',
);
assert.deepEqual(
  resolveFXAccessibility(false, true),
  { mode: 'animated', showImpactGlow: false },
  'Reduce Flashes suppresses the high-intensity impact glow without removing motion feedback',
);

console.log('huntFeedbackPolicy tests passed');

assert.deepEqual(
  (['light', 'medium', 'heavy', undefined] as const).map(resolveClaimHapticCue),
  ['huntStandardCorrect', 'huntClaimMedium', 'huntHeightenedCorrect', 'huntHeightenedCorrect'],
  'claims climb across the three phase tiers; an unset tier keeps the old strongest claim cue',
);
assert.deepEqual(
  (['light', 'medium', 'heavy', undefined] as const).map(resolveTrapRejectHapticCue),
  ['trapRejectLight', 'trapRejectMedium', 'trapRejectHeavy', 'trapRejectHeavy'],
  'trap rejections climb across the three phase tiers',
);
for (const tier of ['light', 'medium', 'heavy'] as const) {
  assert.notEqual(
    resolveClaimHapticCue(tier),
    resolveTrapRejectHapticCue(tier),
    'a claim and a rejection never share a cue at the same tier',
  );
}
assert.deepEqual(
  [1, 2, 3].map(resolveTierUpHapticCue),
  ['tierUp', 'tierUpRazor', 'tierUpUntrappable'],
  'each momentum level-up has its own haptic shape',
);
assert.deepEqual(
  (['steady', 'sharp', 'razorSharp', 'untrappable', 'hunted'] as const).map(resolvePressHapticCue),
  ['huntPressSteady', 'pressSharp', 'pressRazor', 'pressUntrappable', 'pressHunted'],
  'the touch-down cue follows the same momentum as the card glow',
);

// Polly's squawk: always when a real chain fell off, every third other wrong swipe.
{
  let count = 0;
  const heard: boolean[] = [];
  for (let i = 0; i < 9; i++) {
    const r = resolvePollySquawkOnWrong(false, count);
    count = r.otherWrongCountAfter;
    heard.push(r.squawk);
  }
  assert.deepEqual(
    heard,
    [false, false, true, false, false, true, false, false, true],
    'other wrong swipes squawk on every third',
  );
  const fell = resolvePollySquawkOnWrong(true, 1);
  assert.equal(fell.squawk, true, 'a FELL OFF break always squawks');
  assert.equal(fell.otherWrongCountAfter, 1, 'a FELL OFF break does not advance the other-swipe count');
  assert.equal(resolvePollySquawkOnWrong(false, 2).squawk, true, 'the count survives a FELL OFF in between');
}

// RAZOR SHARP startle: once per run, only on a climb that lands on rank 2.
{
  const base = { isRank: 2, wasRank: 1, runSeed: 'run-a', lastStartleRunSeed: null as string | null, muted: false };
  assert.equal(shouldPlayRazorStartle(base), true, 'first climb to RAZOR SHARP in a run startles her');
  assert.equal(shouldPlayRazorStartle({ ...base, wasRank: 0 }), true, 'a climb from STEADY straight to RAZOR SHARP still startles');
  assert.equal(shouldPlayRazorStartle({ ...base, lastStartleRunSeed: 'run-a' }), false, 'same run: no second startle');
  assert.equal(shouldPlayRazorStartle({ ...base, lastStartleRunSeed: 'run-b' }), true, 'a new run startles again');
  assert.equal(shouldPlayRazorStartle({ ...base, muted: true }), false, 'muted (lesson, pause, exit confirm, onboarding) is silent');
  assert.equal(shouldPlayRazorStartle({ ...base, isRank: 1, wasRank: 0 }), false, 'SHARP does not startle');
  assert.equal(shouldPlayRazorStartle({ ...base, isRank: 3, wasRank: 2 }), false, 'UNTRAPPABLE does not startle');
  assert.equal(shouldPlayRazorStartle({ ...base, isRank: 2, wasRank: 3 }), false, 'dropping to RAZOR SHARP does not startle');
  assert.equal(shouldPlayRazorStartle({ ...base, isRank: 2, wasRank: 2 }), false, 'no change does not startle');
}
