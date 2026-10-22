// The terrace sky's moving parts, RN-free so they can be tested: the moon's real phase for a date, how the
// phase sprites sit in the moon's box, the moon rise from behind the back mountains, and the shooting stars.
// All timings are plain numbers here so they can be tuned in one place.

/** Pete's moon sprite sheet (assets/images/moons), 9 cells row by row, lit side on the RIGHT (waxing). */
export const TERRACE_MOON_CELLS = [
  { w: 107, h: 244 }, // r0c0 thin crescent
  { w: 134, h: 247 }, // r0c1
  { w: 138, h: 246 }, // r0c2
  { w: 159, h: 245 }, // r1c0 about a quarter
  { w: 197, h: 245 }, // r1c1
  { w: 222, h: 246 }, // r1c2 gibbous
  { w: 234, h: 244 }, // r2c0
  { w: 238, h: 244 }, // r2c1
  { w: 244, h: 244 }, // r2c2 full
] as const;

const SYNODIC_DAYS = 29.530588853;
/** A known new moon: 2000-01-06 18:14 UTC. */
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const DAY_MS = 86400000;

export type TerraceMoonPhase = {
  /** Days since new moon, 0 .. 29.53. */
  age: number;
  /** Lit fraction of the disc, 0 (new) .. 1 (full). */
  illumination: number;
  /** Growing (lit on the right, as the sprites are drawn) or shrinking (mirrored). */
  waxing: boolean;
  /** Which sprite cell, 0 (thinnest crescent) .. 8 (full). */
  cell: number;
};

/** The real moon phase for a date (mean synodic month; good to about a day, which is plenty for a picture). */
export function terraceMoonPhase(date: Date): TerraceMoonPhase {
  const days = (date.getTime() - REFERENCE_NEW_MOON_MS) / DAY_MS;
  const age = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_DAYS)) / 2;
  const waxing = age < SYNODIC_DAYS / 2;
  const cell = Math.min(8, Math.max(0, Math.round(illumination * 8)));
  return { age, illumination, waxing, cell };
}

export type MoonSpriteBox = { left: number; width: number; height: number; mirror: boolean };

/**
 * Where a phase sprite goes inside the moon's square box: full height, its natural width, hugging the right
 * rim when the moon is growing and the left rim (mirrored) when it is shrinking, so the full disc stays put.
 */
export function terraceMoonSprite(cell: number, waxing: boolean, box: { width: number; height: number }): MoonSpriteBox {
  const c = TERRACE_MOON_CELLS[Math.min(8, Math.max(0, cell))];
  const width = box.height * (c.w / c.h);
  return { left: waxing ? box.width - width : 0, width, height: box.height, mirror: !waxing };
}

export const TERRACE_MOON_RISE = {
  /** Whole-number scale of every moon-rise time (1 = as written). */
  timescale: 1,
  /** Wait after Home first shows (the buttons are still coming out) before the moon starts to climb. */
  delayMs: 900,
  /** The climb from behind the back mountains to the moon's resting place. */
  riseMs: 3000,
} as const;

/** The lowest point of the back mountains' top edge in bg.webp (2796 px tall), measured by make_ridge.py. */
export const TERRACE_RIDGE_LOWEST_Y_PX = 1372;
export const TERRACE_BG_HEIGHT_PX = 2796;

/** The highest point of the back mountains' top edge in bg.webp, measured by make_ridge.py. */
export const TERRACE_RIDGE_HIGHEST_Y_PX = 1238;

/** Height of the open sky on screen, from the top down to the back mountains' highest peak. `bg` is the painting's rect. */
export function terraceSkyHeight(bg: { top: number; height: number }): number {
  return Math.max(0, bg.top + (TERRACE_RIDGE_HIGHEST_Y_PX / TERRACE_BG_HEIGHT_PX) * bg.height);
}

/**
 * How far below its resting place the moon starts so that it is completely hidden behind the back mountains:
 * its top edge goes just under the lowest point of the ridge. `bg` is the painting's rect on screen.
 */
export function terraceMoonRiseDistance(bg: { top: number; height: number }, moon: { top: number }): number {
  const ridgeLowest = bg.top + (TERRACE_RIDGE_LOWEST_Y_PX / TERRACE_BG_HEIGHT_PX) * bg.height;
  return Math.max(0, ridgeLowest + 2 - moon.top);
}

export const TERRACE_SHOOTING_STAR = {
  /** Wait after Home shows before the first star, then between stars: [min, max] ms. */
  firstDelayMs: [5000, 9000],
  gapMs: [12000, 24000],
  /** One star's flight time. */
  durationMs: [650, 950],
  /** How far it travels, as a fraction of the screen width. */
  travelWidth: [0.26, 0.4],
  /** Heading below horizontal, degrees. */
  angleDeg: [16, 30],
  /** Where it may start: fractions of the screen width, and of the sky height (top of the screen down to the back ridge). */
  startX: [0.06, 0.8],
  startY: [0.08, 0.7],
  /** Tail length and head size, in design units (x k). */
  tailLength: 96,
  tailThickness: 2.2,
  headSize: 3.4,
} as const;

export type ShootingStar = {
  /** Start point, px on screen. */
  x: number;
  y: number;
  /** Travel, px. */
  dx: number;
  dy: number;
  /** Heading, degrees clockwise from rightward (screen coords). */
  heading: number;
  durationMs: number;
};

const lerp = (r: readonly [number, number], t: number) => r[0] + (r[1] - r[0]) * t;

/** Next gap before a star: pass `first` for the wait after Home shows. `rand` is Math.random-like (0..1). */
export function terraceStarDelay(first: boolean, rand: () => number): number {
  return Math.round(lerp(first ? TERRACE_SHOOTING_STAR.firstDelayMs : TERRACE_SHOOTING_STAR.gapMs, rand()));
}

/** One star's flight. `skyHeight` is the height of the sky above the back ridge, px. Half go left to right, half right to left. */
export function terraceShootingStar(width: number, skyHeight: number, rand: () => number): ShootingStar {
  const c = TERRACE_SHOOTING_STAR;
  const rightward = rand() < 0.5;
  const angle = lerp(c.angleDeg, rand());
  const heading = rightward ? angle : 180 - angle;
  const travel = lerp(c.travelWidth, rand()) * width;
  const rad = (heading * Math.PI) / 180;
  return {
    x: lerp(c.startX, rand()) * width,
    y: lerp(c.startY, rand()) * skyHeight,
    dx: travel * Math.cos(rad),
    dy: travel * Math.sin(rad),
    heading,
    durationMs: Math.round(lerp(c.durationMs, rand())),
  };
}
