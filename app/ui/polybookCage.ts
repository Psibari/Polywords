// The cage on the Polybook page (Pete, 2026-10-23). It hangs on a rope in the top-left corner; the first
// time the Polybook is opened in an app launch, the book's thud shakes it loose, it falls, slams on the
// floor and breaks into a dome and a base. Every later visit shows the pieces already lying there (and the
// empty rope). All sizes are fractions of the page width, so every phone gets the same picture.
//
// Where it all sits comes from Pete's mockup (1290 x 2796) for the hanging cage and the rope. The pieces lie
// on the floor BELOW the book area, either side of the HOME button (750 x 1624 mock, Pete's "perfect"): the
// open book is far bigger than the closed cover and covers anything placed beside the cover.
// The crash sound is `polybookCageCrash`, played by PolybookCage at the slam.

/** The art, in pixels. `ring` is where the rope passes through the cage's ring (art is the mirrored cage). */
export const POLYBOOK_CAGE_ART = {
  rope: { w: 720, h: 330 },
  hang: { w: 560, h: 641, ring: { x: 238, y: 43 } },
  base: { w: 627, h: 436 },
  /** The dome with its tilt already in the picture. */
  dome: { w: 486, h: 463 },
} as const;

export const POLYBOOK_CAGE = {
  /** The rope art's width, as a fraction of the page width (720 of the 1290 the mockup was drawn at). */
  ropeWidthFraction: 720 / 1290,
  hang: {
    /** The cage art's width as a fraction of the page width. */
    widthFraction: 448 / 1290,
    /** The ring's place as fractions of the page width: from the left edge, and down from the top of the screen. */
    ringX: 233 / 1290,
    ringY: 305 / 1290,
    /** The cage hangs tilted a little (degrees, negative = leaning to the right at the bottom). */
    tiltDeg: -6.5,
  },
  floor: {
    /** `topGap`: the piece's top edge below the book area's bottom edge. Both are fractions of the page width. */
    base: { widthFraction: 250 / 750, left: 12 / 750, topGap: 21 / 750 },
    /** The dome art is 486 px wide, shown at 165/394 of that, as mocked. */
    dome: { widthFraction: (486 * (165 / 394)) / 750, left: 520 / 750, topGap: 6 / 750 },
    /** The lowest a piece may reach: this far above the screen's bottom edge (short phones with no bottom inset). */
    screenMargin: 20 / 750,
  },
  timing: {
    /**
     * Counted from the thud. The page (and the cage with it) fades in over 350 ms after the thud, so the cage
     * hangs in plain view for a beat (to about 700 ms), jolts, and then lets go.
     */
    shakeAtMs: 700,
    shakeMs: 240,
    fallAtMs: 1000,
    fallMs: 380,
    /** At the slam: the base squashes and settles, the dome hops out. */
    settleMs: 220,
    domeMs: 420,
    /** Extra swing the jolt adds, in degrees. */
    shakeDeg: 5,
    /** The dome starts this far up and to the left (page widths) and tipped this much more (degrees). */
    domeFromX: -0.05,
    domeFromY: -0.09,
    domeFromDeg: -40,
  },
} as const;

type Rect = { left: number; top: number; width: number; height: number };

export type PolybookCageLayout = {
  rope: Rect;
  hang: Rect & { originX: number; originY: number; tiltDeg: number };
  base: Rect;
  dome: Rect;
  /** How far the whole cage falls so its bottom lands where the base's bottom sits. */
  fallDistance: number;
};

/**
 * Every rectangle in the screen's own coordinates, from the page width, the screen height and the bottom of
 * the content area (the pieces are measured down from there, so they sit under the open book on every phone).
 */
export function polybookCageLayout(
  pageWidth: number,
  pageHeight: number,
  contentBottom: number,
): PolybookCageLayout {
  const A = POLYBOOK_CAGE_ART;
  const C = POLYBOOK_CAGE;
  const ropeW = C.ropeWidthFraction * pageWidth;
  const rope = { left: 0, top: 0, width: ropeW, height: (ropeW * A.rope.h) / A.rope.w };

  const hangW = C.hang.widthFraction * pageWidth;
  const hs = hangW / A.hang.w;
  const originX = A.hang.ring.x * hs;
  const originY = A.hang.ring.y * hs;
  const hang = {
    left: C.hang.ringX * pageWidth - originX,
    top: C.hang.ringY * pageWidth - originY,
    width: hangW,
    height: A.hang.h * hs,
    originX,
    originY,
    tiltDeg: C.hang.tiltDeg,
  };

  const baseW = C.floor.base.widthFraction * pageWidth;
  const baseH = (baseW * A.base.h) / A.base.w;
  const lowest = pageHeight - C.floor.screenMargin * pageWidth;
  const baseTop = Math.min(contentBottom + C.floor.base.topGap * pageWidth, lowest - baseH);
  const baseBottom = baseTop + baseH;
  const base = { left: C.floor.base.left * pageWidth, top: baseTop, width: baseW, height: baseH };

  const domeW = C.floor.dome.widthFraction * pageWidth;
  const domeH = (domeW * A.dome.h) / A.dome.w;
  const domeTop = Math.min(contentBottom + C.floor.dome.topGap * pageWidth, lowest - domeH);
  const dome = { left: C.floor.dome.left * pageWidth, top: domeTop, width: domeW, height: domeH };

  return { rope, hang, base, dome, fallDistance: baseBottom - (hang.top + hang.height) };
}

/** True once the cage has fallen in this app launch (module scope = once per app open, like Home's moon). */
let cageHasFallen = false;
export const polybookCageHasFallen = () => cageHasFallen;
export const markPolybookCageFallen = () => {
  cageHasFallen = true;
};
