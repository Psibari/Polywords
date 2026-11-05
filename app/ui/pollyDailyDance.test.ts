import assert from 'node:assert/strict';
import { pollyBreachActiveKeyframes, pollyBreachPoseKeyframes } from './pollyDailyBreach';
import {
  POLLY_DANCE,
  POLLY_DANCE_BUBBLE,
  POLLY_DANCE_MS,
  POLLY_DANCE_POSES,
  pollyDailyDanceTimeline,
  pollyDanceBubbleKeyframes,
} from './pollyDailyDance';

const sample = (keys: { inputRange: number[]; outputRange: number[] }, t: number) => {
  const { inputRange: xs, outputRange: ys } = keys;
  if (t <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i += 1) {
    if (t <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (t - xs[i - 1])) / (xs[i] - xs[i - 1]);
  }
  return ys[ys.length - 1];
};
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

const dance = pollyDailyDanceTimeline();

// Segments: contiguous, in the mock's order, 2500 ms in all.
assert.deepEqual(
  dance.segments.map((s) => [s.pose, s.fromMs, s.toMs]),
  [
    ['laugh01', 0, 250],
    ['laugh03', 250, 500],
    ['flyGrin', 500, 850],
    ['hauntTaunt', 850, 1650],
    ['hauntTaunt', 1650, 2000],
    ['laugh', 2000, 2110],
    ['laugh', 2110, 2500],
  ],
);
dance.segments.forEach((s, i) => {
  if (i > 0) assert.equal(s.fromMs, dance.segments[i - 1].toMs, 'contiguous');
});
assert.equal(dance.segments[0].fromMs, 0);
assert.equal(dance.segments[dance.segments.length - 1].toMs, 2500, 'totals 2500 ms');
assert.equal(POLLY_DANCE_MS, 2500, 'the reaction\'s old length');
assert.equal(dance.endMs, POLLY_DANCE_MS);
assert.deepEqual([...POLLY_DANCE_POSES], ['laugh01', 'laugh03', 'flyGrin', 'hauntTaunt', 'laugh']);

// Motion: on the perch to start, hop, hover drifting left, fall, bounce, rest.
for (const keys of [dance.x, dance.y]) {
  for (let i = 1; i < keys.inputRange.length; i += 1) assert.ok(keys.inputRange[i] > keys.inputRange[i - 1], 'increasing input');
}
const at = (t: number) => [sample(dance.x, t), sample(dance.y, t)];
assert.deepEqual(at(0), [0, 0]);
assert.deepEqual(at(250), [0, 0], 'still through the first laugh');
assert.ok(near(sample(dance.y, 312.5), -POLLY_DANCE.laughBobPt), 'the bob dips 3 pt');
assert.ok(near(at(850)[0], 6) && near(at(850)[1], -44), 'hopped up to (+6, -44)');
assert.ok(near(at(1250)[0], POLLY_DANCE.hover.driftToX), 'drifted to -8 by the hover\'s half');
assert.ok(near(at(1650)[0], -8) && near(at(1650)[1], -44), 'still hovering at 1650');
assert.ok(near(at(2000)[0], 0) && near(at(2000)[1], 0), 'back on the perch');
assert.ok(near(sample(dance.y, 2055), POLLY_DANCE.landingBouncePt), 'the landing bounce');
assert.deepEqual(at(2110), [0, 0]);
assert.deepEqual(at(2500), [0, 0], 'at rest at the end');
assert.equal(sample(dance.rotateDeg, 1000), 0, 'no rotation');
// The hover never drifts right of the hop (towards the clues).
for (let t = 850; t <= 2000; t += 10) assert.ok(at(t)[0] <= 6 + 1e-9, `x at ${t}`);

// The bubble: in at 850 over 180 ms, out from 1650 over 160 ms; hidden at rest.
const bubble = pollyDanceBubbleKeyframes();
assert.equal(sample(bubble, 0), 0, 'hidden at rest');
assert.equal(sample(bubble, 849), 0);
assert.equal(sample(bubble, 1030), 1, 'fully in 180 ms after 850');
assert.equal(sample(bubble, 1650), 1, 'shown while she hovers and points');
assert.equal(sample(bubble, 1810), 0, 'out 160 ms after 1650');
assert.equal(sample(bubble, 2500), 0);
assert.deepEqual({ ...POLLY_DANCE_BUBBLE }, { inAtMs: 850, inMs: 180, outAtMs: 1650, outMs: 160 });

// Owning her pose: nothing at rest (clock 0), one pose per segment, back after.
const owned = pollyBreachActiveKeyframes(dance);
assert.equal(sample(owned, 0), 0, 'nothing of the dance at rest');
assert.equal(sample(owned, 1), 1, 'owns her pose once it starts');
assert.equal(sample(owned, 2501), 0, 'hands her pose back at the end');
for (const s of dance.segments) {
  const mid = (s.fromMs + s.toMs) / 2;
  const shown = POLLY_DANCE_POSES.filter((p) => sample(pollyBreachPoseKeyframes(dance, p), mid) === 1);
  assert.deepEqual(shown, [s.pose], `only ${s.pose} at ${mid}`);
}
for (const p of POLLY_DANCE_POSES) assert.equal(sample(pollyBreachPoseKeyframes(dance, p), 0), 0, `${p} hidden at rest`);

console.log('pollyDailyDance tests passed');
