export const HUNT_BOOK_V2_GEOMETRY = {
  // Preserve the historical SVG book's horizontal geometry exactly. The V2
  // experiment grows only top-to-bottom.
  viewBoxWidth: 360,
  viewBoxHeight: 286,
  coverLeft: 10,
  coverRight: 350,
  coverTop: 14,
  coverBottom: 214,
  coverHeight: 224,
  lowerCoverTop: 204,
  lowerCoverBottom: 282,
  pageBlockTop: 214,
  pageBlockBottom: 272,
  ribbonTop: 28,
  ribbonLeft: 168,
  ribbonRight: 192,
  ribbonTailY: 282,
  ribbonNotchY: 268,
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
