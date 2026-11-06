import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dailyBreachClockMs, dailyBreachPollyMoveEndMs } from './dailyBreach';
import { POLLY_DANCE_MS } from './pollyDailyDance';
import {
  DAILY_PERCH_EXIT_POSE,
  DAILY_PERCH_LAYER_POSES,
  DAILY_PERCH_MOVE_TIMELINES,
  DAILY_PERCH_MOVES,
  DAILY_PERCH_POSE,
  DailyPerchMove,
  dailyPerchLayerOpacities,
  dailyPerchVisibleLayers,
} from './pollyDailyPerchLayers';
import type { PollyScreenPoseName } from './pollyScreenPoses';

// The face rig draws idle (pollyScreenPoseUsesRig; the art cannot load here).
const RIG_POSE: PollyScreenPoseName = 'idle';
const IMAGE_POSES = DAILY_PERCH_LAYER_POSES.filter((p) => p !== RIG_POSE);

// ── One clock, as the perch and React Native see it ──
// `native` drives the views while it runs. `js` is React Native's JS copy:
// a render writes every layer computed from it. A native animation leaves the
// JS copy at its start value while it runs, syncs it on a natural end, and on
// a STOP delivers the value it stopped at AFTER the code's setValue(0)
// (Animation.__startAnimationIfNative's end handler, then node.update() → a
// re-render). `live` is the gate: only ever set, so JS and native agree on it.
type Clock = { native: number; js: number; running: boolean; startedAt: number; to: number; live: number };
type World = { now: number; pose: PollyScreenPoseName; clocks: Record<DailyPerchMove, Clock> };

const restClock = (): Clock => ({ native: 0, js: 0, running: false, startedAt: 0, to: 0, live: 0 });
const world = (pose: PollyScreenPoseName): World => ({
  now: 0,
  pose,
  clocks: { hit: restClock(), smash: restClock(), dance: restClock() },
});

function advance(w: World, ms: number) {
  w.now += ms;
  for (const c of Object.values(w.clocks)) {
    if (!c.running) continue;
    c.native = Math.min(c.to, w.now - c.startedAt);
    if (c.native >= c.to) {
      c.running = false;
      c.js = c.native; // natural end: JS synced
    }
  }
}

/** Start a clock as the perch / screen does: stop, setValue(0), gate on, timing to `to`. */
function start(w: World, move: DailyPerchMove, to: number) {
  rest(w, move, true);
  const c = w.clocks[move];
  c.live = 1;
  Object.assign(c, { running: true, startedAt: w.now, to });
}

/** Stop + setValue(0). `gated`: the fix sets the gate to 0 first. */
function rest(w: World, move: DailyPerchMove, gated: boolean) {
  const c = w.clocks[move];
  if (gated) c.live = 0;
  const stoppedAt = c.native;
  const wasRunning = c.running;
  c.running = false;
  c.native = 0;
  c.js = 0;
  // The stopped animation's value lands in JS after the reset.
  if (wasRunning) c.js = stoppedAt;
}

const layersFrom = (w: World, side: 'native' | 'js') =>
  dailyPerchVisibleLayers(
    dailyPerchLayerOpacities(
      w.pose,
      w.pose === RIG_POSE,
      IMAGE_POSES,
      Object.fromEntries(DAILY_PERCH_MOVES.map((m) => {
        const c = w.clocks[m];
        // A running clock's views are rewritten natively every frame.
        return [m, { clock: side === 'js' && !c.running ? c.js : c.native, live: c.live }];
      })) as Record<DailyPerchMove, { clock: number; live: number }>,
    ),
  );

/** Exactly one layer on screen, and the same one whether native or a JS render wrote it last. */
function expectOne(w: World, label: string, layer?: string) {
  const native = layersFrom(w, 'native');
  const js = layersFrom(w, 'js');
  assert.equal(native.length, 1, `${label}: one Polly (native) — got ${native.join(', ')}`);
  assert.deepEqual(js, native, `${label}: a render cannot light another Polly — native ${native}, JS ${js}`);
  if (layer) assert.equal(native[0], layer, `${label}: shows ${layer}`);
}

// ── The perch's layers ──
assert.ok(DAILY_PERCH_LAYER_POSES.includes(RIG_POSE));
assert.equal(DAILY_PERCH_POSE.laughing, 'laugh', 'the loss laughs');
assert.equal(DAILY_PERCH_POSE.happy, 'laugh', 'the dance lands on the laugh');
assert.equal(DAILY_PERCH_EXIT_POSE.laughing, 'flyGrin');
assert.equal(DAILY_PERCH_EXIT_POSE.shocked, 'flyAngry');
assert.equal(new Set(DAILY_PERCH_LAYER_POSES).size, DAILY_PERCH_LAYER_POSES.length, 'one layer per pose');

// At rest, every pose: exactly its own layer.
for (const pose of DAILY_PERCH_LAYER_POSES) expectOne(world(pose), `rest ${pose}`, pose === RIG_POSE ? 'rig' : pose);

// Every clock value of every move, hand-overs included: her layers always
// add up to one Polly, and two only ever share the screen inside a 0.5 ms
// hand-over (a crossfade, one fading out as the next fades in).
for (const move of DAILY_PERCH_MOVES) {
  const timeline = DAILY_PERCH_MOVE_TIMELINES[move];
  const edges = [timeline.startMs, ...timeline.segments.map((s) => s.toMs)];
  const end = move === 'dance' ? POLLY_DANCE_MS + 1 : dailyBreachClockMs(move);
  for (let t = 0; t <= end; t += 0.125) {
    const clocks = Object.fromEntries(DAILY_PERCH_MOVES.map((m) => [m, { clock: m === move ? t : 0, live: m === move ? 1 : 0 }]));
    const layers = dailyPerchLayerOpacities(RIG_POSE, true, IMAGE_POSES, clocks as Record<DailyPerchMove, { clock: number; live: number }>);
    const total = layers.rig + Object.values(layers.images).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `${move} at ${t}: one Polly in all (opacity ${total})`);
    const lit = dailyPerchVisibleLayers(layers);
    if (lit.length > 1) {
      assert.equal(lit.length, 2, `${move} at ${t}: ${lit}`);
      assert.ok(edges.some((e) => Math.abs(t - e) <= 0.5), `${move} at ${t}: two layers only in a hand-over (${lit})`);
    }
  }
}

// ── Second lost life (the loss) during or after the first-miss dance ──
// Pete's doubled Polly: the loss started while the dance still ran.
const LAUGH = DAILY_PERCH_POSE.laughing;
for (const lossAt of [200, 400, 700, 1000, 1400, 1900, 2050, 2300, 2499, POLLY_DANCE_MS + 220]) {
  const w = world(RIG_POSE);
  // First lost life: her pose is the laugh, the dance owns it on its clock.
  w.pose = DAILY_PERCH_POSE.happy;
  start(w, 'dance', POLLY_DANCE_MS);
  for (let t = 50; t < Math.min(lossAt, POLLY_DANCE_MS); t += 100) {
    advance(w, t - w.now);
    expectOne(w, `dance at ${t}`);
  }
  advance(w, lossAt - w.now);
  if (lossAt > POLLY_DANCE_MS) {
    // Its bubble faded: back to idle (the screen's 'perched' resets the dance).
    w.pose = RIG_POSE;
    rest(w, 'dance', true);
    expectOne(w, 'idle after the dance', 'rig');
  }
  // Second lost life: the dance is stopped, she laughs.
  w.pose = LAUGH;
  rest(w, 'dance', true);
  expectOne(w, `loss at ${lossAt}`, LAUGH);
  advance(w, 2720); // the loss line, then its bubble fades
  expectOne(w, `loss bubble fading (from ${lossAt})`, LAUGH);
  w.pose = DAILY_PERCH_EXIT_POSE.laughing; // the fly-out
  expectOne(w, `fly-out (from ${lossAt})`, 'flyGrin');
}

// The test bites: without the gate, a loss mid-dance leaves JS believing the
// dance is still on, and a render lights a dance pose while native shows the
// laugh — the two Pollys Pete saw.
{
  const w = world(DAILY_PERCH_POSE.happy);
  start(w, 'dance', POLLY_DANCE_MS);
  advance(w, 1200);
  w.pose = LAUGH;
  rest(w, 'dance', false);
  const native = layersFrom(w, 'native');
  const js = layersFrom(w, 'js');
  assert.deepEqual(native, [LAUGH]);
  assert.notDeepEqual(js, native, 'ungated: JS and native disagree, so two layers end up lit');
}

// ── Tier moves, then the loss, the win, or another claim ──
for (const tier of ['hit', 'smash'] as const) {
  const clockMs = dailyBreachClockMs(tier);
  const moveEnd = dailyBreachPollyMoveEndMs(tier);
  assert.ok(clockMs > moveEnd + 0.5, `${tier}: the clock runs past her hold, so it rests by itself`);

  // A correct claim's move (her own pose idle under it), then a wrong claim
  // ends the round — the loss — at any point of the move or its hold.
  for (const lossAt of [100, 300, 700, 1000, 1500, 2200, moveEnd - 10, moveEnd + 200]) {
    const w = world(RIG_POSE);
    start(w, tier, clockMs);
    for (let t = 25; t < lossAt; t += 100) {
      advance(w, t - w.now);
      expectOne(w, `${tier} move at ${t}`);
    }
    advance(w, lossAt - w.now);
    w.pose = LAUGH;
    rest(w, 'hit', true); // restBreachClocks: both clocks, gates first
    rest(w, 'smash', true);
    expectOne(w, `${tier} then loss at ${lossAt}`, LAUGH);
    advance(w, 2720);
    w.pose = DAILY_PERCH_EXIT_POSE.laughing;
    expectOne(w, `${tier} then loss, fly-out`, 'flyGrin');
  }

  // The first lost life during the hold: the dance takes over, then the loss.
  {
    const w = world(RIG_POSE);
    start(w, tier, clockMs);
    advance(w, moveEnd - 300);
    w.pose = DAILY_PERCH_POSE.happy;
    rest(w, 'hit', true);
    rest(w, 'smash', true);
    start(w, 'dance', POLLY_DANCE_MS);
    for (let t = 30; t < POLLY_DANCE_MS; t += 120) {
      advance(w, 120);
      expectOne(w, `${tier} hold then dance at ${t}`);
    }
    w.pose = LAUGH;
    rest(w, 'dance', true);
    expectOne(w, `${tier} hold, dance, then loss`, LAUGH);
  }

  // The win: her move plays first, the win's pose waits for its end.
  {
    const w = world(RIG_POSE);
    start(w, tier, clockMs);
    for (let t = 40; t < moveEnd; t += 100) {
      advance(w, t - w.now);
      expectOne(w, `${tier} win move at ${t}`);
    }
    advance(w, moveEnd - w.now);
    w.pose = DAILY_PERCH_POSE.shocked; // the delayed win starts
    advance(w, 1); // past the hold's last edge, clock still running
    expectOne(w, `${tier} win starts`, 'shocked');
    advance(w, clockMs); // the clock ends naturally
    expectOne(w, `${tier} win, clock done`, 'shocked');
    w.pose = DAILY_PERCH_EXIT_POSE.shocked;
    expectOne(w, `${tier} win fly-out`, 'flyAngry');
  }

  // Another correct claim mid-hold (either tier), then a loss.
  for (const next of ['hit', 'smash'] as const) {
    const w = world(RIG_POSE);
    start(w, tier, clockMs);
    advance(w, moveEnd - 200);
    rest(w, 'hit', true);
    rest(w, 'smash', true);
    start(w, next, dailyBreachClockMs(next));
    advance(w, 700);
    expectOne(w, `${tier} hold then ${next} move`);
    advance(w, 300);
    w.pose = LAUGH;
    rest(w, 'hit', true);
    rest(w, 'smash', true);
    expectOne(w, `${tier} hold, ${next} move, then loss`, LAUGH);
  }
}

// ── The wiring: every stop of a clock Polly reads is gated first ──
{
  const read = (path: string) => readFileSync(join(__dirname, path), 'utf8').replace(/\r\n/g, '\n');
  const perch = read('../components/PollyDailyPerch.tsx');
  const screen = read('../screens/DailyChallengeScreen.tsx');
  const before = (src: string, first: string, then: string, label: string) => {
    const a = src.indexOf(first);
    assert.ok(a >= 0 && a < src.indexOf(then, a), label);
  };
  // The perch composes its layers from this module and gates each move.
  assert.match(perch, /const layers = composeDailyPerch<PerchNode>\(/);
  assert.match(perch, /clocks\[move\]\.clock\.interpolate\(\{ \.\.\.keys, extrapolate: 'clamp' \}\),\n\s*clocks\[move\]\.live,/);
  assert.equal(perch.split('danceClock.stopAnimation();').length - 1, 2, 'the dance is stopped in two places');
  for (const stop of perch.split('danceClock.stopAnimation();').slice(0, -1)) {
    assert.match(stop, /danceLive\.setValue\(0\);\n\s*$/, 'the dance gate closes right before every stop');
  }
  before(perch, 'danceLive.setValue(1);', 'Animated.timing(danceClock, {', 'the gate opens as the dance starts');
  // The screen: both gates close before restBreachClocks stops a clock; the
  // tier's gate opens as its clock starts.
  const rest = screen.slice(screen.indexOf('function restBreachClocks() {'));
  before(rest, 'breachHitLive.setValue(0);', 'breachHitClock.stopAnimation();', 'hit gate first');
  before(rest, 'breachSmashLive.setValue(0);', 'breachHitClock.stopAnimation();', 'smash gate first');
  assert.equal(
    (screen.match(/\b(breachHitClock|breachSmashClock|clock)\.stopAnimation\(\);/g) ?? []).length,
    3,
    'breach clocks stop only in restBreachClocks and at a restart',
  );
  // The restart's stop comes after the claim's own reset (gates already 0).
  const run = screen.slice(screen.indexOf('function runPhysicalCorrectTransition('));
  before(run, 'clearCorrectTransitionTimers();', '        clock.stopAnimation();', 'a restart is preceded by the reset');
  before(screen, "(contactTier === 'hit' ? breachHitLive : breachSmashLive).setValue(1);", 'Animated.timing(clock, {', 'tier gate opens at the start');
  assert.match(screen, /hitLive: breachHitLive, smashLive: breachSmashLive/);
}

console.log('pollyDailyPerchLayers: ok');
