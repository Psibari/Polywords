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
  wall: 317 / 890,
  casing: 548 / 795,
  castle: 487 / 715,
  cageTop: 363 / 400,
  cageBase: 292 / 420,
  perch: 70 / 508,
} as const;

// The sky-and-mountains image: 1290 x 2796 source, width-fit, so 443 x 960.18 design units.
export const TERRACE_BG_DESIGN_H = (TERRACE_DESIGN_W * 2796) / 1290;

// Starting positions in design units (from the mock).
export const TERRACE_DEFAULTS: Record<TerraceElementId, TerraceRect> = {
  // y is negative by the sliver the image is taller than the 960 canvas, so its bottom is exact.
  background: { x: 0, y: TERRACE_DESIGN_H - TERRACE_BG_DESIGN_H, w: 443, h: TERRACE_BG_DESIGN_H },
  // Start values only: Pete positions the perch with the DEV tool, beside Polly's feet.
  perch: { x: 0, y: 410, w: 120, h: 120 * TERRACE_ASPECT.perch },
  logo: { x: 71, y: 28, w: 300, h: 300 * TERRACE_ASPECT.logo },
  moon: { x: 332, y: 122, w: 66, h: 66 },
  cageTop: { x: 18, y: 98, w: 100, h: 100 * TERRACE_ASPECT.cageTop },
  castle: { x: 195, y: 445, w: 180, h: 180 * TERRACE_ASPECT.castle },
  wall: { x: 0, y: 495, w: 443, h: 443 * TERRACE_ASPECT.wall },
  plaque: { x: 88, y: 574, w: 268, h: 80 },
  // Polly's art box has no fixed size here: this rect is only her start point and scale.
  // x / y / w come from the mock (her perch-and-bird picture); see terracePollyTransform.
  polly: { x: 78, y: 448, w: 112, h: 163.5 },
  ground: { x: 0, y: 628, w: 443, h: 332 },
  casing: { x: 46, y: 700, w: 349.8, h: 349.8 * TERRACE_ASPECT.casing },
  gear: { x: 4, y: 912, w: 42, h: 42 },
  cageBase: { x: 345, y: 872, w: 98, h: 98 * TERRACE_ASPECT.cageBase },
};

export const TERRACE_CAGE_TOP_ROTATION_DEG = 9;

// The opening in the casing and the two slabs, as fractions of the casing rect, so they move and
// scale with it. Measured from the cleaned casing art (hole 617 x 382 of 795 x 548).
export const TERRACE_NICHE = {
  x: (86.9 - 46) / 349.8,
  y: (736.1 - 700) / 241.1,
  w: 271.5 / 349.8,
  h: 168.1 / 241.1,
} as const;
// Slabs inside the niche, INSET with a dark margin around them and a gap between (as in Pete's
// original composite). x / w are fractions of the niche width, y / h of the niche height.
// Pixel basis: niche 617 x 382; Hunt art 619 x 243, Polybook art 619 x 128 (aspect kept).
const SLAB_W = 555 / 617;
export const TERRACE_SLABS = {
  hunt: { x: (617 - 555) / 2 / 617, w: SLAB_W, y: 18 / 382, h: (555 * 243) / 619 / 382 },
  book: { x: (617 - 555) / 2 / 617, w: SLAB_W, y: 248 / 382, h: (555 * 128) / 619 / 382 },
} as const;

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
  const h = o.h ?? base.h;
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
