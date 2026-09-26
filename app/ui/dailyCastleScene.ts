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
 * Canvas points per gate source px, chosen so the three clue planks fill the
 * straight part of the opening: each plank is 62 pt tall, room for two lines
 * of 24 pt clue text. The board overhangs the opening on both sides, where the
 * arch jambs hide it.
 */
export const DAILY_GATE_PLANK_PT = 62;
export const DAILY_GATE_PT_PER_SRC =
  DAILY_GATE_PLANK_PT / DAILY_GATE_ART.plankPitchSrc;

/** The three planks that carry clues 1–3, top to bottom. */
export const DAILY_GATE_CLUE_PLANKS = [2, 3, 4] as const;

/**
 * Where the gate image sits when closed. The clue planks run from canvas
 * y 258 pt (the opening is ~198 pt wide there, measured on ARCHNEW.png) down
 * to 444 pt, just above the step edge at 446.7 pt.
 */
const GATE_CLUE_TOP_Y = 258;
const GATE_CLUE_CENTER_Y = GATE_CLUE_TOP_Y + DAILY_GATE_PLANK_PT * 1.5;
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
 * How far the gate sinks past closed on the wrong-claim slam: a short, hard
 * jolt, never so deep that the board's top edge drops below the crown of the
 * opening.
 */
export const DAILY_GATE_MAX_SINK = Math.min(
  6,
  DAILY_CASTLE_OPENING.y - dailyGateLineY(0) - 1,
);

/**
 * Clue text box width. At the top clue plank (y 258 pt) the opening spans
 * ~117–315 pt; 190 keeps the text inside it with a few points to spare.
 */
export const DAILY_GATE_CLUE_WIDTH = 190;

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

/**
 * Bebas Neue (FONTS.wordDisplay) advance widths in em, measured from the
 * bundled font with canvas measureText for every character the Daily pool
 * uses. Same font file on device, so the same widths.
 */
const BEBAS_ADVANCE_EM: Record<string, number> = {
  " ": 0.16,
  "'": 0.188,
  "-": 0.27,
  "A": 0.401,
  "B": 0.404,
  "C": 0.383,
  "D": 0.406,
  "E": 0.363,
  "F": 0.344,
  "G": 0.391,
  "H": 0.42,
  "I": 0.192,
  "J": 0.265,
  "K": 0.414,
  "L": 0.344,
  "M": 0.538,
  "N": 0.427,
  "O": 0.4,
  "P": 0.386,
  "Q": 0.4,
  "R": 0.403,
  "S": 0.372,
  "T": 0.364,
  "U": 0.402,
  "V": 0.382,
  "W": 0.557,
  "X": 0.406,
  "Y": 0.394,
  "Z": 0.362,
  "\u2019": 0.188,
};
/** Fallback for a character the table has not seen: the widest measured. */
const BEBAS_WIDEST_EM = Math.max(...Object.values(BEBAS_ADVANCE_EM));

export const DAILY_CLUE_FONT = {
  maxSize: 24,
  minSize: 17,
  lineHeightRatio: 26 / 24,
  letterSpacing: 0.5,
  maxLines: 2,
  /** Headroom for rendering differences between platforms. */
  safety: 0.95,
} as const;

function textWidth(text: string, size: number): number {
  let em = 0;
  for (const ch of text) em += BEBAS_ADVANCE_EM[ch] ?? BEBAS_WIDEST_EM;
  return em * size + text.length * DAILY_CLUE_FONT.letterSpacing;
}

/** Greedy word wrap; the number of lines `text` needs at `size`. */
function linesNeeded(text: string, size: number, width: number): number {
  const words = text.split(' ');
  let lines = 1;
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, size) <= width) {
      line = next;
    } else {
      if (!line) return Infinity; // a single word wider than the box
      lines += 1;
      line = word;
      if (textWidth(line, size) > width) return Infinity;
    }
  }
  return lines;
}

/** True when `text` wraps into at most two lines of `width` at `size`. */
export function dailyClueFits(text: string, size: number, width: number): boolean {
  return (
    linesNeeded(text.toUpperCase(), size, width * DAILY_CLUE_FONT.safety) <=
    DAILY_CLUE_FONT.maxLines
  );
}

/**
 * Largest clue size (canvas points, whole numbers) at which `text` wraps into
 * at most two lines of `width`. Done here rather than trusting
 * adjustsFontSizeToFit, which react-native-web ignores and which cut a clue
 * off with an ellipsis.
 */
export function fitDailyClueFontSize(text: string, width: number): number {
  const usable = width * DAILY_CLUE_FONT.safety;
  for (let size = DAILY_CLUE_FONT.maxSize; size > DAILY_CLUE_FONT.minSize; size -= 1) {
    if (linesNeeded(text.toUpperCase(), size, usable) <= DAILY_CLUE_FONT.maxLines) return size;
  }
  return DAILY_CLUE_FONT.minSize;
}
