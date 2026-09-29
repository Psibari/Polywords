/**
 * Daily Challenge castle scene geometry, measured from the shipped art.
 *
 * `castle_cartoon.png` (towers, arch, steps, floor; built by
 * tools/art/build_daily_castle.py) and the answer wall
 * (`answerwall_framed.png`) are drawn on ONE 1290 × 2796 canvas — a 430 × 932 pt
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
 * castle_cartoon.png's transparent arch opening, alpha-measured (the build
 * script prints it): x 356–933 px, y 442–1269 px. The top edge is the crown of
 * the curve; below 1269 px the steps are opaque and hide whatever sits behind.
 * The door reaches down into the removed top step's place (Pete, 2026-09-26).
 */
export const DAILY_CASTLE_OPENING: DailyCastleRect = {
  x: 356 / 3,
  y: 442 / 3,
  width: 578 / 3,
  height: 828 / 3,
};

/**
 * Polly's Daily speech bubble sits on the steps, just below the arch opening
 * (whose bottom is the top step's edge, 1269 px), so it never covers a clue on
 * the gate (Pete, 2026-09-26). Canvas points; x/y is the bubble's top-left.
 * Two lines of the longest Daily line fit above the floor coins.
 */
export const DAILY_POLLY_BUBBLE = {
  x: 40,
  y: DAILY_CASTLE_OPENING.y + DAILY_CASTLE_OPENING.height + 4,
  maxWidth: 260,
} as const;

/**
 * gate_door.png (tools/art/build_daily_door.py), 1399 × 1597 source px. The
 * board spans x 107–1248 px.
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
 * Canvas points per gate source px. Each plank is 61 pt tall (52 until
 * 2026-09-28): two lines of 24 pt clue text with 9 pt of plank around them,
 * the air 20 pt text had on the 52 pt plank (Pete, 2026-09-26). 62 does not
 * fit the 375 x 667 phone: its three clue planks would need 186 pt between
 * the HUD and the step edge, and it has 185.7.
 *
 * The door art is drawn at this one scale, never stretched, so wood, seams,
 * straps and rivets all grow together (seams about 2.9 pt). Only the middle
 * of the board shows: the opening clips it, so its visible width is the
 * opening's whatever the scale.
 */
export const DAILY_GATE_PLANK_PT = 61;
export const DAILY_GATE_PT_PER_SRC =
  DAILY_GATE_PLANK_PT / DAILY_GATE_ART.plankPitchSrc;

/** The three planks that carry clues 1–3, top to bottom. */
export const DAILY_GATE_CLUE_PLANKS = [2, 3, 4] as const;

/**
 * Where the clues sit (Pete, 2026-09-26: centred in the door, not bunched on
 * the steps). `clueTop` is the canvas y of the first clue plank's top line;
 * the whole gate moves with it. It is chosen per phone by
 * `resolveDailyClueTop`, between:
 *   - DAILY_CLUE_TOP_MIN: above this the arch narrows below the clue box
 *     (castle_cartoon.png: the opening is 177.7 pt wide at y 216 pt);
 *   - DAILY_CLUE_TOP_MAX: the planks end above the step edge and the gate's
 *     top edge stays above the crown.
 * The preferred spot centres the three planks in the door, never above MIN.
 */
const DAILY_CASTLE_OPENING_BOTTOM = DAILY_CASTLE_OPENING.y + DAILY_CASTLE_OPENING.height;
const DAILY_CLUE_BLOCK = DAILY_GATE_PLANK_PT * DAILY_GATE_CLUE_PLANKS.length;
export const DAILY_CLUE_TOP_MIN = 216;
// Lowest of: the planks end just above the step edge; the two planks above the
// clues still reach past the crown with room for the 6 pt wrong-answer slam.
export const DAILY_CLUE_TOP_MAX = Math.min(
  DAILY_CASTLE_OPENING_BOTTOM - DAILY_CLUE_BLOCK - 2,
  DAILY_CASTLE_OPENING.y + DAILY_GATE_PLANK_PT * DAILY_GATE_CLUE_PLANKS[0] - 7,
);
export const DAILY_CLUE_TOP_PREFERRED = Math.max(
  DAILY_CLUE_TOP_MIN,
  (DAILY_CASTLE_OPENING.y + DAILY_CASTLE_OPENING_BOTTOM) / 2 - DAILY_CLUE_BLOCK / 2,
);

const GATE_CLUE_CENTER_LINE_SRC =
  DAILY_GATE_ART.firstLineSrc + DAILY_GATE_ART.plankPitchSrc * 3.5;

/** The gate's closed rect for a given clue top. */
export function dailyGateClosed(clueTop: number = DAILY_CLUE_TOP_PREFERRED): DailyCastleRect {
  const k = DAILY_GATE_PT_PER_SRC;
  const openingCenterX = DAILY_CASTLE_OPENING.x + DAILY_CASTLE_OPENING.width / 2;
  const boardLeft = openingCenterX - (DAILY_GATE_ART.boardWidthSrc * k) / 2;
  return {
    x: boardLeft - DAILY_GATE_ART.boardXSrc * k,
    y: clueTop + DAILY_GATE_PLANK_PT * 1.5 - GATE_CLUE_CENTER_LINE_SRC * k,
    width: DAILY_GATE_ART.widthSrc * k,
    height: DAILY_GATE_ART.heightSrc * k,
  };
}

/** The gate at its preferred (centred) position. */
export const DAILY_GATE_CLOSED: DailyCastleRect = dailyGateClosed();

/** Canvas y of plank line `i` when the gate is closed at `clueTop`. */
export function dailyGateLineY(i: number, clueTop: number = DAILY_CLUE_TOP_PREFERRED): number {
  return (
    dailyGateClosed(clueTop).y +
    (DAILY_GATE_ART.firstLineSrc + DAILY_GATE_ART.plankPitchSrc * i) *
      DAILY_GATE_PT_PER_SRC
  );
}

/**
 * Raise distance: the board's bottom edge must clear the top of the opening.
 * Four points of margin past that.
 */
export function dailyGateOpenTravel(clueTop: number = DAILY_CLUE_TOP_PREFERRED): number {
  return dailyGateLineY(DAILY_GATE_ART.plankCount, clueTop) - DAILY_CASTLE_OPENING.y + 4;
}
export const DAILY_GATE_OPEN_TRAVEL = dailyGateOpenTravel();

/**
 * How far the gate sinks past closed on the wrong-claim slam: a short, hard
 * jolt, never so deep that the board's top edge drops below the crown of the
 * opening.
 */
export function dailyGateMaxSink(clueTop: number = DAILY_CLUE_TOP_PREFERRED): number {
  return Math.min(6, DAILY_CASTLE_OPENING.y - dailyGateLineY(0, clueTop) - 1);
}
export const DAILY_GATE_MAX_SINK = dailyGateMaxSink();

/**
 * Clue text box width. From DAILY_CLUE_TOP_MIN (216 pt) down the opening is at
 * least 177.7 pt wide, centred on the gate; 176 fits inside it and fits every
 * clue in the pool (the longest at 16 pt).
 */
export const DAILY_GATE_CLUE_WIDTH = 176;

/**
 * Clue rects in canvas points with the gate closed. Each fills its plank
 * between the two plank lines, centred on the board.
 */
export function resolveDailyGateClueRects(
  clueTop: number = DAILY_CLUE_TOP_PREFERRED,
): DailyCastleRect[] {
  const closed = dailyGateClosed(clueTop);
  const boardCenterX =
    closed.x +
    (DAILY_GATE_ART.boardXSrc + DAILY_GATE_ART.boardWidthSrc / 2) *
      DAILY_GATE_PT_PER_SRC;
  return DAILY_GATE_CLUE_PLANKS.map((plank) => {
    const top = dailyGateLineY(plank, clueTop);
    return {
      x: boardCenterX - DAILY_GATE_CLUE_WIDTH / 2,
      y: top,
      width: DAILY_GATE_CLUE_WIDTH,
      height: dailyGateLineY(plank + 1, clueTop) - top,
    };
  });
}

/**
 * The framed answer wall, answerwall_framed.png, built by
 * tools/art/build_daily_answer_wall.py on the shared canvas. These are that
 * script's own constants (CAP_TOP, PANEL_TOP, PANEL_BOTTOM, PILLAR_W,
 * PILLARS) in canvas px; change both together. Two recessed brick panels,
 * one column of three answer blocks in each.
 */
export const DAILY_ANSWER_WALL = {
  capTopPx: 1728,
  panelTopPx: 1898,
  panelBottomPx: 2640,
  pillarWidthPx: 120,
  pillarXPx: [0, 585, 1170],
} as const;

/** The two brick panels, in canvas points. */
export const DAILY_ANSWER_PANELS: DailyCastleRect[] = [0, 1].map((i) => {
  const x0 = DAILY_ANSWER_WALL.pillarXPx[i] + DAILY_ANSWER_WALL.pillarWidthPx;
  const x1 = DAILY_ANSWER_WALL.pillarXPx[i + 1];
  return {
    x: x0 / 3,
    y: DAILY_ANSWER_WALL.panelTopPx / 3,
    width: (x1 - x0) / 3,
    height: (DAILY_ANSWER_WALL.panelBottomPx - DAILY_ANSWER_WALL.panelTopPx) / 3,
  };
});

/**
 * Mean colour of answerwall_framed.png's bottom 16 rows (the sill's face),
 * printed by build_daily_answer_wall.py; rerun and copy it if the wall changes. When the scene has to rise to keep the blocks clear
 * of the action label, the strip left under the wall is filled with it.
 */
export const DAILY_ANSWER_WALL_FOOT = '#3D3268';

/**
 * Floor coins (Pete, 2026-09-26): one per solved round on the courtyard
 * floor between the bottom step (its edge ends at y 1538 px, ~513 pt, on
 * castle_cartoon.png) and the answer wall's capstone (576 pt). Coin art from
 * tools/art/build_daily_coins.py: white 186 x 122 px, gold 240 x 155 px, each
 * with SHADOW_PAD 6 px of shadow below the point where the coin meets the
 * floor. Every coin's contact point sits on one line, `contactY`.
 */
export const DAILY_FLOOR_COINS = {
  floorTop: 1539 / 3,
  floorBottom: DAILY_ANSWER_WALL.capTopPx / 3,
  // Low on the floor so the 100 pt gold coin clears the bottom step (513 pt).
  contactY: 572,
  pitch: 76,
  white: { width: 186 / 3, height: 122 / 3, contactFromTop: (122 - 6) / 3 },
  // coin_gold.png is 300 × 192 px: 100 pt wide, ~1.6× a white coin (Pete, 2026-09-26).
  gold: { width: 300 / 3, height: 192 / 3, contactFromTop: (192 - 6) / 3 },
} as const;

/** White coin `index` of `count` (1–4), centred as a row. Canvas points. */
export function resolveDailyFloorCoin(index: number, count: number): DailyCastleRect {
  const c = DAILY_FLOOR_COINS;
  const cx = DAILY_CASTLE_CANVAS.width / 2 + (index - (count - 1) / 2) * c.pitch;
  return {
    x: cx - c.white.width / 2,
    y: c.contactY - c.white.contactFromTop,
    width: c.white.width,
    height: c.white.height,
  };
}

/** The win's single gold coin, centred. Canvas points. */
export function resolveDailyGoldCoin(): DailyCastleRect {
  const c = DAILY_FLOOR_COINS;
  return {
    x: DAILY_CASTLE_CANVAS.width / 2 - c.gold.width / 2,
    y: c.contactY - c.gold.contactFromTop,
    width: c.gold.width,
    height: c.gold.height,
  };
}

/**
 * The frieze: answerwall_framed.png's dark band between the capstone and the
 * brick panels, colour-measured at y 1804–1877 px (the capstone's highlight
 * ends above it, the panels' shadow line starts below it).
 */
export const DAILY_WALL_FRIEZE: DailyCastleRect = {
  x: 0,
  y: 1804 / 3,
  width: DAILY_CASTLE_CANVAS.width,
  height: (1878 - 1804) / 3,
};

/**
 * The five round markers (Pete, 2026-09-28): a row on the frieze, above the
 * answer blocks, drawn over the wall art (never baked into it). Canvas points;
 * scaled with the scene so the row stays on the band on every phone.
 */
export const DAILY_ROUND_MARKERS = {
  dot: 12,
  gap: 10,
  padX: 12,
  padY: 5,
} as const;

/** The round-marker plate for `count` rounds, centred on the frieze. Canvas points. */
export function resolveDailyRoundMarkers(count: number): DailyCastleRect {
  const m = DAILY_ROUND_MARKERS;
  const width = count * m.dot + (count - 1) * m.gap + 2 * m.padX;
  const height = m.dot + 2 * m.padY;
  return {
    x: (DAILY_CASTLE_CANVAS.width - width) / 2,
    y: DAILY_WALL_FRIEZE.y + (DAILY_WALL_FRIEZE.height - height) / 2,
    width,
    height,
  };
}

/** Top of the brick panels: every block sits below it. */
export const DAILY_CASTLE_WALL_FACE_TOP = DAILY_ANSWER_WALL.panelTopPx / 3;

export type DailyCastleGrid = {
  top: number;
  cardWidth: number;
  cardHeight: number;
  columnGap: number;
  rowGap: number;
};

/**
 * Black mortar between the answer blocks and round each panel, in canvas px:
 * build_daily_answer_wall.py's MORTAR_PX, where the six recesses are cut.
 * Change both together.
 */
export const DAILY_ANSWER_MORTAR_PX = 14;

/**
 * Answer blocks (Pete, 2026-09-27): they sit flush in the wall like bricks,
 * so they fill each panel three high with one mortar gap between them and
 * round the panel's edge. About 145.7 x 76.2 pt; answerplaque_stone.png is 3x
 * that. Each block covers its recess in the wall art exactly. Derived from
 * the panels so the two cannot drift apart.
 */
export const DAILY_CASTLE_GRID: DailyCastleGrid = (() => {
  const [left, right] = DAILY_ANSWER_PANELS;
  const mortar = DAILY_ANSWER_MORTAR_PX / 3;
  const cardWidth = left.width - 2 * mortar;
  const cardHeight = (left.height - 4 * mortar) / 3;
  const rowGap = mortar;
  const centerDistance = right.x + right.width / 2 - (left.x + left.width / 2);
  return {
    top: left.y + rowGap,
    cardWidth,
    cardHeight,
    columnGap: centerDistance - cardWidth,
    rowGap,
  };
})();

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

/**
 * SWIPE UP TO CLAIM (DailyChallengeScreen actionLabel) is placed from the
 * SCREEN bottom: absolutely positioned in the SafeAreaView, it ignores the
 * home-bar inset's padding (measured in the browser and on Pete's iPhone,
 * 2026-09-27). With a home bar it sits 10 pt up, clear of the bar; with none
 * (375 x 667) it sits 4 pt up, which gives that phone the room to keep the
 * clues below the HUD with nothing overlapping (Pete, 2026-09-27).
 */
export function dailyActionLabelBottom(bottomInset: number): number {
  return bottomInset > 0 ? 10 : 4;
}
/** The label's line height (16 pt Barlow Condensed), measured: 19 pt. */
export const DAILY_ACTION_LABEL_HEIGHT = 19;
/** Air between the lowest blocks and the label's top. */
export const DAILY_ACTION_LABEL_AIR = 3;

/** Room the grid leaves under itself for the label, from the screen bottom. */
export function dailyActionLabelClearance(bottomInset: number): number {
  return dailyActionLabelBottom(bottomInset) + DAILY_ACTION_LABEL_HEIGHT + DAILY_ACTION_LABEL_AIR;
}

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
 * The compact Daily HUD (Pete, 2026-09-28): DAILY #<n> with the chance
 * feathers beneath it, one small plate centred between the towers. The round
 * markers live on the wall (DAILY_ROUND_MARKERS). DailyChallengeScreen styles
 * the plate from these, so its height below is the one the layout gets.
 * Bebas Neue and Barlow Condensed both have a natural line height of 1.2 em
 * (hhea 900/-300 and 1000/-200 per 1000).
 */
export const DAILY_HUD = {
  marginTop: 4,
  border: 0.5,
  padTop: 5,
  padBottom: 6,
  padX: 12,
  labelSize: 24,
  labelLineHeight: 24 * 1.2,
  /**
   * feather-life-*.png is square, so this is the feather's drawn size (the
   * old 20 x 36 box drew the same 20 x 20 feather with 8 pt empty above and
   * below it).
   */
  feather: 20,
  featherGap: 4,
} as const;

/** Height the HUD layer takes below the top inset: `hudBottom - topInset`. */
export function dailyHudHeight(): number {
  const h = DAILY_HUD;
  return h.marginTop + 2 * h.border + h.padTop + h.labelLineHeight + h.feather + h.padBottom;
}

/**
 * The scene fills the screen width and is anchored to the bottom edge, so the
 * wall and plaques are whole; on shorter phones the tower tops run off the top
 * instead. Two limits then move the whole scene together — the layers never
 * separate:
 *   1. the plaque grid must end above the action label (scene rises);
 *   2. the clues must be able to start below the HUD (scene drops), but never
 *      so far that it breaks limit 1. Where the clues sit within the door is
 *      then `resolveDailyClueTop`'s job.
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
  /** The home-bar inset: it decides where the action label sits. */
  bottomInset: number;
  /** Window y of the HUD's bottom edge; 0 before it has been measured. */
  hudBottom?: number;
  grid?: DailyCastleGrid;
}): DailyCastleFrame {
  const scale = windowWidth / DAILY_CASTLE_CANVAS.width;
  const height = DAILY_CASTLE_CANVAS.height * scale;
  const gridLimit = windowHeight - dailyActionLabelClearance(bottomInset);
  const lowestTop = gridLimit - dailyCastleGridBottom(grid) * scale;
  let top = Math.min(windowHeight - height, lowestTop);
  // The clues can sit as low as DAILY_CLUE_TOP_MAX; only if even that is under
  // the HUD does the scene itself drop.
  const clueTop = hudBottom + DAILY_CASTLE_HUD_GAP - DAILY_CLUE_TOP_MAX * scale;
  if (top < clueTop) top = Math.min(clueTop, lowestTop);
  return { scale, top, width: windowWidth, height };
}

/**
 * The first clue plank's canvas y on this phone: centred in the door
 * (DAILY_CLUE_TOP_PREFERRED) unless the HUD would cover it, then just below the
 * HUD, never below DAILY_CLUE_TOP_MAX.
 */
export function resolveDailyClueTop(frame: DailyCastleFrame, hudBottom = 0): number {
  const belowHud = (hudBottom + DAILY_CASTLE_HUD_GAP - frame.top) / frame.scale;
  return Math.min(DAILY_CLUE_TOP_MAX, Math.max(DAILY_CLUE_TOP_PREFERRED, belowHud));
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
    y: 342,
  },
  handoffScale: 0.7,
  /** Canvas point where it disappears into the back wall. */
  end: {
    x: DAILY_CASTLE_OPENING.x + DAILY_CASTLE_OPENING.width / 2,
    y: 302,
  },
  endScale: 0.42,
  riseMs: 450,
  absorbMs: 200,
} as const;

export const DAILY_CASTLE_FLIGHT_HANDOFF =
  DAILY_CASTLE_FLIGHT.riseMs /
  (DAILY_CASTLE_FLIGHT.riseMs + DAILY_CASTLE_FLIGHT.absorbMs);

/**
 * The two tower caps, alpha-measured from castle_cartoon_gold_flash.png
 * (alpha > 32, stray flecks excluded): left x 0–191 px, y 85–363 px, finial
 * tip at x 33; right x 1113–1289 px, y 77–369 px, finial tip at x 1280. Both
 * domes run off the canvas edge and are centred on their finials; each dome's
 * middle is at about y 230 (left) and 225 (right).
 */
export const DAILY_CASTLE_CAPS: readonly DailyCastleRect[] = [
  { x: 0, y: 85 / 3, width: 192 / 3, height: 279 / 3 },
  { x: 1113 / 3, y: 77 / 3, width: 177 / 3, height: 293 / 3 },
];
const DAILY_CAP_CENTRES = [
  { x: 33 / 3, y: 230 / 3 },
  { x: 1280 / 3, y: 225 / 3 },
] as const;
/** The bloom behind each cap (coin_glow.png), well past the cap's silhouette. */
export const DAILY_CAP_GLOW_SIZE = { width: 216, height: 180 } as const;
export const DAILY_CASTLE_CAP_GLOWS: readonly DailyCastleRect[] = DAILY_CAP_CENTRES.map((centre) => ({
  x: centre.x - DAILY_CAP_GLOW_SIZE.width / 2,
  y: centre.y - DAILY_CAP_GLOW_SIZE.height / 2,
  width: DAILY_CAP_GLOW_SIZE.width,
  height: DAILY_CAP_GLOW_SIZE.height,
}));

/**
 * The castle's gold hit on a correct claim (Pete, 2026-09-29: the old trim fade
 * was too pale and easy to miss; this version device-approved and LOCKED the
 * same day). The gold trim lights, flat crown gold is laid
 * over it, and a bloom swells behind each cap: fast ignition, a hold near the
 * peak, a smooth decay back to the resting art. One progress value runs
 * 0 → 1 (ignited) → 2 (end of hold) → 3 (gone), read through the keyframes of
 * dailyGoldHitKeyframes.
 *
 * `calm` is for Reduce Motion or Reduce Flashes: the same gold at the same
 * strength, but a gentler ignition with no overshoot and no swelling.
 */
export const DAILY_GOLD_HIT_COLOR = '#F5C842';
export const DAILY_GOLD_HIT = {
  full: { igniteMs: 100, holdMs: 200, decayMs: 400 },
  calm: { igniteMs: 200, holdMs: 150, decayMs: 400 },
} as const;
export const DAILY_GOLD_HIT_INPUT = [0, 1, 2, 3];

export function dailyGoldHitMs(calm: boolean): number {
  const timing = DAILY_GOLD_HIT[calm ? 'calm' : 'full'];
  return timing.igniteMs + timing.holdMs + timing.decayMs;
}

export type DailyGoldHitKeyframes = {
  /** The shaded gold trim art (castle_cartoon_gold_flash.png). */
  trim: number[];
  /** The same trim tinted flat DAILY_GOLD_HIT_COLOR, over it: saturation. */
  tint: number[];
  /** The bloom behind each cap. */
  glow: number[];
  /** The bloom's scale about its centre. */
  glowScale: number[];
};

/** Outputs for DAILY_GOLD_HIT_INPUT. Every opacity ends at 0: nothing lingers. */
export function dailyGoldHitKeyframes(calm: boolean): DailyGoldHitKeyframes {
  return calm
    ? {
        trim: [0, 1, 1, 0],
        tint: [0, 0.5, 0.5, 0],
        glow: [0, 0.9, 0.9, 0],
        glowScale: [1, 1, 1, 1],
      }
    : {
        trim: [0, 1, 1, 0],
        // One restrained overshoot at ignition, relaxing through the hold.
        tint: [0, 0.62, 0.5, 0],
        glow: [0, 1, 0.9, 0],
        glowScale: [0.8, 1.12, 1.05, 1],
      };
}

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
  // 24 (Pete, 2026-09-28), two lines included: the 61 pt plank
  // (DAILY_GATE_PLANK_PT) leaves 9 pt around two lines of 24. On the old 52 pt
  // plank two lines of 24 filled it edge to edge and three clues read as one
  // paragraph (Pete, 2026-09-26), so clues were held at 20.
  maxSize: 24,
  // 16 is reached by one clue only ("THE OUTWARD ANGLE WHERE TWO SLOPING ROOF
  // SIDES MEET") in the cartoon castle's 178 pt clue box; every other clue fits at 17+.
  minSize: 16,
  lineHeightRatio: 26 / 24,
  letterSpacing: 0.5,
  maxLines: 2,
  /** Headroom for rendering differences between platforms. */
  safety: 0.95,
} as const;

/** Measured width of `text` on one line at `size`, in canvas points. */
export function dailyClueTextWidth(text: string, size: number): number {
  return textWidth(text, size);
}

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

/**
 * The clue as it is drawn: one line when it fits on one at `size`, otherwise
 * two lines split at the word break that makes them closest in width, so no
 * clue ends on a lone word ("HOW YOU MAKE / A BUTTON WORK", not "HOW YOU MAKE
 * A BUTTON / WORK"). The greedy split is one of the candidates, so a clue that
 * fits greedily always fits balanced.
 */
export function balanceDailyClue(text: string, size: number, width: number): string {
  const upper = text.toUpperCase();
  const usable = width * DAILY_CLUE_FONT.safety;
  if (textWidth(upper, size) <= usable) return upper;
  const words = upper.split(' ');
  let best = upper;
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const first = words.slice(0, i).join(' ');
    const second = words.slice(i).join(' ');
    const widest = Math.max(textWidth(first, size), textWidth(second, size));
    if (widest < bestWidth) {
      bestWidth = widest;
      best = `${first}\n${second}`;
    }
  }
  return best;
}

/**
 * Barlow Condensed Bold (FONTS.tileCopy, the answer-block label) advance
 * widths in em for A–Z — every character the Daily candidates use — measured
 * from the bundled font with canvas measureText. Weight 800 measured the same.
 */
const BARLOW_BOLD_ADVANCE_EM: Record<string, number> = {
  A: 0.482,
  B: 0.47,
  C: 0.464,
  D: 0.476,
  E: 0.438,
  F: 0.421,
  G: 0.467,
  H: 0.48,
  I: 0.23,
  J: 0.452,
  K: 0.491,
  L: 0.426,
  M: 0.548,
  N: 0.514,
  O: 0.473,
  P: 0.465,
  Q: 0.461,
  R: 0.471,
  S: 0.444,
  T: 0.468,
  U: 0.479,
  V: 0.488,
  W: 0.689,
  X: 0.475,
  Y: 0.474,
  Z: 0.412,
};
const BARLOW_BOLD_WIDEST_EM = Math.max(...Object.values(BARLOW_BOLD_ADVANCE_EM));

export const DAILY_ANSWER_FONT = {
  maxSize: 26,
  minSize: 14,
  letterSpacing: 0.5,
  /** The label's side padding on the block face, each side. */
  sidePadding: 11,
  safety: 0.95,
} as const;

export function dailyAnswerTextWidth(text: string, size: number): number {
  let em = 0;
  for (const ch of text.toUpperCase()) em += BARLOW_BOLD_ADVANCE_EM[ch] ?? BARLOW_BOLD_WIDEST_EM;
  return em * size + text.length * DAILY_ANSWER_FONT.letterSpacing;
}

/**
 * Largest whole-point label size at which `label` fits on one line of a
 * block `blockWidth` wide (any consistent unit). Replaces trusting
 * adjustsFontSizeToFit, which react-native-web ignores.
 */
export function fitDailyAnswerFontSize(label: string, blockWidth: number): number {
  const usable = (blockWidth - 2 * DAILY_ANSWER_FONT.sidePadding) * DAILY_ANSWER_FONT.safety;
  for (let size = DAILY_ANSWER_FONT.maxSize; size > DAILY_ANSWER_FONT.minSize; size -= 1) {
    if (dailyAnswerTextWidth(label, size) <= usable) return size;
  }
  return DAILY_ANSWER_FONT.minSize;
}
