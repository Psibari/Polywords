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


export type PollyRelationshipBeat =
  | 'returningAfterAbsence'
  | 'comeback'
  | 'veteranSlump'
  | 'hauntRematch';

export type PollyRelationshipBeatDecision = {
  beat: PollyRelationshipBeat;
  /** Facts only. Presentation decides whether Polly speaks, moves, or stays
   * silent. Keeping copy out of this layer prevents the brain from becoming
   * an untestable dialogue tree. */
  wordRivalry: PollyWordRivalry | null;
} | null;

const DAY_MS = 24 * 60 * 60 * 1000;
const RETURN_AFTER_MS = 3 * DAY_MS;
const ESTABLISHED_RUNS = 8;
const ESTABLISHED_WINS = 2;
const SLUMP_LENGTH = 3;

/**
 * Priority policy for the first observable relationship beats.
 *
 * Specific shared history beats generic form. Results-specific reversals beat
 * Home return recognition. Ordinary wins/losses deliberately produce no beat:
 * scarcity is part of Polly's character and prevents "memory" from turning
 * into constant commentary.
 */
export function resolvePollyRelationshipBeat(input: {
  context: PollyRelationshipContext;
  surface: 'home' | 'results' | 'wordEntry';
  currentOutcome?: 'pollyWon' | 'playerCompleted' | 'playerBeatPolly';
}): PollyRelationshipBeatDecision {
  const { context, surface, currentOutcome } = input;

  if (
    surface === 'wordEntry' &&
    context.relevantWordRivalry !== null &&
    !context.relevantWordRivalry.banished
  ) {
    return { beat: 'hauntRematch', wordRivalry: context.relevantWordRivalry };
  }

  if (surface === 'results') {
    const prior = context.recent.slice(1);
    const priorStruggles = prior.slice(0, SLUMP_LENGTH).filter(x => x === 'struggle').length;
    if (currentOutcome === 'playerBeatPolly' && priorStruggles >= 2) {
      return { beat: 'comeback', wordRivalry: null };
    }

    const established =
      context.runsCompleted >= ESTABLISHED_RUNS ||
      context.masteredCount >= 2 ||
      context.playerHuntsWon >= ESTABLISHED_WINS;
    const currentStruggles = context.recent.slice(0, SLUMP_LENGTH)
      .filter(x => x === 'struggle').length;
    if (established && currentStruggles >= SLUMP_LENGTH) {
      return { beat: 'veteranSlump', wordRivalry: null };
    }
  }

  if (
    surface === 'home' &&
    context.runsCompleted > 0 &&
    context.awayMs !== null &&
    context.awayMs >= RETURN_AFTER_MS
  ) {
    return { beat: 'returningAfterAbsence', wordRivalry: null };
  }

  return null;
}
