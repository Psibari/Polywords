import assert from 'node:assert/strict';

import { buildRematchOutcomeDevPreview } from './rematchOutcomeDevPreview';

const king = buildRematchOutcomeDevPreview('king');
assert.equal(king.persistRun, false);
assert.equal(king.outcome, 'king');
assert.equal(king.word, 'REMATCH');
assert.equal(king.productionOutcome, 'mastered');
assert.equal(king.resultLabel, 'KING');
assert.equal(king.showMasteredBook, true);

const buster = buildRematchOutcomeDevPreview('buster');
assert.equal(buster.persistRun, false);
assert.equal(buster.outcome, 'buster');
assert.equal(buster.word, 'REMATCH');
assert.equal(buster.productionOutcome, 'haunted');
assert.equal(buster.resultLabel, 'BUSTER');
assert.equal(buster.showMasteredBook, false);

console.log('rematchOutcomeDevPreview tests passed');
