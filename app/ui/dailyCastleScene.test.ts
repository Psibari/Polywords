import assert from 'node:assert/strict';
import { DAILY_POOL } from '../game/dailyPool';
import {
  balanceDailyClue,
  DAILY_ANSWER_MORTAR_PX,
  dailyClueTextWidth,
  DAILY_ACTION_LABEL_HEIGHT,
  dailyActionLabelBottom,
  DAILY_CASTLE_CANVAS,
  DAILY_CASTLE_FLIGHT,
  DAILY_CASTLE_FLIGHT_HANDOFF,
  DAILY_CASTLE_GRID,
  DAILY_CASTLE_OPENING,
  DAILY_CASTLE_WALL_FACE_TOP,
  DAILY_GATE_ART,
  DAILY_GATE_CLOSED,
  DAILY_GATE_PT_PER_SRC,
  DAILY_GATE_MAX_SINK,
  DAILY_GATE_OPEN_TRAVEL,
  dailyCastleGridBottom,
  DAILY_FLOOR_COINS,
  resolveDailyFloorCoin,
  resolveDailyGoldCoin,
  dailyAnswerTextWidth,
  DAILY_ANSWER_FONT,
  DAILY_ANSWER_PANELS,
  fitDailyAnswerFontSize,
  dailyClueFits,
  DAILY_CLUE_FONT,
  DAILY_GATE_CLUE_WIDTH,
  fitDailyClueFontSize,
  dailyGateLineY,
  resolveDailyCastleFrame,
  resolveDailyCastleSlot,
  resolveDailyGateClueRects,
  resolveDailyClueTop,
  DAILY_CLUE_TOP_MIN,
  DAILY_CLUE_TOP_MAX,
  DAILY_CLUE_TOP_PREFERRED,
  dailyGateOpenTravel,
  dailyGateMaxSink,
  DAILY_GATE_PLANK_PT,
  DAILY_HUD,
  dailyHudHeight,
  DAILY_ANSWER_WALL,
  DAILY_WALL_FRIEZE,
  DAILY_ROUND_MARKERS,
  resolveDailyRoundMarkers,
  DAILY_CASTLE_CAPS,
  DAILY_CASTLE_CAP_GLOWS,
  DAILY_GOLD_HIT,
  DAILY_GOLD_HIT_COLOR,
  DAILY_GOLD_HIT_INPUT,
  dailyGoldHitKeyframes,
  dailyGoldHitMs,
} from './dailyCastleScene';

const opening = DAILY_CASTLE_OPENING;
const openingBottom = opening.y + opening.height;

// Closed gate covers the whole opening: board top above the crown of the
// arch, board bottom below the step edge, board wider than the opening.
assert.ok(dailyGateLineY(0) < opening.y, 'closed gate board reaches above the opening');
assert.ok(dailyGateLineY(8) > openingBottom, 'closed gate board reaches below the steps');
const boardLeft = DAILY_GATE_CLOSED.x + DAILY_GATE_ART.boardXSrc * DAILY_GATE_PT_PER_SRC;
const boardRight = boardLeft + DAILY_GATE_ART.boardWidthSrc * DAILY_GATE_PT_PER_SRC;
assert.ok(boardLeft < opening.x && boardRight > opening.x + opening.width, 'board overhangs both jambs');

// Plank height (61 pt since 2026-09-28, 52 before) sets the door's one scale:
// the art is drawn uniformly, never stretched, centred on the opening.
assert.equal(DAILY_GATE_PLANK_PT, 61);
assert.ok(
  Math.abs(DAILY_GATE_CLOSED.width / DAILY_GATE_ART.widthSrc - DAILY_GATE_CLOSED.height / DAILY_GATE_ART.heightSrc) < 1e-12,
  'door art drawn at one scale on both axes',
);
assert.ok(Math.abs(dailyGateLineY(3) - dailyGateLineY(2) - DAILY_GATE_PLANK_PT) < 1e-9, 'plank lines one plank apart');
assert.ok(Math.abs((boardLeft + boardRight) / 2 - (opening.x + opening.width / 2)) < 1e-9, 'board centred on the opening');

// Raised gate clears the opening entirely.
assert.ok(dailyGateLineY(8) - DAILY_GATE_OPEN_TRAVEL < opening.y, 'raised gate clears the opening');

// Wrong-claim sink never uncovers the crown of the opening.
assert.ok(DAILY_GATE_MAX_SINK > 0);
assert.ok(dailyGateLineY(0) + DAILY_GATE_MAX_SINK < opening.y, 'sunk gate still covers the crown');

// Clues: one per plank, readable height, inside the opening at every clue
// position a phone can choose (MIN = the centred spot's upper limit, MAX = as
// low as the steps allow). Measured on castle_cartoon.png: from y 216 pt down
// the opening spans at least x 126.3–304 pt.
assert.ok(DAILY_CLUE_TOP_MIN <= DAILY_CLUE_TOP_PREFERRED && DAILY_CLUE_TOP_PREFERRED <= DAILY_CLUE_TOP_MAX);
for (const clueTop of [DAILY_CLUE_TOP_MIN, DAILY_CLUE_TOP_PREFERRED, DAILY_CLUE_TOP_MAX]) {
  const rects = resolveDailyGateClueRects(clueTop);
  assert.equal(rects.length, 3);
  const twoFullLines = DAILY_CLUE_FONT.maxSize * DAILY_CLUE_FONT.lineHeightRatio * DAILY_CLUE_FONT.maxLines;
  for (const [i, clue] of rects.entries()) {
    assert.ok(Math.abs(clue.height - DAILY_GATE_PLANK_PT) < 1e-9, `clue ${i + 1} fills one ${DAILY_GATE_PLANK_PT} pt plank`);
    // At least 8 pt of plank around two full lines at the ceiling, so three
    // clues read as three, not one paragraph (Pete, 2026-09-26).
    assert.ok(clue.height - twoFullLines >= 8, `clue ${i + 1} plank leaves air around two full lines`);
    assert.ok(clue.y >= DAILY_CLUE_TOP_MIN - 1e-9, `clue ${i + 1} sits below the narrow top of the arch`);
    assert.ok(clue.y + clue.height < openingBottom, `clue ${i + 1} sits above the steps (top ${clueTop})`);
    assert.ok(clue.x >= 126.3 && clue.x + clue.width <= 304, `clue ${i + 1} fits the opening width`);
    if (i > 0) assert.equal(clue.y, rects[i - 1].y + rects[i - 1].height, 'clues sit on consecutive planks');
  }
  // The gate still covers the opening, raises clear of it, and its slam never
  // uncovers the crown, wherever the clues sit.
  assert.ok(dailyGateLineY(0, clueTop) < opening.y, `gate board reaches above the opening (top ${clueTop})`);
  assert.ok(dailyGateLineY(8, clueTop) > openingBottom, `gate board reaches below the steps (top ${clueTop})`);
  assert.ok(dailyGateLineY(8, clueTop) - dailyGateOpenTravel(clueTop) < opening.y, 'raised gate clears the opening');
  const sink = dailyGateMaxSink(clueTop);
  assert.ok(sink > 0 && dailyGateLineY(0, clueTop) + sink < opening.y, 'sunk gate still covers the crown');
}
const clues = resolveDailyGateClueRects();

// Grid sits on the brick face, centred, inside the canvas.
assert.ok(DAILY_CASTLE_GRID.top > DAILY_CASTLE_WALL_FACE_TOP, 'grid is below the parapet ledge');
for (let i = 0; i < 6; i += 1) {
  const slot = resolveDailyCastleSlot(DAILY_CASTLE_GRID, i);
  assert.ok(slot.x >= 0 && slot.x + slot.width <= DAILY_CASTLE_CANVAS.width);
}
const left = resolveDailyCastleSlot(DAILY_CASTLE_GRID, 0);
const right = resolveDailyCastleSlot(DAILY_CASTLE_GRID, 1);
assert.ok(Math.abs(left.x - (DAILY_CASTLE_CANVAS.width - (right.x + right.width))) < 1e-9, 'grid is centred');
// Blocks sit flush over the wall's recesses: one mortar gap inside each
// panel's edges and between blocks (build_daily_answer_wall.py cuts the
// recesses with the same rule).
{
  const m = DAILY_ANSWER_MORTAR_PX / 3;
  for (let i = 0; i < 6; i += 1) {
    const slot = resolveDailyCastleSlot(DAILY_CASTLE_GRID, i);
    const panel = DAILY_ANSWER_PANELS[i % 2];
    const row = Math.floor(i / 2);
    assert.ok(Math.abs(slot.x - (panel.x + m)) < 1e-9, `block ${i} left edge`);
    assert.ok(Math.abs(slot.x + slot.width - (panel.x + panel.width - m)) < 1e-9, `block ${i} right edge`);
    assert.ok(Math.abs(slot.y - (panel.y + m + row * (slot.height + m))) < 1e-9, `block ${i} top edge`);
  }
  const last = resolveDailyCastleSlot(DAILY_CASTLE_GRID, 5);
  assert.ok(Math.abs(last.y + last.height - (DAILY_ANSWER_PANELS[1].y + DAILY_ANSWER_PANELS[1].height - m)) < 1e-9, 'bottom row ends one mortar gap above the sill');
}

// Framed wall: the two panels are equal, and each column of three blocks sits
// wholly inside its panel with equal gaps.
assert.equal(DAILY_ANSWER_PANELS[0].width, DAILY_ANSWER_PANELS[1].width, 'panels are the same width');
for (let i = 0; i < 6; i += 1) {
  const slot = resolveDailyCastleSlot(DAILY_CASTLE_GRID, i);
  const panel = DAILY_ANSWER_PANELS[i % 2];
  assert.ok(slot.x >= panel.x && slot.x + slot.width <= panel.x + panel.width, `block ${i} inside its panel horizontally`);
  assert.ok(slot.y >= panel.y && slot.y + slot.height <= panel.y + panel.height + 1e-9, `block ${i} inside its panel vertically`);
  const panelCenter = panel.x + panel.width / 2;
  assert.ok(Math.abs(slot.x + slot.width / 2 - panelCenter) < 1e-9, `block ${i} centred in its panel`);
}

// Every answer word in the live pool fits its block on one line, on the
// smallest supported phone width too.
for (const phoneWidth of [430, 375, 360]) {
  const blockWidth = DAILY_CASTLE_GRID.cardWidth * (phoneWidth / 430);
  for (const word of new Set(DAILY_POOL.flatMap((w) => w.candidates))) {
    const size = fitDailyAnswerFontSize(word, blockWidth);
    const usable = (blockWidth - 2 * DAILY_ANSWER_FONT.sidePadding) * DAILY_ANSWER_FONT.safety;
    assert.ok(dailyAnswerTextWidth(word, size) <= usable, `"${word}" fits a ${phoneWidth}-wide phone's block at ${size} pt`);
  }
}
assert.equal(fitDailyAnswerFontSize('LOCK', DAILY_CASTLE_GRID.cardWidth), DAILY_ANSWER_FONT.maxSize);

// Frame: fills width, bottom-anchored on the reference phone, grid always
// clears the action label, and the first clue stays on screen.
// [width, height, top inset, bottom inset]; HUD bottom = top inset + the
// compact HUD's height.
const phones = [
  [430, 932, 59, 34],
  [390, 844, 47, 34],
  [393, 852, 59, 34],
  [375, 812, 44, 34],
  [375, 667, 20, 0],
  [412, 915, 24, 24],
  [360, 800, 24, 24],
];
// Compact HUD (Pete, 2026-09-28): DAILY #<n> over the feathers. Shorter than
// the old full-width row (label + rule + 36 pt feather box, 76.6 pt), and
// short enough that the 375 x 667 phone's first clue clears it; the old row
// covered that clue by about 6 pt.
assert.ok(Math.abs(dailyHudHeight() - 64.8) < 1e-9, `compact HUD is 64.8 pt tall (${dailyHudHeight()})`);
assert.ok(dailyHudHeight() < 76.6, 'compact HUD is shorter than the old row');
assert.equal(DAILY_HUD.feather, 20, 'feathers keep their drawn size');
for (const [w, h, topInset, inset] of phones) {
  const hudBottom = topInset + dailyHudHeight();
  const f = resolveDailyCastleFrame({ windowWidth: w, windowHeight: h, bottomInset: inset, hudBottom });
  assert.equal(f.width, w);
  const gridBottom = f.top + dailyCastleGridBottom(DAILY_CASTLE_GRID) * f.scale;
  // The action label sits dailyActionLabelBottom above the SCREEN bottom (it
  // ignores the inset's padding); the lowest blocks end above its top.
  const labelTop = h - dailyActionLabelBottom(inset) - DAILY_ACTION_LABEL_HEIGHT;
  assert.ok(gridBottom <= labelTop + 0.001, `${w}x${h}: grid clears the action label`);
  const clueTop = resolveDailyClueTop(f, hudBottom);
  assert.ok(clueTop >= DAILY_CLUE_TOP_MIN && clueTop <= DAILY_CLUE_TOP_MAX, `${w}x${h}: clue position within the door`);
  assert.ok(f.top + clueTop * f.scale >= hudBottom, `${w}x${h}: first clue is below the HUD`);
  // When the scene rises to clear the label, the stage fills the strip under
  // the sill (DAILY_ANSWER_WALL_FOOT); keep that strip inside the home-bar inset.
  assert.ok(h - (f.top + f.height) <= Math.max(inset, 0) + 0.001, `${w}x${h}: any strip under the wall stays inside the bottom inset`);
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

// Every clue in the live Daily pool fits its plank at the size the fitter
// gives it, in at most two lines, with 8 pt of plank around them.
{
  const pool = DAILY_POOL.flatMap((word) => word.meanings);
  let twoLine = 0;
  let twoLineAt22 = 0;
  let at22 = 0;
  for (const clue of pool) {
    const size = fitDailyClueFontSize(clue, DAILY_GATE_CLUE_WIDTH);
    assert.ok(size >= DAILY_CLUE_FONT.minSize && size <= DAILY_CLUE_FONT.maxSize);
    assert.ok(dailyClueFits(clue, size, DAILY_GATE_CLUE_WIDTH), `"${clue}" fits at ${size} pt`);
    const lines = balanceDailyClue(clue, size, DAILY_GATE_CLUE_WIDTH).split('\n').length;
    assert.ok(
      DAILY_GATE_PLANK_PT - lines * size * DAILY_CLUE_FONT.lineHeightRatio >= 8,
      `"${clue}" leaves 8 pt of plank at ${size} pt`,
    );
    if (lines === 2) twoLine += 1;
    if (lines === 2 && size >= 22) twoLineAt22 += 1;
    if (size >= 22) at22 += 1;
  }
  // The taller plank is only worth it if most clues get materially bigger:
  // 20 pt was the ceiling for every two-line clue on the 52 pt plank.
  assert.ok(at22 / pool.length >= 0.85, `${at22}/${pool.length} clues at 22 pt or more`);
  assert.ok(twoLineAt22 / twoLine >= 0.85, `${twoLineAt22}/${twoLine} two-line clues at 22 pt or more`);
}
// Two-line clues reach the 24 pt ceiling; the longest live clue still fits,
// at the floor.
assert.equal(DAILY_CLUE_FONT.maxSize, 24);
assert.equal(fitDailyClueFontSize('A LOUD NOISE', DAILY_GATE_CLUE_WIDTH), 24);
assert.equal(fitDailyClueFontSize('TO GRAB ON AND NOT LET GO', DAILY_GATE_CLUE_WIDTH), 24);
assert.equal(balanceDailyClue('TO GRAB ON AND NOT LET GO', 24, DAILY_GATE_CLUE_WIDTH).split('\n').length, 2);
{
  const longest = DAILY_POOL.flatMap((word) => word.meanings)
    .reduce((a, b) => (dailyClueTextWidth(b.toUpperCase(), 20) > dailyClueTextWidth(a.toUpperCase(), 20) ? b : a));
  const size = fitDailyClueFontSize(longest, DAILY_GATE_CLUE_WIDTH);
  assert.equal(size, DAILY_CLUE_FONT.minSize, `longest clue "${longest}" resolves to the floor`);
  assert.ok(dailyClueFits(longest, size, DAILY_GATE_CLUE_WIDTH), 'longest clue fits');
}

// The drawn clue: one line if it fits on one, otherwise two balanced lines,
// each inside the box, and the words unchanged.
for (const clue of DAILY_POOL.flatMap((word) => word.meanings)) {
  const size = fitDailyClueFontSize(clue, DAILY_GATE_CLUE_WIDTH);
  const drawn = balanceDailyClue(clue, size, DAILY_GATE_CLUE_WIDTH);
  const lines = drawn.split('\n');
  assert.ok(lines.length <= DAILY_CLUE_FONT.maxLines, `"${clue}" draws in at most two lines`);
  assert.equal(lines.join(' '), clue.toUpperCase().split(' ').join(' '));
  for (const line of lines) {
    assert.ok(dailyClueTextWidth(line, size) <= DAILY_GATE_CLUE_WIDTH * DAILY_CLUE_FONT.safety, `"${line}" fits on one line at ${size} pt`);
  }
}
assert.equal(balanceDailyClue('How you make a button work', 20, DAILY_GATE_CLUE_WIDTH), 'HOW YOU MAKE\nA BUTTON WORK');

// Round markers: on the frieze (between the capstone and the brick panels),
// centred, above the answer blocks, clear of the floor coins, on every phone.
{
  const plate = resolveDailyRoundMarkers(5);
  assert.ok(plate.y >= DAILY_WALL_FRIEZE.y && plate.y + plate.height <= DAILY_WALL_FRIEZE.y + DAILY_WALL_FRIEZE.height, 'markers sit on the frieze');
  assert.ok(Math.abs(plate.x + plate.width / 2 - DAILY_CASTLE_CANVAS.width / 2) < 1e-9, 'markers are centred');
  assert.ok(plate.y + plate.height < DAILY_CASTLE_GRID.top, 'markers sit above the answer blocks');
  assert.ok(plate.y > DAILY_ANSWER_WALL.capTopPx / 3, 'markers sit below the capstone top');
  assert.ok(plate.y > DAILY_FLOOR_COINS.contactY, 'markers clear the floor coins');
  assert.equal(plate.width, 5 * DAILY_ROUND_MARKERS.dot + 4 * DAILY_ROUND_MARKERS.gap + 2 * DAILY_ROUND_MARKERS.padX);
  for (const [w, h, , inset] of phones) {
    const f = resolveDailyCastleFrame({ windowWidth: w, windowHeight: h, bottomInset: inset });
    assert.ok(DAILY_ROUND_MARKERS.dot * f.scale >= 10, `${w}x${h}: markers stay legible`);
    const plateBottom = f.top + (plate.y + plate.height) * f.scale;
    assert.ok(plateBottom < h, `${w}x${h}: markers on screen`);
  }
}

// Floor coins: on the open courtyard floor (contact line between the step
// edge and the capstone), inside the screen, never overlapping each other.
for (let count = 1; count <= 4; count += 1) {
  for (let i = 0; i < count; i += 1) {
    const coin = resolveDailyFloorCoin(i, count);
    assert.ok(coin.x >= 0 && coin.x + coin.width <= DAILY_CASTLE_CANVAS.width, `coin ${i + 1}/${count} on screen`);
    if (i > 0) {
      const prev = resolveDailyFloorCoin(i - 1, count);
      assert.ok(prev.x + prev.width < coin.x, `coins ${i}/${count} and ${i + 1}/${count} do not overlap`);
    }
    assert.ok(Math.abs(coin.x + coin.width / 2 - DAILY_CASTLE_CANVAS.width / 2 - (i - (count - 1) / 2) * DAILY_FLOOR_COINS.pitch) < 1e-9);
  }
}
assert.ok(DAILY_FLOOR_COINS.contactY > DAILY_FLOOR_COINS.floorTop && DAILY_FLOOR_COINS.contactY < DAILY_FLOOR_COINS.floorBottom, 'coins stand on the open floor');
const gold = resolveDailyGoldCoin();
assert.ok(gold.y + gold.height <= DAILY_FLOOR_COINS.floorBottom, 'gold coin clears the capstone');

// Gold hit: timing (Pete, 2026-09-29) — fast ignition, a hold near the peak,
// a smooth decay, the whole event readable but brief.
{
  const { igniteMs, holdMs, decayMs } = DAILY_GOLD_HIT.full;
  assert.ok(igniteMs >= 80 && igniteMs <= 120, `ignition ${igniteMs} ms is fast`);
  assert.ok(holdMs >= 150 && holdMs <= 200, `hold ${holdMs} ms keeps the peak readable`);
  assert.ok(decayMs >= 300 && decayMs <= 400, `decay ${decayMs} ms is smooth`);
  const total = dailyGoldHitMs(false);
  assert.ok(total >= 650 && total <= 750, `gold hit ${total} ms`);
  // The next round's gate only starts down after the throw (650 ms) and a
  // tunnel beat, so the peak and hold are never under new-round motion.
  assert.ok(
    igniteMs + holdMs < DAILY_CASTLE_FLIGHT.riseMs + DAILY_CASTLE_FLIGHT.absorbMs,
    'peak and hold are over before the throw ends',
  );
  assert.equal(DAILY_GOLD_HIT_COLOR, '#F5C842', 'crown gold');
  assert.ok(dailyGoldHitMs(true) <= 800, 'calm gold hit stays brief too');
}

// Gold hit: keyframes. Strong at the peak, clean at rest, one overshoot only.
{
  assert.deepEqual(DAILY_GOLD_HIT_INPUT, [0, 1, 2, 3]);
  for (const calm of [false, true]) {
    const keys = dailyGoldHitKeyframes(calm);
    const label = calm ? 'calm' : 'full';
    for (const [name, outputs] of Object.entries(keys)) {
      assert.equal(outputs.length, DAILY_GOLD_HIT_INPUT.length, `${label} ${name}: one output per keyframe`);
    }
    for (const name of ['trim', 'tint', 'glow'] as const) {
      assert.equal(keys[name][0], 0, `${label} ${name} is invisible at rest`);
      assert.equal(keys[name][3], 0, `${label} ${name} leaves nothing behind`);
    }
    assert.equal(keys.trim[1], 1, `${label} gold trim fully lit at the peak`);
    assert.ok(keys.tint[1] >= 0.5, `${label} crown-gold tint saturates the peak`);
    assert.ok(keys.glow[1] >= 0.9, `${label} bloom is clearly visible at the peak`);
    assert.ok(keys.tint[2] >= 0.5 && keys.glow[2] >= 0.9, `${label} holds near the peak`);
    // No pulsing: after the peak, every opacity only falls.
    for (const name of ['trim', 'tint', 'glow'] as const) {
      assert.ok(keys[name][1] >= keys[name][2] && keys[name][2] >= keys[name][3], `${label} ${name} never re-brightens`);
    }
  }

  const full = dailyGoldHitKeyframes(false);
  assert.ok(full.glowScale[1] > 1 && full.glowScale[1] <= 1.15, 'bloom swells a little at ignition');
  assert.ok(full.glowScale[1] > full.glowScale[2] && full.glowScale[2] >= full.glowScale[3], 'one overshoot, then it settles');
  assert.ok(full.tint[1] > full.tint[2], 'one restrained intensity overshoot at ignition');

  const calm = dailyGoldHitKeyframes(true);
  assert.deepEqual(calm.glowScale, [1, 1, 1, 1], 'calm: no swelling');
  assert.equal(calm.tint[1], calm.tint[2], 'calm: no intensity overshoot');
  assert.equal(calm.glow[1], full.glow[2], 'calm keeps the full version\'s held glow');
  assert.ok(DAILY_GOLD_HIT.calm.igniteMs > DAILY_GOLD_HIT.full.igniteMs, 'calm ignites gently');
}

// Gold hit: each bloom is centred on its cap and reaches well past it.
{
  assert.equal(DAILY_CASTLE_CAPS.length, 2, 'two tower caps');
  assert.equal(DAILY_CASTLE_CAP_GLOWS.length, 2, 'one bloom per cap');
  DAILY_CASTLE_CAPS.forEach((cap, i) => {
    assert.ok(cap.x >= 0 && cap.x + cap.width <= DAILY_CASTLE_CANVAS.width + 1e-9, `cap ${i} on the canvas`);
    const glow = DAILY_CASTLE_CAP_GLOWS[i];
    const capMiddleY = cap.y + cap.height / 2;
    assert.ok(Math.abs(glow.y + glow.height / 2 - capMiddleY) < 12, `bloom ${i} is level with its cap`);
    assert.ok(glow.y < cap.y - 20, `bloom ${i} reaches above the finial`);
    assert.ok(glow.y + glow.height > cap.y + cap.height + 20, `bloom ${i} reaches below the cap`);
    assert.ok(glow.width > cap.width * 2, `bloom ${i} spreads well beyond the cap`);
  });
  // The left cap's inner edge is its right side; the right cap's is its left.
  const [left, right] = DAILY_CASTLE_CAPS;
  const [leftGlow, rightGlow] = DAILY_CASTLE_CAP_GLOWS;
  assert.ok(leftGlow.x + leftGlow.width > left.x + left.width + 20, 'left bloom shows past the cap toward the arch');
  assert.ok(rightGlow.x < right.x - 20, 'right bloom shows past the cap toward the arch');
}

console.log('dailyCastleScene tests passed');
