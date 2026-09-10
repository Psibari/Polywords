// The wall art (StoneWall-recessed.png, and the StoneWall.png it replaced)
// is 853x1844px. Its carved ledge's front (lit) edge sits at y=1350 — found
// by scanning the image's brightness across the middle third of its width
// and locating where the lit top surface gives way to the shadow underneath
// it. GraphicGround renders this exact image at this exact aspect ratio,
// pinned to the bottom of its container (AmbientSkyBackground's
// groundBandAspect style), so the ledge's on-screen position is always this
// fixed fraction of the screen's width up from the screen's bottom — no
// runtime measurement needed.
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

// The three brick-shaped recesses darkened into the wall art, in that same
// 853x1844 art space. Each brick lies on its side in the wall — the punch-out
// entrance rotates it upright — so every recess is wider than it is tall.
export const BRICK_RECESSES = [
  { x0: 139, y0: 1063, x1: 381, y1: 1207 }, // index 0 — left
  { x0: 280, y0: 889, x1: 540, y1: 1044 },  // index 1 — middle
  { x0: 460, y0: 1066, x1: 696, y1: 1207 }, // index 2 — right
] as const;
