import assert from 'node:assert/strict';
import {
  dailyBreachBeats,
  dailyBreachClockMs,
  dailyBreachPollyMoveEndMs,
  dailyBreachPollyMoveMs,
} from './dailyBreach';
import {
  POLLY_BREACH_POSES,
  POLLY_FURY,
  POLLY_HIT_JUMP_Y,
  pollyBreachActiveKeyframes,
  pollyBreachPoseKeyframes,
  pollyDailyBreachTimeline,
  pollyHitJumpY,
} from './pollyDailyBreach';

const sample = (keys: { inputRange: number[]; outputRange: number[] }, t: number) => {
  const { inputRange: xs, outputRange: ys } = keys;
  if (t <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i += 1) {
    if (t <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (t - xs[i - 1])) / (xs[i] - xs[i - 1]);
  }
  return ys[ys.length - 1];
};
const increasing = (xs: number[], label: string) => {
  for (let i = 1; i < xs.length; i += 1) assert.ok(xs[i] > xs[i - 1], `${label}: increasing at ${i} (${xs[i - 1]}, ${xs[i]})`);
};

// The jump table: its values at its samples, linear between them, 0 at the ends.
{
  for (const [t, y] of POLLY_HIT_JUMP_Y) {
    if (t < 933) assert.ok(Math.abs(pollyHitJumpY(t) - y) < 1e-9, `jump y at ${t} ms`);
  }
  assert.equal(POLLY_HIT_JUMP_Y[0][1], -27.8, 'the measured first sample is kept');
  assert.equal(POLLY_HIT_JUMP_Y[POLLY_HIT_JUMP_Y.length - 1][0], 933, 'the jump lasts 933 ms');
  assert.equal(pollyHitJumpY(-1), 0, 'on the perch before the jump');
  assert.equal(pollyHitJumpY(933), 0, 'back on the perch at the end');
  assert.equal(pollyHitJumpY(2000), 0);
  assert.ok(Math.abs(pollyHitJumpY(250) - (-89.5 + (-90.1 + 89.5) * 0.5)) < 1e-9, 'linear between samples');
  assert.equal(Math.min(...POLLY_HIT_JUMP_Y.map(([, y]) => y)), -90.1, 'apex -90.1');
}

// Two clues: from the contact, shocked 140, the jump 933, embarrassed 1300.
{
  const hit = pollyDailyBreachTimeline('hit');
  const contact = dailyBreachBeats('hit', true).contactMs ?? 0;
  assert.equal(hit.startMs, contact, 'starts at the plaque\'s contact');
  assert.deepEqual(hit.segments.map((s) => [s.pose, s.toMs - s.fromMs]), [['shocked', 140], ['masterShock', 933], ['embarrassed', 1300]]);
  hit.segments.forEach((s, i) => {
    if (i > 0) assert.equal(s.fromMs, hit.segments[i - 1].toMs, 'contiguous');
  });
  assert.equal(hit.endMs, dailyBreachPollyMoveEndMs('hit'));
  assert.equal(hit.endMs - hit.startMs, dailyBreachPollyMoveMs('hit', true).moveMs + dailyBreachPollyMoveMs('hit', true).holdMs);
  const jumpAt = hit.segments[1].fromMs;
  for (const [t, y] of POLLY_HIT_JUMP_Y) assert.ok(Math.abs(sample(hit.y, jumpAt + t) - y) < 1e-9, `y on the clock at ${t}`);
  assert.equal(sample(hit.y, jumpAt - 1), 0, 'still on the perch while shocked');
  assert.equal(sample(hit.y, hit.endMs), 0);
  assert.deepEqual([sample(hit.x, 700), sample(hit.rotateDeg, 700)], [0, 0], 'straight up and down');
  increasing(hit.y.inputRange, 'hit y');
}

// One clue: from the throw; contiguous segments that sum to 2870 ms.
{
  const smash = pollyDailyBreachTimeline('smash');
  assert.equal(smash.startMs, 0, 'starts at the throw');
  assert.deepEqual(
    smash.segments.map((s) => [s.pose, s.toMs - s.fromMs]),
    [['angryYell', 130], ['sulk', 130], ['flyAngry', 120], ['jumpAngry', 200], ['jumpAngry', 480], ['jumpAngry', 380], ['angry', 130], ['angry', 1300]],
  );
  smash.segments.forEach((s, i) => {
    if (i > 0) assert.equal(s.fromMs, smash.segments[i - 1].toMs, 'contiguous');
  });
  assert.equal(smash.segments[smash.segments.length - 1].toMs, 2870, 'sums to 2870 ms');
  assert.equal(smash.endMs, 2870);
  assert.equal(smash.endMs, dailyBreachPollyMoveEndMs('smash'));
  for (const keys of [smash.x, smash.y, smash.rotateDeg]) {
    increasing(keys.inputRange, 'smash motion');
    assert.equal(sample(keys, 0), 0, 'at rest at the throw');
    assert.equal(sample(keys, smash.endMs), 0, 'at rest at the end');
  }
  const at = (t: number) => [sample(smash.x, t), sample(smash.y, t), sample(smash.rotateDeg, t)];
  assert.deepEqual(at(130), [0, 0, 0], 'still through the yell');
  assert.ok(Math.abs(at(260)[1] - POLLY_FURY.crouchY) < 1e-9, 'crouched by 260');
  assert.deepEqual(at(380).map((v) => Math.round(v * 1e6) / 1e6), [18, -36, 0], 'launched as the plaque reaches the gate');
  assert.deepEqual(at(580).map((v) => Math.round(v * 1e6) / 1e6), [10, -120, -6], 'at the apex');
  assert.deepEqual(at(1060).map((v) => Math.round(v * 1e6) / 1e6), [10, -114, -6], 'the shake ends on the drift point');
  assert.deepEqual(at(1440).map((v) => Math.round(v * 1e6) / 1e6), [0, 0, 0], 'back on the perch');
  assert.ok(Math.abs(at(1505)[1] - POLLY_FURY.landingBouncePt) < 1e-9, 'the landing bounce');
  // The mid-air shake: within its decaying bounds, and the same every time.
  for (let i = 0; i < smash.x.inputRange.length; i += 1) {
    const t = smash.x.inputRange[i];
    if (t <= 580 || t >= 1060) continue;
    const u = (t - 580) / 480;
    const jitter = 3 + (1.5 - 3) * u;
    assert.ok(Math.abs(smash.x.outputRange[i] - 10) <= jitter + 1e-9, `x jitter at ${t}`);
    assert.ok(Math.abs(smash.rotateDeg.outputRange[i] + 6) <= 2 + (1 - 2) * u + 1e-9, `rotation jitter at ${t}`);
  }
  assert.deepEqual(pollyDailyBreachTimeline('smash'), smash, 'deterministic');
}

// Pose layers and who owns her pose, on each tier's clock.
for (const tier of ['hit', 'smash'] as const) {
  const timeline = pollyDailyBreachTimeline(tier);
  const active = pollyBreachActiveKeyframes(timeline);
  increasing(active.inputRange, `${tier} active`);
  assert.equal(sample(active, 0), 0, `${tier}: nothing of the move at rest (clock 0)`);
  assert.equal(sample(active, (timeline.startMs + timeline.endMs) / 2), 1, `${tier}: owns her pose during the move`);
  assert.equal(sample(active, timeline.endMs + 1), 0, `${tier}: hands her pose back after the hold`);
  for (const pose of POLLY_BREACH_POSES) {
    const keys = pollyBreachPoseKeyframes(timeline, pose);
    increasing(keys.inputRange, `${tier} ${pose}`);
    assert.equal(sample(keys, 0), 0, `${tier} ${pose}: hidden at rest`);
    assert.equal(sample(keys, timeline.endMs + 1), 0, `${tier} ${pose}: hidden after the move`);
  }
  for (const s of timeline.segments) {
    const mid = (s.fromMs + s.toMs) / 2;
    const shown = POLLY_BREACH_POSES.filter((pose) => sample(pollyBreachPoseKeyframes(timeline, pose), mid) === 1);
    assert.deepEqual(shown, [s.pose], `${tier}: only ${s.pose} at ${mid}`);
  }
  // The tier's clock runs long enough for her whole move.
  assert.ok(dailyBreachClockMs(tier) > timeline.endMs + 0.5, `${tier}: the clock covers her move`);
}
assert.deepEqual(
  [...POLLY_BREACH_POSES].sort(),
  ['angry', 'angryYell', 'embarrassed', 'flyAngry', 'jumpAngry', 'masterShock', 'shocked', 'sulk'],
);

console.log('pollyDailyBreach tests passed');
