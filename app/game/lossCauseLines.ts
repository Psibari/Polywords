import { LossCause } from './polyRunEngine';

// Results screen verdictSub copy for a lost run. Natural case — the
// verdictSub Text element applies textTransform 'uppercase' at render time.
export const LOSS_CAUSE_LINES = {
  // 2+ ghosts active outranks every individual cause below.
  haunts: 'The haunts are starting to stack.',
  trap: 'You let a bird beat you',
  rejectedReal: 'You know what that word means, and you still got it wrong.',
  wrongCall: "Almost doesn't count",
  neutral: ['Go again. Focus this time.', 'Out of feathers.'] as const,
} as const;

// Pure: haunts condition first, then lossCause, then neutral. No
// Math.random — the roll is an input, same purity rule pollyMemory.ts
// follows, so ResultsScreen draws it once in a useState initialiser.
export function pickLossVerdictLine(
  ghostCount: number,
  lossCause: LossCause,
  roll: number,
): string {
  if (ghostCount >= 2) return LOSS_CAUSE_LINES.haunts;
  if (lossCause === 'trap') return LOSS_CAUSE_LINES.trap;
  if (lossCause === 'rejectedReal') return LOSS_CAUSE_LINES.rejectedReal;
  if (lossCause === 'wrongCall') return LOSS_CAUSE_LINES.wrongCall;
  const pool = LOSS_CAUSE_LINES.neutral;
  const index = Math.min(pool.length - 1, Math.floor(roll * pool.length));
  return pool[index];
}
