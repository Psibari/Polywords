export type DailyCastleRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Daily Challenge castle composition registered to squarearchfull.png.
 *
 * All coordinates are full-screen reference points on a 430 × 932 phone.
 * Runtime code scales this reference uniformly for other portrait phones.
 * Art should be exported to the matching 3x pixel canvases below so no
 * component has to guess its own proportions.
 */
export const DAILY_CASTLE_REFERENCE = {
  width: 430,
  height: 932,
} as const;

export const DAILY_CASTLE_LAYOUT = {
  // The 1046 × 2346 full scene includes the arch, ledge, and six recesses.
  // Its width fills the reference phone; its bottom can bleed below the screen.
  scene: { x: 0, y: 0, width: 430, height: 430 * 2346 / 1046 },
  // The gate travels within the transparent arch opening. Its source includes
  // transparent padding at the top and bottom, including the hanging spikes.
  opening: { x: 82, y: 184, width: 266, height: 404 },

  // Six answer plaques, registered directly to the baked recess artwork.
  // These are full-screen reference coordinates on the 430 × 932 layout.
  // Slightly larger than the carved recesses so the cards read as physical
  // plaques emerging from the wall rather than labels painted inside holes.
  card: { width: 146, height: 58 },
  answerSlots: [
    { x: 39, y: 672 },
    { x: 221, y: 672 },
    { x: 39, y: 752 },
    { x: 221, y: 752 },
    { x: 39, y: 834 },
    { x: 221, y: 834 },
  ],

  // Carved reward scale inside the opening.
  stoneFeather: { width: 40, height: 56 },
  stoneFeatherGap: 18,

  // Reserved composition zone, not a hard Polly crop.
  pollyClearance: { x: 22, y: 128, width: 108, height: 158 },

  // Two reference points beyond the opening height guarantees a clean hide.
  gateOpenTravel: 410,
} as const;

export const DAILY_CASTLE_EXPORT_3X = {
  squarearch: { width: 1290, height: 1590 },
  gate: { width: 737, height: 1062 },
  featherwall: { width: 737, height: 1062 },
  answerwall: { width: 1290, height: 900 },
  answerRecesses: { width: 1290, height: 900 },
  answercard: { width: 480, height: 192 },
  stonefeather: { width: 120, height: 168 },
} as const;

export function resolveDailyCastleScale(
  windowWidth: number,
  windowHeight: number,
): number {
  return Math.min(
    windowWidth / DAILY_CASTLE_REFERENCE.width,
    windowHeight / DAILY_CASTLE_REFERENCE.height,
  );
}

export function resolveDailyCastleXOffset(
  windowWidth: number,
  scale: number,
): number {
  return (windowWidth - DAILY_CASTLE_REFERENCE.width * scale) / 2;
}
