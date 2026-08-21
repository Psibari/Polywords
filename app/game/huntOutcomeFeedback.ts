export type OutcomeReveal = 'mastered' | 'haunted';
export type OutcomeRevealSfx = OutcomeReveal;

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
