import {
  ACTIVE_TILE_BASE_FONT_SIZE,
  ACTIVE_TILE_MIN_FONT_SIZE,
  ACTIVE_TILE_WHOLE_WORD_TEXT_PROPS,
  resolveActiveTileHeight,
} from './tileTextLayout';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

eq(ACTIVE_TILE_BASE_FONT_SIZE, 27, 'active tile base font size');
eq(ACTIVE_TILE_MIN_FONT_SIZE, 22, 'active tile minimum font size');

eq(
  ACTIVE_TILE_WHOLE_WORD_TEXT_PROPS.android_hyphenationFrequency,
  'none',
  'Android hyphenation is disabled',
);
eq(
  ACTIVE_TILE_WHOLE_WORD_TEXT_PROPS.lineBreakStrategyIOS,
  'standard',
  'iOS uses standard word-aware line breaking',
);
eq(
  ACTIVE_TILE_WHOLE_WORD_TEXT_PROPS.textBreakStrategy,
  'highQuality',
  'Android uses high-quality word-aware line breaking',
);

eq(resolveActiveTileHeight(140), 152, 'measured height below minimum');
eq(resolveActiveTileHeight(152), 152, 'measured height at minimum');
eq(resolveActiveTileHeight(152.01), 153, 'fractional measured height rounds up');
eq(resolveActiveTileHeight(247.2), 248, 'expanded measured height rounds up');
eq(resolveActiveTileHeight(0), 152, 'zero measurement falls back to minimum');
eq(resolveActiveTileHeight(-1), 152, 'negative measurement falls back to minimum');
eq(resolveActiveTileHeight(Number.NaN), 152, 'NaN measurement falls back to minimum');
eq(resolveActiveTileHeight(Number.POSITIVE_INFINITY), 152, 'infinite measurement falls back to minimum');

console.log('tileTextLayout tests passed');
