import assert from 'node:assert/strict';
import {
  TERRACE_MOON_CELLS,
  TERRACE_MOON_RISE,
  TERRACE_SHOOTING_STAR,
  terraceMoonPhase,
  terraceMoonRiseDistance,
  terraceMoonSprite,
  terraceShootingStar,
  terraceSkyHeight,
  terraceStarDelay,
} from './homeTerraceSky';

// Moon phase: the reference new moon is dark, two weeks later it is full, a week after new it is half and growing.
const newMoon = terraceMoonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14)));
assert.ok(newMoon.illumination < 0.001, 'reference new moon is dark');
assert.equal(newMoon.cell, 0, 'new moon uses the thinnest sprite');

const full = terraceMoonPhase(new Date(Date.UTC(2000, 0, 21, 4, 40)));
assert.ok(full.illumination > 0.99, `full moon is lit: ${full.illumination}`);
assert.equal(full.cell, 8);

const week = terraceMoonPhase(new Date(Date.UTC(2000, 0, 13, 18, 14)));
assert.ok(Math.abs(week.illumination - 0.5) < 0.1, 'a week after new is about half lit');
assert.equal(week.waxing, true, 'and growing');

const waning = terraceMoonPhase(new Date(Date.UTC(2000, 0, 28, 18, 14)));
assert.ok(Math.abs(waning.illumination - 0.5) < 0.1, 'three weeks after new is about half lit');
assert.equal(waning.waxing, false, 'and shrinking');

// Dates before the reference still land on a valid phase.
const early = terraceMoonPhase(new Date(Date.UTC(1990, 5, 1)));
assert.ok(early.age >= 0 && early.age < 29.54 && early.cell >= 0 && early.cell <= 8);

// Sprites hug the right rim when growing and the left rim (mirrored) when shrinking, at full height.
const box = { width: 100, height: 100 };
const crescentUp = terraceMoonSprite(0, true, box);
const crescentDown = terraceMoonSprite(0, false, box);
assert.equal(crescentUp.height, 100);
assert.ok(Math.abs(crescentUp.width - 100 * (TERRACE_MOON_CELLS[0].w / TERRACE_MOON_CELLS[0].h)) < 1e-9);
assert.ok(Math.abs(crescentUp.left + crescentUp.width - 100) < 1e-9, 'growing crescent touches the right edge');
assert.equal(crescentDown.left, 0, 'shrinking crescent touches the left edge');
assert.equal(crescentUp.mirror, false);
assert.equal(crescentDown.mirror, true);
const fullSprite = terraceMoonSprite(8, true, box);
assert.ok(Math.abs(fullSprite.width - 100) < 1e-9 && Math.abs(fullSprite.left) < 1e-9, 'full moon fills the box');

// Moon rise: starts below the ridge's lowest point, and never negative.
const bg = { top: -150, height: 1000 };
const dist = terraceMoonRiseDistance(bg, { top: 89 });
assert.ok(dist > 0);
assert.ok(89 + dist >= bg.top + (1372 / 2796) * bg.height, 'moon starts at or below the lowest ridge point');
assert.equal(terraceMoonRiseDistance(bg, { top: 5000 }), 0, 'a moon already below the ridge does not move');
assert.ok(TERRACE_MOON_RISE.riseMs * TERRACE_MOON_RISE.timescale > 0);

assert.ok(terraceSkyHeight({ top: -150, height: 1000 }) > 0 && terraceSkyHeight({ top: -150, height: 1000 }) < 89 + dist);

// Shooting stars stay in bounds and are reproducible for a given random source.
function seeded(seed: number) {
  // mulberry32: well mixed even for consecutive seeds.
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const c = TERRACE_SHOOTING_STAR;
for (let i = 0; i < 200; i++) {
  const r = seeded(i + 1);
  const star = terraceShootingStar(400, 500, r);
  assert.ok(star.x >= c.startX[0] * 400 - 1e-9 && star.x <= c.startX[1] * 400 + 1e-9);
  assert.ok(star.y >= c.startY[0] * 500 - 1e-9 && star.y <= c.startY[1] * 500 + 1e-9);
  assert.ok(star.dy > 0, 'stars always fall');
  assert.ok(star.durationMs >= c.durationMs[0] && star.durationMs <= c.durationMs[1]);
  const len = Math.hypot(star.dx, star.dy);
  assert.ok(len >= c.travelWidth[0] * 400 - 1e-6 && len <= c.travelWidth[1] * 400 + 1e-6);
  const d1 = terraceStarDelay(true, seeded(i + 1));
  const d2 = terraceStarDelay(false, seeded(i + 1));
  assert.ok(d1 >= c.firstDelayMs[0] && d1 <= c.firstDelayMs[1]);
  assert.ok(d2 >= c.gapMs[0] && d2 <= c.gapMs[1]);
}
assert.deepEqual(terraceShootingStar(400, 500, seeded(7)), terraceShootingStar(400, 500, seeded(7)));
// Both directions occur.
const headings = new Set(Array.from({ length: 60 }, (_, i) => terraceShootingStar(400, 500, seeded(i + 100)).dx > 0));
assert.equal(headings.size, 2, 'stars go both ways');

console.log('homeTerraceSky tests passed');
