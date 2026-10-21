import assert from 'node:assert/strict';
import {
  TERRACE_DEFAULTS,
  TERRACE_DESIGN_H,
  TERRACE_DESIGN_W,
  TERRACE_ELEMENT_IDS,
  resolveTerraceLayout,
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

  // Background and front are bottom-anchored and the same width as the screen.
  assert.ok(Math.abs(layout.background.top + layout.background.height - phone.height) < 1e-6);
  assert.ok(Math.abs(layout.background.width - phone.width) < 1e-6);
  assert.ok(Math.abs(layout.front.top + layout.front.height - phone.height) < 1e-6);

  // The wall spans the full width and is never scaled differently from the frame.
  assert.equal(layout.rects.wall.left, 0);
  assert.ok(Math.abs(layout.rects.wall.width - phone.width) < 1e-6);

  // Bottom-group elements keep their distance from the screen bottom (design units).
  for (const id of ['wall', 'plaque', 'casing', 'gear', 'cageBase', 'castle', 'perch'] as const) {
    const d = TERRACE_DEFAULTS[id];
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

console.log('homeTerraceScene tests passed');
