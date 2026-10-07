import assert from 'node:assert/strict';
import {
  FACE_RIG_BREATHE_MS_MAX,
  FACE_RIG_BREATHE_MS_MIN,
  FACE_RIG_EYE_REST_MAX,
  FACE_RIG_EYE_REST_MIN,
  FACE_RIG_PRESETS,
  FACE_RIG_SHAKE_STEPS,
  FACE_RIG_SPRITE_POP_MS,
  FACE_RIG_SPRITE_POP_SCALE,
  FACE_RIG_SPRITE_STATES,
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
assert.equal(byId.rattled.eyeWide, true, 'RATTLED has the wide eye');
assert.equal(byId.rattled.brow, 'shock', 'RATTLED has the shock brow');
assert.equal(byId.rattled.shake, true, 'RATTLED shakes');
assert.equal(FACE_RIG_PRESETS.filter(p => p.shake).length, 1, 'only RATTLED shakes');
assert.ok(byId.rattled.breatheMs < byId.amused.breatheMs, 'RATTLED breathes faster than AMUSED');
assert.equal(byId.conceding.sprite, 'smirk', 'CONCEDING uses the approved smirk sprite');
assert.equal(FACE_RIG_PRESETS.filter(p => p.sprite).length, 1, 'only CONCEDING is sprite-driven');
assert.equal(FACE_RIG_SHAKE_STEPS[FACE_RIG_SHAKE_STEPS.length - 1], 0, 'shake must end at rest');

// Full-sprite states: the ones the rig layers cannot make.
assert.deepEqual(
  FACE_RIG_SPRITE_STATES.map(s => s.id),
  ['angry', 'laugh', 'bigLaugh', 'shocked', 'sulk', 'embarrassed'],
  'full-sprite states must be the six acting looks the rig cannot make',
);
assert.equal(new Set(FACE_RIG_SPRITE_STATES.map(s => s.label)).size, FACE_RIG_SPRITE_STATES.length, 'labels unique');
assert.ok(FACE_RIG_SPRITE_POP_SCALE > 1 && FACE_RIG_SPRITE_POP_SCALE < 1.2, 'pop stays a small beat');
assert.ok(FACE_RIG_SPRITE_POP_MS >= 80 && FACE_RIG_SPRITE_POP_MS <= 300, 'pop stays under 300 ms');

// Full-sprite states: the approved acting sprites that stand in where the old rig cannot act.
assert.deepEqual(
  FACE_RIG_SPRITE_STATES.map(st => st.id),
  ['angry', 'laugh', 'bigLaugh', 'shocked', 'sulk', 'embarrassed'],
  'sprite states must cover angry, laugh, big laugh, shocked, sulk, embarrassed',
);
assert.equal(new Set(FACE_RIG_SPRITE_STATES.map(st => st.label)).size, FACE_RIG_SPRITE_STATES.length, 'sprite labels unique');

console.log('Polly face rig presets contract passed');
