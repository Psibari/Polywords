// Pure geometry and text-fit math for the Daily clue scroll. RN-free by
// design (no imports from react-native) so it runs under plain tsx and can
// be tested without a renderer — same pattern as tileTextLayout.ts.
//
// This module exists because the scroll's height used to be hardcoded
// (QuillScrollPanel's VIEW_H = 190) while its width floated with the
// device. That made the parchment's rendered aspect a function of screen
// width, so the art distorted by x1.06 on a 320pt screen and x1.48 on a
// 430pt one, and the two symptoms (stretched art, crushed text) traded
// against each other under every tuning pass.

// ── Source art ────────────────────────────────────────────────────
// PNG header-verified dimensions of assets/images/textures/scroll_paper.png
// and scroll_rod.png.
export const SCROLL_PAPER_SOURCE_W = 799;
export const SCROLL_PAPER_SOURCE_H = 485;

// The parchment is top-lit with a continuous gradient (mean luma 41.3 at the
// top band, 20.2 near the bottom) and tapers narrower toward the top (opaque
// width 89.1% -> 98.5%). There is no flat band to slice: the longest
// full-width, low-gradient run is 27px, 5.6% of the image. So a 3-slice with
// a "neutral middle" is not available.
//
// What IS available: those continuous features tolerate vertical stretch — a
// stretched gradient is still a gradient. Only the ragged bottom edge carries
// fine detail with a characteristic scale, and pixel-scanning puts its start
// at y=436, where mean opaque width collapses from 98.5% to 52.9%.
export const SCROLL_PAPER_EDGE_SPLIT_PX = 436;

export const SCROLL_ROD_SOURCE_W = 1659;
export const SCROLL_ROD_SOURCE_H = 165;
export const SCROLL_ROD_ASPECT = SCROLL_ROD_SOURCE_W / SCROLL_ROD_SOURCE_H;

// The rod is wider than the paper because that is what a real scroll looks
// like. It gets there by overhanging into the screen margins (the panel's
// own marginHorizontal is 20, and QuillScrollPanel's root is overflow:
// 'visible'), NOT by stretching the drawing. 1.06 keeps it inside the screen
// on every supported width.
export const SCROLL_ROD_WIDTH_RATIO = 1.06;

// ── Type scale ────────────────────────────────────────────────────
// 24/18 is the largest scale whose worst-case three-clue stack is constant
// at 160pt on every device AND where no clue in the live pool exceeds two
// lines. At 26/19 the 51-character roof clue needs three lines on a 320pt
// screen, and numberOfLines={2} truncates rather than wrapping it.
export const DAILY_CLUE_TYPE = {
  activeSize: 24,
  activeLineHeight: 28,
  memorySize: 18,
  memoryLineHeight: 22,
  gap: 8,
  maxLines: 2,
  textPadding: 18,
} as const;

// Bebas Neue metrics, calibrated against a device capture rather than
// guessed: "SENT FROM THE MOUND TO HOME" (27 chars) at 27pt measures 281pt
// in-app, and 27 * (27 * 0.363 + 0.6) = 281pt.
export const BEBAS_ADVANCE_EM = 0.363;
export const BEBAS_TRACKING = 0.6;

// ── Parchment slices ──────────────────────────────────────────────
export type ParchmentSlices = {
  width: number;
  uniformScale: number;
  // The undistorted torn bottom edge.
  edgeHeight: number;
  edgeImageHeight: number;
  edgeImageTop: number;
  // The smooth body, which absorbs all vertical stretch.
  bodyHeight: number;
  bodyImageHeight: number;
};

const EDGE_SPLIT_FRACTION = SCROLL_PAPER_EDGE_SPLIT_PX / SCROLL_PAPER_SOURCE_H;

export function resolveParchmentSlices(
  width: number,
  totalHeight: number,
): ParchmentSlices {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 0;
  const safeTotal = Number.isFinite(totalHeight) && totalHeight > 0 ? totalHeight : 0;
  const uniformScale = safeWidth / SCROLL_PAPER_SOURCE_W;

  // Full image rendered at its true aspect. The edge slice is a window onto
  // the bottom of this, so the edge never scales differently from the width.
  const naturalImageHeight = SCROLL_PAPER_SOURCE_H * uniformScale;
  const naturalEdgeHeight =
    (SCROLL_PAPER_SOURCE_H - SCROLL_PAPER_EDGE_SPLIT_PX) * uniformScale;

  // A panel too short to hold even the edge clamps rather than going
  // negative; the body then contributes nothing.
  const edgeHeight = Math.min(naturalEdgeHeight, safeTotal);
  const bodyHeight = Math.max(0, safeTotal - edgeHeight);

  return {
    width: safeWidth,
    uniformScale,
    edgeHeight,
    edgeImageHeight: naturalImageHeight,
    edgeImageTop: -(SCROLL_PAPER_EDGE_SPLIT_PX * uniformScale),
    bodyHeight,
    // The body occupies 0..EDGE_SPLIT_FRACTION of the source, so to show
    // exactly that band at bodyHeight the full image must be drawn taller.
    // This is the only place vertical stretch happens.
    bodyImageHeight: bodyHeight / EDGE_SPLIT_FRACTION,
  };
}

// ── Rod ───────────────────────────────────────────────────────────
export type RodMetrics = {
  width: number;
  height: number;
  overhang: number;
};

export function resolveRodMetrics(panelWidth: number): RodMetrics {
  const safePanel = Number.isFinite(panelWidth) && panelWidth > 0 ? panelWidth : 0;
  const width = safePanel * SCROLL_ROD_WIDTH_RATIO;
  return {
    width,
    height: width / SCROLL_ROD_ASPECT,
    overhang: (width - safePanel) / 2,
  };
}

// ── Clue fitting ──────────────────────────────────────────────────
export function resolveClueTextBoxWidth(panelWidth: number): number {
  return Math.max(0, panelWidth - DAILY_CLUE_TYPE.textPadding * 2);
}

export function estimateClueWidth(text: string, fontSize: number): number {
  return text.length * (fontSize * BEBAS_ADVANCE_EM + BEBAS_TRACKING);
}

export function estimateClueLines(
  text: string,
  fontSize: number,
  boxWidth: number,
): number {
  if (boxWidth <= 0) return DAILY_CLUE_TYPE.maxLines;
  return Math.max(1, Math.ceil(estimateClueWidth(text, fontSize) / boxWidth));
}

function worstBlockHeight(
  clues: readonly string[],
  fontSize: number,
  lineHeight: number,
  boxWidth: number,
): number {
  let worst = lineHeight;
  for (const clue of clues) {
    const height = estimateClueLines(clue, fontSize, boxWidth) * lineHeight;
    if (height > worst) worst = height;
  }
  return worst;
}

// Worst case for a stack of `clueCount` clues: the last one is active, the
// rest are memory. Any clue can appear in any slot, so each block is sized
// by the pool's worst entry at that block's size.
export function resolveClueStackHeight(
  clueCount: number,
  boxWidth: number,
  clues: readonly string[],
): number {
  const count = Math.max(1, Math.min(3, Math.floor(clueCount)));
  const active = worstBlockHeight(
    clues,
    DAILY_CLUE_TYPE.activeSize,
    DAILY_CLUE_TYPE.activeLineHeight,
    boxWidth,
  );
  const memory = worstBlockHeight(
    clues,
    DAILY_CLUE_TYPE.memorySize,
    DAILY_CLUE_TYPE.memoryLineHeight,
    boxWidth,
  );
  return active + (count - 1) * memory + (count - 1) * DAILY_CLUE_TYPE.gap;
}

// The reserved text box. Fixed rather than per-round, so nothing below the
// scroll ever moves; the parchment unrolls INTO this reservation (Task 5).
// 160 is the measured worst case at 24/18 and is constant on every device.
const RESERVED_TEXT_HEIGHT = 160;

export function resolveReservedTextHeight(_panelWidth: number): number {
  return RESERVED_TEXT_HEIGHT;
}
