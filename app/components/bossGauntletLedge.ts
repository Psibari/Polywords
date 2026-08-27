// StoneWall.png is 853x1844px. Its carved ledge's front (lit) edge sits at
// y=1350 — found by scanning the image's brightness across the middle third
// of its width and locating where the lit top surface gives way to the
// shadow underneath it. GraphicGround renders this exact image at this exact
// aspect ratio, pinned to the bottom of its container (AmbientSkyBackground's
// groundBandAspect style), so the ledge's on-screen position is always this
// fixed fraction of the screen's width up from the screen's bottom — no
// runtime measurement needed.
export const LEDGE_OFFSET_RATIO = (1844 - 1350) / 853;

export function resolveLedgeOffset(windowWidth: number): number {
  return windowWidth * LEDGE_OFFSET_RATIO;
}
