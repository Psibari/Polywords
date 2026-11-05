import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveDailyCelebrationGrade } from '../game/dailyClaimPresentation';
import {
  DAILY_BREACH_HOLE,
  DAILY_CAP_CENTRES,
  DAILY_CASTLE_FLIGHT,
  DAILY_CASTLE_FLIGHT_HANDOFF,
  DAILY_CASTLE_GRID,
  DAILY_GOLD_HALO,
  DAILY_GOLD_HIT_TIERS,
  DAILY_GOLD_HIT_WHITE,
  dailyGoldHitKeyframes,
  dailyGoldHitMs,
  dailyGoldHitMsForTier,
  dailyGoldHitTierKeyframes,
  DAILY_CLUE_TOP_MAX,
  DAILY_CLUE_TOP_PREFERRED,
  DAILY_GATE_ART,
  DAILY_GATE_CLUE_PLANKS,
  DAILY_GATE_PT_PER_SRC,
  dailyBreachHoleCanvas,
  dailyBreachHoleInGate,
  dailyGateClosed,
} from './dailyCastleScene';
import {
  DAILY_BREACH_CALM_GATE_RISE_MS,
  DAILY_BREACH_CRACK_SEED,
  DAILY_BREACH_CRACKS,
  DAILY_BREACH_DUST,
  DAILY_BREACH_FLASH_LIMIT,
  DAILY_BREACH_GATE_JITTER,
  DAILY_BREACH_GATE_RISE_MS,
  DAILY_BREACH_PLAQUE_PRESS,
  DAILY_BREACH_LIGHTNING,
  DAILY_BREACH_SEEDS,
  DAILY_BREACH_SHAKE,
  DAILY_BREACH_SPLINTERS,
  BREACH_CONTACT_LEAD_MS,
  dailyBreachBeats,
  dailyBreachBoltKeyframes,
  dailyBreachClockMs,
  dailyBreachContactCueMs,
  dailyBreachCracksOnClock,
  dailyBreachGateJitterOnClock,
  dailyBreachOnClock,
  dailyBreachPressOnClock,
  dailyBreachShakeOnClock,
  dailyGoldHitPhaseOnClock,
  dailyBreachBolts,
  dailyBreachCrackLines,
  dailyBreachCrackPath,
  dailyBreachDust,
  dailyBreachDustKeyframes,
  dailyBreachEffectsMs,
  dailyBreachFlashCount,
  dailyBreachFlashes,
  dailyBreachFlashKeyframes,
  dailyBreachFlashOpacity,
  dailyBreachGateJitterKeyframes,
  dailyBreachShakeKeyframes,
  dailyBreachSplinterKeyframes,
  dailyBreachSplinters,
  dailyBreachPollyMoveMs,
  dailyFlightLayerOpacity,
  dailyGateBreakKeyframes,
  dailyGateShownClueCount,
  resolveDailyBreachTier,
  type DailyBreachTier,
} from './dailyBreach';

const TIERS: readonly DailyBreachTier[] = ['open', 'hit', 'smash'];

// Tier: one clue ladder. Every count, and the mapping goes through the grade.
{
  assert.equal(resolveDailyBreachTier(0), 'smash');
  assert.equal(resolveDailyBreachTier(1), 'smash');
  assert.equal(resolveDailyBreachTier(2), 'hit');
  assert.equal(resolveDailyBreachTier(3), 'open');
  assert.equal(resolveDailyBreachTier(4), 'open');
  const byGrade = { solved: 'open', sharp: 'hit', cold: 'smash' } as const;
  for (let count = 0; count <= 4; count += 1) {
    assert.equal(
      resolveDailyBreachTier(count),
      byGrade[resolveDailyCelebrationGrade(count)],
      `tier follows the celebration grade at ${count} clues`,
    );
  }
}

// Beats with motion on: the approved 4 Nov mock.
assert.deepEqual(dailyBreachBeats('open', true), {
  contactMs: null,
  plaqueRiseMs: 450,
  plaqueAbsorbMs: 200,
  gateRiseStartMs: 0,
  gateRiseMs: 400,
  plaqueGoneMs: 650,
  gateUpMs: 400,
  thrownGoneMs: 650,
});
assert.deepEqual(dailyBreachBeats('hit', true), {
  contactMs: 450,
  plaqueRiseMs: 450,
  plaqueAbsorbMs: 200,
  gateRiseStartMs: 1210,
  gateRiseMs: 400,
  plaqueGoneMs: 1410,
  gateUpMs: 1610,
  thrownGoneMs: 1610,
});
assert.deepEqual(dailyBreachBeats('smash', true), {
  contactMs: 380,
  plaqueRiseMs: 380,
  plaqueAbsorbMs: 200,
  gateRiseStartMs: 1060,
  gateRiseMs: 400,
  plaqueGoneMs: 580,
  gateUpMs: 1460,
  thrownGoneMs: 1460,
});

// Beats with motion off: today's calm sequence, identical for every tier.
for (const tier of TIERS) {
  assert.deepEqual(dailyBreachBeats(tier, false), {
    contactMs: null,
    plaqueRiseMs: 0,
    plaqueAbsorbMs: 0,
    gateRiseStartMs: 0,
    gateRiseMs: 120,
    plaqueGoneMs: 0,
    gateUpMs: 120,
    thrownGoneMs: 120,
  }, `calm ${tier}`);
}

// 'open' is today's throw exactly: dailyThrowGoneMs(motion) in DailyChallengeScreen
// is max(dailyGateRiseMs(motion), motion ? riseMs + absorbMs : 0).
{
  for (const motion of [true, false]) {
    const gateRiseMs = motion ? DAILY_BREACH_GATE_RISE_MS : DAILY_BREACH_CALM_GATE_RISE_MS;
    const flightMs = motion ? DAILY_CASTLE_FLIGHT.riseMs + DAILY_CASTLE_FLIGHT.absorbMs : 0;
    assert.equal(dailyBreachBeats('open', motion).thrownGoneMs, Math.max(gateRiseMs, flightMs));
  }
  assert.equal(dailyBreachBeats('open', true).thrownGoneMs, 650);
  assert.equal(dailyBreachBeats('open', false).thrownGoneMs, 120);

  // The screen reads both straight from this model, per tier (2026-11-04: the
  // breach wiring replaced the old max(gate rise, flight) bodies, so 'open'
  // above IS the screen's old timing).
  const screen = readFileSync(join(__dirname, '../screens/DailyChallengeScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(
    screen,
    /function dailyGateRiseMs\(motion: boolean, tier: DailyBreachTier\): number \{\n  return dailyBreachBeats\(tier, motion\)\.gateRiseMs;\n\}/,
    'dailyGateRiseMs reads the tier\'s beats',
  );
  assert.match(
    screen,
    /function dailyThrowGoneMs\(motion: boolean, tier: DailyBreachTier\): number \{\n  return dailyBreachBeats\(tier, motion\)\.thrownGoneMs;\n\}/,
    'dailyThrowGoneMs reads the tier\'s beats',
  );
  for (const tier of TIERS) {
    assert.equal(dailyBreachBeats(tier, true).gateRiseMs, 400, `${tier} gate rise with motion`);
    assert.equal(dailyBreachBeats(tier, false).gateRiseMs, 120, `${tier} gate rise without`);
  }
}

// Invariants, every tier and mode: the throw is over only when both the plaque
// and the gate are; a struck or smashed gate never lifts before the contact.
for (const tier of TIERS) {
  for (const motion of [true, false]) {
    const beats = dailyBreachBeats(tier, motion);
    const label = `${tier} motion=${motion}`;
    assert.ok(beats.thrownGoneMs >= beats.plaqueGoneMs, `${label}: thrown after the plaque`);
    assert.ok(beats.thrownGoneMs >= beats.gateUpMs, `${label}: thrown after the gate`);
    assert.equal(beats.gateUpMs, beats.gateRiseStartMs + beats.gateRiseMs, `${label}: gate up = start + rise`);
    if (motion && tier !== 'open') {
      assert.ok(beats.contactMs !== null, `${label}: has a contact beat`);
      assert.ok(beats.gateRiseStartMs >= beats.contactMs, `${label}: gate waits for contact`);
      assert.equal(beats.contactMs, beats.plaqueRiseMs, `${label}: contact is the end of the rise`);
    }
  }
}

// Polly's tier move.
assert.deepEqual(dailyBreachPollyMoveMs('open', true), { moveMs: 0, holdMs: 0 });
assert.deepEqual(dailyBreachPollyMoveMs('hit', true), { moveMs: 1073, holdMs: 1300 });
assert.deepEqual(dailyBreachPollyMoveMs('smash', true), { moveMs: 1570, holdMs: 1300 });
for (const tier of TIERS) {
  assert.deepEqual(dailyBreachPollyMoveMs(tier, false), { moveMs: 0, holdMs: 0 }, `no Polly move under Reduce Motion: ${tier}`);
}

// The breach hole: measured in the art, in the bottom two clue planks, and it
// travels with the gate.
{
  const k = DAILY_GATE_PT_PER_SRC;
  const line = (i: number) => DAILY_GATE_ART.firstLineSrc + DAILY_GATE_ART.plankPitchSrc * i;
  const [, plankB, plankC] = DAILY_GATE_CLUE_PLANKS;
  assert.ok(DAILY_BREACH_HOLE.ySrc > line(plankB) && DAILY_BREACH_HOLE.ySrc < line(plankC + 1), 'centre is in clue planks 2-3');
  assert.ok(Math.abs(DAILY_BREACH_HOLE.ySrc - line(plankB + 1)) < 12, 'centre sits about on the line between those two planks');
  const b = DAILY_BREACH_HOLE.boundsSrc;
  assert.ok(b.x0 < DAILY_BREACH_HOLE.xSrc && DAILY_BREACH_HOLE.xSrc < b.x1 && b.y0 < DAILY_BREACH_HOLE.ySrc && DAILY_BREACH_HOLE.ySrc < b.y1);
  assert.ok(b.y0 >= line(plankB) - 2, 'the hole does not reach into the first clue plank');
  const inGate = dailyBreachHoleInGate();
  assert.equal(inGate.x, DAILY_BREACH_HOLE.xSrc * k);
  assert.equal(inGate.y, DAILY_BREACH_HOLE.ySrc * k);
  for (const clueTop of [DAILY_CLUE_TOP_PREFERRED, DAILY_CLUE_TOP_MAX]) {
    const closed = dailyGateClosed(clueTop);
    const hole = dailyBreachHoleCanvas(clueTop);
    assert.ok(Math.abs(hole.x - (closed.x + inGate.x)) < 1e-9 && Math.abs(hole.y - (closed.y + inGate.y)) < 1e-9, `hole = gate origin + art offset at ${clueTop}`);
  }
  const shift = dailyBreachHoleCanvas(DAILY_CLUE_TOP_MAX).y - dailyBreachHoleCanvas().y;
  assert.ok(Math.abs(shift - (DAILY_CLUE_TOP_MAX - DAILY_CLUE_TOP_PREFERRED)) < 1e-9, 'the hole moves 1:1 with clueTop');
  // The 2026-11-04 cross-check at the default clue top: (211.0, 341.6), against
  // the mock's (208, 341) and the plaque handoff (215, 342).
  const atDefault = dailyBreachHoleCanvas();
  assert.ok(Math.abs(atDefault.x - 210.99) < 0.01 && Math.abs(atDefault.y - 341.64) < 0.01, `default hole ${atDefault.x}, ${atDefault.y}`);
  assert.ok(Math.abs(atDefault.x - DAILY_CASTLE_FLIGHT.handoff.x) < 5 && Math.abs(atDefault.y - DAILY_CASTLE_FLIGHT.handoff.y) < 1, 'within 5 / 1 pt of the handoff at the default clue top');
}

// Cracks: fixed seed, same every time, seven lines of four segments.
{
  const c = DAILY_BREACH_CRACKS;
  const lines = dailyBreachCrackLines();
  assert.deepEqual(dailyBreachCrackLines(), lines, 'deterministic');
  assert.deepEqual(dailyBreachCrackLines(DAILY_BREACH_CRACK_SEED), lines, 'the default is the fixed seed');
  assert.notDeepEqual(dailyBreachCrackLines(DAILY_BREACH_CRACK_SEED + 1), lines, 'the seed is what decides them');
  assert.equal(lines.length, 7);
  lines.forEach((points, line) => {
    assert.equal(points.length, c.segmentsPerLine + 1, `line ${line} has four segments`);
    assert.deepEqual(points[0], { x: 0, y: 0 }, `line ${line} starts at the hole centre`);
    const direction = -Math.PI / 2 + (line * 2 * Math.PI) / c.lineCount;
    for (let i = 1; i < points.length; i += 1) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      const length = Math.hypot(dx, dy);
      assert.ok(length >= c.segmentMinPt - 1e-9 && length <= c.segmentMaxPt + 1e-9, `segment length ${length}`);
      const off = Math.atan2(Math.sin(Math.atan2(dy, dx) - direction), Math.cos(Math.atan2(dy, dx) - direction));
      assert.ok(Math.abs(off) <= c.wobbleRad + 1e-9, `segment wobble ${off}`);
    }
  });
  const d = dailyBreachCrackPath({ x: 100, y: 200 });
  assert.equal((d.match(/M/g) ?? []).length, 7);
  assert.equal((d.match(/L/g) ?? []).length, 28);
  assert.ok(d.startsWith('M100 200 '), 'path starts at the given origin');
  assert.equal(dailyBreachCrackPath({ x: 100, y: 200 }), d, 'path is deterministic');
  assert.equal(c.color, '#12041F');
  assert.equal(c.strokeWidth, 1.6);
}

// The broken gate shows the first clue only, whatever revealedCount says.
for (const revealed of [1, 2, 3] as const) {
  assert.equal(dailyGateShownClueCount(revealed, true), 1, `broken, ${revealed} revealed`);
  assert.equal(dailyGateShownClueCount(revealed, false), revealed, `intact, ${revealed} revealed`);
}

// DailyGate (React Native, so checked by source): it renders only the shown
// clues, keeps both doors mounted, draws the cracks under the clue text, and
// keeps one transform shape whether or not the optional channels are passed.
{
  const gate = readFileSync(join(__dirname, '../components/DailyGate.tsx'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(gate, /const shownCount = dailyGateShownClueCount\(revealedCount, broken\);\n  const visibleClues = clues\.slice\(0, shownCount\);/);
  assert.doesNotMatch(gate, /clues\.slice\(0, revealedCount\)/, 'clues are never sliced by revealedCount directly');
  assert.match(gate, /\{visibleClues\.map\(/, 'only visible clues are rendered');
  assert.match(gate, /broken = false,/, 'broken defaults to false');
  // Both doors mounted; the art switch is an Animated node (the caller's native
  // value, or a resting one following `broken`), never a React-state style.
  assert.match(gate, /source=\{GATE\}[\s\S]*?opacity: wholeOpacity/);
  assert.match(gate, /source=\{GATE_BROKEN\}[\s\S]*?opacity: brokenOpacity/);
  assert.match(gate, /const brokenOpacity = \(brokenArt \?\? restingBrokenArt\)/);
  assert.match(gate, /const wholeOpacity = useMemo\(\(\) => Animated\.subtract\(1, brokenOpacity\), \[brokenOpacity\]\);/);
  assert.doesNotMatch(gate, /opacity: broken \?/, 'the art is never switched by a render');
  assert.doesNotMatch(gate, /<Image\b/, 'both doors are Animated.Image');
  assert.match(gate, /gate_door_broken\.png/);
  assert.match(gate, /transform: \[\{ translateY \}, \{ translateX \}\]/);
  assert.match(gate, /const translateX = jitterX \?\? restingJitterX;/);
  assert.match(gate, /const cracksOpacity = cracks \?\? restingCracks;/);
  const cracksAt = gate.indexOf('<Path');
  const cluesAt = gate.indexOf('{visibleClues.map(');
  assert.ok(cracksAt > gate.indexOf('source={GATE_BROKEN}') && cracksAt < cluesAt, 'cracks draw over the doors and under the clue text');
  assert.match(gate, /const CRACK_PATH = dailyBreachCrackPath\(dailyBreachHoleInGate\(\)\);/, 'cracks are built once, at module load');
  assert.doesNotMatch(gate, /Math\.random/, 'no random at render time');
}

// ── Tiered gold hit ──
{
  assert.deepEqual(DAILY_GOLD_HIT_TIERS, {
    open: {
      igniteMs: 100, holdMs: 260, decayMs: 500,
      keyframes: { trim: [0, 1, 1, 0], tint: [0, 0.85, 0.7, 0], glow: [0, 1, 1, 0], glowScale: [0.9, 1.45, 1.25, 1], white: [0, 0.18, 0.06, 0] },
      halo: 1,
    },
    hit: {
      igniteMs: 80, holdMs: 340, decayMs: 560,
      keyframes: { trim: [0, 1, 1, 0], tint: [0, 1, 0.9, 0], glow: [0, 1, 1, 0], glowScale: [0.9, 1.75, 1.5, 1], white: [0, 0.45, 0.18, 0] },
      halo: 1.5,
    },
    smash: {
      igniteMs: 70, holdMs: 460, decayMs: 700,
      keyframes: { trim: [0, 1, 1, 0], tint: [0, 1, 1, 0], glow: [0, 1, 1, 0], glowScale: [0.9, 2.1, 1.8, 1], white: [0, 0.6, 0.25, 0] },
      halo: 2.2,
    },
  });
  assert.equal(DAILY_GOLD_HIT_WHITE, '#FFF6D8');
  assert.equal(dailyGoldHitMsForTier('open'), 860);
  assert.equal(dailyGoldHitMsForTier('hit'), 980);
  assert.equal(dailyGoldHitMsForTier('smash'), 1230);
  for (const tier of TIERS) {
    // Calm: today's calm hit, every tier, no white and no halo.
    assert.equal(dailyGoldHitMsForTier(tier, true), dailyGoldHitMs(true), `calm ${tier} length`);
    assert.deepEqual(
      dailyGoldHitTierKeyframes(tier, true),
      { ...dailyGoldHitKeyframes(true), white: [0, 0, 0, 0], halo: [0, 0, 0, 0] },
      `calm ${tier} keyframes`,
    );
    const keys = dailyGoldHitTierKeyframes(tier, false);
    for (const name of ['trim', 'tint', 'glow', 'white', 'halo'] as const) {
      assert.equal(keys[name][0], 0, `${tier} ${name} rests at 0`);
      assert.equal(keys[name][3], 0, `${tier} ${name} leaves nothing behind`);
    }
    // The peak and hold are over before that tier's throw is.
    const t = DAILY_GOLD_HIT_TIERS[tier];
    assert.ok(t.igniteMs + t.holdMs < dailyBreachBeats(tier, true).thrownGoneMs, `${tier} peak and hold before the throw ends`);
  }
  // halo opacity = min(1, trim * 0.55 * halo).
  assert.deepEqual(dailyGoldHitTierKeyframes('open', false).halo, [0, 0.55, 0.55, 0]);
  const hitHalo = dailyGoldHitTierKeyframes('hit', false).halo;
  assert.ok(Math.abs(hitHalo[1] - 0.825) < 1e-9 && Math.abs(hitHalo[2] - 0.825) < 1e-9);
  assert.deepEqual(dailyGoldHitTierKeyframes('smash', false).halo, [0, 1, 1, 0], 'capped at 1');
  assert.deepEqual(
    { w: DAILY_GOLD_HALO.width, h: DAILY_GOLD_HALO.height, c: DAILY_GOLD_HALO.centre, o: DAILY_GOLD_HALO.peakOpacity, f: DAILY_GOLD_HALO.fadeOffset },
    { w: 430, h: 520, c: { x: 0.5, y: 0.38 }, o: 0.55, f: 0.68 },
  );
}

// ── Castle shake ──
for (const profile of ['hit', 'smash'] as const) {
  const keys = dailyBreachShakeKeyframes(profile);
  assert.deepEqual(dailyBreachShakeKeyframes(profile), keys, `${profile} shake is deterministic`);
  for (const axis of ['x', 'y'] as const) {
    const { inputRange, outputRange } = keys[axis];
    assert.equal(inputRange[0], 0);
    assert.equal(inputRange[inputRange.length - 1], 1);
    assert.ok(Object.is(outputRange[0], 0), `${profile} ${axis} starts at exactly 0`);
    assert.ok(Object.is(outputRange[outputRange.length - 1], 0), `${profile} ${axis} ends at exactly 0`);
    for (let i = 1; i < inputRange.length; i += 1) assert.ok(inputRange[i] > inputRange[i - 1], 'increasing input');
    inputRange.forEach((t, i) => {
      assert.ok(Math.abs(outputRange[i]) <= DAILY_BREACH_SHAKE[profile].amplitudePt * (1 - t) + 1e-9, `${profile} ${axis} decays linearly`);
    });
    assert.ok(outputRange.some((v) => Math.abs(v) > DAILY_BREACH_SHAKE[profile].amplitudePt * 0.5), `${profile} ${axis} actually shakes`);
  }
  assert.notDeepEqual(keys.x.outputRange, keys.y.outputRange, 'the axes differ');
}
assert.deepEqual(
  { hit: DAILY_BREACH_SHAKE.hit, smash: DAILY_BREACH_SHAKE.smash },
  { hit: { amplitudePt: 7, ms: 720 }, smash: { amplitudePt: 13, ms: 950 } },
);

// ── Lightning ──
{
  const L = DAILY_BREACH_LIGHTNING;
  const hole = dailyBreachHoleCanvas();
  const bolts = dailyBreachBolts(hole);
  assert.deepEqual(dailyBreachBolts(hole), bolts, 'bolts are deterministic');
  assert.notDeepEqual(bolts[0], bolts[1], 'two different bolt shapes');
  assert.deepEqual(DAILY_CAP_CENTRES[0], { x: 106 / 3, y: 307 / 3 }, 'left cap (35.3, 102.3)');
  assert.deepEqual(DAILY_CAP_CENTRES[1], { x: 1183 / 3, y: 307 / 3 }, 'right cap (394.3, 102.3)');
  const targets = { hole, left: DAILY_CAP_CENTRES[0], right: DAILY_CAP_CENTRES[1] } as const;
  for (const bolt of bolts) {
    for (const branch of ['hole', 'left', 'right'] as const) {
      const points = bolt[branch];
      const [minX, maxX] = L.startX[branch];
      assert.ok(points[0].x >= minX && points[0].x <= maxX && points[0].y === L.startY, `${branch} starts in the sky`);
      assert.deepEqual(points[points.length - 1], { x: targets[branch].x, y: targets[branch].y }, `${branch} ends on its target`);
      for (let i = 1; i < points.length - 1; i += 1) {
        const dy = points[i].y - points[i - 1].y;
        assert.ok(dy >= L.stepPt[0] - 1e-9 && dy <= L.stepPt[1] + 1e-9, `${branch} segment drop ${dy}`);
      }
    }
  }
  for (const index of [0, 1] as const) {
    const keys = dailyBreachBoltKeyframes(index);
    assert.deepEqual(keys.outputRange, [0, 1, 1, 0]);
    assert.equal(keys.inputRange[1], L.boltAtMs[index]);
    assert.equal(keys.inputRange[2] - keys.inputRange[1], 70, 'each bolt lasts 70 ms');
  }
  assert.deepEqual([...L.boltAtMs], [110, 190], '110 ms, then 80 ms later');
}

// ── Screen flashes and the photosensitivity limit ──
{
  assert.deepEqual(dailyBreachFlashes('open'), []);
  assert.deepEqual(dailyBreachFlashes('hit'), [{ atMs: 0, peak: 0.18, decayMs: 200 }]);
  assert.deepEqual(dailyBreachFlashes('smash'), [
    { atMs: 110, peak: 0.5, decayMs: 200 },
    { atMs: 190, peak: 0.5, decayMs: 200 },
  ]);
  for (const tier of ['hit', 'smash'] as const) {
    const flashes = dailyBreachFlashes(tier);
    const keys = dailyBreachFlashKeyframes(flashes);
    for (let i = 1; i < keys.inputRange.length; i += 1) assert.ok(keys.inputRange[i] > keys.inputRange[i - 1], `${tier} flash input increases`);
    assert.equal(keys.outputRange[keys.outputRange.length - 1], 0, `${tier} flash ends at 0`);
    // Linear interpolation of the keyframes is the flash curve itself.
    const lerp = (t: number) => {
      const { inputRange: xs, outputRange: ys } = keys;
      if (t <= xs[0]) return ys[0];
      for (let i = 1; i < xs.length; i += 1) {
        if (t <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (t - xs[i - 1])) / (xs[i] - xs[i - 1]);
      }
      return ys[ys.length - 1];
    };
    for (let t = 0; t <= 500; t += 1) {
      // Skip the half-millisecond ramp before each jump.
      if (flashes.some((f) => t > f.atMs - 0.5 && t < f.atMs)) continue;
      assert.ok(Math.abs(lerp(t) - dailyBreachFlashOpacity(flashes, t)) < 1e-9, `${tier} flash at ${t} ms`);
    }
  }
  assert.deepEqual({ ...DAILY_BREACH_FLASH_LIMIT }, { maxFlashes: 3, windowMs: 1000 });
  assert.equal(dailyBreachFlashCount('open'), 1, 'open: the white wash only');
  assert.equal(dailyBreachFlashCount('hit'), 2, 'hit: its flash and the white wash');
  assert.equal(dailyBreachFlashCount('smash'), 3, 'smash: two bolts and the white wash, the maximum');
  for (const tier of TIERS) assert.ok(dailyBreachFlashCount(tier) <= DAILY_BREACH_FLASH_LIMIT.maxFlashes);
  // The smash's three, from the claim: the white wash peaks at the gold hit's
  // ignition, the bolts fire after contact. All inside one second.
  const contact = dailyBreachBeats('smash', true).contactMs ?? 0;
  const times = [DAILY_GOLD_HIT_TIERS.smash.igniteMs, ...DAILY_BREACH_LIGHTNING.boltAtMs.map((at) => contact + at)];
  assert.ok(Math.max(...times) - Math.min(...times) < 700, `smash flashes within about 700 ms: ${times.join(', ')}`);
}

// ── Splinters and dust ──
{
  const S = DAILY_BREACH_SPLINTERS;
  const splinters = dailyBreachSplinters();
  assert.deepEqual(dailyBreachSplinters(), splinters, 'splinters are deterministic');
  assert.deepEqual(dailyBreachSplinters(DAILY_BREACH_SEEDS.splinters, 26), splinters);
  assert.equal(splinters.length, 26);
  const allowed = new Set<string>([...S.colors, S.gold]);
  for (const p of splinters) {
    assert.ok(p.width >= 4 && p.width <= 10 && p.height >= 16 && p.height <= 46, 'sliver size');
    assert.ok(allowed.has(p.color), `colour ${p.color}`);
    const speed = Math.hypot(p.vx, p.vy + S.kickUpPtPerS);
    assert.ok(speed >= 180 - 1e-9 && speed <= 520 + 1e-9, `throw speed ${speed}`);
    assert.ok(Math.abs(p.spinDegPerS) <= 700, 'spin');
    assert.ok(Math.abs(p.dx) <= S.spawnPt.x && Math.abs(p.dy) <= S.spawnPt.y, 'from around the hole');
    const keys = dailyBreachSplinterKeyframes(p);
    assert.equal(keys.opacity[0], 1);
    assert.equal(keys.opacity[keys.opacity.length - 1], 0, 'fades out over 1.0 s');
    assert.equal(keys.inputRange[keys.inputRange.length - 1], 1000);
    assert.equal(keys.x[0], p.dx);
    assert.equal(keys.y[0], p.dy);
    const last = keys.inputRange.length - 1;
    assert.ok(Math.abs(keys.y[last] - (p.dy + p.vy + 0.5 * 1300)) < 1e-9, 'gravity 1300 pt/s^2');
  }
  const gold = splinters.filter((p) => p.color === S.gold).length;
  assert.ok(gold >= 1 && gold <= 6, `a few gold splinters (${gold})`);

  for (const tier of ['hit', 'smash'] as const) {
    const dust = dailyBreachDust(tier);
    assert.deepEqual(dailyBreachDust(tier), dust, `${tier} dust is deterministic`);
    assert.equal(dust.length, tier === 'hit' ? 7 : 9);
    for (const puff of dust) assert.ok(puff.size >= 26 && puff.size <= 60, 'puff size');
  }
  assert.deepEqual(DAILY_BREACH_DUST.hit.at, { x: 215, y: 342 }, 'hit dust at the handoff');
  const dustKeys = dailyBreachDustKeyframes();
  assert.equal(dustKeys.inputRange[dustKeys.inputRange.length - 1], 700);
  assert.ok(Math.abs(dustKeys.rise[0]) < 1e-9 && dustKeys.rise[dustKeys.rise.length - 1] === -34, 'rises 34 pt');
  assert.ok(Math.abs(dustKeys.scale[0] - 0.6) < 1e-9 && Math.abs(dustKeys.scale[dustKeys.scale.length - 1] - 1.7) < 1e-9, 'grows 0.6 to 1.7');
  assert.equal(dustKeys.opacity[0], 1);
  assert.equal(dustKeys.opacity[dustKeys.opacity.length - 1], 0, 'fades over 700 ms');

  assert.equal(dailyBreachEffectsMs('open'), 0);
  assert.equal(dailyBreachEffectsMs('hit'), 700);
  assert.equal(dailyBreachEffectsMs('smash'), 1000);
}

// The stage (React Native, so checked by source): the breach shake is its own
// parent transform, the wall keeps its tremble channel, the white flash sits
// outside the shake, and nothing is random at render time.
{
  const stage = readFileSync(join(__dirname, '../components/DailyCastleStage.tsx'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(stage, /style=\{\[styles\.shakeWorld, \{ transform: shakeTransform \}\]\}/);
  assert.match(stage, /style=\{\[styles\.wallGroup, \{ transform: wallTrembleTransform \}\]\}/, 'the wall keeps its own tremble');
  const shakeOpen = stage.indexOf('styles.shakeWorld');
  const flashAt = stage.indexOf('styles.breachFlash, {');
  const wallAt = stage.indexOf('styles.wallGroup, {');
  assert.ok(shakeOpen > 0 && wallAt > shakeOpen, 'the wall group is inside the shaking world');
  const shakeClose = stage.indexOf('      </Animated.View>\n\n      {/* The one shared full-stage white flash');
  assert.ok(shakeClose > shakeOpen, 'the shaking world closes just before the white flash');
  assert.ok(flashAt > shakeClose, 'the white flash is outside the shake');
  for (const source of [stage, readFileSync(join(__dirname, 'dailyBreach.ts'), 'utf8')]) {
    assert.doesNotMatch(source, /Math\.random/, 'no random at render time');
  }
}

// ── The gate's shudder (DailyGate jitterX) ──
for (const profile of ['hit', 'smash'] as const) {
  const keys = dailyBreachGateJitterKeyframes(profile);
  assert.deepEqual(dailyBreachGateJitterKeyframes(profile), keys, `${profile} gate jitter is deterministic`);
  assert.ok(Object.is(keys.outputRange[0], 0) && Object.is(keys.outputRange[keys.outputRange.length - 1], 0), `${profile} jitter rests at 0`);
  assert.equal(keys.inputRange[0], 0);
  assert.equal(keys.inputRange[keys.inputRange.length - 1], 1);
  const { amplitudePt } = DAILY_BREACH_GATE_JITTER[profile];
  keys.inputRange.forEach((t, i) => assert.ok(Math.abs(keys.outputRange[i]) <= amplitudePt * (1 - t) + 1e-9, `${profile} jitter decays`));
  assert.ok(keys.outputRange.some((v) => Math.abs(v) > amplitudePt * 0.4), `${profile} jitter actually moves`);
}
assert.deepEqual(
  { hit: DAILY_BREACH_GATE_JITTER.hit, smash: DAILY_BREACH_GATE_JITTER.smash },
  { hit: { amplitudePt: 3.5, ms: 720 }, smash: { amplitudePt: 4, ms: 500 } },
);
assert.deepEqual({ ...DAILY_BREACH_PLAQUE_PRESS }, { dipPt: 6, scaleDown: 0.04, inMs: 45, outMs: 45 });
assert.equal(DAILY_BREACH_PLAQUE_PRESS.inMs + DAILY_BREACH_PLAQUE_PRESS.outMs, 90, 'the press lasts 90 ms');

// ── The plaque's copies and the broken art, per tier ──
// Which copy is visible at a given progress, and whether the hole is open.
{
  const H = DAILY_CASTLE_FLIGHT_HANDOFF;
  const at = (keys: { inputRange: number[]; outputRange: number[] }, p: number) => {
    const { inputRange: xs, outputRange: ys } = keys;
    if (p <= xs[0]) return ys[0];
    for (let i = 1; i < xs.length; i += 1) {
      if (p <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (p - xs[i - 1])) / (xs[i] - xs[i - 1]);
    }
    return ys[ys.length - 1];
  };
  const fadeFrom = H + (1 - H) * 0.35;

  // 'open' (and 'smash'): today's keyframes, exactly.
  const standard = dailyFlightLayerOpacity(H, false);
  assert.deepEqual(standard.front, { inputRange: [0, H - 0.001, H], outputRange: [1, 1, 0] });
  assert.deepEqual(standard.back, { inputRange: [0, H - 0.001, H, fadeFrom, 1], outputRange: [0, 0, 1, 1, 0] });

  // 'hit': the front copy carries it the whole way; the back copy never shows.
  const hit = dailyFlightLayerOpacity(H, true);
  for (let p = 0; p <= 1.0000001; p += 0.005) {
    assert.equal(at(hit.back, p), 0, `hit: never under the gate (p ${p.toFixed(3)})`);
    if (p < 1 - 1e-9) assert.ok(at(hit.front, p) > 0, `hit: visible at p ${p.toFixed(3)}`);
  }
  assert.equal(at(hit.front, H), 1, 'hit: fully visible held at the shut gate');
  assert.equal(at(hit.front, 1), 0, 'hit: gone at the end of the tunnel');
  // Its fade into the tunnel matches the back copy's in the other tiers.
  for (const p of [fadeFrom, (fadeFrom + 1) / 2, 1]) {
    assert.ok(Math.abs(at(hit.front, p) - at(standard.back, p)) < 1e-9, `hit fades like the others at ${p}`);
  }

  // 'smash': the hole is open in every frame the plaque is behind the gate.
  const breakKeys = dailyGateBreakKeyframes(H);
  assert.deepEqual(breakKeys.inputRange, standard.back.inputRange.slice(0, 3), 'one swap window for both');
  for (let p = 0; p <= 1.0000001; p += 0.0005) {
    const back = at(standard.back, p);
    const hole = at(breakKeys, p);
    if (p <= H) assert.ok(Math.abs(hole - back) < 1e-9, `the hole opens with the swap (p ${p.toFixed(4)})`);
    else assert.equal(hole, 1, `the hole stays open through the absorb (p ${p.toFixed(4)})`);
  }
  assert.equal(at(breakKeys, H - 0.002), 0, 'whole gate on the way in');
  assert.equal(at(breakKeys, H), 1, 'broken at the handoff');
  assert.equal(at(standard.back, H), 1, 'the plaque is on the back copy at the handoff');
  assert.equal(at(standard.front, H), 0, 'and no longer on the front copy');
  // The plaque fits through the hole at the handoff (102 x 53 pt vs 154 x 130 pt).
  const k = DAILY_GATE_PT_PER_SRC;
  const b = DAILY_BREACH_HOLE.boundsSrc;
  assert.ok(DAILY_CASTLE_GRID.cardWidth * DAILY_CASTLE_FLIGHT.handoffScale < (b.x1 - b.x0) * k, 'plaque narrower than the hole');
  assert.ok(DAILY_CASTLE_GRID.cardHeight * DAILY_CASTLE_FLIGHT.handoffScale < (b.y1 - b.y0) * k, 'plaque shorter than the hole');

  // The stage reads these, not its own copy of them.
  const stage = readFileSync(join(__dirname, '../components/DailyCastleStage.tsx'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(stage, /const layers = dailyFlightLayerOpacity\(H, flight\.stayInFront === true\);/);
  assert.match(stage, /brokenArt=\{gateBrokenArt\}/);
  assert.doesNotMatch(stage, /frontThroughHandoff/);
}

// The claim sequence in DailyChallengeScreen (React Native, so checked by source).
{
  const screen = readFileSync(join(__dirname, '../screens/DailyChallengeScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const between = (start: string, end: string) => {
    const from = screen.indexOf(start);
    assert.ok(from >= 0, `found ${start}`);
    const to = screen.indexOf(end, from + start.length);
    assert.ok(to > from, `found ${end}`);
    return screen.slice(from, to);
  };
  // The tier comes from the claimed round's own clue count, before the claim commits.
  const claim = between('function handleClaim(\n', '// Wrong — the gate slams down');
  assert.match(claim, /const breachTier = resolveDailyBreachTier\(round\.revealedClueCount\);\n      setClaimBreachTier\(breachTier\);\n      beginClaimPresentation\(/);
  assert.match(claim, /runPhysicalCorrectTransition\(candidate, origin, breachTier\);/);
  // At the claim: the haptic always; the chime and gold hit only without a contact beat.
  assert.match(
    claim,
    /Haptics\.cueAsync\(dailyCelebrationHaptic\(grade\)\);[\s\S]*?if \(dailyBreachBeats\(breachTier, reduceMotion === false\)\.contactMs === null\) \{\n\s*playSfx\('correctClaim'\);[\s\S]*?setGoldHit\(/,
  );
  assert.equal(claim.split("playSfx('correctClaim')").length - 1, 1, 'one claim chime');

  const run = between('function runPhysicalCorrectTransition(', 'function handleClaimStart(');
  assert.match(run, /const beats = dailyBreachBeats\(breachTier, motion\);/);
  assert.match(run, /if \(beats\.gateRiseStartMs === 0\) raiseGate\(\);/, 'open and calm: the gate rises at once');
  assert.match(run, /stayInFront: breachTier === 'hit'/, 'a hit plaque stays in front of the shut gate');
  // The contact path (2026-11-04, measured on a phone: a contact TIMER that set
  // state put the sounds 270 ms and the lightning ~660 ms after the plaque).
  // At the claim: the gold tier (no token bump), and for a smash the broken
  // state and the armed hole. Nothing at contact renders.
  const atClaim = between('const contactTier = ', 'gatePosition.stopAnimation();');
  assert.match(atClaim, /setGoldHit\(\(prev\) => \(\{ token: prev\.token, tier: contactTier \}\)\);/, 'the gold tier is set at the claim, not bumped');
  assert.match(atClaim, /setGateBroken\(true\);\n\s*gateBreakArmed\.setValue\(1\);/);
  assert.doesNotMatch(run, /token: prev\.token \+ 1, tier: breachTier/, 'no gold hit token at contact');
  // The cues: guarded, sounds and haptic only, no state, no animation.
  const cues = between('const fireContactCues = () => {', '\n    };');
  assert.match(cues, /^const fireContactCues = \(\) => \{\n\s*if \(completingCandidateRef\.current !== candidate\) return;/);
  for (const needle of ["playSfx('breachGateCrack')", "playSfx('breachCastleRumble')", "playSfx('breachSmash')", "playSfx('breachThunder')", "Haptics.cueAsync('trapRejectHeavy')", "Haptics.cueAsync('bossEntry')"]) {
    assert.ok(cues.includes(needle), `contact cues: ${needle}`);
  }
  assert.doesNotMatch(cues, /\bset[A-Z]\w*\(|Animated\.|correctClaim/, 'nothing at contact but sounds and haptics');
  // On the plaque's real contact: the first leg's completion, cues FIRST.
  const legEnd = between('plaqueRiseLeg().start(({ finished }) => {', '\n      });');
  assert.ok(legEnd.indexOf('if (cuesOnLegEnd) fireContactCues();') > legEnd.indexOf('if (!finished) return;'), 'only on a finished leg');
  assert.ok(legEnd.indexOf('if (cuesOnLegEnd) fireContactCues();') < legEnd.indexOf('plaqueAbsorbLeg().start()'), 'cues before the absorb starts');
  assert.match(run, /const cuesOnLegEnd = contactTier !== null && BREACH_CONTACT_LEAD_MS === 0;/);
  assert.match(run, /scheduleCorrectTransition\(fireContactCues, dailyBreachContactCueMs\(contactTier\)\);/, 'a lead fires them early instead');
  // The tier's clock starts in the same tick as the first leg, just before it.
  const clockAt = run.indexOf('Animated.timing(clock, {');
  assert.ok(clockAt > 0 && clockAt < run.indexOf('plaqueRiseLeg().start('), 'clock and plaque start together');
  assert.match(run, /const clockMs = dailyBreachClockMs\(contactTier\);/);
  assert.equal(run.split('scheduleCorrectTransition(').length - 1, 6, 'no contact timer beyond the cue lead');
  // The broken gate is gone before the next round's gate drops.
  const landed = between("setPhysicalClaimPhase('landed');", '}, goneAtMs);');
  assert.ok(landed.includes('setGateBroken(false);'), 'whole gate again once it is up');
  // The smash's hole: armed at the claim, opened by the flight's own progress,
  // disarmed once the broken gate is up.
  assert.ok(landed.includes('gateBreakArmed.setValue(0);'), 'disarmed before the next gate drops');
  assert.match(
    screen,
    /const gateBrokenArt = useMemo\(\n\s*\(\) => Animated\.multiply\(\n\s*gateBreakArmed,\n\s*flightProgress\.interpolate\(\{\n\s*\.\.\.dailyGateBreakKeyframes\(DAILY_CASTLE_FLIGHT_HANDOFF\),/,
    'the hole is driven off the same progress as the plaque',
  );
  assert.match(screen, /gateBrokenArt=\{gateBrokenArt\}/);
  assert.ok(atClaim.includes('setGateBroken(true)'), 'clues two and three still hidden while broken');
  assert.match(run, /const runsProgress = flies \|\| beats\.contactMs !== null;/, 'a breach runs the progress even with no plaque drawn');
  assert.match(run, /const goneAtMs = dailyThrowGoneMs\(motion, breachTier\);/);
  assert.match(run, /const goldHitEndMs = \(beats\.contactMs \?\? 0\) \+ dailyGoldHitMsForTier\(breachTier, reduceFlashes\);/);
  assert.match(screen, /throwDelayMs=\{dailyThrowGoneMs\(reduceMotion === false, claimBreachTier\)\}/, 'Polly\'s bubble waits for the tier\'s throw');
  // Every new piece goes back to rest with the claim timers.
  assert.match(screen, /correctTransitionTimersRef\.current = \[\];\n    resetBreachPresentation\(\);/);
  assert.doesNotMatch(screen, /Math\.random/);
}

// ── The breach clocks ──
// Every contact visual rides its tier's clock: at rest before the contact and
// after its effect, and invisible at 0 (where the clock rests between claims).
{
  const sample = (keys: { inputRange: number[]; outputRange: number[] }, t: number) => {
    const { inputRange: xs, outputRange: ys } = keys;
    if (t <= xs[0]) return ys[0];
    for (let i = 1; i < xs.length; i += 1) {
      if (t <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (t - xs[i - 1])) / (xs[i] - xs[i - 1]);
    }
    return ys[ys.length - 1];
  };
  assert.equal(BREACH_CONTACT_LEAD_MS, 0, 'cues on the plaque\'s contact until a phone pass says otherwise');

  // dailyBreachOnClock: placement and the resting point before the start.
  assert.deepEqual(dailyBreachOnClock({ inputRange: [0, 1], outputRange: [0, 5] }, 100, 50), { inputRange: [100, 150], outputRange: [0, 5] });
  assert.deepEqual(dailyBreachOnClock({ inputRange: [0, 10], outputRange: [1, 0] }, 100, 1, 0), { inputRange: [99.5, 100, 110], outputRange: [0, 1, 0] });

  for (const tier of ['hit', 'smash'] as const) {
    const contact = dailyBreachBeats(tier, true).contactMs ?? 0;
    const clockMs = dailyBreachClockMs(tier);
    assert.equal(dailyBreachContactCueMs(tier), contact, `${tier}: cues at contact`);
    const sets: [string, { inputRange: number[]; outputRange: number[] }, number][] = [
      ['shake x', dailyBreachShakeOnClock(tier).x, 0],
      ['shake y', dailyBreachShakeOnClock(tier).y, 0],
      ['gate jitter', dailyBreachGateJitterOnClock(tier), 0],
      ['gold phase', dailyGoldHitPhaseOnClock(tier, DAILY_GOLD_HIT_TIERS[tier]), 0],
      ['calm gold phase', dailyGoldHitPhaseOnClock(tier, { igniteMs: 200, holdMs: 150, decayMs: 400 }), 0],
      ['flash', dailyBreachFlashKeyframes(dailyBreachFlashes(tier).map((f) => ({ ...f, atMs: f.atMs + contact }))), 0],
      ['dust opacity', dailyBreachOnClock({ inputRange: dailyBreachDustKeyframes().inputRange, outputRange: dailyBreachDustKeyframes().opacity }, contact, 1, 0), 0],
    ];
    if (tier === 'hit') {
      sets.push(['cracks', dailyBreachCracksOnClock(), 0], ['press', dailyBreachPressOnClock(), 0]);
    } else {
      for (const index of [0, 1] as const) {
        const k = dailyBreachBoltKeyframes(index);
        sets.push([`bolt ${index}`, { inputRange: k.inputRange.map((t) => t + contact), outputRange: k.outputRange }, 0]);
      }
      const k = dailyBreachSplinterKeyframes(dailyBreachSplinters()[0]);
      sets.push(['splinter opacity', dailyBreachOnClock({ inputRange: k.inputRange, outputRange: k.opacity }, contact, 1, 0), 0]);
    }
    for (const [name, keys, rest] of sets) {
      for (let i = 1; i < keys.inputRange.length; i += 1) assert.ok(keys.inputRange[i] > keys.inputRange[i - 1], `${tier} ${name}: increasing input`);
      assert.equal(sample(keys, 0), rest, `${tier} ${name}: at rest with the clock at 0`);
      assert.equal(sample(keys, contact - 1), rest, `${tier} ${name}: nothing before the contact`);
      assert.ok(Math.abs(sample(keys, clockMs)) < 1e-9 && sample(keys, clockMs + 1000) === sample(keys, clockMs), `${tier} ${name}: at rest when the clock ends`);
      assert.ok(keys.inputRange[keys.inputRange.length - 1] <= clockMs, `${tier} ${name}: inside the clock`);
      assert.ok(keys.inputRange.some((t, i) => t >= contact - 0.5 && keys.outputRange[i] !== rest), `${tier} ${name}: it does play, from the contact`);
    }
    // The gold hit lights at the contact, holds and goes, then drops back to 0.
    const t = DAILY_GOLD_HIT_TIERS[tier];
    const gold = dailyGoldHitPhaseOnClock(tier, t);
    assert.ok(Math.abs(sample(gold, contact + t.igniteMs) - 1) < 1e-9, `${tier}: ignited`);
    assert.ok(Math.abs(sample(gold, contact + t.igniteMs + t.holdMs) - 2) < 1e-9, `${tier}: held`);
    assert.ok(Math.abs(sample(gold, contact + t.igniteMs + t.holdMs + t.decayMs) - 3) < 1e-9, `${tier}: gone`);
  }
  // 'hit': the cracks fade from the gate's rise.
  assert.equal(sample(dailyBreachCracksOnClock(), dailyBreachBeats('hit', true).gateRiseStartMs), 1);
}

// The stage's breach layers are mounted with it (motion allowed), memoised, and
// played by the clocks; nothing about them waits for a claim or a contact.
{
  const stage = readFileSync(join(__dirname, '../components/DailyCastleStage.tsx'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(stage, /const DailyBreachEffectLayers = React\.memo\(function DailyBreachEffectLayers/);
  assert.match(stage, /\{breachLayers && <DailyBreachEffectLayers layers=\{breachLayers\}/);
  assert.match(stage, /const breachLayers = useMemo<DailyBreachLayers \| null>\(\(\) => \{\n\s*if \(!animateMotion\) return null;/);
  assert.doesNotMatch(stage, /setBreachRun|breachRun|breachEffects|shakeToken/, 'no mount-on-demand path left');
  assert.match(stage, /const phase = Animated\.add\(\n\s*goldHit,\n\s*Animated\.add\(phaseOnClock\('hit', hitClock\), phaseOnClock\('smash', smashClock\)\),/);
  const layers = between('const DailyBreachEffectLayers', 'const styles = StyleSheet.create');
  assert.equal(layers.split('pointerEvents="none"').length - 1, 3, 'bolts, dust and splinters never take touches');
  function between(start: string, end: string) {
    const from = stage.indexOf(start);
    assert.ok(from >= 0, `found ${start}`);
    return stage.slice(from, stage.indexOf(end, from));
  }
}

// The four breach sounds are rewound ahead of time and start with play() alone;
// every other sound keeps its rewind-then-play path.
{
  const sfx = readFileSync(join(__dirname, '../audio/sfx.ts'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(sfx, /const PRE_REWOUND_SFX: ReadonlySet<SfxName> = new Set<SfxName>\(\[\n  'breachGateCrack',\n  'breachCastleRumble',\n  'breachSmash',\n  'breachThunder',\n\]\);/);
  const play = sfx.slice(sfx.indexOf('async function playOnPlayer('), sfx.indexOf('function getOrCreateSlot('));
  const fast = play.indexOf('if (PRE_REWOUND_SFX.has(name) && item.rewound) {');
  assert.ok(fast > 0 && fast < play.indexOf('await item.player.seekTo(0, 0, 0);'), 'the pre-rewound start comes first');
  const fastPath = play.slice(fast, play.indexOf('    return;\n  }', fast));
  assert.ok(!fastPath.includes('await') && !fastPath.includes('seekTo') && fastPath.includes('item.player.play();'), 'no rewind on the contact path');
  assert.match(play, /item\.player\.pause\(\);\n\s*await item\.player\.seekTo\(0, 0, 0\);/, 'other sounds unchanged');
  assert.match(sfx, /onFinish\?\.\(\);\n  if \(PRE_REWOUND_SFX\.has\(name\)\) rewindAhead\(item\);/, 'rewound again when a play finishes');
  assert.match(sfx, /slot\.loadAttempts = 0;\n\s*if \(PRE_REWOUND_SFX\.has\(name\)\) rewindAhead\(item\);/, 'rewound when the player loads (warm-up)');
}

console.log('dailyBreach tests passed');
