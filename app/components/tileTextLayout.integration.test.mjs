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
  /style=\{\[styles\.row, \{ height: activeCardHeight \+ ROW_VERTICAL_INSET \}\]\}/,
  'BossGauntletSpines row must grow with the active card measurement',
);
assert.match(
  gauntletSpines,
  /const \[measuredCardHeights, setMeasuredCardHeights\]/,
  'BossGauntletSpines must retain each keyed measurement through judged-state collapse',
);
assert.match(
  maskBoard,
  /onActiveCardHeightChange=\{handleGauntletTileHeightChange\}/,
  'MaskBoard must receive gauntlet height for board-owned overflow geometry',
);
assert.match(
  maskBoard,
  /setActiveGauntletTileHeight\(previous => Math\.max\(previous, height\)\)/,
  'MaskBoard must retain the largest judged gauntlet geometry until the board unmounts',
);
assert.match(
  maskBoard,
  /scrollEnabled=\{gridHasVerticalOverflow\}/,
  'MaskBoard must activate its board-owned scroll fallback only after measured overflow',
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
