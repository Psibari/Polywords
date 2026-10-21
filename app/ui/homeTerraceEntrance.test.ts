import assert from 'node:assert/strict';
import { TERRACE_LABEL, terraceLabelFontSizes } from './homeTerraceScene';
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
// ENTER THE HUNT is much larger than POLYBOOK and fills its width fraction (with spacing).
const sizes = terraceLabelFontSizes(300);
assert.ok(sizes.hunt > sizes.book * 1.5);
const huntWidth =
  sizes.hunt * (TERRACE_LABEL.advanceEm.enterTheHunt + TERRACE_LABEL.letterSpacingEm * 14);
assert.ok(Math.abs(huntWidth - 300 * TERRACE_LABEL.huntWidthFraction) < 0.01);
console.log('homeTerraceEntrance tests passed');
