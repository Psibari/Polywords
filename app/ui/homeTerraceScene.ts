// Layout for the outdoor-terrace Home (Pete, 2026-10-20). Pure geometry, no React.
//
// The art was composed on a 443 x 960 design canvas (the 1290:2796 background ratio). Every
// number below is in those design units. They came from the clickable mock, which Pete says is
// "off on position", so they are STARTING values: the DEV positioner (app/dev) is how Pete sets
// the real ones on a phone.
//
// One frame holds the whole lower scene: width-fit (k = screenWidth / 443) and BOTTOM-anchored.
// The sky and ridges, the castle, the front ridge, the wall, the ground, the console and the
// cage base all share that frame, so the castle can never drift against the ridges or the wall
// on a different phone shape. Nothing here scales the wall by an animation. Only the sky group
// (logo, moon, upper cage half) is TOP-anchored below the safe-area inset, so the logo is never
// under the status bar.
//
// Taller phones show extra sky above the frame (filled with the background's top colour); shorter
// phones crop the top of the sky. The lower scene is never cropped.

export const TERRACE_DESIGN_W = 443;
export const TERRACE_DESIGN_H = 960;

// Source pixel sizes of the shipped art (assets/images/home/terrace).
export const TERRACE_BG_PX = { w: 1290, h: 2796 } as const;
// front.webp starts this many source rows down the background.
export const TERRACE_FRONT_TOP_PX = 1440;
// The background's top-row colour, used to fill above the frame on taller phones.
// BOTTOM_COLOR is the front ridge's last row, used to fill below it if the picture is raised.
export const TERRACE_SKY_TOP_COLOR = '#100E2A';
export const TERRACE_FRONT_BOTTOM_COLOR = '#0C0B20';

export type TerraceAnchor = 'top' | 'bottom';

export type TerraceRect = { x: number; y: number; w: number; h: number };

export const TERRACE_ELEMENT_IDS = [
  'background',
  'logo',
  'moon',
  'cageTop',
  'castle',
  'wall',
  'plaque',
  'perch',
  'polly',
  'ground',
  'casing',
  'gear',
  'cageBase',
] as const;

export type TerraceElementId = (typeof TERRACE_ELEMENT_IDS)[number];

export const TERRACE_ELEMENT_LABEL: Record<TerraceElementId, string> = {
  background: 'Sky and mountains',
  perch: 'Perch',
  logo: 'Logo',
  moon: 'Moon',
  cageTop: 'Cage top',
  castle: 'Castle',
  wall: 'Back wall',
  plaque: 'Daily plaque',
  polly: 'Polly',
  ground: 'Ground',
  casing: 'Console',
  gear: 'Settings gear',
  cageBase: 'Cage base',
};

export const TERRACE_ANCHOR: Record<TerraceElementId, TerraceAnchor> = {
  background: 'bottom',
  perch: 'bottom',
  logo: 'top',
  moon: 'top',
  cageTop: 'top',
  castle: 'bottom',
  wall: 'bottom',
  plaque: 'bottom',
  polly: 'bottom',
  ground: 'bottom',
  casing: 'bottom',
  gear: 'bottom',
  cageBase: 'bottom',
};

// Art aspect ratios (height / width) of the shipped images.
export const TERRACE_ASPECT = {
  logo: 251 / 1558,
  wall: 353 / 1095,
  casing: 1034 / 1458,
  castle: 487 / 715,
  cageTop: 363 / 400,
  cageBase: 292 / 420,
  perch: 70 / 508,
  // The Daily button art (btn_daily.png, 1121 x 175): the strip of wall recess left above the console.
  plaque: 175 / 1121,
} as const;

// The sky-and-mountains image: 1290 x 2796 source, width-fit, so 443 x 960.18 design units.
export const TERRACE_BG_DESIGN_H = (TERRACE_DESIGN_W * 2796) / 1290;

// Starting positions in design units (from the mock).
export const TERRACE_DEFAULTS: Record<TerraceElementId, TerraceRect> = {
  // Pete's 2026-10-21 20:54 DEV readout, locked as the defaults. Heights of the single-picture art
  // (logo, wall, plaque, castle, perch, cage, casing) equal width x TERRACE_ASPECT, as the DEV tool
  // keeps them. The background's y is negative: the image is taller than the 960 canvas.
  background: { x: -2.95, y: -173.24, w: 449.52, h: 974.31 },
  logo: { x: 42.67, y: 40.98, w: 364.65, h: 58.75 },
  moon: { x: 346.16, y: 84.81, w: 65.5, h: 65.5 },
  cageTop: { x: 173.33, y: 804.44, w: 100, h: 90.75 },
  castle: { x: 140.08, y: 431.42, w: 162.45, h: 110.65 },
  wall: { x: -27.29, y: 390.81, w: 496.27, h: 159.98 },
  plaque: { x: 62.61, y: 465.93, w: 318.77, h: 49.76 },
  perch: { x: -7.06, y: 379.3, w: 120, h: 16.54 },
  // Polly's art box has no fixed size here: this rect is only her start point and scale.
  // See terracePollyTransform.
  polly: { x: -47.24, y: 238.9, w: 135.12, h: 197.25 },
  ground: { x: -31.89, y: 792.21, w: 1119.44, h: 838.95 },
  casing: { x: -33.1, y: 509.04, w: 497.6, h: 352.89 },
  gear: { x: 2.82, y: 831.08, w: 42, h: 42 },
  cageBase: { x: 20.13, y: 856.65, w: 120.01, h: 83.44 },
};

export const TERRACE_CAGE_TOP_ROTATION_DEG = 9;

// The opening in the casing and the two flat buttons, as fractions of the casing rect, so they move
// and scale with it. Measured from Pete's 2026-10-21 casing art (1458 x 1034; hole 1140 x 705 at
// x 161, y 143). Buttons are his flat art: Hunt 1117 x 404, Polybook 1121 x 263.
export const TERRACE_NICHE = {
  x: 161 / 1458,
  y: 143 / 1034,
  w: 1140 / 1458,
  h: 705 / 1034,
} as const;
// Buttons inside the niche (x / w fractions of niche width, y / h of niche height), as in Pete's
// own composite: centred, about 17 px margin on a 1140 x 705 opening, a 7 px gap between.
export const TERRACE_SLABS = {
  hunt: { x: (1140 - 1117) / 2 / 1140, w: 1117 / 1140, y: 17 / 705, h: 404 / 705 },
  book: { x: (1140 - 1121) / 2 / 1140, w: 1121 / 1140, y: 428 / 705, h: 263 / 705 },
} as const;

// Button labels (Lilita One, Pete 2026-10-21). ENTER THE HUNT is three lines, ENTER and HUNT big with
// a tiny THE between ("the" is not an important word); RESUME HUNT is two big lines; POLYBOOK is one
// line, much smaller. Advance widths are in em, measured from assets/fonts/LilitaOne-Regular.ttf.
export const TERRACE_LABEL = {
  /** The Hunt text block fills this much of the button height. */
  huntBlockHeightFraction: 0.78,
  /** ...and never more than this much of its width. */
  // Leaves room for the crown emblem at each end (each takes 7% + 14% of the button width).
  huntMaxWidthFraction: 0.56,
  /** Big line height, and the small THE's size and line height, as multiples of the big size. */
  bigLineHeight: 0.92,
  smallSize: 0.34,
  smallLineHeight: 0.5,
  bookSizeRatio: 0.7,
  letterSpacingEm: 0.05,
  advanceEm: { enter: 2.726, hunt: 2.422, resume: 3.642, polybook: 4.887 },
} as const;

export type TerraceLabelLayout = {
  /** Big-line size for ENTER / RESUME / HUNT, points. */
  hunt: number;
  /** The small THE between ENTER and HUNT. */
  small: number;
  book: number;
};

/** Label sizes (points) for the two buttons, from their pixel sizes on screen. */
export function terraceLabelLayout(huntWidth: number, huntHeight: number): TerraceLabelLayout {
  const L = TERRACE_LABEL;
  // Block height: two big lines plus the small THE line.
  const byHeight = (L.huntBlockHeightFraction * huntHeight) / (2 * L.bigLineHeight + L.smallLineHeight);
  // The widest big line is RESUME.
  const byWidth =
    (L.huntMaxWidthFraction * huntWidth) / (L.advanceEm.resume + L.letterSpacingEm * 'RESUME'.length);
  const hunt = Math.min(byHeight, byWidth);
  return { hunt, small: hunt * L.smallSize, book: hunt * L.bookSizeRatio };
}

// Castle windows and door glow, as fractions of the castle rect (from the mock's overlays).
export type TerraceWindow = { kind: 'arch' | 'slit'; x: number; y: number; w: number; h: number };
const CASTLE_X = 195;
const CASTLE_Y = 445;
const CASTLE_W = 180;
const CASTLE_H = 180 * TERRACE_ASPECT.castle;
function castleWindow(kind: 'arch' | 'slit', x: number, y: number, w: number, h: number): TerraceWindow {
  return { kind, x: (x - CASTLE_X) / CASTLE_W, y: (y - CASTLE_Y) / CASTLE_H, w: w / CASTLE_W, h: h / CASTLE_H };
}
export const TERRACE_CASTLE_WINDOWS: readonly TerraceWindow[] = [
  castleWindow('arch', 221.7, 462.6, 6.0, 11.6),
  castleWindow('slit', 223.7, 492.8, 2.0, 12.6),
  castleWindow('arch', 342.0, 462.6, 6.0, 11.6),
  castleWindow('slit', 344.0, 492.8, 2.0, 12.6),
  castleWindow('arch', 281.6, 492.8, 6.5, 11.6), // the castle door
];

// Perspective seams painted on the ground (design units, ground-local): wide slabs, no cracks.
export const TERRACE_GROUND_SEAM_ROWS = [22, 54, 96, 150, 218, 300] as const;
export const TERRACE_GROUND_SEAM_COLUMNS_BOTTOM_X = [-440, -290, -140, 10, 160, 310, 460, 610, 760] as const;
export const TERRACE_GROUND_VANISH = { x: 221, y: -260 } as const;

// Wall, console and the Daily button are single pictures: the DEV tool only scales them uniformly, so their height
// always follows their width. This also keeps old saved overrides (made against earlier art with a
// different aspect) from stretching the new art.
const ASPECT_LOCKED: ReadonlySet<TerraceElementId> = new Set<TerraceElementId>(['wall', 'casing', 'plaque']);
export function lockTerraceAspect(id: TerraceElementId, rect: TerraceRect): TerraceRect {
  if (!ASPECT_LOCKED.has(id)) return rect;
  return { ...rect, h: rect.w * (TERRACE_ASPECT as Record<string, number>)[id] };
}

export type TerraceOverrides = Partial<Record<TerraceElementId, Partial<TerraceRect>>>;

export type TerraceViewport = {
  width: number;
  height: number;
  insetTop: number;
};

export type ScreenRect = { left: number; top: number; width: number; height: number };

export type TerraceLayout = {
  /** Screen points per design unit. */
  k: number;
  /** The sky and ridges image (the 'background' element). */
  background: ScreenRect;
  /** The front-ridge overlay (same scale as the background). */
  front: ScreenRect;
  rects: Record<TerraceElementId, ScreenRect>;
};

export function terraceScale(width: number): number {
  return width / TERRACE_DESIGN_W;
}

function rectFor(
  id: TerraceElementId,
  viewport: TerraceViewport,
  k: number,
  overrides: TerraceOverrides,
): ScreenRect {
  const base = TERRACE_DEFAULTS[id];
  const o = overrides[id] ?? {};
  const x = o.x ?? base.x;
  const y = o.y ?? base.y;
  const w = o.w ?? base.w;
  const h = lockTerraceAspect(id, { x, y, w, h: o.h ?? base.h }).h;
  const top =
    TERRACE_ANCHOR[id] === 'top'
      ? viewport.insetTop + y * k
      : viewport.height - (TERRACE_DESIGN_H - y) * k;
  return { left: x * k, top, width: w * k, height: h * k };
}

export function resolveTerraceLayout(
  viewport: TerraceViewport,
  overrides: TerraceOverrides = {},
): TerraceLayout {
  const k = terraceScale(viewport.width);
  const rects = {} as Record<TerraceElementId, ScreenRect>;
  for (const id of TERRACE_ELEMENT_IDS) rects[id] = rectFor(id, viewport, k, overrides);
  // The front ridge is part of the same picture as the sky, so it follows the background rect.
  const bg = rects.background;
  const s = bg.width / TERRACE_BG_PX.w;
  return {
    k,
    background: bg,
    front: {
      left: bg.left,
      top: bg.top + TERRACE_FRONT_TOP_PX * s,
      width: bg.width,
      height: (TERRACE_BG_PX.h - TERRACE_FRONT_TOP_PX) * s,
    },
    rects,
  };
}

// Polly is the existing PollyHomePerch (a 246 pt art box whose bottom edge sits
// `perchBottomOffset` above the screen bottom, rooted off the left edge). We cannot move that
// component's own layout, so she is wrapped and transformed about the perch box's bottom-left.
// The START values are an estimate, NOT measured on a phone: Pete sets the real ones with the
// DEV positioner.
export const TERRACE_POLLY_ART_PT = 220; // drawn bird height inside the 246 pt box (see pollyHomePoses)
export const TERRACE_POLLY_BOX_LEFT_PT = -66; // box left edge relative to the perch root

export type TerracePollyTransform = {
  originX: number;
  originY: number;
  translateX: number;
  translateY: number;
  scale: number;
};

export function terracePollyTransform(
  rect: TerraceRect,
  viewport: TerraceViewport,
  k: number,
  perchBottomOffset: number,
): TerracePollyTransform {
  const feetY = viewport.height - (TERRACE_DESIGN_H - (rect.y + rect.h)) * k; // wanted feet line
  const boxBottomY = viewport.height - perchBottomOffset;
  const scale = (rect.h * k) / TERRACE_POLLY_ART_PT;
  return {
    originX: 0,
    originY: boxBottomY,
    translateX: rect.x * k - TERRACE_POLLY_BOX_LEFT_PT * scale,
    translateY: feetY - boxBottomY,
    scale,
  };
}
