import assert from 'node:assert/strict';
import {
  FACE_RIG_BREATHE_MS_MAX,
  FACE_RIG_BREATHE_MS_MIN,
  FACE_RIG_EYE_REST_MAX,
  FACE_RIG_EYE_REST_MIN,
  FACE_RIG_PRESETS,
  FACE_RIG_SHAKE_STEPS,
} from './pollyFaceRigPresets';

const byId = Object.fromEntries(FACE_RIG_PRESETS.map(p => [p.id, p]));

// The five rivalry-ledger states, in ledger order.
assert.deepEqual(
  FACE_RIG_PRESETS.map(p => p.id),
  ['dismissive', 'amused', 'watchful', 'rattled', 'conceding'],
  'presets must be the five ledger states in order',
);
assert.deepEqual(
  FACE_RIG_PRESETS.map(p => p.label),
  ['DISMISSIVE', 'AMUSED', 'WATCHFUL', 'RATTLED', 'CONCEDING'],
);

for (const p of FACE_RIG_PRESETS) {
  assert.ok(p.eyeRest >= FACE_RIG_EYE_REST_MIN && p.eyeRest <= FACE_RIG_EYE_REST_MAX, `${p.id} eyeRest in range`);
  assert.ok(p.breatheMs >= FACE_RIG_BREATHE_MS_MIN && p.breatheMs <= FACE_RIG_BREATHE_MS_MAX, `${p.id} breatheMs in range`);
  assert.ok(['closed', 'open', 'gape'].includes(p.mouth), `${p.id} mouth valid`);
  assert.ok(['normal', 'angry', 'shock', 'slack'].includes(p.brow), `${p.id} brow valid`);
  assert.ok(p.intent.length > 10, `${p.id} documents its intent`);
}

// Design invariants: the registers must stay distinguishable.
assert.equal(byId.amused.eyeRest, 1, 'AMUSED is the art as drawn');
assert.ok(byId.dismissive.eyeRest < byId.watchful.eyeRest, 'DISMISSIVE lid is heavier than WATCHFUL');
assert.ok(byId.conceding.eyeRest < byId.dismissive.eyeRest, 'CONCEDING lid is the heaviest');
assert.equal(byId.rattled.eyeWide, true, 'RATTLED has the wide eye');
assert.equal(byId.rattled.brow, 'shock', 'RATTLED has the shock brow');
assert.equal(byId.rattled.shake, true, 'RATTLED shakes');
assert.equal(FACE_RIG_PRESETS.filter(p => p.shake).length, 1, 'only RATTLED shakes');
assert.equal(byId.conceding.brow, 'slack', 'CONCEDING has the slack brow');
assert.ok(byId.rattled.breatheMs < byId.amused.breatheMs, 'RATTLED breathes faster than AMUSED');
assert.ok(byId.conceding.breatheMs > byId.amused.breatheMs, 'CONCEDING breathes slower than AMUSED');
assert.equal(FACE_RIG_SHAKE_STEPS[FACE_RIG_SHAKE_STEPS.length - 1], 0, 'shake must end at rest');

console.log('Polly face rig presets contract passed');
