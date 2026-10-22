import assert from 'node:assert/strict';
import { HALL_GOLD_CENTER, TERRACE_DIVE, terraceDiveOrigin, terraceDiveTimeline } from './homeTerraceDive';

const t = terraceDiveTimeline(TERRACE_DIVE);
assert.equal(t.polybookRetreatAt, 0, 'POLYBOOK retreats first');
assert.ok(t.huntRetreatAt > t.polybookRetreatAt, 'HUNT retreats after POLYBOOK');
assert.equal(t.hallFadeMs, t.huntRetreatAt + t.retreatMs, 'hall is fully in when both have gone');
assert.ok(t.zoomAt >= t.hallFadeMs, 'zoom starts after both buttons are gone');
assert.ok(t.flashAt > t.zoomAt && t.flashAt < t.navigateAt, 'flash is inside the zoom');
assert.equal(t.flashAt + t.flashMs, t.navigateAt, 'flash ends exactly when the zoom ends');
assert.equal(t.navigateAt, t.zoomAt + t.zoomMs, 'navigate when the zoom ends');

const fast = terraceDiveTimeline({ ...TERRACE_DIVE, timescale: 0.5 });
assert.ok(Math.abs(fast.navigateAt - t.navigateAt / 2) < 1e-9, 'timescale scales every duration');

const o = terraceDiveOrigin({ left: 100, top: 200, width: 1000, height: 500 });
assert.equal(o.x, 100 + HALL_GOLD_CENTER.x * 1000);
assert.equal(o.y, 200 + HALL_GOLD_CENTER.y * 500);
assert.ok(TERRACE_DIVE.zoomScale > 1);
console.log('homeTerraceDive tests passed');
