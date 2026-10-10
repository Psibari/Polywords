export type OutcomeReveal = 'mastered' | 'haunted';
export type OutcomeRevealSfx = OutcomeReveal;

export type BossOutcomeSequenceFeedback = {
  startSfx: 'masteredTransform' | 'hauntedTransformSlam';
  impact: {
    delayMs: 270 | 580;
    sfx: 'masteredBookSlam' | null;
    hapticCue: 'masteredBookImpact' | 'hauntedBookImpact';
    boardShake: boolean;
  };
};

export function resolveBossOutcomeSequenceFeedback(
  outcome: OutcomeReveal,
): BossOutcomeSequenceFeedback {
  if (outcome === 'mastered') {
    return {
      startSfx: 'masteredTransform',
      impact: {
        delayMs: 270,
        sfx: 'masteredBookSlam',
        hapticCue: 'masteredBookImpact',
        boardShake: false,
      },
    };
  }
  return {
    startSfx: 'hauntedTransformSlam',
    impact: {
      delayMs: 580,
      sfx: null,
      hapticCue: 'hauntedBookImpact',
      boardShake: true,
    },
  };
}

export type BossOutcomePlaqueFeedback = {
  sfx: 'masteredResult' | 'hauntedResult';
  hapticCue: 'mastery' | null;
};

export function resolveBossOutcomePlaqueFeedback(
  outcome: OutcomeReveal,
): BossOutcomePlaqueFeedback {
  if (outcome === 'mastered') {
    return { sfx: 'masteredResult', hapticCue: 'mastery' };
  }
  return { sfx: 'hauntedResult', hapticCue: null };
}

export function resolveOutcomeRevealSfx(outcome: OutcomeReveal): OutcomeRevealSfx {
  return outcome;
}

export type RankUpFeedback = {
  sfx: 'mastered' | null;
  successHaptic: boolean;
  heavyPulse: boolean;
};

export function resolveRankUpFeedback(died: boolean): RankUpFeedback {
  if (died) {
    return { sfx: null, successHaptic: false, heavyPulse: false };
  }
  return { sfx: 'mastered', successHaptic: true, heavyPulse: true };
}

/** Player-facing boss labels carry stakes, not the retired score multiplier. */
export function resolveBossEventKicker(isMasteryRematch: boolean): "POLLY'S WORD" | "MASTER'S REMATCH" {
  return isMasteryRematch ? "MASTER'S REMATCH" : "POLLY'S WORD";
}

export type RematchPresentationPhase = 'entry' | 'king' | 'buster';
export type RematchBookVariant = 'neutral' | 'mastered';

/**
 * A Master's Rematch starts from the already-earned gold state. Winning keeps
 * it; losing only drops the presentation back to the regular book. Persistent
 * Mastery is intentionally untouched by this visual policy.
 */
export function resolveRematchBookVariant(phase: RematchPresentationPhase): RematchBookVariant {
  return phase === 'buster' ? 'neutral' : 'mastered';
}

/**
 * A MASTER'S REMATCH loss is not a Haunt (nothing haunts the player), so it
 * borrows none of the haunted sounds. Pete chose the punch already used when
 * a chain falls off (`streakBreakImpact`), paired with the matching single
 * Medium haptic. Fired once, when the BU of BUSTER lands.
 */
export type RematchLossFeedback = {
  sfx: 'streakBreakImpact';
  hapticCue: 'fellOffSmall';
};

export function resolveRematchLossFeedback(): RematchLossFeedback {
  return { sfx: 'streakBreakImpact', hapticCue: 'fellOffSmall' };
}

/** MASTER loses its MA and gains BU. The kept letters never move. */
export const BUSTER_WORD = {
  before: 'MASTER',
  dropped: 'MA',
  arriving: 'BU',
  kept: 'STER',
} as const;
