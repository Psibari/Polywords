import assert from 'node:assert/strict';
import { POLYBOOK_CAGE, POLYBOOK_CAGE_ART, polybookCageLayout } from './polybookCage';

const near = (a: number, b: number, tol: number, msg: string) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, wanted ${b}`);

// Pete's mockup is 1290 wide: the ring at (233, 305), the cage art 448 wide, the rope art 720 wide.
{
  const L = polybookCageLayout(1290, 2796, 2200);
  near(L.hang.left + L.hang.originX, 233, 1e-6, 'ring x');
  near(L.hang.top + L.hang.originY, 305, 1e-6, 'ring y');
  near(L.hang.width, 448, 1e-6, 'cage width');
  near(L.rope.width, 720, 1e-6, 'rope width');
  near(L.rope.height, 330, 1e-6, 'rope keeps its aspect');
  assert.equal(L.rope.left, 0);
  assert.equal(L.rope.top, 0);
}

// The approved floor mock is 750 x 1624 with the book area ending at 1390: the base 250 wide at left 12, top 1411;
// the dome at left 520, top 1396. Both lie below the book area.
{
  const L = polybookCageLayout(750, 1624, 1390);
  near(L.base.width, 250, 1e-6, 'base width');
  near(L.base.left, 12, 1e-6, 'base left');
  near(L.base.top, 1411, 1e-6, 'base top');
  near(L.dome.left, 520, 1e-6, 'dome left');
  near(L.dome.top, 1396, 1e-6, 'dome top');
  near(L.dome.width, 486 * (165 / 394), 1e-6, 'dome width');
  near(L.dome.height / L.dome.width, POLYBOOK_CAGE_ART.dome.h / POLYBOOK_CAGE_ART.dome.w, 1e-9, 'dome aspect');
  assert.ok(L.base.top > 1390 && L.dome.top > 1390, 'pieces under the book area');
  // The HOME button sits centred between them (it is about 270..480 wide on this phone).
  assert.ok(L.base.left + L.base.width < 270 && L.dome.left > 480, 'HOME stays between the pieces');
}

// On every phone: everything is on screen, the cage falls downward and lands on the base's bottom edge, and the
// pieces never overlap each other. Phones with a bottom inset keep the pieces below the book area.
for (const [w, h, inset] of [[320, 568, 0], [375, 667, 0], [375, 812, 34], [390, 844, 34], [430, 932, 34], [768, 1024, 0]] as const) {
  const contentBottom = h - inset - 86;
  const L = polybookCageLayout(w, h, contentBottom);
  assert.ok(L.rope.left === 0 && L.rope.width <= w, `rope on screen at ${w}`);
  assert.ok(L.hang.left > 0 && L.hang.left + L.hang.width < w, `hanging cage on screen at ${w}`);
  assert.ok(L.hang.top > 0, `cage starts below the top edge at ${w}`);
  assert.ok(L.fallDistance > 0, `cage falls downward at ${w}`);
  near(L.hang.top + L.hang.height + L.fallDistance, L.base.top + L.base.height, 1e-6, `lands on the base at ${w}`);
  assert.ok(L.base.top + L.base.height <= h && L.dome.top + L.dome.height <= h, `pieces on screen at ${w}`);
  assert.ok(L.base.left >= 0 && L.base.left + L.base.width < L.dome.left, `base left of the dome at ${w}`);
  assert.ok(L.dome.left + L.dome.width <= w, `dome on screen at ${w}`);
  // (The widest phone lets the tipped dome reach up a few points, 1% of the width at most, to stay on screen.)
  if (inset > 0) assert.ok(L.base.top >= contentBottom - 0.01 * w && L.dome.top >= contentBottom - 0.01 * w, `pieces under the book area at ${w}`);
}

// The timing runs in order: jolt, then fall, then the slam.
const T = POLYBOOK_CAGE.timing;
assert.ok(T.shakeAtMs + T.shakeMs <= T.fallAtMs, 'jolt finishes before the fall');
assert.ok(T.fallAtMs > 0 && T.fallMs > 0 && T.settleMs > 0 && T.domeMs > 0);
console.log('polybookCage tests passed');
