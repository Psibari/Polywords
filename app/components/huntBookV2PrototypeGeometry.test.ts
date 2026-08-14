import assert from 'node:assert/strict';

import {
  HUNT_BOOK_V2_GEOMETRY as G,
  HUNT_BOOK_V2_STATES,
  HUNT_BOOK_V2_TEXT_SCALES,
  HUNT_BOOK_V2_WORDS,
} from './huntBookV2PrototypeGeometry';

// Exact historical SVG HeroBook baseline. These values intentionally match the
// pre-rig book so the dev viewer cannot quietly drift while we use it as the
// visual reference for future cover texture/proportion work.
assert.equal(G.viewBoxWidth, 360);
assert.equal(G.viewBoxHeight, 210);
assert.equal(G.coverLeft, 10);
assert.equal(G.coverRight, 350);
assert.equal(G.coverTop, 14);
assert.equal(G.coverBottom, 158);
assert.equal(G.coverHeight, 162);
assert.equal(G.lowerCoverTop, 150);
assert.equal(G.lowerCoverBottom, 204);
assert.equal(G.pageBlockTop, 158);
assert.equal(G.pageBlockBottom, 196);

assert.ok(HUNT_BOOK_V2_WORDS.includes('CONCENTRATION'));
assert.deepEqual(HUNT_BOOK_V2_STATES.map(state => state.key), ['closed', 'partial', 'intake']);
assert.deepEqual(HUNT_BOOK_V2_TEXT_SCALES, [0.84, 1, 1.14]);

console.log('huntBookV2PrototypeGeometry tests passed');
