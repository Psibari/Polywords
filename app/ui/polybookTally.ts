// Polybook MASTERY tally layout (Pete, 2026-11-10). RN-free and pure.
//
// The four crown files have different margins, so each crown is sized by its
// PAINTED area, not its file box: every crown's painted width is the same W,
// and only the painted box is shown (a clipping wrapper with the full image
// placed inside it at a negative offset).
import type { PolybookTallyKind } from '../game/polybookTally';

/** Reading order, row by row: MASTERED, KING / BANISHED, HAUNTED. */
export const POLYBOOK_TALLY_ORDER: readonly PolybookTallyKind[] = ['mastered', 'king', 'banished', 'haunted'];

export const POLYBOOK_TALLY_LABELS: Record<PolybookTallyKind, string> = {
  mastered: 'MASTERED',
  king: 'KING',
  banished: 'BANISHED',
  haunted: 'HAUNTED',
};

/**
 * Painted bounding boxes in file pixels, measured 2026-11-10 with pngjs
 * (alpha > 8). x0/y0 inclusive, x1/y1 exclusive. Re-measure if the art changes.
 * Files: assets/images/results/GoldenCrown.png, kingcrown.png, banishcrown.png, hauntcrown.png.
 */
export type CrownArtBox = { fileW: number; fileH: number; x0: number; y0: number; x1: number; y1: number };

export const POLYBOOK_TALLY_CROWN_BOXES: Record<PolybookTallyKind, CrownArtBox> = {
  mastered: { fileW: 1536, fileH: 1024, x0: 91, y0: 22, x1: 1445, y1: 986 },
  king: { fileW: 1536, fileH: 1024, x0: 33, y0: 3, x1: 1489, y1: 1024 },
  banished: { fileW: 1453, fileH: 1082, x0: 36, y0: 62, x1: 1418, y1: 1006 },
  haunted: { fileW: 1453, fileH: 1082, x0: 19, y0: 36, x1: 1428, y1: 1031 },
};

/** Gaps in points. TEST VALUES. */
export const POLYBOOK_TALLY_COLUMN_GAP = 14;
export const POLYBOOK_TALLY_ROW_GAP = 18;
export const POLYBOOK_TALLY_CROWN_TEXT_GAP = 6;

export function paintedAspect(box: CrownArtBox): number {
  return (box.y1 - box.y0) / (box.x1 - box.x0);
}

/** Tallest painted height per unit of painted width among the four crowns. */
export const POLYBOOK_TALLY_SLOT_ASPECT = Math.max(
  ...POLYBOOK_TALLY_ORDER.map((kind) => paintedAspect(POLYBOOK_TALLY_CROWN_BOXES[kind])),
);

export type CrownFrame = {
  /** Clipping wrapper = the scaled painted box. */
  width: number;
  height: number;
  /** The whole file, absolutely placed inside the wrapper. */
  imageWidth: number;
  imageHeight: number;
  imageLeft: number;
  imageTop: number;
};

export function resolveCrownFrame(box: CrownArtBox, paintedWidth: number): CrownFrame {
  const scale = paintedWidth / (box.x1 - box.x0);
  return {
    width: paintedWidth,
    height: (box.y1 - box.y0) * scale,
    imageWidth: box.fileW * scale,
    imageHeight: box.fileH * scale,
    imageLeft: -box.x0 * scale,
    imageTop: -box.y0 * scale,
  };
}

export type TallyAreaInput = {
  /** Measured width and height of the area the 2x2 tally may use. */
  areaWidth: number;
  areaHeight: number;
  /** Measured height of one tile's text (count + label), at the player's text size. */
  textBlockHeight: number;
};

export function resolveTallyColumnWidth(areaWidth: number): number {
  return Math.max(0, (areaWidth - POLYBOOK_TALLY_COLUMN_GAP) / 2);
}

/**
 * The largest painted crown width W that lets both rows (crown slot + gap + text)
 * fit the measured height, capped by the column width. Each row's crown slot is
 * W * POLYBOOK_TALLY_SLOT_ASPECT tall so the counts line up across the row.
 */
export function resolveTallyCrownWidth({ areaWidth, areaHeight, textBlockHeight }: TallyAreaInput): number {
  const byWidth = resolveTallyColumnWidth(areaWidth);
  const crownHeightBudget =
    (areaHeight - POLYBOOK_TALLY_ROW_GAP - 2 * (textBlockHeight + POLYBOOK_TALLY_CROWN_TEXT_GAP)) / 2;
  const byHeight = crownHeightBudget / POLYBOOK_TALLY_SLOT_ASPECT;
  return Math.max(0, Math.floor(Math.min(byWidth, byHeight)));
}

/**
 * Text. The page follows the iPhone Text Size (no allowFontScaling={false}),
 * capped at POLYBOOK_TALLY_FONT_SCALE_CAP through maxFontSizeMultiplier so the
 * largest accessibility sizes cannot push the tally off the page. Sizes are the
 * size at Text Size 1.0. TEST VALUES.
 */
export const POLYBOOK_TALLY_COUNT_FONT_SIZE = 48;
export const POLYBOOK_TALLY_LABEL_FONT_SIZE = 18;
export const POLYBOOK_TALLY_FONT_SCALE_CAP = 1.6;
/** Barlow Condensed Bold's natural line: (ascent 1000 + descent 200) / 1000 em. */
export const POLYBOOK_TALLY_TEXT_LINE_FACTOR = 1.2;
/** Below this crown width the text is shrunk instead of the crowns. TEST VALUE. */
export const POLYBOOK_TALLY_MIN_CROWN_WIDTH = 44;
const MIN_TEXT_SHRINK = 0.4;

export type TallyLayoutInput = {
  areaWidth: number;
  areaHeight: number;
  /** useWindowDimensions().fontScale. */
  fontScale: number;
  /** onLayout height of a rendered text block, when known; trusted over the estimate if taller. */
  measuredTextBlockHeight?: number;
};

export type TallyLayout = {
  columnWidth: number;
  crownWidth: number;
  /** Every crown sits on the bottom of a slot this tall, so counts line up across a row. */
  slotHeight: number;
  /** Font sizes to pass (RN then multiplies by min(fontScale, cap)). */
  countFontSize: number;
  labelFontSize: number;
  textBlockHeight: number;
};

export function estimateTallyTextBlockHeight(fontScale: number, textShrink = 1): number {
  const effective = Math.min(Math.max(fontScale, 0), POLYBOOK_TALLY_FONT_SCALE_CAP);
  return (
    (POLYBOOK_TALLY_COUNT_FONT_SIZE + POLYBOOK_TALLY_LABEL_FONT_SIZE) *
    POLYBOOK_TALLY_TEXT_LINE_FACTOR *
    effective *
    textShrink
  );
}

export function resolveTallyLayout(input: TallyLayoutInput): TallyLayout {
  const columnWidth = resolveTallyColumnWidth(input.areaWidth);
  const fullText = estimateTallyTextBlockHeight(input.fontScale);
  // Shrink the text only when full-size text would leave the crowns under the minimum width.
  const minCrown = Math.min(columnWidth, POLYBOOK_TALLY_MIN_CROWN_WIDTH);
  const textBudget =
    (input.areaHeight - POLYBOOK_TALLY_ROW_GAP) / 2 -
    POLYBOOK_TALLY_CROWN_TEXT_GAP -
    minCrown * POLYBOOK_TALLY_SLOT_ASPECT;
  const textShrink = fullText > 0 ? Math.min(1, Math.max(MIN_TEXT_SHRINK, textBudget / fullText)) : 1;
  const textBlockHeight = Math.max(fullText * textShrink, input.measuredTextBlockHeight ?? 0);
  const crownWidth = resolveTallyCrownWidth({
    areaWidth: input.areaWidth,
    areaHeight: input.areaHeight,
    textBlockHeight,
  });
  return {
    columnWidth,
    crownWidth,
    slotHeight: crownWidth * POLYBOOK_TALLY_SLOT_ASPECT,
    countFontSize: POLYBOOK_TALLY_COUNT_FONT_SIZE * textShrink,
    labelFontSize: POLYBOOK_TALLY_LABEL_FONT_SIZE * textShrink,
    textBlockHeight,
  };
}

/** DEV-only override values Pete cycles through to see 0, 1 and many. */
export const POLYBOOK_TALLY_DEV_COUNTS: readonly number[] = [0, 1, 7, 48, 123];
