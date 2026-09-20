export type DailyCastleRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Locked Daily Challenge castle composition.
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
  arch: { x: 0, y: 126, width: 430, height: 530 },
  // Exact transparent doorway cutout in the approved 1290 × 1590 arch.
  // Source bounds: x 290..1027, y 277..1339. At 3× that maps 1:1
  // into the logical phone composition below.
  opening: { x: 290 / 3, y: 126 + 277 / 3, width: 737 / 3, height: 1062 / 3 },
  answerWall: { x: 0, y: 600, width: 430, height: 300 },
  answerRecesses: { x: 0, y: 600, width: 430, height: 300 },

  // Six answer plaques, registered directly to the baked recess artwork.
  // These are full-screen reference coordinates on the 430 × 932 layout.
  // Slightly larger than the carved recesses so the cards read as physical
  // plaques emerging from the wall rather than labels painted inside holes.
  card: { width: 146, height: 58 },
  answerSlots: [
    { x: 48, y: 680 },
    { x: 227, y: 684 },
    { x: 45, y: 744 },
    { x: 226, y: 749 },
    { x: 43, y: 816 },
    { x: 222, y: 816 },
  ],

  // Carved reward scale inside the opening.
  stoneFeather: { width: 40, height: 56 },
  stoneFeatherGap: 18,

  // Reserved composition zone, not a hard Polly crop.
  pollyClearance: { x: 22, y: 128, width: 108, height: 158 },

  // Two reference points beyond the opening height guarantees a clean hide.
  gateOpenTravel: 356,
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
