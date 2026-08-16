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
  // Both floored at 14px (this project's non-gameplay legibility minimum) —
  // previously 11/10, below the floor. Each is used only by its own labeled
  // spot (hudLabel: boss stakes kicker + outcome CONTINUE label;
  // ghostSubLabel: card era badge), so raising them here can't inflate any
  // other UI.
  hudLabel: 14,
  progressLabel: 15,
  pollyLine: 17,
  ghostSubLabel: 14,
} as const;
