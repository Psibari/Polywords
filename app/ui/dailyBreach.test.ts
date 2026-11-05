import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveDailyCelebrationGrade } from '../game/dailyClaimPresentation';
import { DAILY_CASTLE_FLIGHT } from './dailyCastleScene';
import {
  DAILY_BREACH_CALM_GATE_RISE_MS,
  DAILY_BREACH_GATE_RISE_MS,
  dailyBreachBeats,
  dailyBreachPollyMoveMs,
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

console.log('dailyBreach tests passed');
