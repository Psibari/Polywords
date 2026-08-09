import type { TextProps } from 'react-native';

export const ACTIVE_TILE_BASE_FONT_SIZE = 27;
export const ACTIVE_TILE_MIN_FONT_SIZE = 22;

const ACTIVE_TILE_MIN_HEIGHT = 152;

export const ACTIVE_TILE_WHOLE_WORD_TEXT_PROPS = {
  android_hyphenationFrequency: 'none',
  lineBreakStrategyIOS: 'standard',
  textBreakStrategy: 'highQuality',
} as const satisfies Pick<
  TextProps,
  'android_hyphenationFrequency' | 'lineBreakStrategyIOS' | 'textBreakStrategy'
>;

export function resolveActiveTileHeight(measuredHeight: number): number {
  if (!Number.isFinite(measuredHeight) || measuredHeight <= 0) {
    return ACTIVE_TILE_MIN_HEIGHT;
  }

  return Math.max(ACTIVE_TILE_MIN_HEIGHT, Math.ceil(measuredHeight));
}
