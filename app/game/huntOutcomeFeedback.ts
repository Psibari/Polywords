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
  sfx: 'masteredResult' | null;
  hapticCue: 'mastery' | null;
};

export function resolveBossOutcomePlaqueFeedback(
  outcome: OutcomeReveal,
): BossOutcomePlaqueFeedback {
  if (outcome === 'mastered') {
    return { sfx: 'masteredResult', hapticCue: 'mastery' };
  }
  return { sfx: null, hapticCue: null };
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
