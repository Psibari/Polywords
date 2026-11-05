import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveDailyCelebrationGrade } from '../game/dailyClaimPresentation';
import {
  DAILY_BREACH_HOLE,
  DAILY_CASTLE_FLIGHT,
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
  DAILY_BREACH_GATE_RISE_MS,
  dailyBreachBeats,
  dailyBreachCrackLines,
  dailyBreachCrackPath,
  dailyBreachPollyMoveMs,
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

  // The screen still computes it that way. If either function changes, this
  // model has to change with it (or replace it).
  const screen = readFileSync(join(__dirname, '../screens/DailyChallengeScreen.tsx'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(
    screen,
    /function dailyGateRiseMs\(motion: boolean\): number \{\n  return motion \? 400 : 120;\n\}/,
    'dailyGateRiseMs is still 400 / 120',
  );
  assert.match(
    screen,
    /function dailyThrowGoneMs\(motion: boolean\): number \{\n  const flightMs = motion \? DAILY_CASTLE_FLIGHT\.riseMs \+ DAILY_CASTLE_FLIGHT\.absorbMs : 0;\n  return Math\.max\(dailyGateRiseMs\(motion\), flightMs\);\n\}/,
    'dailyThrowGoneMs is still max(gate rise, flight)',
  );
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
  assert.match(gate, /source=\{GATE\}[\s\S]*?opacity: broken \? 0 : 1/);
  assert.match(gate, /source=\{GATE_BROKEN\}[\s\S]*?opacity: broken \? 1 : 0/);
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

console.log('dailyBreach tests passed');
