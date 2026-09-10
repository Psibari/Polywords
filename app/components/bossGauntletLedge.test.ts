import assert from 'node:assert/strict';

import {
  BRICK_RECESSES,
  LEDGE_ART_Y,
  LEDGE_OFFSET_RATIO,
  RECESS_OVERLAYS,
  SHELF_FACE_ART_BOTTOM,
  SHELF_FACE_ART_TOP,
  SHELF_LIP_ART_H,
  SHELF_LIP_ART_TOP,
  WALL_ART_H,
  WALL_ART_W,
  resolveLedgeOffset,
  wallArtScale,
} from './bossGauntletLedge';

const expectedRatio = (1844 - 1350) / 853;
assert.ok(
  Math.abs(LEDGE_OFFSET_RATIO - expectedRatio) < 1e-9,
  'LEDGE_OFFSET_RATIO must come from the measured wall-art ledge pixel (y=1350 of 1844, at 853px wide)',
);
assert.equal(WALL_ART_W, 853, 'wall art width is the one source the ratio derives from');
assert.equal(WALL_ART_H, 1844, 'wall art height is the one source the ratio derives from');
assert.equal(LEDGE_ART_Y, 1350, 'ledge line is the one source the ratio derives from');

assert.equal(resolveLedgeOffset(0), 0, 'zero width offsets to zero');
assert.ok(
  Math.abs(resolveLedgeOffset(853) - (1844 - 1350)) < 0.1,
  'at the wall art\'s own native width, the offset equals the raw measured pixel gap',
);
assert.ok(
  Math.abs(resolveLedgeOffset(393) - 393 * LEDGE_OFFSET_RATIO) < 1e-9,
  'the offset always scales linearly with window width',
);

// wallArtScale is the single art-space -> screen-points conversion, so it
// must be exactly linear through the origin and hit 1 at the art's own width.
assert.equal(wallArtScale(0), 0, 'zero width scales to zero');
assert.equal(wallArtScale(WALL_ART_W), 1, 'at native art width the scale is 1:1');
for (const width of [320, 393, 430, 1024]) {
  assert.ok(
    Math.abs(wallArtScale(width) - width / WALL_ART_W) < 1e-12,
    `wallArtScale(${width}) must be width / WALL_ART_W`,
  );
  assert.ok(
    Math.abs(wallArtScale(width * 2) - wallArtScale(width) * 2) < 1e-12,
    'wallArtScale must be linear — doubling the width doubles the scale',
  );
}

// The lip is cut from the wall art itself: its top row sits above the ledge
// line and its bottom row is the wall's own bottom row.
assert.ok(SHELF_LIP_ART_TOP < LEDGE_ART_Y, 'the lip starts above the ledge\'s lit edge');
assert.equal(
  SHELF_LIP_ART_TOP + SHELF_LIP_ART_H,
  WALL_ART_H,
  'the lip runs to the bottom row of the wall art',
);

// The label's home. It has to be a real band of stone on the lip's front
// face: below the ledge's lit edge, and comfortably inside the lip art.
assert.ok(
  SHELF_FACE_ART_TOP > LEDGE_ART_Y,
  'the shelf face starts below the ledge\'s lit edge',
);
assert.ok(
  SHELF_FACE_ART_TOP > SHELF_LIP_ART_TOP &&
    SHELF_FACE_ART_BOTTOM < SHELF_LIP_ART_TOP + SHELF_LIP_ART_H,
  'the shelf face must lie inside the lip art that paints it',
);
assert.ok(
  SHELF_FACE_ART_BOTTOM - SHELF_FACE_ART_TOP >= 40,
  'the shelf face must be tall enough to carry the label at any screen width',
);

assert.equal(BRICK_RECESSES.length, 3, 'the gauntlet has exactly three brick recesses');
BRICK_RECESSES.forEach((recess, index) => {
  const w = recess.x1 - recess.x0;
  const h = recess.y1 - recess.y0;
  assert.ok(w > 0 && h > 0, `recess ${index} must have positive extent`);
  // The brick lies on its side in the wall and the entrance rotates it
  // upright — a recess taller than it is wide would mean the brick is
  // already standing, and the punch-out rotation would be wrong.
  assert.ok(w > h, `recess ${index} must be wider than it is tall — the brick lies on its side`);
  assert.ok(
    recess.x0 >= 0 && recess.x1 <= WALL_ART_W,
    `recess ${index} must sit inside the wall art horizontally`,
  );
  assert.ok(
    recess.y0 >= 0 && recess.y1 <= LEDGE_ART_Y,
    `recess ${index} must sit above the ledge line`,
  );
});

// The painted hole must always fully cover the geometric one it belongs to.
// The two are separate numbers by design (the overlay carries a bleed), so
// nothing but this test stops an edit to one from drifting off the other and
// leaving a visible seam at the brick's edge.
assert.equal(
  RECESS_OVERLAYS.length,
  BRICK_RECESSES.length,
  'every brick recess must have exactly one overlay, and vice versa',
);
RECESS_OVERLAYS.forEach((overlay, index) => {
  const recess = BRICK_RECESSES[index];
  assert.ok(
    overlay.x <= recess.x0,
    `overlay ${index} must start at or left of its recess (${overlay.x} > ${recess.x0})`,
  );
  assert.ok(
    overlay.y <= recess.y0,
    `overlay ${index} must start at or above its recess (${overlay.y} > ${recess.y0})`,
  );
  assert.ok(
    overlay.x + overlay.w >= recess.x1,
    `overlay ${index} must end at or right of its recess (${overlay.x + overlay.w} < ${recess.x1})`,
  );
  assert.ok(
    overlay.y + overlay.h >= recess.y1,
    `overlay ${index} must end at or below its recess (${overlay.y + overlay.h} < ${recess.y1})`,
  );
  // And it still has to be a piece of this wall, drawn above the ledge.
  assert.ok(
    overlay.x >= 0 && overlay.x + overlay.w <= WALL_ART_W,
    `overlay ${index} must sit inside the wall art horizontally`,
  );
  assert.ok(
    overlay.y >= 0 && overlay.y + overlay.h <= LEDGE_ART_Y,
    `overlay ${index} must sit above the ledge line`,
  );
});

console.log('bossGauntletLedge tests passed');
