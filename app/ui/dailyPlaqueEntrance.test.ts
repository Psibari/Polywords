import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DAILY_PLAQUE_DROP,
  DAILY_PLAQUE_ENTRANCE,
  DAILY_PLAQUE_INPUT,
  DAILY_PLAQUE_PEAK,
  DAILY_PLAQUE_PROUD,
  DAILY_PLAQUE_SCALE,
  DAILY_PLAQUE_SLOT_COUNT,
  DAILY_STONE_SEAT_RATES,
  dailyPlaqueEntranceCues,
  dailyPlaqueEntranceDelay,
  dailyPlaqueEntranceMs,
  dailyPlaqueImpactMs,
} from './dailyPlaqueEntrance';

const slots = Array.from({ length: DAILY_PLAQUE_SLOT_COUNT }, (_, index) => index);

// Sequencing: one block after another in reading order, 55-65 ms apart (a
// tighter stagger read as blinking on device).
{
  const { staggerMs } = DAILY_PLAQUE_ENTRANCE;
  assert.ok(staggerMs >= 55 && staggerMs <= 65, `stagger ${staggerMs} ms is outside 55-65`);
  slots.slice(1).forEach((index) => {
    assert.equal(
      dailyPlaqueEntranceDelay(index) - dailyPlaqueEntranceDelay(index - 1),
      staggerMs,
      `slot ${index} follows slot ${index - 1} by the stagger`,
    );
  });
  const delays = new Set(slots.map(dailyPlaqueEntranceDelay));
  assert.equal(delays.size, slots.length, 'no two blocks start on the same frame');
}

// A punch, not a drift: fast out, a short settle.
{
  const { punchMs, settleMs } = DAILY_PLAQUE_ENTRANCE;
  assert.ok(punchMs >= 110 && punchMs <= 130, `punch ${punchMs} ms reads as a punch`);
  assert.ok(settleMs >= 160 && settleMs <= 180, `settle ${settleMs} ms stays short`);
  assert.ok(punchMs < settleMs, 'out faster than it settles');
  assert.equal(
    dailyPlaqueImpactMs(0),
    dailyPlaqueEntranceDelay(0) + punchMs,
    'impact is the end of the punch',
  );
}

// Total entrance: the whole set is flush quickly, and that is when input opens.
{
  const total = dailyPlaqueEntranceMs(true);
  const expected =
    dailyPlaqueEntranceDelay(DAILY_PLAQUE_SLOT_COUNT - 1) +
    DAILY_PLAQUE_ENTRANCE.punchMs +
    DAILY_PLAQUE_ENTRANCE.settleMs;
  assert.equal(total, expected, 'entrance ends when the last block is flush');
  assert.ok(total <= 700, `entrance ${total} ms keeps Daily pacing`);
  slots.forEach((index) => {
    assert.ok(
      dailyPlaqueImpactMs(index) + DAILY_PLAQUE_ENTRANCE.settleMs <= total,
      `slot ${index} is flush by the time input opens`,
    );
  });
}

// Reduced motion: no entrance, so nothing waits on one.
{
  assert.equal(dailyPlaqueEntranceMs(false), 0, 'reduced motion never delays input');
  assert.equal(dailyPlaqueEntranceMs(true, 0), 0, 'no blocks, no entrance');
}

// Keyframes: flush → out of the wall → exactly flush. Depth, not size: the
// block starts and ends at its slot exactly.
{
  assert.deepEqual(DAILY_PLAQUE_INPUT, [0, DAILY_PLAQUE_PEAK, 1]);
  assert.ok(DAILY_PLAQUE_PEAK > 0 && DAILY_PLAQUE_PEAK < 1, 'peak between start and flush');
  [DAILY_PLAQUE_SCALE, DAILY_PLAQUE_DROP, DAILY_PLAQUE_PROUD].forEach((outputs) => {
    assert.equal(outputs.length, DAILY_PLAQUE_INPUT.length, 'one output per keyframe');
  });

  const [startScale, peakScale, endScale] = DAILY_PLAQUE_SCALE;
  assert.equal(startScale, 1, 'the block starts at its full wall size, not sunk');
  assert.ok(peakScale >= 1.015 && peakScale <= 1.02, `scale ${peakScale} barely grows`);
  assert.equal(endScale, 1, 'the block rests at exactly its slot size');

  const [startDrop, peakDrop, endDrop] = DAILY_PLAQUE_DROP;
  assert.equal(startDrop, 0, 'the block starts in its slot');
  assert.ok(peakDrop >= 6 && peakDrop <= 10, `drop ${peakDrop} pt carries the punch`);
  assert.equal(endDrop, 0, 'the block rests exactly in its slot');
  assert.ok(
    peakDrop > (peakScale - 1) * 100,
    'the punch reads through translation, not growth',
  );

  const [startProud, peakProud, endProud] = DAILY_PLAQUE_PROUD;
  assert.equal(startProud, 0, 'no top face or shadow before the punch');
  assert.ok(peakProud >= 0.7 && peakProud <= 1, `top face ${peakProud} is clearly visible at the peak`);
  assert.equal(endProud, 0, 'no top face or shadow on the flush block');
}

// The row seat haptic is Medium, through the cueAsync gateway.
{
  const source = readFileSync(join(__dirname, '../utils/haptics.ts'), 'utf8');
  assert.match(
    source,
    /case 'dailyStoneSeat':\s*return ExpoHaptics\.impactAsync\(ExpoHaptics\.ImpactFeedbackStyle\.Medium\);/,
    'dailyStoneSeat is one Medium impact',
  );
}

// Sound and haptic counts: one grind and three row thuds, never six.
{
  const cues = slots.map((index) => dailyPlaqueEntranceCues(index, true));
  assert.equal(cues.filter((cue) => cue.shift).length, 1, 'one grind for the set');
  assert.equal(cues[0].shift, true, 'the grind starts with the first block');

  const seats = cues
    .map((cue, index) => ({ row: cue.seatRow, index }))
    .filter((seat) => seat.row !== null);
  assert.deepEqual(seats.map((seat) => seat.row), [0, 1, 2], 'one thud (and one tap) per row');
  seats.forEach((seat) => {
    assert.equal(Math.floor(seat.index / 2), seat.row, `slot ${seat.index} is in row ${seat.row}`);
  });
  const impacts = seats.map((seat) => dailyPlaqueImpactMs(seat.index));
  impacts.slice(1).forEach((at, i) => {
    assert.ok(at - impacts[i] >= 80, 'row thuds are a rhythm, not a machine gun');
  });
  seats.forEach((seat) => {
    assert.ok(DAILY_STONE_SEAT_RATES[seat.row as number] !== undefined, `row ${seat.row} has a rate`);
  });
  assert.equal(new Set(DAILY_STONE_SEAT_RATES).size, 3, 'the three rows sound like three stones');
}

// Reduced motion keeps the feedback, once: one thud, one tap, no grind.
{
  const cues = slots.map((index) => dailyPlaqueEntranceCues(index, false));
  assert.equal(cues.filter((cue) => cue.shift).length, 0, 'no grind without movement');
  assert.deepEqual(
    cues.map((cue) => cue.seatRow).filter((row) => row !== null),
    [0],
    'one thud for the set',
  );
}

console.log('dailyPlaqueEntrance tests passed');
