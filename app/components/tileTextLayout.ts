import type { TextProps } from 'react-native';

export const ACTIVE_TILE_BASE_FONT_SIZE = 27;
export const ACTIVE_TILE_MIN_FONT_SIZE = 22;

const ACTIVE_TILE_MAX_CARD_WIDTH = 290;
const ACTIVE_TILE_GAUNTLET_MAX_CARD_WIDTH = 300;
const ACTIVE_TILE_SCREEN_GUTTER = 80;
const ACTIVE_TILE_GAUNTLET_SCREEN_GUTTER = 40;
const ACTIVE_TILE_TEXT_REGION_RATIO = 0.82;
const ACTIVE_TILE_TEXT_SIDE_PADDING = 8;
const ACTIVE_TILE_TEXT_WIDTH_SAFETY = 0.96;
const ACTIVE_TILE_TARGET_LINE_COUNT = 3;
const ACTIVE_TILE_LETTER_SPACING = 0.6;
const ACTIVE_TILE_BASE_LINE_HEIGHT = 31;

// Barlow Condensed Bold advance widths in em, measured from the bundled font.
// Keeping Hunt wrapping deterministic avoids relying on platform line-breaking
// at the exact right edge of the painted card.
const ACTIVE_TILE_GLYPH_ADVANCE_EM: Record<string, number> = {
  ' ': 0.2,
  '!': 0.279,
  '%': 0.766,
  '&': 0.603,
  "'": 0.17,
  '+': 0.438,
  ',': 0.211,
  '-': 0.331,
  '.': 0.223,
  '0': 0.453,
  '1': 0.284,
  '2': 0.438,
  '3': 0.436,
  '4': 0.484,
  '5': 0.439,
  '6': 0.44,
  '7': 0.407,
  '8': 0.44,
  '9': 0.435,
  ':': 0.275,
  ';': 0.232,
  '?': 0.437,
  '@': 0.759,
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
  _: 0.421,
  Ä: 0.482,
  É: 0.438,
  Ú: 0.479,
  '—': 0.593,
  '’': 0.188,
  '“': 0.352,
  '”': 0.352,
  '…': 0.709,
};
const ACTIVE_TILE_WIDEST_GLYPH_EM = Math.max(
  ...Object.values(ACTIVE_TILE_GLYPH_ADVANCE_EM),
);

export type ActiveTileTextLayout = {
  fontSize: number;
  lineHeight: number;
  lines: readonly string[];
  textRegionWidth: number;
};

export function resolveActiveTileCardWidth(
  viewportWidth: number,
  gauntletCard: boolean,
): number {
  const safeViewportWidth = Number.isFinite(viewportWidth) && viewportWidth > 0
    ? viewportWidth
    : gauntletCard
      ? ACTIVE_TILE_GAUNTLET_MAX_CARD_WIDTH + ACTIVE_TILE_GAUNTLET_SCREEN_GUTTER
      : ACTIVE_TILE_MAX_CARD_WIDTH + ACTIVE_TILE_SCREEN_GUTTER;
  const gutter = gauntletCard
    ? ACTIVE_TILE_GAUNTLET_SCREEN_GUTTER
    : ACTIVE_TILE_SCREEN_GUTTER;
  const maximum = gauntletCard
    ? ACTIVE_TILE_GAUNTLET_MAX_CARD_WIDTH
    : ACTIVE_TILE_MAX_CARD_WIDTH;
  return Math.min(Math.max(safeViewportWidth - gutter, 0), maximum);
}

export function activeTileTextWidth(text: string, fontSize: number): number {
  let advanceEm = 0;
  for (const character of text.toUpperCase()) {
    advanceEm += ACTIVE_TILE_GLYPH_ADVANCE_EM[character] ?? ACTIVE_TILE_WIDEST_GLYPH_EM;
  }
  return advanceEm * fontSize + Math.max(0, text.length - 1) * ACTIVE_TILE_LETTER_SPACING;
}

function resolveActiveTileTextRegionWidth(cardWidth: number): number {
  const safeCardWidth = Number.isFinite(cardWidth) && cardWidth > 0
    ? cardWidth
    : ACTIVE_TILE_MAX_CARD_WIDTH;
  const panelWidth = safeCardWidth * ACTIVE_TILE_TEXT_REGION_RATIO;
  return Math.max(
    0,
    (panelWidth - ACTIVE_TILE_TEXT_SIDE_PADDING * 2) * ACTIVE_TILE_TEXT_WIDTH_SAFETY,
  );
}

function wrapActiveTileText(text: string, fontSize: number, width: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let currentLine = words[0];
  for (const word of words.slice(1)) {
    const candidate = `${currentLine} ${word}`;
    if (activeTileTextWidth(candidate, fontSize) <= width) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export function resolveActiveTileTextLayout(
  text: string,
  cardWidth: number,
): ActiveTileTextLayout {
  const textRegionWidth = resolveActiveTileTextRegionWidth(cardWidth);
  for (let fontSize = ACTIVE_TILE_BASE_FONT_SIZE; fontSize >= ACTIVE_TILE_MIN_FONT_SIZE; fontSize -= 1) {
    const lines = wrapActiveTileText(text, fontSize, textRegionWidth);
    const allLinesFit = lines.every(line => activeTileTextWidth(line, fontSize) <= textRegionWidth);
    if (allLinesFit && lines.length <= ACTIVE_TILE_TARGET_LINE_COUNT) {
      return {
        fontSize,
        lineHeight: Math.round(fontSize * ACTIVE_TILE_BASE_LINE_HEIGHT / ACTIVE_TILE_BASE_FONT_SIZE),
        lines,
        textRegionWidth,
      };
    }
  }

  const lines = wrapActiveTileText(text, ACTIVE_TILE_MIN_FONT_SIZE, textRegionWidth);
  return {
    fontSize: ACTIVE_TILE_MIN_FONT_SIZE,
    lineHeight: Math.round(
      ACTIVE_TILE_MIN_FONT_SIZE * ACTIVE_TILE_BASE_LINE_HEIGHT / ACTIVE_TILE_BASE_FONT_SIZE,
    ),
    lines,
    textRegionWidth,
  };
}

const ACTIVE_TILE_MIN_HEIGHT = 152;
const DEFAULT_GRID_PADDING_TOP = 110;
const MIN_GRID_PADDING_TOP = 48;
const DEFAULT_GRID_PADDING_BOTTOM = 48;
const MIN_GRID_PADDING_BOTTOM = 12;
const DEFAULT_CUE_TEXT_HEIGHT = 21;
const UP_CUE_TO_CARD_GAP = 14;
const ACTIVE_DECK_REGION_EXTRA = 32;

export const ACTIVE_TILE_WHOLE_WORD_TEXT_PROPS = {
  android_hyphenationFrequency: 'none',
  lineBreakStrategyIOS: 'standard',
  textBreakStrategy: 'highQuality',
} as const satisfies Pick<
  TextProps,
  'android_hyphenationFrequency' | 'lineBreakStrategyIOS' | 'textBreakStrategy'
>;

export function resolveActiveTileHeight(
  measuredHeight: number,
  minimumHeight = ACTIVE_TILE_MIN_HEIGHT,
): number {
  const safeMinimumHeight = Number.isFinite(minimumHeight) && minimumHeight > 0
    ? Math.ceil(minimumHeight)
    : ACTIVE_TILE_MIN_HEIGHT;

  if (!Number.isFinite(measuredHeight) || measuredHeight <= 0) {
    return safeMinimumHeight;
  }

  return Math.max(safeMinimumHeight, Math.ceil(measuredHeight));
}

export function resolveGauntletRowHeight(
  measuredHeights: ReadonlyMap<string, number>,
  minimumHeight = 200,
): number {
  const safeMinimumHeight = resolveActiveTileHeight(0, minimumHeight);
  let rowHeight = safeMinimumHeight;
  for (const height of measuredHeights.values()) {
    rowHeight = Math.max(
      rowHeight,
      resolveActiveTileHeight(height, safeMinimumHeight),
    );
  }
  return rowHeight;
}

export function releaseGauntletMeasuredHeight(
  measuredHeights: Map<string, number>,
  maskId: string,
): Map<string, number> {
  if (!measuredHeights.has(maskId)) return measuredHeights;
  const next = new Map(measuredHeights);
  next.delete(maskId);
  return next;
}

export function resolveActiveCueLayout(
  activeCardHeight: number,
  measuredUpCueHeight: number,
  measuredRightCueHeight: number,
): {
  activeCardHeight: number;
  upCueHeight: number;
  rightCueHeight: number;
  leadingCueRegionHeight: number;
  ownedRegionHeight: number;
} {
  const safeCardHeight = resolveActiveTileHeight(activeCardHeight);
  const safeCueHeight = (height: number) => (
    Number.isFinite(height) && height > 0
      ? Math.ceil(height)
      : DEFAULT_CUE_TEXT_HEIGHT
  );
  const upCueHeight = safeCueHeight(measuredUpCueHeight);
  const rightCueHeight = safeCueHeight(measuredRightCueHeight);
  const leadingCueRegionHeight = upCueHeight + UP_CUE_TO_CARD_GAP;

  return {
    activeCardHeight: safeCardHeight,
    upCueHeight,
    rightCueHeight,
    leadingCueRegionHeight,
    ownedRegionHeight:
      leadingCueRegionHeight + safeCardHeight + ACTIVE_DECK_REGION_EXTRA + rightCueHeight,
  };
}

type ActiveTileLayoutOptions = {
  state: 'idle' | 'correct' | 'trap-caught' | 'wrong' | 'hidden' | 'revealed';
  isSpecialSplit: boolean;
  bookMaterial: boolean;
  gauntletCard: boolean;
  tileHeight: number;
};

export function resolveActiveTileLayoutPolicy({
  state,
  isSpecialSplit,
  bookMaterial,
  tileHeight,
}: ActiveTileLayoutOptions): {
  usesMeasuredLayout: boolean;
  minimumHeight: number;
  textProps: TextProps;
} {
  const usesMeasuredLayout =
    state !== 'hidden' && state !== 'revealed' && !isSpecialSplit && !bookMaterial;

  if (usesMeasuredLayout) {
    return {
      usesMeasuredLayout: true,
      minimumHeight: resolveActiveTileHeight(tileHeight, tileHeight),
      textProps: ACTIVE_TILE_WHOLE_WORD_TEXT_PROPS,
    };
  }

  return {
    usesMeasuredLayout: false,
    minimumHeight: Math.max(tileHeight, 58),
    textProps: {
      numberOfLines: 2,
      adjustsFontSizeToFit: true,
      minimumFontScale: isSpecialSplit ? 0.65 : 0.8,
    },
  };
}

export function resolveBoardVerticalSpacing(
  viewportHeight: number,
  ownedRegionHeight: number,
  fixedWordRegionHeight: number,
): { gridPaddingTop: number; gridPaddingBottom: number } {
  if (
    !Number.isFinite(viewportHeight) || viewportHeight <= 0 ||
    !Number.isFinite(ownedRegionHeight) || ownedRegionHeight <= 0 ||
    !Number.isFinite(fixedWordRegionHeight) || fixedWordRegionHeight < 0
  ) {
    return {
      gridPaddingTop: DEFAULT_GRID_PADDING_TOP,
      gridPaddingBottom: DEFAULT_GRID_PADDING_BOTTOM,
    };
  }

  let shortage = Math.max(
    0,
    fixedWordRegionHeight + DEFAULT_GRID_PADDING_TOP +
      ownedRegionHeight + DEFAULT_GRID_PADDING_BOTTOM - viewportHeight,
  );
  const reclaimedTop = Math.min(shortage, DEFAULT_GRID_PADDING_TOP - MIN_GRID_PADDING_TOP);
  shortage -= reclaimedTop;
  const reclaimedBottom = Math.min(
    shortage,
    DEFAULT_GRID_PADDING_BOTTOM - MIN_GRID_PADDING_BOTTOM,
  );

  return {
    gridPaddingTop: DEFAULT_GRID_PADDING_TOP - reclaimedTop,
    gridPaddingBottom: DEFAULT_GRID_PADDING_BOTTOM - reclaimedBottom,
  };
}

// Extra room above the deck, taken from the space below it so the content
// height is unchanged. Used only while a board carries an instruction caption
// band; the deck sits lower by the reserve but does not move within the word.
export function applyBoardTopReserve(
  spacing: { gridPaddingTop: number; gridPaddingBottom: number },
  reserve: number,
): { gridPaddingTop: number; gridPaddingBottom: number } {
  if (!Number.isFinite(reserve) || reserve <= 0) return spacing;
  return {
    gridPaddingTop: spacing.gridPaddingTop + reserve,
    gridPaddingBottom: Math.max(MIN_GRID_PADDING_BOTTOM, spacing.gridPaddingBottom - reserve),
  };
}

// The hero book's base art is drawn with contentFit fill onto a 1154x830
// canvas; its last drawn row is 818 (all three variants, read from the PNGs
// 2026-09-28). The page edges and ribbon hang below the plate's layout box, so
// anything placed under the plate starts from here, never from the box.
const HERO_BOOK_SOURCE_HEIGHT = 830;
const HERO_BOOK_SOURCE_ART_BOTTOM = 819;

export function resolveHeroBookArtBottom(bookHeight: number): number {
  return Math.ceil((bookHeight * HERO_BOOK_SOURCE_ART_BOTTOM) / HERO_BOOK_SOURCE_HEIGHT);
}

export function hasBoardVerticalOverflow(viewportHeight: number, contentHeight: number): boolean {
  if (
    !Number.isFinite(viewportHeight) || viewportHeight <= 0 ||
    !Number.isFinite(contentHeight) || contentHeight <= 0
  ) {
    return false;
  }

  return contentHeight > viewportHeight;
}
