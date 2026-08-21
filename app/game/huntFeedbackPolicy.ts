export type HuntFeedbackEvent =
  | 'routineReal'
  | 'routineTrap'
  | 'gauntletCorrect'
  | 'mastery';

export type ScreenFlashEvent = Extract<HuntFeedbackEvent, 'gauntletCorrect' | 'mastery'>;
export type ScreenFlashTier = 'gauntlet' | 'mastery';

export type ScreenFlashRecipe = {
  tier: ScreenFlashTier;
  color: '#F5C842';
  peakOpacity: number;
  attackMs: number;
  decayMs: number;
};

const SCREEN_FLASHES: Record<ScreenFlashEvent, ScreenFlashRecipe> = {
  gauntletCorrect: {
    tier: 'gauntlet',
    color: '#F5C842',
    peakOpacity: 0.16,
    attackMs: 50,
    decayMs: 170,
  },
  mastery: {
    tier: 'mastery',
    color: '#F5C842',
    peakOpacity: 0.38,
    attackMs: 65,
    decayMs: 260,
  },
};

export function resolveScreenFlash(event: HuntFeedbackEvent): ScreenFlashRecipe | null {
  if (event === 'routineReal' || event === 'routineTrap') return null;
  return SCREEN_FLASHES[event];
}

export type FXAccessibility = {
  mode: 'animated' | 'static';
  showImpactGlow: boolean;
};

export function resolveFXAccessibility(
  reduceMotion: boolean | null,
  reduceFlashes: boolean,
): FXAccessibility {
  const mode = reduceMotion === false ? 'animated' : 'static';
  return {
    mode,
    showImpactGlow: mode === 'animated' && !reduceFlashes,
  };
}
