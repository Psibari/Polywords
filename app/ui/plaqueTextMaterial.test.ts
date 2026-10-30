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
assert.equal(carved.face, stone.face, 'carved stone keeps the one Haunted ink');
assert.notEqual(carved.depth, stone.depth, 'carved stone draws a light edge, not the dark smear');
assert.deepEqual(carved.edgeOffset, { width: 0, height: 1.8 });
assert.equal(carved.edgeRadius, 0.5);
assert.equal(stone.edgeOffset, undefined, 'the existing stone material keeps its default shadow');

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
