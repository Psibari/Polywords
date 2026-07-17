export const FONTS = {
  // Hero word — normal and boss
  wordDisplay: 'BebasNeue-Regular',
  bossWord:    'BebasNeue-Regular',
  heroFace:    'BebasNeue-Regular',

  // All UI — HUD, badges, tile text, labels, results, stamps
  // Always use with textTransform: 'uppercase' except Polly
  ui: 'BarlowCondensed-Bold',
  hud: 'BarlowCondensed-Bold',
  tileCopy: 'BarlowCondensed-Bold',
  label: 'BarlowCondensed-Bold',
  brand: 'BarlowCondensed-Bold',

  // Polly speech only — mixed case, never uppercase
  polly: 'LilitaOne-Regular',

  // Brand logotype only — wordmark lockup + app icon. Never general UI.
  logotype: 'RammettoOne-Regular',

  // Legacy aliases — keep to avoid breaking existing imports
  poppinsBold:     'BarlowCondensed-Bold',
  poppinsSemiBold: 'BarlowCondensed-Bold',
} as const;

export const FONT_SIZES = {
  wordDisplay:               96,
  wordDisplayLetterSpacing:   2,
  bossWordDisplay:           114,
  bossWordLetterSpacing:       2,
  tileCopy:                   28,
  brandTitle:                 48,
  hudScore:                   26,
  hudMultiplier:              32,
  hudLabel:                   11,
  progressLabel:              15,
  pollyLine:                  17,
  ghostSubLabel:              10,
} as const;
