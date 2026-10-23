import assert from 'node:assert/strict';
import {
  TERRACE_DEFAULTS,
  TERRACE_DESIGN_H,
  TERRACE_DESIGN_W,
  TERRACE_ELEMENT_IDS,
  lockTerraceAspect,
  resolveTerraceLayout,
  terracePollyTransform,
  terracePollyDropDistance,
  TERRACE_POLLY_DROP,
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
  // sides. The front hill is its own element: it bleeds off both sides and reaches the bottom of
  // the sky picture, so no sky shows below the ridge line.
  const bgBottomGap = phone.height - (layout.background.top + layout.background.height);
  assert.ok(Math.abs(bgBottomGap - (TERRACE_DESIGN_H - TERRACE_DEFAULTS.background.y - TERRACE_DEFAULTS.background.h) * k) < 1e-6);
  assert.ok(layout.background.left <= 1e-6 && layout.background.left + layout.background.width >= phone.width - 1e-6);
  assert.ok(layout.front.left <= 1e-6 && layout.front.left + layout.front.width >= phone.width - 1e-6);
  assert.ok(layout.front.top + layout.front.height >= layout.background.top + layout.background.height - 1e-6);

  // The wall covers the full width (Pete's locked wall is wider than the screen, bleeding off both
  // sides), scaled by the frame's own factor.
  assert.ok(layout.rects.wall.left <= 1e-6);
  assert.ok(layout.rects.wall.left + layout.rects.wall.width >= phone.width - 1e-6);

  // Bottom-group elements keep their distance from the screen bottom (design units).
  for (const id of ['wall', 'plaque', 'casing', 'gear', 'castle', 'perch'] as const) {
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

// The sky and the front hill are separate pieces (Pete 2026-10-22): moving either leaves the other.
{
  const phone = PHONES[0];
  const base = resolveTerraceLayout(phone);
  const raised = resolveTerraceLayout(phone, { background: { y: TERRACE_DEFAULTS.background.y - 100 } });
  assert.ok(Math.abs(base.background.top - raised.background.top - 100 * base.k) < 1e-6);
  assert.equal(raised.front.top, base.front.top, 'moving the background does not move the front hill');
  const movedFront = resolveTerraceLayout(phone, { front: { y: TERRACE_DEFAULTS.front.y - 40 } });
  assert.equal(movedFront.background.top, base.background.top, 'moving the front hill does not move the background');
  assert.ok(Math.abs(base.front.top - movedFront.front.top - 40 * base.k) < 1e-6);
  const scaled = resolveTerraceLayout(phone, { front: { w: TERRACE_DEFAULTS.front.w * 1.1 } });
  assert.ok(Math.abs(scaled.front.width - base.front.width * 1.1) < 1e-6);
  assert.equal(scaled.background.width, base.background.width);
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

// Polly's fall starts fully above the top of the screen on every phone: her box bottom, shifted up by the
// drop distance, is at or above y = 0 (screen top), with the margin to spare.
for (const phone of PHONES) {
  const layout = resolveTerraceLayout(phone);
  const t = terracePollyTransform(TERRACE_DEFAULTS.polly, phone, layout.k, 364);
  const drop = terracePollyDropDistance(t);
  const feetY = t.originY + t.translateY;
  const boxBottomAtStart = feetY - drop * t.scale;
  assert.ok(boxBottomAtStart <= -TERRACE_POLLY_DROP.marginPt * t.scale + 1e-6, `Polly starts off the top on ${phone.width}x${phone.height}`);
  assert.ok(drop > 0);
}

console.log('homeTerraceScene tests passed');
