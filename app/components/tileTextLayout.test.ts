import {
  ACTIVE_TILE_BASE_FONT_SIZE,
  ACTIVE_TILE_MIN_FONT_SIZE,
  ACTIVE_TILE_WHOLE_WORD_TEXT_PROPS,
  hasBoardVerticalOverflow,
  resolveActiveTileHeight,
  resolveActiveTileLayoutPolicy,
  resolveBoardVerticalSpacing,
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

eq(resolveActiveTileHeight(180, 200), 200, 'gauntlet measurement keeps its 200px minimum');
eq(resolveActiveTileHeight(200.2, 200), 201, 'gauntlet measurement rounds up');
eq(resolveActiveTileHeight(240, Number.NaN), 240, 'invalid custom minimum falls back to 152px');

const normalPolicy = resolveActiveTileLayoutPolicy({
  state: 'idle',
  isSpecialSplit: false,
  bookMaterial: false,
  gauntletCard: false,
  tileHeight: 152,
});
eq(normalPolicy.usesMeasuredLayout, true, 'normal live card uses measured layout');
eq(normalPolicy.minimumHeight, 152, 'normal live card minimum height');
eq(normalPolicy.textProps.numberOfLines, undefined, 'normal live card has no line cap');
eq(normalPolicy.textProps.adjustsFontSizeToFit, undefined, 'normal live card does not shrink');
eq(normalPolicy.textProps.minimumFontScale, undefined, 'normal live card has no shrink floor prop');
eq(normalPolicy.textProps.android_hyphenationFrequency, 'none', 'normal live card disables hyphenation');

const gauntletPolicy = resolveActiveTileLayoutPolicy({
  state: 'idle',
  isSpecialSplit: false,
  bookMaterial: false,
  gauntletCard: true,
  tileHeight: 200,
});
eq(gauntletPolicy.usesMeasuredLayout, true, 'live gauntlet card uses measured layout');
eq(gauntletPolicy.minimumHeight, 200, 'live gauntlet card keeps the sealed-spine minimum');
eq(gauntletPolicy.textProps.numberOfLines, undefined, 'live gauntlet card has no line cap');
eq(gauntletPolicy.textProps.adjustsFontSizeToFit, undefined, 'live gauntlet card does not shrink');
eq(gauntletPolicy.textProps.minimumFontScale, undefined, 'live gauntlet card has no shrink floor prop');
eq(gauntletPolicy.textProps.textBreakStrategy, 'highQuality', 'live gauntlet card uses word-aware breaks');

eq(resolveActiveTileLayoutPolicy({
  state: 'idle',
  isSpecialSplit: true,
  bookMaterial: false,
  gauntletCard: false,
  tileHeight: 58,
}).usesMeasuredLayout, false, 'special split stays fixed');
eq(resolveActiveTileLayoutPolicy({
  state: 'hidden',
  isSpecialSplit: false,
  bookMaterial: false,
  gauntletCard: false,
  tileHeight: 58,
}).usesMeasuredLayout, false, 'hidden tile stays fixed');

const roomySpacing = resolveBoardVerticalSpacing(700, 300, 176);
eq(roomySpacing.gridPaddingTop, 110, 'roomy board keeps default top spacing');
eq(roomySpacing.gridPaddingBottom, 48, 'roomy board keeps default bottom spacing');

const shortSpacing = resolveBoardVerticalSpacing(550, 300, 176);
eq(shortSpacing.gridPaddingTop, 48, 'short board reclaims top whitespace first');
eq(shortSpacing.gridPaddingBottom, 26, 'short board reclaims only needed bottom whitespace');

const measuredGridSpacing = resolveBoardVerticalSpacing(374, 300, 0);
eq(measuredGridSpacing.gridPaddingTop, 48, 'measured grid viewport can omit fixed word region');
eq(measuredGridSpacing.gridPaddingBottom, 26, 'measured grid reclaims exact remaining whitespace');

const largeCardSpacing = resolveBoardVerticalSpacing(500, 420, 176);
eq(largeCardSpacing.gridPaddingTop, 48, 'large card uses minimum safe top spacing');
eq(largeCardSpacing.gridPaddingBottom, 12, 'large card uses minimum safe bottom spacing');
eq(hasBoardVerticalOverflow(500, 656), true, 'measured tall content activates board overflow');
eq(hasBoardVerticalOverflow(656, 656), false, 'exact fit does not activate board overflow');
eq(hasBoardVerticalOverflow(Number.NaN, 656), false, 'invalid viewport does not enable scrolling');
eq(hasBoardVerticalOverflow(500, Number.POSITIVE_INFINITY), false, 'invalid content does not enable scrolling');

const invalidSpacing = resolveBoardVerticalSpacing(Number.NaN, 300, 176);
eq(invalidSpacing.gridPaddingTop, 110, 'invalid viewport keeps default top spacing');
eq(invalidSpacing.gridPaddingBottom, 48, 'invalid viewport keeps default bottom spacing');

console.log('tileTextLayout tests passed');
