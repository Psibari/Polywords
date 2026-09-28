import type { TextProps } from 'react-native';

export const ACTIVE_TILE_BASE_FONT_SIZE = 27;
export const ACTIVE_TILE_MIN_FONT_SIZE = 22;

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
