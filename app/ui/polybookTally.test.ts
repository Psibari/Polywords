import assert from 'node:assert/strict';
import {
  POLYBOOK_TALLY_COLUMN_GAP,
  POLYBOOK_TALLY_CROWN_BOXES,
  POLYBOOK_TALLY_CROWN_TEXT_GAP,
  POLYBOOK_TALLY_FONT_SCALE_CAP,
  POLYBOOK_TALLY_ORDER,
  POLYBOOK_TALLY_ROW_GAP,
  POLYBOOK_TALLY_SLOT_ASPECT,
  estimateTallyTextBlockHeight,
  paintedAspect,
  resolveCrownFrame,
  resolveTallyCrownWidth,
  resolveTallyLayout,
} from './polybookTally';

const near = (a: number, b: number, msg: string, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, wanted ${b}`);

assert.deepEqual([...POLYBOOK_TALLY_ORDER], ['mastered', 'king', 'banished', 'haunted']);

// Every box lies inside its file.
for (const kind of POLYBOOK_TALLY_ORDER) {
  const box = POLYBOOK_TALLY_CROWN_BOXES[kind];
  assert.ok(box.x0 >= 0 && box.x1 <= box.fileW && box.x0 < box.x1, `${kind} x inside file`);
  assert.ok(box.y0 >= 0 && box.y1 <= box.fileH && box.y0 < box.y1, `${kind} y inside file`);
}

// Every crown's painted width equals W; the height follows the painted aspect; the image is the
// whole file at the same scale, offset so exactly the painted box shows.
for (const W of [44, 87.5, 120]) {
  for (const kind of POLYBOOK_TALLY_ORDER) {
    const box = POLYBOOK_TALLY_CROWN_BOXES[kind];
    const f = resolveCrownFrame(box, W);
    near(f.width, W, `${kind} painted width`);
    near(f.height, W * paintedAspect(box), `${kind} painted height`);
    near(f.imageWidth / f.imageHeight, box.fileW / box.fileH, `${kind} file aspect kept`);
    near(f.imageLeft + box.x1 * (f.imageWidth / box.fileW), W, `${kind} painted right edge at W`);
    near(f.imageTop + box.y1 * (f.imageHeight / box.fileH), f.height, `${kind} painted bottom edge at height`);
    assert.ok(f.imageLeft <= 0 && f.imageTop <= 0, `${kind} offsets are negative`);
    assert.ok(f.height <= W * POLYBOOK_TALLY_SLOT_ASPECT + 1e-9, `${kind} fits the shared slot`);
  }
}

// W fits both rows into the height, and never exceeds a column.
{
  const areaWidth = 246;
  const areaHeight = 364;
  const textBlockHeight = 80;
  const W = resolveTallyCrownWidth({ areaWidth, areaHeight, textBlockHeight });
  const used = 2 * (W * POLYBOOK_TALLY_SLOT_ASPECT + POLYBOOK_TALLY_CROWN_TEXT_GAP + textBlockHeight) + POLYBOOK_TALLY_ROW_GAP;
  assert.ok(used <= areaHeight, `rows fit: ${used} <= ${areaHeight}`);
  assert.ok(2 * W + POLYBOOK_TALLY_COLUMN_GAP <= areaWidth, 'columns fit');
}
// Wide, short area: height wins. Narrow, tall area: width wins.
assert.ok(resolveTallyCrownWidth({ areaWidth: 600, areaHeight: 300, textBlockHeight: 80 }) < (600 - POLYBOOK_TALLY_COLUMN_GAP) / 2);
assert.equal(resolveTallyCrownWidth({ areaWidth: 200, areaHeight: 900, textBlockHeight: 80 }), Math.floor((200 - POLYBOOK_TALLY_COLUMN_GAP) / 2));
// Too small an area gives 0, never negative.
assert.equal(resolveTallyCrownWidth({ areaWidth: 100, areaHeight: 50, textBlockHeight: 80 }), 0);

// The whole layout fits at every Text Size, including past the cap, on a short page.
for (const areaHeight of [240, 300, 364, 480]) {
  for (const fontScale of [0.82, 1, 1.35, 1.6, 2.4, 3.12]) {
    const L = resolveTallyLayout({ areaWidth: 246, areaHeight, fontScale });
    const used = 2 * (L.slotHeight + POLYBOOK_TALLY_CROWN_TEXT_GAP + L.textBlockHeight) + POLYBOOK_TALLY_ROW_GAP;
    assert.ok(used <= areaHeight + 1e-9, `fits h=${areaHeight} scale=${fontScale}: ${used}`);
    assert.ok(L.crownWidth <= L.columnWidth, 'crown within column');
  }
}
// At normal Text Size on a normal page the text is not shrunk.
{
  const L = resolveTallyLayout({ areaWidth: 246, areaHeight: 364, fontScale: 1 });
  assert.equal(L.countFontSize, 48);
  assert.equal(L.labelFontSize, 18);
}
// A taller measured text block is trusted over the estimate.
{
  const est = estimateTallyTextBlockHeight(1);
  const L = resolveTallyLayout({ areaWidth: 246, areaHeight: 364, fontScale: 1, measuredTextBlockHeight: est + 20 });
  assert.equal(L.textBlockHeight, est + 20);
}
// The estimate stops growing at the cap.
near(estimateTallyTextBlockHeight(3), estimateTallyTextBlockHeight(POLYBOOK_TALLY_FONT_SCALE_CAP), 'cap');

console.log('polybookTally (layout) tests passed');
