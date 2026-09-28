import {
  ACTIVE_TILE_BASE_FONT_SIZE,
  ACTIVE_TILE_MIN_FONT_SIZE,
  ACTIVE_TILE_WHOLE_WORD_TEXT_PROPS,
  activeTileTextWidth,
  applyBoardTopReserve,
  hasBoardVerticalOverflow,
  releaseGauntletMeasuredHeight,
  resolveActiveTileHeight,
  resolveActiveTileLayoutPolicy,
  resolveActiveTileCardWidth,
  resolveActiveTileTextLayout,
  resolveActiveCueLayout,
  resolveBoardVerticalSpacing,
  resolveGauntletRowHeight,
  resolveHeroBookArtBottom,
} from './tileTextLayout';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

eq(ACTIVE_TILE_BASE_FONT_SIZE, 27, 'active tile base font size');
eq(ACTIVE_TILE_MIN_FONT_SIZE, 22, 'active tile minimum font size');

const observedLongClue = 'WHAT STEPH CURRY DOES WITH THREES FROM THE PARKING LOT';
const smallestIPhoneCardWidth = resolveActiveTileCardWidth(375, false);
eq(smallestIPhoneCardWidth, 290, 'normal card width stays unchanged on the smallest supported iPhone');
const observedLongClueLayout = resolveActiveTileTextLayout(
  observedLongClue,
  smallestIPhoneCardWidth,
);
eq(observedLongClueLayout.fontSize, 24, 'observed long clue shrinks only enough to keep three lines');
eq(observedLongClueLayout.lineHeight, 28, 'long clue line height follows its fitted font size');
eq(observedLongClueLayout.lines.length, 3, 'observed long clue remains a three-line card');
eq(observedLongClueLayout.lines[0], 'WHAT STEPH CURRY', 'observed clue first line');
eq(observedLongClueLayout.lines[1], 'DOES WITH THREES', 'observed clue second line');
eq(observedLongClueLayout.lines[2], 'FROM THE PARKING LOT', 'observed clue final line');
eq(
  Math.ceil(activeTileTextWidth(observedLongClueLayout.lines[2], observedLongClueLayout.fontSize)),
  213,
  'bundled-font metrics include the full final line width',
);
ok(
  observedLongClueLayout.lines.every(
    line => activeTileTextWidth(line, observedLongClueLayout.fontSize) <=
      observedLongClueLayout.textRegionWidth,
  ),
  'every observed-clue line fits inside the supported card text region',
);

const shortClueLayout = resolveActiveTileTextLayout('PAY A FINE.', smallestIPhoneCardWidth);
eq(shortClueLayout.fontSize, ACTIVE_TILE_BASE_FONT_SIZE, 'short clues keep the existing font size');
eq(shortClueLayout.lines.length, 1, 'short clues keep their existing one-line layout');
eq(shortClueLayout.lines[0], 'PAY A FINE.', 'short clue wording is unchanged');

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

const standardCueLayout = resolveActiveCueLayout(152, 20, 20);
eq(standardCueLayout.upCueHeight, 20, 'cue layout uses measured UP text height');
eq(standardCueLayout.rightCueHeight, 20, 'cue layout uses measured RIGHT text height');
eq(standardCueLayout.leadingCueRegionHeight, 34, 'UP cue placement includes its measured height');
eq(standardCueLayout.ownedRegionHeight, 238, 'owned cue region includes both measured cue texts');

const wrappedCueLayout = resolveActiveCueLayout(152, 64.2, 88.1);
eq(wrappedCueLayout.upCueHeight, 65, 'wrapped UP cue measurement rounds up');
eq(wrappedCueLayout.rightCueHeight, 89, 'wrapped RIGHT cue measurement rounds up');
eq(
  wrappedCueLayout.ownedRegionHeight,
  352,
  'large accessibility-wrapped cues expand the owned region',
);

const invalidCueLayout = resolveActiveCueLayout(Number.NaN, -4, Number.POSITIVE_INFINITY);
eq(invalidCueLayout.activeCardHeight, 152, 'invalid active height uses the Hunt minimum');
eq(invalidCueLayout.upCueHeight, 21, 'invalid UP cue measurement uses the text fallback');
eq(invalidCueLayout.rightCueHeight, 21, 'invalid RIGHT cue measurement uses the text fallback');
eq(invalidCueLayout.ownedRegionHeight, 240, 'invalid cue inputs produce bounded fallback geometry');

const longGauntletHeights = new Map([['long-card', 348]]);
eq(
  resolveGauntletRowHeight(longGauntletHeights),
  348,
  'gauntlet row retains a long card through its in-flight geometry',
);
const collapsedGauntletHeights = releaseGauntletMeasuredHeight(
  longGauntletHeights,
  'long-card',
);
eq(
  resolveGauntletRowHeight(collapsedGauntletHeights),
  200,
  'gauntlet row releases a long card after layout collapse completes',
);
const shortGauntletHeights = new Map(collapsedGauntletHeights).set('short-card', 224);
eq(
  resolveGauntletRowHeight(shortGauntletHeights),
  224,
  'a short next card is not held open by a collapsed long card',
);
eq(
  releaseGauntletMeasuredHeight(shortGauntletHeights, 'missing-card'),
  shortGauntletHeights,
  'releasing an unknown gauntlet card preserves map identity',
);

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

const reserved = applyBoardTopReserve({ gridPaddingTop: 90, gridPaddingBottom: 48 }, 36);
eq(reserved.gridPaddingTop, 126, 'caption reserve adds to the room above the deck');
eq(reserved.gridPaddingBottom, 12, 'caption reserve comes out of the room below the deck');
const tightReserve = applyBoardTopReserve({ gridPaddingTop: 48, gridPaddingBottom: 20 }, 36);
eq(tightReserve.gridPaddingBottom, 12, 'caption reserve never takes the bottom below its floor');
const noReserve = { gridPaddingTop: 90, gridPaddingBottom: 48 };
eq(applyBoardTopReserve(noReserve, 0), noReserve, 'boards without a caption keep their spacing');
eq(resolveHeroBookArtBottom(210), 208, 'hero book art ends 208 pt below the plate top at bookHeight 210');

console.log('tileTextLayout tests passed');
