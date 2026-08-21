import assert from 'node:assert/strict';

import {
  resolveFXAccessibility,
  resolveScreenFlash,
} from './huntFeedbackPolicy';

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
