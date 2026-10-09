import assert from 'node:assert/strict';

import { buildResultsDevPreview } from './resultsDevPreview';
import { resolveHuntResultLabel } from './huntControl';

const king = buildResultsDevPreview('king');
assert.equal(king.persistRun, false, 'KING preview must never persist a run');
assert.equal(king.bossMastered, true);
assert.equal(king.bossRematchWon, true);
assert.equal(king.bossRematchLost, false);
assert.equal(king.wordResults.length, 1);
assert.equal(king.wordResults[0].isBossWord, true);
assert.equal(
  resolveHuntResultLabel({
    status: 'complete',
    bossMastered: king.bossMastered,
    haunted: king.haunted,
    bossRematchLost: king.bossRematchLost,
    bossRematchWon: king.bossRematchWon,
  }),
  'KING',
);

const buster = buildResultsDevPreview('buster');
assert.equal(buster.persistRun, false, 'BUSTER preview must never persist a run');
assert.equal(buster.bossMastered, false);
assert.equal(buster.bossRematchWon, false);
assert.equal(buster.bossRematchLost, true);
assert.equal(buster.wordResults.length, 1);
assert.equal(buster.wordResults[0].isBossWord, true);
assert.equal(
  resolveHuntResultLabel({
    status: 'complete',
    bossMastered: buster.bossMastered,
    haunted: buster.haunted,
    bossRematchLost: buster.bossRematchLost,
    bossRematchWon: buster.bossRematchWon,
  }),
  'BUSTER',
);

console.log('resultsDevPreview tests passed');
