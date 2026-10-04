import type { PollyRelationshipBeatDecision, PollyRelationshipContext } from './pollyRelationship';

export type PollyLifeProfileName =
  | 'neutral'
  | 'cocky'
  | 'watchful'
  | 'rattled'
  | 'hauntFocused';

export type PollyLifeProfile = {
  name: PollyLifeProfileName;
  crownTilt: boolean;
  angryBrow: boolean;
  eye: 'default' | 'wide';
  mouth: 'closed' | 'open' | 'gape';
  dozeDelayMultiplier: number;
  ambientIntensity: number;
};

const PROFILES: Record<PollyLifeProfileName, PollyLifeProfile> = {
  neutral: {
    name: 'neutral',
    crownTilt: false,
    angryBrow: false,
    eye: 'default',
    mouth: 'closed',
    dozeDelayMultiplier: 1,
    ambientIntensity: 1,
  },
  cocky: {
    name: 'cocky',
    crownTilt: true,
    angryBrow: false,
    eye: 'default',
    mouth: 'closed',
    dozeDelayMultiplier: 0.72,
    ambientIntensity: 0.78,
  },
  watchful: {
    name: 'watchful',
    crownTilt: false,
    angryBrow: false,
    eye: 'wide',
    mouth: 'closed',
    dozeDelayMultiplier: 1.75,
    ambientIntensity: 1.12,
  },
  rattled: {
    name: 'rattled',
    crownTilt: false,
    angryBrow: true,
    eye: 'wide',
    mouth: 'open',
    dozeDelayMultiplier: 2,
    ambientIntensity: 1.22,
  },
  hauntFocused: {
    name: 'hauntFocused',
    crownTilt: true,
    angryBrow: true,
    eye: 'default',
    mouth: 'open',
    dozeDelayMultiplier: 1.6,
    ambientIntensity: 1.15,
  },
};

/**
 * Converts proven rivalry facts into Polly's low-level physical disposition.
 *
 * Immediate gameplay events still own the foreground reaction. This profile is
 * deliberately quieter: it changes how Polly rests between beats, so memory is
 * visible even when she is not speaking.
 */
export function resolvePollyLifeProfile(input: {
  context: PollyRelationshipContext;
  decision?: PollyRelationshipBeatDecision;
}): PollyLifeProfile {
  const { context, decision = null } = input;

  if (decision?.beat === 'hauntRematch') return PROFILES.hauntFocused;
  if (decision?.beat === 'comeback') return PROFILES.rattled;
  if (decision?.beat === 'veteranSlump') return PROFILES.cocky;
  if (decision?.beat === 'returningAfterAbsence') return PROFILES.watchful;

  // Carry the emotional weather beyond the exact screen where a named beat
  // fired. A rebound after a rough patch keeps Polly rattled on the next Home
  // visit; an established three-run slump lets her stay visibly comfortable.
  // This is derived from existing facts, never persisted as a new truth.
  const recentStruggles = context.recent.slice(0, 3).filter(x => x === 'struggle').length;
  const priorStruggles = context.recent.slice(1, 4).filter(x => x === 'struggle').length;
  if (context.playerWinStreak > 0 && priorStruggles >= 2) return PROFILES.rattled;
  if (
    recentStruggles >= 3 &&
    (context.runsCompleted >= 8 || context.masteredCount >= 2 || context.playerHuntsWon >= 2)
  ) return PROFILES.cocky;

  // Outside those relationship-shaped patterns, current streaks supply only
  // a subtle baseline. Permanent mastery never makes Polly submissive.
  if (context.playerWinStreak >= 2) return PROFILES.watchful;
  if (context.pollyWinStreak >= 2) return PROFILES.cocky;
  return PROFILES.neutral;
}

export function getPollyLifeProfile(name: PollyLifeProfileName): PollyLifeProfile {
  return PROFILES[name];
}
