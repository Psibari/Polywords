export const FONTS = {
  // Hero word, normal and boss.
  wordDisplay: 'BebasNeue-Regular',
  bossWord: 'BebasNeue-Regular',
  heroFace: 'BebasNeue-Regular',

  // HUD, badges, tile text, labels, results, stamps, and Polly bubbles.
  // Use with textTransform: 'uppercase' except Polly dialogue.
  ui: 'BarlowCondensed-Bold',
  hud: 'BarlowCondensed-Bold',
  tileCopy: 'BarlowCondensed-Bold',
  label: 'BarlowCondensed-Bold',
  brand: 'BarlowCondensed-Bold',
} as const;

export const FONT_SIZES = {
  wordDisplay: 96,
  wordDisplayLetterSpacing: 2,
  bossWordDisplay: 114,
  bossWordLetterSpacing: 2,
  tileCopy: 28,
  brandTitle: 48,
  hudScore: 26,
  hudMultiplier: 34,
  hudLabel: 11,
  progressLabel: 15,
  pollyLine: 17,
  ghostSubLabel: 10,
} as const;
