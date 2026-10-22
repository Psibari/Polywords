import assert from 'node:assert/strict';
import {
  HALL_GOLD_CENTER,
  TERRACE_DAILY_DIVE,
  TERRACE_DIVE,
  terraceCastleDoor,
  terraceDailyDiveTimeline,
  terraceDailyOrigin,
  terraceDiveOrigin,
  terraceDiveTimeline,
  terraceZoomShift,
} from './homeTerraceDive';
import { TERRACE_CASTLE_WINDOWS } from './homeTerraceScene';

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

const door = TERRACE_CASTLE_WINDOWS[TERRACE_CASTLE_WINDOWS.length - 1];
assert.equal(door.kind, 'arch', 'the last window is the castle door');
const c = terraceCastleDoor();
assert.ok(c.x > 0 && c.x < 1 && c.y > 0 && c.y < 1, 'door centre is inside the castle');
const co = terraceDailyOrigin({ left: 10, top: 20, width: 200, height: 100 });
assert.equal(co.x, 10 + c.x * 200);
assert.equal(co.y, 20 + c.y * 100);
console.log('homeTerraceDive tests passed');
