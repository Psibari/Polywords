export const HUNT_BOOK_V2_GEOMETRY = {
  // Exact historical SVG HeroBook baseline. No V2 stretching, ribbon, or
  // altered page anatomy. This viewer exists only so the original object can
  // be judged on-device before any new treatment is added.
  viewBoxWidth: 360,
  viewBoxHeight: 210,
  coverLeft: 10,
  coverRight: 350,
  coverTop: 14,
  coverBottom: 158,
  coverHeight: 162,
  lowerCoverTop: 150,
  lowerCoverBottom: 204,
  pageBlockTop: 158,
  pageBlockBottom: 196,
} as const;

export const HUNT_BOOK_V2_WORDS = [
  'BANK',
  'LIGHT',
  'EXCHANGE',
  'CONCENTRATION',
] as const;

export const HUNT_BOOK_V2_STATES = [
  { key: 'closed', label: 'CLOSED', progress: 0 },
  { key: 'partial', label: 'PARTIALLY OPEN', progress: 0.5 },
  { key: 'intake', label: 'INTAKE READY', progress: 1 },
] as const;

export const HUNT_BOOK_V2_TEXT_SCALES = [0.84, 1, 1.14] as const;

export type HuntBookV2State = (typeof HUNT_BOOK_V2_STATES)[number];
