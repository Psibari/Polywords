import assert from 'node:assert/strict';
import {
  DAILY_CASTLE_ACTION_LABEL_CLEARANCE,
  DAILY_CASTLE_CANVAS,
  DAILY_CASTLE_FLIGHT,
  DAILY_CASTLE_FLIGHT_HANDOFF,
  DAILY_CASTLE_GRID,
  DAILY_CASTLE_OPENING,
  DAILY_CASTLE_WALL_FACE_TOP,
  DAILY_GATE_CLOSED,
  DAILY_GATE_MAX_SINK,
  DAILY_GATE_OPEN_TRAVEL,
  dailyCastleGridBottom,
  dailyGateLineY,
  resolveDailyCastleFrame,
  resolveDailyCastleSlot,
  resolveDailyGateClueRects,
} from './dailyCastleScene';

const opening = DAILY_CASTLE_OPENING;
const openingBottom = opening.y + opening.height;

// Closed gate covers the whole opening: board top above the crown of the
// arch, board bottom below the step edge, board wider than the opening.
assert.ok(dailyGateLineY(0) < opening.y, 'closed gate board reaches above the opening');
assert.ok(dailyGateLineY(8) > openingBottom, 'closed gate board reaches below the steps');
const boardLeft = DAILY_GATE_CLOSED.x + 107 * 0.25;
const boardRight = boardLeft + 1141 * 0.25;
assert.ok(boardLeft < opening.x && boardRight > opening.x + opening.width, 'board overhangs both jambs');

// Raised gate clears the opening entirely.
assert.ok(dailyGateLineY(8) - DAILY_GATE_OPEN_TRAVEL < opening.y, 'raised gate clears the opening');

// Wrong-claim sink never uncovers the crown of the opening.
assert.ok(DAILY_GATE_MAX_SINK > 0);
assert.ok(dailyGateLineY(0) + DAILY_GATE_MAX_SINK < opening.y, 'sunk gate still covers the crown');

// Clues: one per plank, inside the straight part of the opening, readable height.
const clues = resolveDailyGateClueRects();
assert.equal(clues.length, 3);
for (const [i, clue] of clues.entries()) {
  assert.ok(clue.height >= 40, `clue ${i + 1} plank is tall enough for two lines`);
  assert.ok(clue.y > opening.y + 70, `clue ${i + 1} sits below the curve of the arch`);
  assert.ok(clue.y + clue.height < openingBottom, `clue ${i + 1} sits above the steps`);
  // Measured on ARCHNEW.png: from y 800 px (266.7 pt) down, the opening spans
  // at least x 348–963 px (116–321 pt).
  assert.ok(clue.x >= 116 && clue.x + clue.width <= 321, `clue ${i + 1} fits the opening width`);
  if (i > 0) assert.equal(clue.y, clues[i - 1].y + clues[i - 1].height, 'clues sit on consecutive planks');
}

// Grid sits on the brick face, centred, inside the canvas.
assert.ok(DAILY_CASTLE_GRID.top > DAILY_CASTLE_WALL_FACE_TOP, 'grid is below the parapet ledge');
for (let i = 0; i < 6; i += 1) {
  const slot = resolveDailyCastleSlot(DAILY_CASTLE_GRID, i);
  assert.ok(slot.x >= 0 && slot.x + slot.width <= DAILY_CASTLE_CANVAS.width);
}
const left = resolveDailyCastleSlot(DAILY_CASTLE_GRID, 0);
const right = resolveDailyCastleSlot(DAILY_CASTLE_GRID, 1);
assert.equal(left.x, DAILY_CASTLE_CANVAS.width - (right.x + right.width), 'grid is centred');

// Frame: fills width, bottom-anchored on the reference phone, grid always
// clears the action label, and the first clue stays on screen.
// [width, height, top inset, bottom inset]; HUD bottom ≈ top inset + 70.
const phones = [
  [430, 932, 59, 34],
  [390, 844, 47, 34],
  [393, 852, 59, 34],
  [375, 667, 20, 0],
  [412, 915, 24, 24],
  [360, 800, 24, 24],
];
for (const [w, h, topInset, inset] of phones) {
  const hudBottom = topInset + 70;
  const f = resolveDailyCastleFrame({ windowWidth: w, windowHeight: h, bottomInset: inset, hudBottom });
  assert.equal(f.width, w);
  const gridBottom = f.top + dailyCastleGridBottom(DAILY_CASTLE_GRID) * f.scale;
  assert.ok(gridBottom <= h - inset - DAILY_CASTLE_ACTION_LABEL_CLEARANCE + 0.001, `${w}x${h}: grid clears the action label`);
  assert.ok(f.top + clues[0].y * f.scale >= hudBottom, `${w}x${h}: first clue is below the HUD`);
  assert.ok(f.top + f.height >= h - 0.001, `${w}x${h}: the wall reaches the bottom of the screen`);
}
// Before the HUD is measured the scene is simply bottom-anchored.
const unmeasured = resolveDailyCastleFrame({ windowWidth: 375, windowHeight: 667, bottomInset: 0 });
assert.equal(unmeasured.top, 667 - 932 * (375 / 430));
const reference = resolveDailyCastleFrame({ windowWidth: 430, windowHeight: 932, bottomInset: 34 });
assert.equal(reference.scale, 1);
assert.equal(reference.top, 0);

// Flight: handoff point is where the plaque is wholly inside the opening at
// its handoff scale, and the end point is inside the opening too.
const halfW = (DAILY_CASTLE_GRID.cardWidth * DAILY_CASTLE_FLIGHT.handoffScale) / 2;
const halfH = (DAILY_CASTLE_GRID.cardHeight * DAILY_CASTLE_FLIGHT.handoffScale) / 2;
const h = DAILY_CASTLE_FLIGHT.handoff;
assert.ok(h.x - halfW > opening.x && h.x + halfW < opening.x + opening.width, 'handoff plaque inside opening width');
assert.ok(h.y + halfH < openingBottom && h.y - halfH > opening.y + 70, 'handoff plaque inside opening height');
assert.ok(DAILY_CASTLE_FLIGHT.end.y > opening.y && DAILY_CASTLE_FLIGHT.end.y < h.y, 'plaque goes up and in');
assert.ok(DAILY_CASTLE_FLIGHT_HANDOFF > 0 && DAILY_CASTLE_FLIGHT_HANDOFF < 1);

console.log('dailyCastleScene tests passed');
