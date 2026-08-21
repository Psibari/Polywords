import assert from 'node:assert/strict';

import { createBossGauntletPressProps } from './bossGauntletPress';

const picks: number[] = [];
const enabled = createBossGauntletPressProps(2, false, index => picks.push(index));

assert.equal(
  'onPressIn' in enabled,
  false,
  'finger-down is anticipation only and has no commitment callback',
);
assert.equal(picks.length, 0, 'creating or touching the press contract does not pick a card');
enabled.onPress?.({} as never);
assert.deepEqual(picks, [2], 'a completed press release picks exactly the selected card');

const disabled = createBossGauntletPressProps(1, true, index => picks.push(index));
assert.equal(disabled.disabled, true, 'an inert card is disabled at the Pressable boundary');
assert.equal(disabled.onPress, undefined, 'an inert card has no commit callback');

console.log('bossGauntletPress tests passed');
