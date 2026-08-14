import assert from 'node:assert/strict';

import {
  HUNT_BOOK_V2_GEOMETRY as G,
  HUNT_BOOK_V2_STATES,
  HUNT_BOOK_V2_TEXT_SCALES,
  HUNT_BOOK_V2_WORDS,
} from './huntBookV2PrototypeGeometry';

// Historical SVG width was 360 with cover edges at x=10 and x=350. V2 is
// allowed to grow vertically only; these assertions guard against accidental
// yaw/widening or a future "just stretch it" regression.
assert.equal(G.viewBoxWidth, 360);
assert.equal(G.coverLeft, 10);
assert.equal(G.coverRight, 350);
assert.equal(G.viewBoxHeight, 286);
assert.ok(G.coverBottom > 158, 'V2 cover must be visibly longer than the historical 158px bottom');

// Every stationary page/ribbon coordinate must remain inside the SVG bounds.
assert.ok(G.lowerCoverTop >= 0);
assert.ok(G.lowerCoverBottom <= G.viewBoxHeight);
assert.ok(G.pageBlockTop >= 0);
assert.ok(G.pageBlockBottom <= G.viewBoxHeight);
assert.ok(G.ribbonTop >= 0);
assert.ok(G.ribbonLeft >= 0 && G.ribbonLeft <= G.viewBoxWidth);
assert.ok(G.ribbonRight >= 0 && G.ribbonRight <= G.viewBoxWidth);
assert.ok(G.ribbonTailY <= G.viewBoxHeight);
assert.ok(G.ribbonNotchY < G.ribbonTailY, 'forked ribbon must have a visible V-cut notch');
assert.ok(G.ribbonLeft < G.ribbonRight);

// The Work-session stress case must stay present, along with all three book
// positions and the compact/default/large text-scale sweep.
assert.ok(HUNT_BOOK_V2_WORDS.includes('CONCENTRATION'));
assert.deepEqual(HUNT_BOOK_V2_STATES.map(state => state.key), ['closed', 'partial', 'intake']);
assert.deepEqual(HUNT_BOOK_V2_TEXT_SCALES, [0.84, 1, 1.14]);

console.log('huntBookV2PrototypeGeometry tests passed');
