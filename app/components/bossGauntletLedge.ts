// The wall art (StoneWall.png) is 853x1844px. Its carved ledge's front (lit)
// edge sits at y=1350 — found by scanning the image's brightness across the
// middle third of its width and locating where the lit top surface gives way
// to the shadow underneath it. GraphicGround renders this exact image at
// this exact aspect ratio, pinned to the bottom of its container
// (AmbientSkyBackground's groundBandAspect style), so the ledge's on-screen
// position is always this fixed fraction of the screen's width up from the
// screen's bottom — no runtime measurement needed.
export const WALL_ART_W = 853;
export const WALL_ART_H = 1844;
export const LEDGE_ART_Y = 1350;

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
// wall art itself: 853x512, whose top row corresponds to y=1332 of the wall
// (18 art-units above the lit edge) and whose bottom row is the wall's own
// bottom row (1332 + 512 = 1844). Rendered over the gauntlet row so the
// bricks land BEHIND the ledge rather than on top of it.
export const SHELF_LIP_ART_TOP = 1332;
export const SHELF_LIP_ART_H = 512;

// Where the three gauntlet bricks sit in the wall, in that same 853x1844 art
// space — the GEOMETRY the punch-out flight starts from (each brick's flush
// position, size and angle). Each brick lies on its side in the wall and the
// entrance rotates it upright, so every recess is wider than it is tall.
export const BRICK_RECESSES = [
  { x0: 139, y0: 1063, x1: 381, y1: 1207 }, // index 0 — left
  { x0: 280, y0: 889, x1: 540, y1: 1044 },  // index 1 — middle
  { x0: 460, y0: 1066, x1: 696, y1: 1207 }, // index 2 — right
] as const;

// Where each hole's ART is drawn, in that same wall-art space. The wall
// itself is never cut: GraphicGround always renders the INTACT StoneWall,
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
  { x: 133, y: 1057, w: 254, h: 156 }, // index 0 — left
  { x: 274, y: 883, w: 272, h: 167 },  // index 1 — middle
  { x: 454, y: 1060, w: 248, h: 153 }, // index 2 — right
] as const;
