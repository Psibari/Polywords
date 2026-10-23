// Where the broken cage and its rope hang on the Polybook page (Pete, 2026-10-23). The art is
// polybook_cage.webp (1290 x 1088): a rope across the top and the cage hanging from it by its ring.
// It is placed from the page's own header, so it never lands on the POLYBOOK title or the book:
// the ring sits just under the header at the right, over the room's window; the rope leaves the
// top edge to the upper left and the right edge to the right.

export const POLYBOOK_CAGE_ART = { w: 1290, h: 1088, ring: { x: 450, y: 360 } } as const;

export const POLYBOOK_CAGE = {
  /** Cage art width as a fraction of the page width (0.28 x 1290 / 750 on the phone it was mocked on). */
  widthFraction: (0.28 * 1290) / 750,
  /** The ring's horizontal position, as a fraction of the page width. */
  ringX: 0.84,
  /** The ring's distance below the header's bottom edge, as a fraction of the page width. */
  ringBelowHeader: 13 / 750,
} as const;

/** The cage image's rectangle in the page's own coordinates, from the page width and the header's bottom edge. */
export function polybookCageRect(pageWidth: number, headerBottom: number) {
  const width = POLYBOOK_CAGE.widthFraction * pageWidth;
  const s = width / POLYBOOK_CAGE_ART.w;
  const ringX = POLYBOOK_CAGE.ringX * pageWidth;
  const ringY = headerBottom + POLYBOOK_CAGE.ringBelowHeader * pageWidth;
  return {
    left: ringX - POLYBOOK_CAGE_ART.ring.x * s,
    top: ringY - POLYBOOK_CAGE_ART.ring.y * s,
    width,
    height: POLYBOOK_CAGE_ART.h * s,
  };
}
