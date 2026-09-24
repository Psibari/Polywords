export type DailyCastleRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Daily Challenge castle composition registered to 3darch5.png.
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
  // Fit-test registration uses the full reference composition with no offset.
  topOffset: 0,
  // The rebuilt scene fills the 430 by 932 logical phone exactly.
  scene: { x: 0, y: 0, width: 430, height: 932 },
  // The gate travels within the transparent arch opening. Its source includes
  // transparent padding at the top and bottom, including the hanging spikes.
  opening: { x: 82, y: 160, width: 266, height: 428 },

  // Six answer plaques, registered directly to the baked recess artwork.
  // These are full-screen reference coordinates on the 430 × 932 layout.
  // Slightly larger than the carved recesses so the cards read as physical
  // plaques emerging from the wall rather than labels painted inside holes.
  card: { width: 140, height: 54 },
  answerSlots: [
    { x: 68.0262, y: 596.5254 },
    { x: 218.8614, y: 597.7489 },
    { x: 67.7867, y: 688.4408 },
    { x: 219.2205, y: 689.0525 },
    { x: 67.4276, y: 783.7207 },
    { x: 219.4599, y: 784.3325 },
  ],

  // Carved reward scale inside the opening.
  stoneFeather: { width: 40, height: 56 },
  stoneFeatherGap: 18,

  // Reserved composition zone, not a hard Polly crop.
  pollyClearance: { x: 22, y: 128, width: 108, height: 158 },

  // Two reference points beyond the opening height guarantees a clean hide.
  gateOpenTravel: 434,
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
