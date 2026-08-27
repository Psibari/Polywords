import assert from 'node:assert/strict';

import { LEDGE_OFFSET_RATIO, resolveLedgeOffset } from './bossGauntletLedge';

const expectedRatio = (1844 - 1350) / 853;
assert.ok(
  Math.abs(LEDGE_OFFSET_RATIO - expectedRatio) < 1e-9,
  'LEDGE_OFFSET_RATIO must come from the measured StoneWall.png ledge pixel (y=1350 of 1844, at 853px wide)',
);

assert.equal(resolveLedgeOffset(0), 0, 'zero width offsets to zero');
assert.ok(
  Math.abs(resolveLedgeOffset(853) - (1844 - 1350)) < 0.1,
  'at the wall art\'s own native width, the offset equals the raw measured pixel gap',
);
assert.ok(
  Math.abs(resolveLedgeOffset(393) - 393 * LEDGE_OFFSET_RATIO) < 1e-9,
  'the offset always scales linearly with window width',
);

console.log('bossGauntletLedge tests passed');
