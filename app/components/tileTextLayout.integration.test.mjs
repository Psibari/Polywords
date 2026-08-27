import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const swipeMask = await readFile('app/components/SwipeMask.tsx', 'utf8');
const gauntletSpines = await readFile('app/components/BossGauntletSpines.tsx', 'utf8');
const maskBoard = await readFile('app/components/MaskBoard.tsx', 'utf8');

assert.match(
  swipeMask,
  /const activeTileLayoutPolicy = resolveActiveTileLayoutPolicy\(\{[\s\S]*?gauntletCard,[\s\S]*?tileHeight,[\s\S]*?\}\);/,
  'SwipeMask must resolve one shared layout policy from the live normal/gauntlet flags',
);
assert.match(
  swipeMask,
  /\.\.\.activeTileLayoutPolicy\.textProps/,
  'SwipeMask phrase Text must apply the shared measured-path text props',
);
assert.match(
  swipeMask,
  /activeTileLayoutPolicy\.usesMeasuredLayout[\s\S]*?minHeight:[\s\S]*?activeTileLayoutPolicy\.minimumHeight/,
  'SwipeMask measured normal and gauntlet paths must use a minimum rather than a fixed height',
);
assert.match(
  gauntletSpines,
  /onMeasuredHeightChange=\{handleActiveCardHeightChange\}/,
  'BossGauntletSpines must receive the open SwipeMask measurement',
);
assert.match(
  gauntletSpines,
  /if \(isOpen\) onMeasuredHeightChange\(maskId, height\);[\s\S]*?if \(!isOpen\) return;[\s\S]*?onMeasuredHeightChange\(tile\.mask\.id, measuredHeightRef\.current\);/,
  'A gauntlet slot must relay a phrase measured while sealed when that exact seal opens',
);
assert.match(
  gauntletSpines,
  /style=\{\[styles\.row, \{ height: CARD_CLOSED_HEIGHT \+ ROW_VERTICAL_INSET/,
  'BossGauntletSpines row must stay pinned to the closed-card footprint, not grow with the ' +
    'active card measurement (a growing row pushes the bottom-anchored header upward)',
);
assert.match(
  gauntletSpines,
  /onExitComplete=\{\(\) => onLayoutExitComplete\(tile\.mask\.id\)\}/,
  'Gauntlet SwipeMask collapse completion must report through a layout-only callback',
);
assert.match(
  gauntletSpines,
  /releaseGauntletMeasuredHeight\(previous, maskId\)/,
  'BossGauntletSpines must remove only the collapsed mask measurement',
);
assert.match(
  gauntletSpines,
  /resolveGauntletRowHeight\(measuredCardHeights, CARD_CLOSED_HEIGHT\)/,
  'BossGauntletSpines must derive its row from active/in-flight measurements, floored to the ' +
    "closed card's own (short) resting height rather than the helper's taller opened-card default",
);
assert.ok(
  gauntletSpines.indexOf('onActiveCardHeightChange?.(activeCardHeight)') <
    gauntletSpines.indexOf("if (gatePhase !== 'tiles' && gatePhase !== 'wrongFail') return null"),
  'Gauntlet height publication must not introduce a hook after the conditional return',
);
assert.match(
  maskBoard,
  /scrollEnabled=\{gridHasVerticalOverflow\}/,
  'MaskBoard must activate its board-owned scroll fallback only after measured overflow',
);
assert.match(
  maskBoard,
  /resolveActiveCueLayout\([\s\S]*?activeTileHeight,[\s\S]*?activeCueMeasurements\.upHeight,[\s\S]*?activeCueMeasurements\.rightHeight/,
  'MaskBoard must derive owned cue geometry from both native text measurements',
);
assert.match(
  maskBoard,
  /key=\{`up-\$\{cueLayoutIdentity\}`\}[\s\S]*?onLayout=\{event => handleCueTextLayout\('up',[\s\S]*?key=\{`right-\$\{cueLayoutIdentity\}`\}[\s\S]*?onLayout=\{event => handleCueTextLayout\('right'/,
  'Both cue texts must remount and remeasure for the active layout identity',
);
assert.match(
  maskBoard,
  /pointerEvents="none"[\s\S]*?styles\.swipeUpCueRegion[\s\S]*?pointerEvents="none"[\s\S]*?styles\.swipeRightCueRegion/,
  'Both measured cue regions must remain pointerless flow siblings around the card stack',
);
assert.doesNotMatch(
  maskBoard,
  /swipeCueOverlay:\s*\{[\s\S]*?position:\s*'absolute'/,
  'Cue text must stay in flow so its native height contributes to ScrollView content size',
);
assert.match(
  swipeMask,
  /onStartShouldSetPanResponderCapture:\s*\(\) => !disabledRef\.current && !judgedRef\.current/,
  'SwipeMask must retain touch-down capture over the board-owned scroll fallback',
);
assert.match(
  swipeMask,
  /onPanResponderTerminationRequest:\s*\(\) => false/,
  'SwipeMask must not yield an active card gesture to the board-owned scroll fallback',
);

console.log('tileTextLayout integration tests passed');
