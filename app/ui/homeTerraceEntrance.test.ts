import assert from 'node:assert/strict';
import { TERRACE_LABEL, terraceLabelLayout } from './homeTerraceScene';
import {
  TERRACE_BUTTON_COUNT,
  terraceEntranceCues,
  terraceEntranceDelay,
  terraceEntranceMs,
  terraceTrembleMs,
} from './homeTerraceEntrance';

assert.equal(TERRACE_BUTTON_COUNT, 2);
// Hunt starts first; Polybook follows by the Daily stagger.
assert.ok(terraceEntranceDelay(1) > terraceEntranceDelay(0));
// Nothing is pressable before the last button is flush; reduced motion has no wait.
assert.ok(terraceEntranceMs(true) > terraceEntranceDelay(1));
assert.equal(terraceEntranceMs(false), 0);
// The tremble ends exactly when the last button is flush.
assert.equal(terraceTrembleMs(), terraceEntranceMs(true) - terraceEntranceDelay(0));
// One grind, with the first button; a thud per button; reduced motion: one thud, no grind.
assert.deepEqual(terraceEntranceCues(0, true), { shift: true, seatRow: 0 });
assert.deepEqual(terraceEntranceCues(1, true), { shift: false, seatRow: 1 });
assert.deepEqual(terraceEntranceCues(0, false), { shift: false, seatRow: 0 });
assert.deepEqual(terraceEntranceCues(1, false), { shift: false, seatRow: null });
// Hunt label: big lines much larger than POLYBOOK, a tiny THE, and the block fits the button.
const lay = terraceLabelLayout(322, 116);
assert.ok(lay.hunt > lay.book * 1.3);
assert.ok(lay.small < lay.hunt * 0.5);
const block =
  lay.hunt * 2 * TERRACE_LABEL.bigLineHeight + lay.hunt * TERRACE_LABEL.smallLineHeight;
assert.ok(block <= 116 * TERRACE_LABEL.huntBlockHeightFraction + 0.01);
const widest = lay.hunt * (TERRACE_LABEL.advanceEm.resume + TERRACE_LABEL.letterSpacingEm * 6);
assert.ok(widest <= 322 * TERRACE_LABEL.huntMaxWidthFraction + 0.01);
// A wide, short button is limited by height, a narrow one by width.
assert.ok(terraceLabelLayout(100, 400).hunt < terraceLabelLayout(400, 400).hunt);
console.log('homeTerraceEntrance tests passed');
