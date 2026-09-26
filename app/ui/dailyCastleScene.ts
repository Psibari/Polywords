/**
 * Daily Challenge castle scene geometry, measured from the shipped art.
 *
 * `ARCHNEW.png` (towers, arch, steps, floor) and the answer wall
 * (`cornerwall.png`) are exported on ONE 1290 × 2796 canvas — a 430 × 932 pt
 * phone at 3x — so both are drawn at the same rect and stay registered. Never
 * position either layer on its own; nudging one breaks the join between them.
 *
 * Every value here is in canvas points (source px / 3) unless named `Src`.
 * Values come from the alpha channel of the files named beside them; re-measure
 * if an export changes.
 *
 * Pure module: no React Native import, so it runs under plain node tests.
 */

export type DailyCastleRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DAILY_CASTLE_CANVAS = { width: 430, height: 932 } as const;

/**
 * ARCHNEW.png's transparent arch opening, alpha-measured: x 305–985 px,
 * y 579–1340 px. The top edge is the crown of the curve; below 1340 px the
 * steps are opaque and hide whatever sits behind the opening.
 */
export const DAILY_CASTLE_OPENING: DailyCastleRect = {
  x: 305 / 3,
  y: 579 / 3,
  width: 680 / 3,
  height: 761 / 3,
};

/**
 * Left tower crown on ARCHNEW.png: merlon tops at y 187 px, crown spans
 * x 0–396 px.
 */
export const DAILY_CASTLE_LEFT_TOWER = {
  x: 0,
  crownTop: 187 / 3,
  width: 396 / 3,
} as const;

/**
 * gate2.png, 1399 × 1597 source px. The visible board spans x 107–1248 px.
 * Its eight planks are divided by lines at y = 119 + 167.4·i px (i = 0…8;
 * line 0 is the board's top edge, line 8 its bottom edge).
 */
export const DAILY_GATE_ART = {
  widthSrc: 1399,
  heightSrc: 1597,
  boardXSrc: 107,
  boardWidthSrc: 1141,
  firstLineSrc: 119,
  plankPitchSrc: 167.4,
  plankCount: 8,
} as const;

/**
 * Canvas points per gate source px. At 0.25 a plank is ~41.9 pt tall — tall
 * enough for a two-line clue at a readable size — and the board overhangs the
 * opening on both sides, where the arch jambs hide it.
 */
export const DAILY_GATE_PT_PER_SRC = 0.25;

/** The three planks that carry clues 1–3, top to bottom. */
export const DAILY_GATE_CLUE_PLANKS = [2, 3, 4] as const;

/**
 * Where the gate image sits when closed. The middle of the clue planks
 * (line 3.5) lands at canvas y 1000 px (333.3 pt), low enough that every clue
 * plank sits in the straight part of the opening rather than the curve.
 */
const GATE_CLUE_CENTER_Y = 1000 / 3;
const GATE_CLUE_CENTER_LINE_SRC =
  DAILY_GATE_ART.firstLineSrc + DAILY_GATE_ART.plankPitchSrc * 3.5;

export const DAILY_GATE_CLOSED: DailyCastleRect = (() => {
  const k = DAILY_GATE_PT_PER_SRC;
  const openingCenterX = DAILY_CASTLE_OPENING.x + DAILY_CASTLE_OPENING.width / 2;
  const boardLeft = openingCenterX - (DAILY_GATE_ART.boardWidthSrc * k) / 2;
  return {
    x: boardLeft - DAILY_GATE_ART.boardXSrc * k,
    y: GATE_CLUE_CENTER_Y - GATE_CLUE_CENTER_LINE_SRC * k,
    width: DAILY_GATE_ART.widthSrc * k,
    height: DAILY_GATE_ART.heightSrc * k,
  };
})();

/** Canvas y of plank line `i` when the gate is closed. */
export function dailyGateLineY(i: number): number {
  return (
    DAILY_GATE_CLOSED.y +
    (DAILY_GATE_ART.firstLineSrc + DAILY_GATE_ART.plankPitchSrc * i) *
      DAILY_GATE_PT_PER_SRC
  );
}

/**
 * Raise distance: the board's bottom edge must clear the top of the opening.
 * Four points of margin past that.
 */
export const DAILY_GATE_OPEN_TRAVEL =
  dailyGateLineY(DAILY_GATE_ART.plankCount) - DAILY_CASTLE_OPENING.y + 4;

/**
 * How far the gate may sink past closed on a wrong claim. The board's top edge
 * sits this far above the crown of the opening, so a deeper drop would show a
 * sliver of the wall behind it.
 */
export const DAILY_GATE_MAX_SINK =
  DAILY_CASTLE_OPENING.y - dailyGateLineY(0) - 1;

/** Clue text box width: the straight part of the opening minus a margin. */
export const DAILY_GATE_CLUE_WIDTH = 184;

/**
 * Clue rects in canvas points with the gate closed. Each fills its plank
 * between the two plank lines, centred on the board.
 */
export function resolveDailyGateClueRects(): DailyCastleRect[] {
  const boardCenterX =
    DAILY_GATE_CLOSED.x +
    (DAILY_GATE_ART.boardXSrc + DAILY_GATE_ART.boardWidthSrc / 2) *
      DAILY_GATE_PT_PER_SRC;
  return DAILY_GATE_CLUE_PLANKS.map((plank) => {
    const top = dailyGateLineY(plank);
    return {
      x: boardCenterX - DAILY_GATE_CLUE_WIDTH / 2,
      y: top,
      width: DAILY_GATE_CLUE_WIDTH,
      height: dailyGateLineY(plank + 1) - top,
    };
  });
}

/**
 * Answer wall: the parapet ledge band ends at y 1893 px on the wall export;
 * the six plaques sit on the brick face below it.
 */
export const DAILY_CASTLE_WALL_FACE_TOP = 1893 / 3;

export type DailyCastleGrid = {
  top: number;
  cardWidth: number;
  cardHeight: number;
  columnGap: number;
  rowGap: number;
};

export const DAILY_CASTLE_GRID: DailyCastleGrid = {
  top: 645,
  cardWidth: 184,
  cardHeight: 64,
  columnGap: 14,
  rowGap: 14,
};

export function dailyCastleGridBottom(grid: DailyCastleGrid): number {
  return grid.top + 3 * grid.cardHeight + 2 * grid.rowGap;
}

/** Slot `index` (0–5, row-major, two columns) in canvas points. */
export function resolveDailyCastleSlot(
  grid: DailyCastleGrid,
  index: number,
): DailyCastleRect {
  const left =
    (DAILY_CASTLE_CANVAS.width - 2 * grid.cardWidth - grid.columnGap) / 2;
  return {
    x: left + (index % 2) * (grid.cardWidth + grid.columnGap),
    y: grid.top + Math.floor(index / 2) * (grid.cardHeight + grid.rowGap),
    width: grid.cardWidth,
    height: grid.cardHeight,
  };
}

/** Room kept under the grid for the action label. */
export const DAILY_CASTLE_ACTION_LABEL_CLEARANCE = 26;

export type DailyCastleFrame = {
  /** Screen points per canvas point. */
  scale: number;
  /** Screen y of the canvas top; negative when the towers run off-screen. */
  top: number;
  width: number;
  height: number;
};

/** Gap kept between the HUD's bottom edge and the first clue. */
export const DAILY_CASTLE_HUD_GAP = 6;

/**
 * The scene fills the screen width and is anchored to the bottom edge, so the
 * wall and plaques are whole; on shorter phones the tower tops run off the top
 * instead. Two limits then move the whole scene together — the layers never
 * separate:
 *   1. the plaque grid must end above the action label (scene rises);
 *   2. the first clue plank must start below the HUD (scene drops), but never
 *      so far that it breaks limit 1.
 */
export function resolveDailyCastleFrame({
  windowWidth,
  windowHeight,
  bottomInset,
  hudBottom = 0,
  grid = DAILY_CASTLE_GRID,
}: {
  windowWidth: number;
  windowHeight: number;
  bottomInset: number;
  /** Window y of the HUD's bottom edge; 0 before it has been measured. */
  hudBottom?: number;
  grid?: DailyCastleGrid;
}): DailyCastleFrame {
  const scale = windowWidth / DAILY_CASTLE_CANVAS.width;
  const height = DAILY_CASTLE_CANVAS.height * scale;
  const gridLimit =
    windowHeight - bottomInset - DAILY_CASTLE_ACTION_LABEL_CLEARANCE;
  const lowestTop = gridLimit - dailyCastleGridBottom(grid) * scale;
  let top = Math.min(windowHeight - height, lowestTop);
  const firstClueY = dailyGateLineY(DAILY_GATE_CLUE_PLANKS[0]);
  const clueTop = hudBottom + DAILY_CASTLE_HUD_GAP - firstClueY * scale;
  if (top < clueTop) top = Math.min(clueTop, lowestTop);
  return { scale, top, width: windowWidth, height };
}

/** Canvas rect → screen rect for a resolved frame. */
export function toDailyCastleScreen(
  frame: DailyCastleFrame,
  rect: DailyCastleRect,
): DailyCastleRect {
  return {
    x: rect.x * frame.scale,
    y: frame.top + rect.y * frame.scale,
    width: rect.width * frame.scale,
    height: rect.height * frame.scale,
  };
}

/**
 * The correct plaque's flight into the opening. It crosses in FRONT of the
 * castle until it is wholly inside the opening (HANDOFF), then carries on
 * BEHIND the gate plane and shrinks away into the wall at the back.
 */
export const DAILY_CASTLE_FLIGHT = {
  /** Canvas point the plaque's centre reaches at the handoff. */
  handoff: {
    x: DAILY_CASTLE_OPENING.x + DAILY_CASTLE_OPENING.width / 2,
    y: 400,
  },
  handoffScale: 0.7,
  /** Canvas point where it disappears into the back wall. */
  end: {
    x: DAILY_CASTLE_OPENING.x + DAILY_CASTLE_OPENING.width / 2,
    y: 322,
  },
  endScale: 0.42,
  riseMs: 450,
  absorbMs: 200,
} as const;

export const DAILY_CASTLE_FLIGHT_HANDOFF =
  DAILY_CASTLE_FLIGHT.riseMs /
  (DAILY_CASTLE_FLIGHT.riseMs + DAILY_CASTLE_FLIGHT.absorbMs);
