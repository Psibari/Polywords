import type { GhostMeaning } from './types';
import type { HauntOutcome } from './polyRunEngine';

export type ReturningHauntResolution = {
  ghosts: GhostMeaning[];
  changed: boolean;
  priorMisses: number;
};

// A Returning Haunt verdict is a run-scoped event. The marker makes a failed
// Haunt safe to reconcile after a crash without incrementing runsMissed twice.
export function applyReturningHauntResolution(
  ghosts: GhostMeaning[],
  word: string,
  outcome: Exclude<HauntOutcome, 'pending'>,
  resolutionId: string,
): ReturningHauntResolution {
  const wordId = word.trim().toUpperCase();
  const existing = ghosts.find(ghost => ghost.wordId === wordId);
  const priorMisses = existing?.runsMissed ?? 0;

  if (outcome === 'banished') {
    if (!existing) return { ghosts, changed: false, priorMisses };
    return {
      ghosts: ghosts.filter(ghost => ghost.wordId !== wordId),
      changed: true,
      priorMisses,
    };
  }

  if (!existing || existing.lastHauntResolutionId === resolutionId) {
    return { ghosts, changed: false, priorMisses };
  }

  const failedAgain: GhostMeaning = {
    ...existing,
    runsMissed: existing.runsMissed + 1,
    lastHauntResolutionId: resolutionId,
  };
  return {
    // Preserve the existing rotation behavior: a failed returning ghost moves
    // to the back of the queue so another ghost can surface next Hunt.
    ghosts: [
      ...ghosts.filter(ghost => ghost.wordId !== wordId),
      failedAgain,
    ],
    changed: true,
    priorMisses,
  };
}
