import assert from 'node:assert/strict';
import {
  HALL_GOLD_CENTER,
  TERRACE_BOOK_DIVE,
  TERRACE_DAILY_DIVE,
  TERRACE_DIVE,
  terraceBookDiveNavigateAt,
  terraceBookRiseFrom,
  terraceBookRiseTransform,
  terraceCastleDoor,
  terraceDailyDiveTimeline,
  terraceDailyOrigin,
  terraceDiveOrigin,
  terraceDiveTimeline,
  terraceZoomShift,
} from './homeTerraceDive';
import { TERRACE_CASTLE_DOOR, TERRACE_CASTLE_WINDOWS } from './homeTerraceScene';

const t = terraceDiveTimeline(TERRACE_DIVE);
assert.equal(t.polybookRetreatAt, 0, 'POLYBOOK retreats first');
assert.ok(t.huntRetreatAt > t.polybookRetreatAt, 'HUNT retreats after POLYBOOK');
assert.ok(t.zoomAt >= t.huntRetreatAt + t.retreatMs, 'zoom starts after both buttons are gone');
assert.ok(t.flashAt > t.zoomAt && t.flashAt < t.navigateAt, 'flash is inside the zoom');
assert.equal(t.flashAt + t.flashMs, t.navigateAt, 'flash ends exactly when the zoom ends');
assert.equal(t.navigateAt, t.zoomAt + t.zoomMs, 'navigate when the zoom ends');

const fast = terraceDiveTimeline({ ...TERRACE_DIVE, timescale: 0.5 });
assert.ok(Math.abs(fast.navigateAt - t.navigateAt / 2) < 1e-9, 'timescale scales every duration');

const o = terraceDiveOrigin({ left: 100, top: 200, width: 1000, height: 500 });
assert.equal(o.x, 100 + HALL_GOLD_CENTER.x * 1000);
assert.equal(o.y, 200 + HALL_GOLD_CENTER.y * 500);
assert.ok(TERRACE_DIVE.zoomScale > 1);
const sh = terraceZoomShift({ x: 300, y: 500 }, 400, 800);
assert.deepEqual(sh, { dx: 100, dy: 100 });

const d = terraceDailyDiveTimeline(TERRACE_DAILY_DIVE);
assert.ok(d.zoomAt > d.riseMs, 'zoom starts after the castle has risen');
assert.ok(d.flashAt > d.zoomAt && d.flashAt < d.navigateAt, 'daily flash is inside the zoom');
assert.equal(d.flashAt + d.flashMs, d.navigateAt);
assert.equal(d.navigateAt, d.zoomAt + d.zoomMs);
const dfast = terraceDailyDiveTimeline({ ...TERRACE_DAILY_DIVE, timescale: 0.5 });
assert.ok(Math.abs(dfast.navigateAt - d.navigateAt / 2) < 1e-9);
assert.ok(TERRACE_DAILY_DIVE.zoomScale > TERRACE_DIVE.zoomScale, 'the tiny door needs more zoom than the hall');

// The door is the painted one at the bottom of the castle picture, below every lit window.
for (const w of TERRACE_CASTLE_WINDOWS) {
  assert.ok(TERRACE_CASTLE_DOOR.y > w.y + w.h, 'the door is below every lit window');
}
const c = terraceCastleDoor();
assert.ok(c.x > 0 && c.x < 1 && c.y > 0 && c.y < 1, 'door centre is inside the castle');
const co = terraceDailyOrigin({ left: 10, top: 20, width: 200, height: 100 });
assert.equal(co.x, 10 + c.x * 200);
assert.equal(co.y, 20 + c.y * 100);

// Polybook rise.
{
  const nav = terraceBookDiveNavigateAt();
  assert.equal(nav, t.huntRetreatAt + t.retreatMs + TERRACE_BOOK_DIVE.holdMs, 'hand over after both buttons have gone');
  assert.ok(nav < t.navigateAt, 'the Polybook hand-over is quicker than the Hunt dive');
  const niche = { left: 100, top: 200, width: 1000, height: 500 };
  const from = terraceBookRiseFrom(niche);
  assert.deepEqual({ x: from.x, y: from.y }, terraceDiveOrigin(niche), 'the book starts at the hall golden end');
  assert.equal(from.w, TERRACE_BOOK_DIVE.startWidthFraction * 1000);
  const cover = { x: 20, y: 300, w: 350, h: 500 };
  const x = terraceBookRiseTransform(from, cover);
  // Applying the shift to the cover centre lands it on the start point.
  assert.ok(Math.abs(cover.x + cover.w / 2 + x.dx - from.x) < 1e-9);
  assert.ok(Math.abs(cover.y + cover.h / 2 + x.dy - from.y) < 1e-9);
  assert.ok(Math.abs(x.scale * cover.w - from.w) < 1e-9, 'it starts at the requested width');
  assert.ok(x.scale > 0 && x.scale < 1, 'it grows into place');
}
console.log('homeTerraceDive tests passed');
