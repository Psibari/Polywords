import assert from 'node:assert/strict';

import {
  PLAQUE_TEXT_MATERIALS,
  resolveBusterTransformFrame,
  resolvePlaqueImagePhase,
} from './plaqueTextMaterial';

const gold = PLAQUE_TEXT_MATERIALS.goldPlaque;
assert.equal(gold.face, '#6C22A8');
assert.equal(gold.depth, '#2A0A46');
assert.equal(gold.highlight, '#C77BFF');

const purple = PLAQUE_TEXT_MATERIALS.purplePlaque;
assert.equal(purple.face, '#F5C842');
assert.equal(purple.depth, '#8A5400');
assert.equal(purple.highlight, '#FFF1A6');

const stone = PLAQUE_TEXT_MATERIALS.stonePlaque;
assert.equal(stone.face, '#1A1830');
assert.equal(stone.depth, '#080711');
assert.equal(stone.highlight, '#655F87');

const carved = PLAQUE_TEXT_MATERIALS.carvedStonePlaque;
assert.equal(carved.face, '#3E3A55', 'carved stone word matches the ink of the carved headline in the art');
assert.notEqual(carved.face, stone.face, 'carved stone no longer uses the near-black stone ink');
assert.notEqual(carved.depth, stone.depth, 'carved stone draws a light edge, not the dark smear');
assert.deepEqual(carved.edgeOffset, { width: 0, height: 1.8 });
assert.equal(carved.edgeRadius, 0.5);
assert.equal(stone.edgeOffset, undefined, 'the existing stone material keeps its default shadow');

const carvedGold = PLAQUE_TEXT_MATERIALS.carvedGoldPlaque;
assert.equal(carvedGold.face, '#4A1E80');
assert.notEqual(carvedGold.depth, gold.depth, 'carved gold draws a light edge, not the dark smear');
assert.deepEqual(carvedGold.edgeOffset, { width: 0, height: 1.8 });
assert.equal(carvedGold.edgeRadius, 0.5);
assert.equal(gold.edgeOffset, undefined, 'the existing gold material keeps its default shadow');
assert.equal(purple.edgeOffset, undefined, 'purplePlaque (now unused) keeps its default shadow');

const raisedGold = PLAQUE_TEXT_MATERIALS.raisedGoldPlaque;
assert.equal(raisedGold.face, '#F5C842');
assert.equal(raisedGold.depth, 'rgba(42, 12, 64, 0.85)');
assert.equal(raisedGold.highlight, '#FFF1A6');
assert.equal(raisedGold.shadow, 'rgba(20, 4, 35, 0.72)');
assert.deepEqual(raisedGold.edgeOffset, { width: 0.6, height: 0.9 });
assert.equal(raisedGold.edgeRadius, 0.8);
assert.ok((raisedGold.edgeRadius ?? 0) > 0, 'Android drops a text shadow whose radius is 0');
assert.notEqual(raisedGold.depth, purple.depth, 'BUSTER no longer uses the amber drop shadow');

assert.deepEqual(resolveBusterTransformFrame('master'), {
  visibleWord: 'MASTER',
  animatedPrefix: null,
  keptSuffix: null,
});
assert.deepEqual(resolveBusterTransformFrame('swap'), {
  visibleWord: null,
  animatedPrefix: 'BU',
  keptSuffix: 'STER',
});
assert.deepEqual(resolveBusterTransformFrame('final'), {
  visibleWord: 'BUSTER',
  animatedPrefix: null,
  keptSuffix: null,
});

assert.equal(resolvePlaqueImagePhase('master'), 'master');
assert.equal(resolvePlaqueImagePhase('swap'), 'final');
assert.equal(resolvePlaqueImagePhase('final'), 'final');

console.log('plaqueTextMaterial tests passed');
