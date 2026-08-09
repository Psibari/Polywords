import type { TextProps } from 'react-native';

export const ACTIVE_TILE_BASE_FONT_SIZE = 27;
export const ACTIVE_TILE_MIN_FONT_SIZE = 22;

const ACTIVE_TILE_MIN_HEIGHT = 152;
const DEFAULT_GRID_PADDING_TOP = 110;
const MIN_GRID_PADDING_TOP = 48;
const DEFAULT_GRID_PADDING_BOTTOM = 48;
const MIN_GRID_PADDING_BOTTOM = 12;

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

export function hasBoardVerticalOverflow(viewportHeight: number, contentHeight: number): boolean {
  if (
    !Number.isFinite(viewportHeight) || viewportHeight <= 0 ||
    !Number.isFinite(contentHeight) || contentHeight <= 0
  ) {
    return false;
  }

  return contentHeight > viewportHeight;
}
