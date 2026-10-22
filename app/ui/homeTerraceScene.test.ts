import assert from 'node:assert/strict';
import {
  TERRACE_DEFAULTS,
  TERRACE_DESIGN_H,
  TERRACE_DESIGN_W,
  TERRACE_ELEMENT_IDS,
  lockTerraceAspect,
  resolveTerraceLayout,
  terraceEffectiveRect,
  terraceFrontFromBackground,
  terracePollyTransform,
} from './homeTerraceScene';

// Phones Pete's players use, plus a short and a tall one: iPhone 15 (393x852, top inset 59),
// small (375x667, inset 20), tall (360x800, inset 24), big (430x932, inset 59).
const PHONES = [
  { width: 393, height: 852, insetTop: 59 },
  { width: 375, height: 667, insetTop: 20 },
  { width: 360, height: 800, insetTop: 24 },
  { width: 430, height: 932, insetTop: 59 },
];

for (const phone of PHONES) {
  const layout = resolveTerraceLayout(phone);
  const k = phone.width / TERRACE_DESIGN_W;
  assert.ok(Math.abs(layout.k - k) < 1e-9, 'scale is full-width');

  // The background is a bottom-anchored element at Pete's locked position (raised, so the sky
  // picture ends above the screen bottom and the ground covers below it), and it bleeds off both
  // sides. The front ridge is the same picture: same left and width, lower part of it.
  const bgBottomGap = phone.height - (layout.background.top + layout.background.height);
  assert.ok(Math.abs(bgBottomGap - (TERRACE_DESIGN_H - TERRACE_DEFAULTS.background.y - TERRACE_DEFAULTS.background.h) * k) < 1e-6);
  assert.ok(layout.background.left <= 1e-6 && layout.background.left + layout.background.width >= phone.width - 1e-6);
  assert.equal(layout.front.left, layout.background.left);
  assert.equal(layout.front.width, layout.background.width);
  assert.ok(layout.front.top + layout.front.height <= layout.background.top + layout.background.height + 1e-6);

  // The wall covers the full width (Pete's locked wall is wider than the screen, bleeding off both
  // sides), scaled by the frame's own factor.
  assert.ok(layout.rects.wall.left <= 1e-6);
  assert.ok(layout.rects.wall.left + layout.rects.wall.width >= phone.width - 1e-6);

  // Bottom-group elements keep their distance from the screen bottom (design units).
  for (const id of ['wall', 'plaque', 'casing', 'gear', 'cageBase', 'castle', 'perch'] as const) {
    const d = lockTerraceAspect(id, TERRACE_DEFAULTS[id]);
    const bottomGap = phone.height - (layout.rects[id].top + layout.rects[id].height);
    const want = (TERRACE_DESIGN_H - d.y - d.h) * k;
    assert.ok(Math.abs(bottomGap - want) < 1e-6, `${id} stays bottom-anchored`);
  }

  // The logo is below the safe-area inset on every phone.
  assert.ok(layout.rects.logo.top >= phone.insetTop, 'logo clears the status bar');
  // Hit areas that matter stay on screen.
  for (const id of TERRACE_ELEMENT_IDS) {
    const r = layout.rects[id];
    assert.ok(Number.isFinite(r.left + r.top + r.width + r.height), `${id} is finite`);
  }
}

// Overrides replace only the keys given, and move the element the right way.
{
  const base = resolveTerraceLayout(PHONES[0]);
  const moved = resolveTerraceLayout(PHONES[0], { wall: { y: TERRACE_DEFAULTS.wall.y + 10 } });
  assert.ok(Math.abs(moved.rects.wall.top - base.rects.wall.top - 10 * base.k) < 1e-6);
  assert.equal(moved.rects.wall.width, base.rects.wall.width);
}

// Raising the background moves the front ridge with it (they are one picture).
{
  const phone = PHONES[0];
  const base = resolveTerraceLayout(phone);
  const raised = resolveTerraceLayout(phone, { background: { y: TERRACE_DEFAULTS.background.y - 100 } });
  assert.ok(Math.abs(base.background.top - raised.background.top - 100 * base.k) < 1e-6);
  assert.ok(Math.abs(base.front.top - raised.front.top - 100 * base.k) < 1e-6);
  assert.equal(raised.background.width, base.background.width);
}

// Polly's transform follows her rect.
{
  const phone = PHONES[0];
  const layout = resolveTerraceLayout(phone);
  const a = terracePollyTransform(TERRACE_DEFAULTS.polly, phone, layout.k, 364);
  const b = terracePollyTransform({ ...TERRACE_DEFAULTS.polly, y: TERRACE_DEFAULTS.polly.y + 10 }, phone, layout.k, 364);
  assert.ok(Math.abs(b.translateY - a.translateY - 10 * layout.k) < 1e-6);
  assert.ok(a.scale > 0);
}

// The front hill is its own element (Pete 2026-10-22): moving it leaves the background alone, and
// until it is moved it follows the background exactly as before.
{
  const phone = { width: 390, height: 844, insetTop: 47 };
  const base = resolveTerraceLayout(phone);
  const movedFront = resolveTerraceLayout(phone, { front: { y: TERRACE_DEFAULTS.front.y - 40 } });
  assert.equal(movedFront.background.top, base.background.top, 'moving the front hill does not move the background');
  assert.ok(Math.abs(base.front.top - movedFront.front.top - 40 * base.k) < 1e-6, 'front hill moves on its own');
  assert.equal(movedFront.front.left, base.front.left);
  assert.equal(movedFront.front.width, base.front.width);
  const scaled = resolveTerraceLayout(phone, { front: { w: TERRACE_DEFAULTS.front.w * 1.1 } });
  assert.ok(Math.abs(scaled.front.width - base.front.width * 1.1) < 1e-6, 'front hill scales on its own');
  assert.equal(scaled.background.width, base.background.width);
  // The default front rect is exactly the lower part of the default background picture.
  const f = terraceFrontFromBackground(TERRACE_DEFAULTS.background);
  assert.deepEqual(TERRACE_DEFAULTS.front, f);
  // The locked background height (974.31) is Pete's DEV readout, rounded to 2 places, so it is
  // within 0.05 design units of the exact picture height, not equal to it.
  assert.ok(Math.abs(f.y + f.h - (TERRACE_DEFAULTS.background.y + TERRACE_DEFAULTS.background.h)) < 0.05);
  // The effective rect of an untouched front follows a moved background.
  const eff = terraceEffectiveRect('front', { background: { y: TERRACE_DEFAULTS.background.y - 100 } });
  assert.ok(Math.abs(eff.y - (TERRACE_DEFAULTS.front.y - 100)) < 1e-6);
}

console.log('homeTerraceScene tests passed');
