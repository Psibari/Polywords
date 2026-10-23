import assert from 'node:assert/strict';
import { POLYBOOK_CAGE_ART, polybookCageRect } from './polybookCage';

// On the 750-wide phone the cage was mocked on (header bottom at 112): ring at (630, 125), image 361 wide.
const r = polybookCageRect(750, 112);
assert.ok(Math.abs(r.width - 361) < 1);
assert.ok(Math.abs(r.left + POLYBOOK_CAGE_ART.ring.x * (r.width / POLYBOOK_CAGE_ART.w) - 630) < 1e-6, 'ring at 84% across');
assert.ok(Math.abs(r.top + POLYBOOK_CAGE_ART.ring.y * (r.width / POLYBOOK_CAGE_ART.w) - 125) < 1e-6, 'ring 13 below the header');
assert.ok(Math.abs(r.height / r.width - POLYBOOK_CAGE_ART.h / POLYBOOK_CAGE_ART.w) < 1e-9, 'art aspect kept');

// The cage body (art x 139..730, y 325..976) stays on screen and above the book (top at 320 / 750 of the width).
for (const w of [320, 375, 390, 430, 768]) {
  const header = (112 / 750) * w;
  const c = polybookCageRect(w, header);
  const s = c.width / POLYBOOK_CAGE_ART.w;
  const bodyRight = c.left + 730 * s;
  const bodyLeft = c.left + 139 * s;
  const bodyBottom = c.top + 976 * s;
  assert.ok(bodyLeft > 0 && bodyRight < w, `cage body on screen at width ${w}`);
  assert.ok(bodyBottom < (320 / 750) * w, `cage body above the book at width ${w}`);
}
console.log('polybookCage tests passed');
