import type { MomentumStrength } from '../ui/momentumAccent';

export type HuntFeedbackEvent =
  | 'routineReal'
  | 'routineTrap'
  | 'gauntletCorrect'
  | 'mastery';

// TEST VALUE. The whistle waits for the card's sideways buzz (SwipeMask: 70 ms
// + 55 ms) so it starts as the 420 ms fall starts. Tune by ear.
export const WRONG_FALL_WHISTLE_DELAY_MS = 125;

export type WrongSwipeSfxPlan = {
  /** Plays at judgement. */
  first: 'wrongSlap';
  /** Plays fallDelayMs later, as the card falls. */
  fall: 'wrongImpact';
  fallDelayMs: number;
};

// Every wrong swipe, broken chain or not, normal card or gauntlet card: the
// slap, then the whistle as the card falls. The streak-break punch
// (streakBreakImpact) no longer plays here; BUSTER and the Haunt STILL card
// still use it.
export function resolveWrongSwipeSfx(): WrongSwipeSfxPlan {
  return { first: 'wrongSlap', fall: 'wrongImpact', fallDelayMs: WRONG_FALL_WHISTLE_DELAY_MS };
}

// Polly's short squawk on a wrong swipe. It used to fire on every wrong swipe,
// which wore thin (Pete, 2026-10-07). Rule: always when a real chain FELL OFF,
// and on every third other wrong swipe. The count is a plain counter, not
// Math.random, so it is deterministic and never touches a Hunt's rng stream.
export const POLLY_SQUAWK_EVERY_NTH_OTHER_WRONG = 3;

export function resolvePollySquawkOnWrong(
  brokeRealChain: boolean,
  otherWrongCountBefore: number,
): { squawk: boolean; otherWrongCountAfter: number } {
  if (brokeRealChain) return { squawk: true, otherWrongCountAfter: otherWrongCountBefore };
  const otherWrongCountAfter = otherWrongCountBefore + 1;
  return {
    squawk: otherWrongCountAfter % POLLY_SQUAWK_EVERY_NTH_OTHER_WRONG === 0,
    otherWrongCountAfter,
  };
}

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

// ── Haptic cue selection ────────────────────────────────────────────────
// Claiming a REAL and rejecting a trap are different gestures with different
// meaning, so they get different shapes in the hand: a claim is a solid
// Medium "take"; a rejection always opens with a sharp Rigid "swat". Both
// climb across the Hunt's three phase tiers (light / medium / heavy) by
// rhythm, never by Heavy force, which stays reserved for Boss beats.
// An unset tier keeps the old behavior (the strongest claim cue).
export type HuntHapticTier = 'light' | 'medium' | 'heavy';

export type ClaimHapticCue = 'standardCorrect' | 'claimMedium' | 'heightenedCorrect';
export type TrapRejectHapticCue = 'trapRejectLight' | 'trapRejectMedium' | 'trapRejectHeavy';
export type TierUpHapticCue = 'tierUp' | 'tierUpRazor' | 'tierUpUntrappable';

export function resolveClaimHapticCue(tier: HuntHapticTier | undefined): ClaimHapticCue {
  if (tier === 'light') return 'standardCorrect';
  if (tier === 'medium') return 'claimMedium';
  return 'heightenedCorrect';
}

export function resolveTrapRejectHapticCue(tier: HuntHapticTier | undefined): TrapRejectHapticCue {
  if (tier === 'light') return 'trapRejectLight';
  if (tier === 'medium') return 'trapRejectMedium';
  return 'trapRejectHeavy';
}

export type PressHapticCue =
  | 'pressSteady'
  | 'pressSharp'
  | 'pressRazor'
  | 'pressUntrappable'
  | 'pressHunted';

const PRESS_HAPTIC_CUE: Record<MomentumStrength, PressHapticCue> = {
  steady: 'pressSteady',
  sharp: 'pressSharp',
  razorSharp: 'pressRazor',
  untrappable: 'pressUntrappable',
  hunted: 'pressHunted',
};

/** The touch-down cue for a Hunt card, by the same momentum as its glow. */
export function resolvePressHapticCue(strength: MomentumStrength): PressHapticCue {
  return PRESS_HAPTIC_CUE[strength];
}

/** `rank` is the new momentum read tier: 1 SHARP, 2 RAZOR SHARP, 3 UNTRAPPABLE. */
export function resolveTierUpHapticCue(rank: number): TierUpHapticCue {
  if (rank >= 3) return 'tierUpUntrappable';
  if (rank === 2) return 'tierUpRazor';
  return 'tierUp';
}

/**
 * Polly's startled squawk when momentum first reaches RAZOR SHARP in a run
 * ("that's when she starts to get worried"). Once per Hunt run: a FELL OFF
 * and re-climb in the same run stays quiet. Muted while the HUD is hidden
 * (lesson, pause, exit confirm) and during first-run onboarding.
 */
export function shouldPlayRazorStartle(args: {
  isRank: number;
  wasRank: number;
  runSeed: string | number;
  lastStartleRunSeed: string | number | null;
  muted: boolean;
}): boolean {
  return args.isRank === 2
    && args.isRank > args.wasRank
    && args.lastStartleRunSeed !== args.runSeed
    && !args.muted;
}
