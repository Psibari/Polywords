import { PollyMemory, PollyWordRivalry } from './pollyMemory';
import { HuntPerformance } from './types';
import { resolveRivalryState } from './pollyMood';
import { BookRivalryState } from './pollyBookLines';

export type PollyRelationshipContext = {
  todayMood: BookRivalryState;
  runsCompleted: number;
  masteredCount: number;
  playerHuntsWon: number;
  pollyHuntsWon: number;
  playerWinStreak: number;
  pollyWinStreak: number;
  longestPlayerWinStreak: number;
  longestPollyWinStreak: number;
  recent: HuntPerformance[];
  /** Milliseconds since the last recorded meaningful visit. Null means the
   *  relationship brain has no trustworthy prior-visit timestamp yet. */
  awayMs: number | null;
  relevantWordRivalry: PollyWordRivalry | null;
};

/**
 * Pure relationship read. It stores no labels such as "veteran" or
 * "comeback": those are authored-behavior policy decisions and can evolve
 * without migrating save data. This object exposes the proven facts needed to
 * distinguish a new player from an established rival, a current slump from a
 * historically strong player, and a word with shared history from a fresh one.
 */
export function derivePollyRelationshipContext(input: {
  memory: PollyMemory;
  recent: HuntPerformance[];
  runsCompleted: number;
  masteredCount: number;
  now: number;
  word?: string | null;
}): PollyRelationshipContext {
  const { memory, recent, runsCompleted, masteredCount, now } = input;
  const word = typeof input.word === 'string' ? input.word.trim().toUpperCase() : '';
  const awayMs = memory.lastVisitAt !== null && Number.isFinite(now)
    ? Math.max(0, Math.floor(now - memory.lastVisitAt))
    : null;

  return {
    todayMood: resolveRivalryState({ recent, masteredCount, runsCompleted }),
    runsCompleted: Math.max(0, Math.floor(runsCompleted)),
    masteredCount: Math.max(0, Math.floor(masteredCount)),
    playerHuntsWon: memory.playerHuntsWon,
    pollyHuntsWon: memory.pollyHuntsWon,
    playerWinStreak: memory.playerWinStreak,
    pollyWinStreak: memory.pollyWinStreak,
    longestPlayerWinStreak: memory.longestPlayerWinStreak,
    longestPollyWinStreak: memory.longestPollyWinStreak,
    recent: [...recent],
    awayMs,
    relevantWordRivalry: word ? memory.wordRivalries[word] ?? null : null,
  };
}
