export const FONTS = {
  // Master word display — normal words
  wordDisplay: 'SuperCartoon-6R791',

  // Boss word ONLY — never use anywhere else
  bossWord: 'gomarice_okuba_cloud',

  // Tile copy — all masks and traps
  tileCopy: 'SuperFrosting-R9z4o',

  // Brand title + Polly speech lines
  brand: 'SuperCarnival-j9Wq0',

  // HUD — score, multiplier numbers
  hud: 'SuperCartoon-6R791',

  // Progress labels, sub-labels, ghost sub-label
  label: 'SuperFrosting-R9z4o',
} as const;

export const FONT_SIZES = {
  wordDisplay:     56,
  bossWordDisplay: 64,
  tileCopy:        18,
  brandTitle:      48,
  hudScore:        22,
  hudMultiplier:   32,
  hudLabel:        11,
  progressLabel:   12,
  pollyLine:       14,
  ghostSubLabel:   10,
} as const;
