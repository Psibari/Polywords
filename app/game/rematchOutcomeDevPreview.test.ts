import assert from 'node:assert/strict';

import { buildRematchOutcomeDevPreview } from './rematchOutcomeDevPreview';

const king = buildRematchOutcomeDevPreview('king');
assert.equal(king.persistRun, false);
assert.equal(king.outcome, 'king');
assert.equal(king.word, 'FOAM');
assert.equal(king.productionOutcome, 'mastered');
assert.equal(king.resultLabel, 'KING');
assert.equal(king.startBookVariant, 'mastered');
assert.equal(king.finalBookVariant, 'mastered');

const buster = buildRematchOutcomeDevPreview('buster');
assert.equal(buster.persistRun, false);
assert.equal(buster.outcome, 'buster');
assert.equal(buster.word, 'FOAM');
assert.equal(buster.productionOutcome, 'buster');
assert.equal(buster.resultLabel, 'BUSTER');
assert.equal(buster.startBookVariant, 'mastered');
assert.equal(buster.finalBookVariant, 'neutral');

console.log('rematchOutcomeDevPreview tests passed');
