import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DAILY_FLOOR_COINS,
  dailyGoldHitMs,
  resolveDailyCastleFrame,
} from './dailyCastleScene';
import {
  DAILY_COIN_FACE,
  DAILY_COIN_FINALE,
  DAILY_COIN_FINALE_STEPS,
  DAILY_COIN_GLINT_MS,
  DAILY_COIN_OVERSHOOT,
  dailyCoinFinaleArrivalMs,
  dailyCoinFinaleFloorHoldMs,
  dailyCoinFinaleKeyframes,
  dailyCoinFinaleResetsFor,
  dailyCoinFinaleRestingStep,
  dailyCoinFinaleTotalMs,
  resolveDailyCoinFinaleGeometry,
  type DailyCoinFinaleChannel,
  type DailyCoinFinaleKeyframes,
} from './dailyCoinFinale';

const S = DAILY_COIN_FINALE_STEPS;
const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

// Linear interpolation with clamping, as Animated.interpolate reads a channel.
function at(channel: DailyCoinFinaleChannel, x: number): number {
  const { input, output } = channel;
  if (x <= input[0]) return output[0];
  for (let i = 1; i < input.length; i += 1) {
    if (x <= input[i]) {
      const t = (x - input[i - 1]) / (input[i] - input[i - 1]);
      return output[i - 1] + (output[i] - output[i - 1]) * t;
    }
  }
  return output[output.length - 1];
}

const samples = Array.from({ length: 501 }, (_, i) => (i / 500) * S.gone);
const startScale = 0.36;
const full = dailyCoinFinaleKeyframes('full', startScale, true);
const fullNoGlint = dailyCoinFinaleKeyframes('full', startScale, false);
const calm = dailyCoinFinaleKeyframes('calm', startScale, false);

// Every channel is a valid interpolation: inputs strictly increasing, one
// output per input, starting at rest and ending gone.
for (const [name, k] of Object.entries({ full, fullNoGlint, calm })) {
  for (const [channelName, channel] of Object.entries(k as DailyCoinFinaleKeyframes)) {
    assert.equal(channel.input.length, channel.output.length, `${name}.${channelName} lengths`);
    channel.input.slice(1).forEach((x, i) => {
      assert.ok(x > channel.input[i], `${name}.${channelName} inputs strictly increase`);
    });
    channel.output.forEach((v) => assert.ok(Number.isFinite(v), `${name}.${channelName} finite`));
  }
  const keys = k as DailyCoinFinaleKeyframes;
  assert.equal(at(keys.hero, S.landed), 0, `${name}: no hero at rest`);
  assert.equal(at(keys.veil, S.landed), 0, `${name}: no veil at rest`);
  assert.equal(at(keys.glow, S.landed), 0, `${name}: no glow at rest`);
  assert.equal(at(keys.floor, S.landed), 1, `${name}: floor coin shown at rest`);
  assert.equal(at(keys.hero, S.gone), 0, `${name}: hero gone at the end`);
  assert.equal(at(keys.veil, S.gone), 0, `${name}: veil gone at the end`);
  assert.equal(at(keys.glow, S.gone), 0, `${name}: glow gone at the end`);
  // One coin up to the hero's exit: the floor coin and the hero hand over,
  // never both, never neither.
  samples.filter((x) => x <= S.held).forEach((x) => {
    assert.ok(close(at(keys.floor, x) + at(keys.hero, x), 1), `${name}: one coin at ${x}`);
  });
  // Continuity (Pete, 2026-09-29): once the hero has taken over, the floor
  // coin never reappears — not as the hero fades, not behind Results.
  samples.filter((x) => x >= S.arrived).forEach((x) => {
    assert.equal(at(keys.floor, x), 0, `${name}: floor stays empty at ${x}`);
  });
  assert.equal(at(keys.floor, S.gone + 1), 0, `${name}: floor empty past the end`);
  // Nothing moves before lift-off: the floor hold is the coin at rest.
  samples.filter((x) => x <= S.liftOff).forEach((x) => {
    assert.equal(at(keys.hero, x), 0, `${name}: resting on the floor at ${x}`);
  });
}

// Approved beats (Pete, 2026-09-29): a 250–350 ms floor hold, a 450–600 ms
// flight, a 700–1000 ms hero hold.
{
  const t = DAILY_COIN_FINALE.full;
  assert.ok(t.floorHoldMs >= 250 && t.floorHoldMs <= 350, `floor hold ${t.floorHoldMs}`);
  assert.ok(t.flightMs >= 450 && t.flightMs <= 600, `flight ${t.flightMs}`);
  assert.ok(t.holdMs >= 700 && t.holdMs <= 1000, `hero hold ${t.holdMs}`);
  assert.ok(t.settleMs > 0 && t.settleMs <= 250, 'one short settle');
  assert.ok(DAILY_COIN_GLINT_MS < t.holdMs, 'the glint is over inside the hold');
  const c = DAILY_COIN_FINALE.calm;
  assert.ok(c.holdMs >= 700 && c.holdMs <= 1000, `calm hero hold ${c.holdMs}`);
  assert.equal(c.settleMs, 0, 'calm: no settle, no overshoot');
}

// The hand-off: at lift-off the hero is the floor art exactly — floor size,
// floor angle, floor edge — at the floor coin's place.
{
  assert.equal(at(full.scale, S.liftOff), startScale);
  assert.ok(close(at(full.tilt, S.liftOff), DAILY_COIN_FACE.ratio), 'floor angle');
  assert.ok(close(at(full.edge, S.liftOff), DAILY_COIN_FACE.edge), 'floor edge');
  assert.equal(at(full.travel, S.liftOff), 0, 'at the floor coin');
}

// Arrival: face-on, no edge, at the hero's place, one restrained overshoot
// that settles to hero size and stays there through the hold.
{
  assert.ok(close(at(full.tilt, S.arrived), 1), 'face-on at arrival');
  assert.ok(close(at(full.edge, S.arrived), 0), 'no edge face-on');
  assert.equal(at(full.travel, S.arrived), 1);
  assert.equal(at(full.scale, S.arrived), DAILY_COIN_OVERSHOOT);
  assert.ok(DAILY_COIN_OVERSHOOT > 1 && DAILY_COIN_OVERSHOOT <= 1.08, 'restrained overshoot');
  assert.equal(at(full.scale, S.settled), 1);
  assert.equal(at(full.scale, S.held), 1);
  // A single overshoot: scale rises to the peak, then only falls.
  const scales = samples.map((x) => at(full.scale, x));
  const peak = scales.indexOf(Math.max(...scales));
  scales.slice(1, peak + 1).forEach((v, i) => assert.ok(v >= scales[i] - 1e-9, 'grows to the peak'));
  scales.slice(peak + 1).forEach((v, i) => assert.ok(v <= scales[peak + i] + 1e-9, 'never bounces again'));
  // The turn only ever opens toward the player.
  const tilts = samples.map((x) => at(full.tilt, x));
  tilts.slice(1).forEach((v, i) => assert.ok(v >= tilts[i] - 1e-9, 'the tilt never swings back'));
}

// One glint, after the settle; none without it.
{
  const opacities = samples.map((x) => at(full.glintOpacity, x));
  let runs = 0;
  opacities.forEach((v, i) => {
    if (v > 0 && (i === 0 || opacities[i - 1] === 0)) runs += 1;
  });
  assert.equal(runs, 1, 'exactly one glint');
  samples.filter((x) => x < S.settled).forEach((x) => {
    assert.equal(at(full.glintOpacity, x), 0, 'no glint before the coin settles');
  });
  assert.ok(at(full.glintX, S.settled) < at(full.glintX, S.held), 'it sweeps across');
  for (const k of [fullNoGlint, calm]) {
    samples.forEach((x) => assert.equal(at(k.glintOpacity, x), 0, 'no glint under Reduce Flashes'));
  }
}

// Reduce Motion: in place, face-on, hero size, no overshoot — a crossfade,
// then the same readable gold hold.
{
  samples.forEach((x) => {
    assert.equal(at(calm.scale, x), 1, 'no zoom');
    assert.equal(at(calm.travel, x), 1, 'no flight');
    assert.equal(at(calm.tilt, x), 1, 'no turn');
    assert.equal(at(calm.edge, x), 0, 'no edge');
  });
  assert.equal(at(calm.hero, S.arrived), 1);
  assert.equal(at(calm.hero, S.held), 1);
  assert.ok(at(calm.glow, S.held) > 0.5, 'the gold glow holds');
}

// Timing: the reward cue lands at arrival, Results only after the hold and
// exit, and lift-off never overlaps the castle's gold hit.
{
  for (const mode of ['full', 'calm'] as const) {
    const t = DAILY_COIN_FINALE[mode];
    const hold = t.floorHoldMs;
    assert.equal(dailyCoinFinaleArrivalMs(mode, hold), hold + t.flightMs);
    assert.equal(
      dailyCoinFinaleTotalMs(mode, hold),
      dailyCoinFinaleArrivalMs(mode, hold) + t.settleMs + t.holdMs + t.exitMs,
    );
  }
  // Full motion: the coin lands 1230 ms after the claim (throw 650, tunnel
  // beat 180, gate drop 400), long after the 700 ms gold hit.
  assert.equal(dailyCoinFinaleFloorHoldMs('full', 1230, dailyGoldHitMs(false)), DAILY_COIN_FINALE.full.floorHoldMs);
  // Reduce Motion: it lands at 320 ms (gate 120, beat 80, drop 120) while the
  // calm gold hit runs to 750 ms, so the floor hold stretches to clear it.
  const calmHold = dailyCoinFinaleFloorHoldMs('calm', 320, dailyGoldHitMs(true));
  assert.equal(320 + calmHold, dailyGoldHitMs(true));
  assert.ok(calmHold >= DAILY_COIN_FINALE.calm.floorHoldMs);
}

// Geometry: on every phone the hero is whole on screen, clear of the top
// inset, above the floor coin, and substantially bigger than it.
{
  const phones = [
    { w: 375, h: 667, top: 20, bottom: 0 },
    { w: 390, h: 844, top: 47, bottom: 34 },
    { w: 430, h: 932, top: 59, bottom: 34 },
    { w: 360, h: 800, top: 24, bottom: 0 },
    { w: 412, h: 915, top: 24, bottom: 16 },
  ];
  for (const p of phones) {
    const frame = resolveDailyCastleFrame({ windowWidth: p.w, windowHeight: p.h, bottomInset: p.bottom });
    const g = resolveDailyCoinFinaleGeometry(frame, p.w, p.h, p.top);
    const label = `${p.w}x${p.h}`;
    assert.ok(g.hero.y - g.size / 2 >= p.top, `${label}: hero clear of the top inset`);
    assert.ok(g.hero.y + g.size / 2 <= p.h, `${label}: hero above the screen bottom`);
    assert.ok(g.hero.x - g.size / 2 >= 0 && g.hero.x + g.size / 2 <= p.w, `${label}: hero across the screen`);
    assert.ok(g.start.y > g.hero.y, `${label}: the coin flies up off the floor`);
    assert.ok(1 / g.startScale >= 2.2, `${label}: hero ${(1 / g.startScale).toFixed(2)}x the floor coin`);
    assert.ok(close(g.startScale * g.size, DAILY_FLOOR_COINS.gold.width * frame.scale), `${label}: start is floor size`);
  }
}

// Where the progress rests: at gone after a win (the floor stays empty behind
// Results), at rest otherwise; only a session in play resets it, when its
// gold coin is sunk out of sight.
{
  assert.equal(dailyCoinFinaleRestingStep('won'), S.gone);
  assert.equal(dailyCoinFinaleRestingStep('active'), S.landed);
  assert.equal(dailyCoinFinaleRestingStep('lost'), S.landed);
  assert.equal(dailyCoinFinaleRestingStep(null), S.landed);
  for (const k of [full, calm]) {
    assert.equal(at(k.floor, dailyCoinFinaleRestingStep('won')), 0, 'won: no floor coin behind Results');
    assert.equal(at(k.hero, dailyCoinFinaleRestingStep('won')), 0, 'won: no hero behind Results');
    assert.equal(at(k.veil, dailyCoinFinaleRestingStep('won')), 0, 'won: no veil behind Results');
  }
  assert.equal(dailyCoinFinaleResetsFor('active'), true, 'a new session resets');
  assert.equal(dailyCoinFinaleResetsFor('won'), false, 'the win never resets under Results');
  assert.equal(dailyCoinFinaleResetsFor('lost'), false);
  assert.equal(dailyCoinFinaleResetsFor(null), false);
  const screen = readFileSync(join(__dirname, '../screens/DailyChallengeScreen.tsx'), 'utf8');
  assert.ok(
    !/coinFinale\.setValue\(0\)/.test(screen),
    'the screen never snaps the finale back to rest outside the new-session reset',
  );
}

// The reward chime and Success haptic belong to the finale's arrival, not the
// claim: the screen plays them once, from the finale.
{
  const screen = readFileSync(join(__dirname, '../screens/DailyChallengeScreen.tsx'), 'utf8');
  const chimes = screen.split("playSfx('mastered')").length - 1;
  const successes = screen.split("Haptics.cueAsync('mastery')").length - 1;
  assert.equal(chimes, 1, 'one reward chime');
  assert.equal(successes, 1, 'one Success haptic');
  const finale = screen.indexOf('const runGoldCoinFinale');
  assert.ok(finale > 0 && screen.indexOf("playSfx('mastered')") > finale, 'the chime is in the finale');
}

console.log('dailyCoinFinale tests passed');
