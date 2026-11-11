// KING counter (Pete, 2026-11-10): how many MASTER'S REMATCH wins the player has.
// Starts at 0 for everyone and goes up by 1 per rematch WIN. A rematch win still
// adds no crown, no Polybook mastery and no bookLog "mastered" entry.
//
// Recorded at the same moment a normal Boss mastery is: when the last hidden
// card is judged (useGameStore resolveMystery). Progress is written at once but
// the active Hunt snapshot is debounced, so an app kill in between can restore
// the Hunt from before the verdict and let the same win be judged again. The
// win id below (run seed + round + word) is saved in the same progress write as
// the count, so a replay of the same win adds nothing.
import type { PlayerProgress } from './types';

export function sanitizeKingWins(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

export function sanitizeKingWinId(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function kingWinId(runSeed: number, stepIndex: number, word: string): string {
  return `${runSeed}:${stepIndex}:${word.trim().toUpperCase()}`;
}

export type KingWinEvent = {
  isMasteryRematch: boolean;
  won: boolean;
  winId: string;
};

/** Returns the same object when nothing changes. */
export function applyKingWin(progress: PlayerProgress, event: KingWinEvent): PlayerProgress {
  if (!event.isMasteryRematch || !event.won) return progress;
  if (progress.lastKingWinId === event.winId) return progress;
  return {
    ...progress,
    kingWins: sanitizeKingWins(progress.kingWins) + 1,
    lastKingWinId: event.winId,
  };
}

/** loadProgress: older saves have neither field; bad values become 0 / absent. */
export function hydrateKingWins(progress: PlayerProgress): PlayerProgress {
  const kingWins = sanitizeKingWins(progress.kingWins);
  const lastKingWinId = sanitizeKingWinId(progress.lastKingWinId);
  if (kingWins === progress.kingWins && lastKingWinId === progress.lastKingWinId) return progress;
  const { lastKingWinId: _drop, ...rest } = progress;
  return lastKingWinId === undefined ? { ...rest, kingWins } : { ...rest, kingWins, lastKingWinId };
}
