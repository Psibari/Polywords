// Measured from assets/backgrounds/bgbottom.png via pngjs pixel sampling: the
// source is a 1024x1536 illustration with a flat, contentless green fill over
// roughly the top half, and torch-lit ground detail in the bottom half. The
// green-to-purple halo blend begins ~48-51% down. GROUND_CROP_FRACTION keeps
// the bottom 50%, which lands right at the start of that blend, preserving
// the halo instead of cutting it off hard.
export const GROUND_SOURCE_WIDTH = 1024;
export const GROUND_SOURCE_HEIGHT = 1536;
export const GROUND_CROP_FRACTION = 0.5;

export type StarDensity = 'low' | 'medium' | 'high';

export type GroundLayout = {
  imageWidth: number;
  imageHeight: number;
  bandHeight: number;
  imageOffsetY: number;
};

export function computeGroundLayout(containerWidth: number): GroundLayout {
  const imageWidth = containerWidth;
  const imageHeight = containerWidth * (GROUND_SOURCE_HEIGHT / GROUND_SOURCE_WIDTH);
  const bandHeight = imageHeight * GROUND_CROP_FRACTION;
  const imageOffsetY = -(imageHeight - bandHeight);
  return { imageWidth, imageHeight, bandHeight, imageOffsetY };
}
