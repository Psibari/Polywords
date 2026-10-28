// The wall art (StoneWall2.png) is 853x1844px. Its carved ledge's front (lit)
// edge sits at y=1349 — found by scanning the image's brightness across the
// middle third of its width and locating where the lit top surface gives way
// to the shadow underneath it. GraphicGround renders this exact image at
// this exact aspect ratio, pinned to the bottom of its container
// (AmbientSkyBackground's groundBandAspect style), so the ledge's on-screen
// position is always this fixed fraction of the screen's width up from the
// screen's bottom — no runtime measurement needed.
export const WALL_ART_W = 853;
export const WALL_ART_H = 1844;
export const LEDGE_ART_Y = 1349;

// Every conversion from wall art space into screen points goes through this
// one function: the art is always drawn at full screen width, so a single
// uniform scale covers both axes.
export function wallArtScale(windowWidth: number): number {
  return windowWidth / WALL_ART_W;
}

export const LEDGE_OFFSET_RATIO = (WALL_ART_H - LEDGE_ART_Y) / WALL_ART_W;

export function resolveLedgeOffset(windowWidth: number): number {
  return windowWidth * LEDGE_OFFSET_RATIO;
}

// shelf-front.png is the foreground lip of that same ledge, cut from the
// wall art itself: 853x513, whose top row corresponds to y=1331 of the wall
// (18 art-units above the lit edge) and whose bottom row is the wall's own
// bottom row (1331 + 513 = 1844). Rendered over the gauntlet row so the
// bricks land BEHIND the ledge rather than on top of it.
export const SHELF_LIP_ART_TOP = 1331;
export const SHELF_LIP_ART_H = 513;

// The shelf's own front face, measured off shelf-front.png exactly the way
// the ledge line was — scanning luminance down the middle third. The lit top
// edge is last bright at y=1349 (lum 76) and drops into a dark lip band
// (1352-1358, lum <10), the face runs from 1360 to 1408 (lum 49 easing to
// 31, near-flat), and a bright rim at 1409-1413 precedes the cliff into
// under-shelf shadow at 1414-1415 (lum 28 to 16). Measured on StoneWall2.png
// to about +/-3 art units. That face is empty carved stone directly beneath the cards,
// and it is where the gauntlet's CHOOSE A SEAL label lives — there is no
// longer clear space for it above the bricks.
export const SHELF_FACE_ART_TOP = 1360;
export const SHELF_FACE_ART_BOTTOM = 1408;

// Where the three gauntlet bricks sit in the wall, in that same 853x1844 art
// space — the GEOMETRY the punch-out flight starts from (each brick's flush
// position, size and angle). Each brick lies on its side in the wall and the
// entrance rotates it upright, so every recess is wider than it is tall.
export const BRICK_RECESSES = [
  { x0: 130, y0: 1065, x1: 416, y1: 1215 }, // index 0 — left
  { x0: 266, y0: 903, x1: 578, y1: 1060 },  // index 1 — middle
  { x0: 422, y0: 1063, x1: 707, y1: 1211 }, // index 2 — right
] as const;

// Where each hole's ART is drawn, in that same wall-art space. The wall
// itself is never cut: GraphicGround always renders the INTACT StoneWall2,
// shared by every screen, and the gauntlet paints these three overlays over
// it only while it is on screen — revealed under each brick as that brick
// pushes out, and gone with the gauntlet.
//
// These are deliberately NOT equal to BRICK_RECESSES: each is its matching
// recess grown by a 6px bleed on every side, so the painted hole's edge
// always covers the geometric one rather than leaving a seam. The test file
// enforces that containment, so an edit to one can never silently drift from
// the other.
export const RECESS_OVERLAYS = [
  { x: 124, y: 1059, w: 298, h: 162 }, // index 0 — left
  { x: 260, y: 897, w: 324, h: 169 },  // index 1 — middle
  { x: 416, y: 1057, w: 297, h: 160 }, // index 2 — right
] as const;
