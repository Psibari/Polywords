// Run with: npx.cmd -y tsx app/components/dailyScrollLayout.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
//
// The clue-width figures here are an APPROXIMATION, not a measurement.
// Bebas Neue is not available to the test runner, so rendered width is
// modelled as `chars * (fontSize * BEBAS_ADVANCE_EM + BEBAS_TRACKING)`.
// BEBAS_ADVANCE_EM = 0.363 was calibrated against a real device capture:
// "SENT FROM THE MOUND TO HOME" (27 chars) at 27pt measures 281pt in-app
// and 281pt in this model. The authoritative check is still the device.
// This test's job is to catch a pool entry or a type-scale change that
// blows the budget, the same way bookLineWidths.test.ts guards log lines.
import {
  DAILY_CLUE_TYPE,
  SCROLL_PAPER_SOURCE_H,
  SCROLL_PAPER_SOURCE_W,
  SCROLL_PAPER_EDGE_SPLIT_PX,
  SCROLL_ROD_ASPECT,
  estimateClueLines,
  estimateClueWidth,
  resolveClueStackHeight,
  resolveClueTextBoxWidth,
  resolveParchmentSlices,
  resolveReservedTextHeight,
  resolveRodMetrics,
} from './dailyScrollLayout';
import { DAILY_POOL } from '../game/dailyPool';

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

function near(actual: number, expected: number, tol: number, label: string): void {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${label}: expected ~${expected}, got ${actual}`);
  }
}

const DEVICE_WIDTHS = [320, 375, 393, 430];
const panelWidthFor = (screenWidth: number) => screenWidth - 40;

// ── The torn bottom edge NEVER distorts, at any panel height ──────
// This is the whole point of the two-slice. The edge's height must stay a
// fixed fraction of its width no matter how tall the panel gets.
{
  const width = 335;
  const naturalEdgeRatio =
    (SCROLL_PAPER_SOURCE_H - SCROLL_PAPER_EDGE_SPLIT_PX) / SCROLL_PAPER_SOURCE_W;
  for (const totalHeight of [170, 200, 252, 300]) {
    const slices = resolveParchmentSlices(width, totalHeight);
    near(
      slices.edgeHeight / slices.width,
      naturalEdgeRatio,
      0.0001,
      `edge slice distorts at totalHeight ${totalHeight}`,
    );
  }
}

// ── The two slices share one uniform horizontal scale ─────────────
{
  const slices = resolveParchmentSlices(335, 252);
  near(slices.uniformScale, 335 / SCROLL_PAPER_SOURCE_W, 0.0001, 'uniform scale');
  near(
    slices.edgeImageHeight,
    SCROLL_PAPER_SOURCE_H * slices.uniformScale,
    0.01,
    'edge draws the full image at natural scale',
  );
  near(
    slices.edgeImageTop,
    -(SCROLL_PAPER_EDGE_SPLIT_PX * slices.uniformScale),
    0.01,
    'edge clips to the bottom band of the source',
  );
}

// ── Body + edge exactly fill the requested height ─────────────────
{
  for (const totalHeight of [170, 252, 300]) {
    const s = resolveParchmentSlices(335, totalHeight);
    near(s.bodyHeight + s.edgeHeight, totalHeight, 0.01, `slices fill ${totalHeight}`);
  }
}

// ── A panel shorter than the edge alone degrades safely ───────────
{
  const s = resolveParchmentSlices(335, 5);
  ok(s.bodyHeight >= 0, 'bodyHeight never goes negative');
  ok(s.edgeHeight <= 5 + 0.01, 'edge is clamped into a too-short panel');
}

// ── The rod keeps its true aspect at every width ──────────────────
// Guards the shipped x1.22 stretch: rod.scaleX 1.1 / scaleY 0.9 made a
// 10.055 drawing render at 12.29.
{
  for (const screenWidth of DEVICE_WIDTHS) {
    const rod = resolveRodMetrics(panelWidthFor(screenWidth));
    near(rod.width / rod.height, SCROLL_ROD_ASPECT, 0.0001, `rod aspect at ${screenWidth}`);
    ok(rod.width > panelWidthFor(screenWidth), `rod overhangs the panel at ${screenWidth}`);
    near(
      rod.overhang * 2 + panelWidthFor(screenWidth),
      rod.width,
      0.01,
      `overhang accounts for the full excess at ${screenWidth}`,
    );
    ok(
      rod.width <= screenWidth,
      `rod must not exceed the screen at ${screenWidth} (got ${rod.width})`,
    );
  }
}

// ── No clue in the live pool needs more than two lines, anywhere ──
// If this fails, either a pool entry got longer or the type scale grew.
// Both are real regressions: maxLines is enforced by numberOfLines, so a
// third line does not wrap — it truncates.
{
  for (const screenWidth of DEVICE_WIDTHS) {
    const box = resolveClueTextBoxWidth(panelWidthFor(screenWidth));
    for (const entry of DAILY_POOL) {
      for (const clue of entry.meanings) {
        const activeLines = estimateClueLines(clue, DAILY_CLUE_TYPE.activeSize, box);
        ok(
          activeLines <= DAILY_CLUE_TYPE.maxLines,
          `${entry.word}: "${clue}" (${clue.length} chars) needs ${activeLines} lines at ${DAILY_CLUE_TYPE.activeSize}pt in a ${box}pt box (${screenWidth}pt screen)`,
        );
        const memoryLines = estimateClueLines(clue, DAILY_CLUE_TYPE.memorySize, box);
        ok(
          memoryLines <= DAILY_CLUE_TYPE.maxLines,
          `${entry.word}: "${clue}" needs ${memoryLines} memory lines in a ${box}pt box (${screenWidth}pt screen)`,
        );
      }
    }
  }
}

// ── Lines break on WORD boundaries, not mid-word ──────────────────
// The estimator used to divide total width by box width, which models
// mid-word breaking and therefore under-counts. This guards the model
// itself: a box wide enough for the character count but too narrow to hold
// the second word must report two lines.
{
  const twoWords = 'ALPHA BRAVO';
  const fontSize = 23;
  const fullWidth = estimateClueWidth(twoWords, fontSize);
  const firstWordWidth = estimateClueWidth('ALPHA', fontSize);
  // A box between "one word" and "both words" wide: mid-word division would
  // still say one line here, word wrapping says two.
  const box = (fullWidth + firstWordWidth) / 2;
  ok(fullWidth / box < 2, 'the mid-word model would report one line for this box');
  ok(
    estimateClueLines(twoWords, fontSize, box) === 2,
    'word wrapping must push the overflowing word onto its own line',
  );
  // A single word wider than the box takes one line and does not hang.
  ok(
    estimateClueLines('SUPERCALIFRAGILISTIC', fontSize, 10) === 1,
    'an unbreakable word occupies exactly one line',
  );
}

// ── The reservation IS the live pool's worst three-clue stack ─────
// Not a literal restated against itself: the constant is checked against
// the height the pool actually produces, so a pool edit or a type-scale
// change that grows the stack fails here instead of silently overflowing
// the reservation on device. Reserved height is constant across devices by
// design; if a device drifts out of that, the layout has started varying by
// phone again.
{
  const allClues = DAILY_POOL.flatMap((entry) => entry.meanings);
  let worstAcrossDevices = 0;
  for (const screenWidth of DEVICE_WIDTHS) {
    const panelWidth = panelWidthFor(screenWidth);
    const box = resolveClueTextBoxWidth(panelWidth);
    const worst = resolveClueStackHeight(3, box, allClues);
    const reserved = resolveReservedTextHeight(panelWidth);
    ok(
      worst <= reserved,
      `worst 3-clue stack ${worst}pt exceeds reserved ${reserved}pt at ${screenWidth}pt`,
    );
    near(
      reserved,
      resolveReservedTextHeight(panelWidthFor(320)),
      0.01,
      `reserved text height must not vary by device (${screenWidth}pt)`,
    );
    if (worst > worstAcrossDevices) worstAcrossDevices = worst;
  }
  near(
    resolveReservedTextHeight(panelWidthFor(375)),
    Math.ceil(worstAcrossDevices),
    0.01,
    'RESERVED_TEXT_HEIGHT must equal the live pool worst-case 3-clue stack, rounded up',
  );
}

// ── One and two clue stacks are strictly shorter than three ───────
// The unroll (Task 5) depends on this ordering.
{
  const allClues = DAILY_POOL.flatMap((entry) => entry.meanings);
  const box = resolveClueTextBoxWidth(panelWidthFor(375));
  const h1 = resolveClueStackHeight(1, box, allClues);
  const h2 = resolveClueStackHeight(2, box, allClues);
  const h3 = resolveClueStackHeight(3, box, allClues);
  ok(h1 < h2 && h2 < h3, `stack heights must increase: ${h1}, ${h2}, ${h3}`);
}

console.log('OK dailyScrollLayout');
