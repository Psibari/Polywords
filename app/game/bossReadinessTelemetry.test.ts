import assert from 'node:assert/strict';

import {
  createBossReadinessState,
  markBossEntered,
  markBossPlayable,
} from './bossReadinessTelemetry';

let state = createBossReadinessState();
let entered = markBossEntered(state, 7, 1_000);
state = entered.state;
assert.equal(entered.shouldRecord, true, 'the first render of a boss step records boss_entered');

entered = markBossEntered(state, 7, 1_200);
state = entered.state;
assert.equal(entered.shouldRecord, false, 'rerenders do not duplicate boss_entered');

let playable = markBossPlayable(state, 6, 2_000);
assert.equal(playable.transitionMs, null, 'a stale board cannot finish a different boss step');

playable = markBossPlayable(state, 7, 3_080);
state = playable.state;
assert.equal(playable.transitionMs, 2_080, 'boss_playable measures the real entry-to-input-ready interval');

playable = markBossPlayable(state, 7, 3_200);
assert.equal(playable.transitionMs, null, 'duplicate decision-ready callbacks do not duplicate boss_playable');

entered = markBossEntered(state, 9, 5_000);
state = entered.state;
assert.equal(entered.shouldRecord, true, 'a later boss step starts a fresh readiness measurement');
playable = markBossPlayable(state, 9, 4_900);
assert.equal(playable.transitionMs, 0, 'clock skew cannot produce a negative readiness duration');

console.log('bossReadinessTelemetry tests passed');
