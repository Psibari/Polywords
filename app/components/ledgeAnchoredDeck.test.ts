import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACTIVE_CARD_TOP_GAP,
  LEDGE_ANCHOR_CARD_OVERLAP,
  applyBoardTopReserve,
  resolveActiveCueLayout,
  resolveActiveTileHeight,
  resolveBoardVerticalSpacing,
  resolveCardLedgeOverlap,
  resolveLedgeAnchoredBoardSpacing,
  resolveLedgeTopInBoardViewport,
} from './tileTextLayout';

// The Hunt deck is pushed DOWN (never up) so its card meets the wall ledge the
// way it does on Pete's phone (375x812, iPhone 11 with Display Zoom, confirmed
// from the DEV readout 2026-11-09).
//
// The board viewport height on each window is ESTIMATED here: window height
// minus assumed safe-area insets, the ~115 pt HUD and the 176 pt word zone. On
// device the viewport height and bottom inset are measured, not assumed.
const HUD_ESTIMATE = 115;
const WORD_ZONE = 4 + 172;
const WINDOWS: Array<{ w: number; h: number; top: number; bottom: number }> = [
  { w: 320, h: 693, top: 50, bottom: 34 },
  { w: 375, h: 667, top: 20, bottom: 0 },
  { w: 375, h: 812, top: 44, bottom: 34 },
  { w: 390, h: 844, top: 47, bottom: 34 },
  { w: 393, h: 852, top: 59, bottom: 34 },
  { w: 402, h: 874, top: 62, bottom: 34 },
  { w: 414, h: 896, top: 48, bottom: 34 },
  { w: 430, h: 932, top: 59, bottom: 34 },
  { w: 440, h: 956, top: 62, bottom: 34 },
];
const CARD_H = resolveActiveTileHeight(0);
const OWNED = resolveActiveCueLayout(CARD_H, 21, 21).ownedRegionHeight;
const MIN_BOTTOM = 12;

function layoutFor({ w, h, top, bottom }: (typeof WINDOWS)[number]) {
  const viewport = h - top - bottom - HUD_ESTIMATE - WORD_ZONE;
  const base = resolveBoardVerticalSpacing(viewport, OWNED, 0);
  const ledge = resolveLedgeTopInBoardViewport(viewport, w, bottom);
  assert.ok(ledge !== null);
  const anchored = resolveLedgeAnchoredBoardSpacing(base, viewport, OWNED, CARD_H, ledge);
  return { viewport, base, ledge, anchored };
}
const at = (w: number, h: number) => layoutFor(WINDOWS.find((x) => x.w === w && x.h === h)!);

// 1. Pete's baseline window is exactly today's layout: 110 above, 48 below.
{
  const { base, anchored, ledge } = at(375, 812);
  assert.deepEqual(base, { gridPaddingTop: 110, gridPaddingBottom: 48 });
  assert.deepEqual(anchored, { gridPaddingTop: 110, gridPaddingBottom: 48 }, 'baseline must not move');
  const overlap = resolveCardLedgeOverlap(110, CARD_H, ledge);
  assert.ok(overlap >= LEDGE_ANCHOR_CARD_OVERLAP && overlap < LEDGE_ANCHOR_CARD_OVERLAP + 1, `baseline overlap ${overlap}`);
}

// 2. Short windows keep today's values and minimums exactly.
assert.deepEqual(at(375, 667).anchored, { gridPaddingTop: 68, gridPaddingBottom: 48 });
assert.deepEqual(at(375, 667).anchored, at(375, 667).base);
assert.deepEqual(at(320, 693).anchored, { gridPaddingTop: 48, gridPaddingBottom: 30 });
assert.deepEqual(at(320, 693).anchored, at(320, 693).base);

// 3. Taller / wider windows: pushed down to hold the baseline overlap, no scrolling.
for (const win of WINDOWS.filter((x) => x.h > 812)) {
  const { viewport, base, ledge, anchored } = layoutFor(win);
  const label = `${win.w}x${win.h}`;
  assert.ok(anchored.gridPaddingTop > base.gridPaddingTop, `${label}: deck should be pushed down`);
  assert.ok(
    Math.abs(resolveCardLedgeOverlap(anchored.gridPaddingTop, CARD_H, ledge) - LEDGE_ANCHOR_CARD_OVERLAP) < 1e-9,
    `${label}: card must overlap the ledge by the baseline`,
  );
  assert.ok(anchored.gridPaddingBottom >= MIN_BOTTOM, `${label}: bottom minimum`);
  assert.ok(anchored.gridPaddingTop + OWNED + anchored.gridPaddingBottom <= viewport + 1e-9, `${label}: must not scroll`);
}

// 4. Never moves the deck up, on any window.
for (const win of WINDOWS) {
  const { base, anchored } = layoutFor(win);
  assert.ok(anchored.gridPaddingTop >= base.gridPaddingTop, `${win.w}x${win.h}: never up`);
}

// 5. A push that would outgrow the viewport stops at the bottom minimum instead of scrolling.
{
  const viewport = 320;
  const base = resolveBoardVerticalSpacing(viewport, OWNED, 0);
  const anchored = resolveLedgeAnchoredBoardSpacing(base, viewport, OWNED, CARD_H, viewport + 500);
  assert.equal(anchored.gridPaddingBottom, MIN_BOTTOM);
  assert.equal(anchored.gridPaddingTop + OWNED + anchored.gridPaddingBottom, viewport);
}

// 6. Unknown inputs (first frame before onLayout, missing ledge) leave today's spacing alone.
{
  const base = { gridPaddingTop: 110, gridPaddingBottom: 48 };
  assert.deepEqual(resolveLedgeAnchoredBoardSpacing(base, 500, OWNED, CARD_H, null), base);
  assert.deepEqual(resolveLedgeAnchoredBoardSpacing(base, 0, OWNED, CARD_H, 300), base);
  assert.equal(resolveLedgeTopInBoardViewport(0, 375, 34), null);
  assert.equal(resolveLedgeTopInBoardViewport(500, 0, 34), null);
}

// 7. The onboarding caption reserve still applies on top of the pushed deck.
{
  const { anchored } = at(440, 956);
  const reserved = applyBoardTopReserve(anchored, 20);
  assert.equal(reserved.gridPaddingTop, anchored.gridPaddingTop + 20);
}

// 8. Wiring: the card gap matches SwipeMask, and MaskBoard feeds the ledge result
// through applyBoardTopReserve, whose top padding is the caption band's bottom.
const swipeMask = readFileSync('app/components/SwipeMask.tsx', 'utf8');
const tileGap = /const TILE_GAP\s*=\s*(\d+);/.exec(swipeMask);
assert.ok(tileGap, 'SwipeMask TILE_GAP not found');
assert.equal(Number(tileGap[1]), ACTIVE_CARD_TOP_GAP, 'ACTIVE_CARD_TOP_GAP must equal SwipeMask TILE_GAP');
const maskBoard = readFileSync('app/components/MaskBoard.tsx', 'utf8');
assert.match(maskBoard, /resolveLedgeAnchoredBoardSpacing\(\s*baseBoardSpacing,/);
assert.match(maskBoard, /const boardSpacing = applyBoardTopReserve\(ledgeBoardSpacing, onboardingCaptionReserve\);/);
assert.match(maskBoard, /boardSpacing\.gridPaddingTop - \(showSwipeCues/);
assert.match(maskBoard, /const captionBandBottomInGrid = gridPaddingTop;/);

console.log('ledge-anchored deck tests passed');
