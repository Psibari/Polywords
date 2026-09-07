// Polly's mood — the Polybook's "today" entry (right page). Two layers:
// the per-run stamp, and the read of her current mood off the rolling window
// of recent stamps. Neither stores anything; both are computed fresh from
// whatever the caller already has.
//
// Pure by contract, same as bookLog.ts: no React, no AsyncStorage, no Date,
// no Math.random.

import { GameState } from './polyRunEngine';
import { HuntPerformance } from './types';
import { BookRivalryState } from './pollyBookLines';

/**
 * Stamp one finished run as struggle, steady, or clean.
 *
 * Moved out of useGameStore.ts so it can be tested without constructing an
 * engine state — this takes only the four fields it actually reads.
 *
 * struggle: the run ended in gameOver at or before the halfway mark.
 * clean: the run reached complete with the boss word mastered. Mastering the
 *   boss word is what beating her means (docs/POLYBOOK.md, "What counts as
 *   beating her") — this does NOT also require a flawless boss (no visible
 *   tile missed). A run that mastered the boss but slipped once on a visible
 *   tile still beat her, and now stamps the same as one that didn't slip.
 * steady: everything else, including a gameOver past the halfway mark and a
 *   complete run that didn't master the boss.
 */
export function resolveHuntPerformance(input: {
  status: GameState['status'];
  stepIndex: number;
  sessionLength: number;
  bossOutcome: GameState['bossOutcome'];
}): HuntPerformance {
  const { status, stepIndex, sessionLength, bossOutcome } = input;

  // Same value as the store's old `session.filter((_, i) => i <= stepIndex).length`
  // — that filter only ever looked at indices, never the array's contents.
  const roundsReached = Math.max(0, Math.min(stepIndex + 1, sessionLength));

  if (status === 'gameOver' && roundsReached <= Math.ceil(sessionLength / 2)) {
    return 'struggle';
  }
  if (status === 'complete' && bossOutcome === 'mastered') {
    return 'clean';
  }
  return 'steady';
}

/** The length of the window `resolveRivalryState` reads — she notices a
 *  player once she's seen a full window of them, even without a mastery. */
const NOTICED_AFTER_RUNS = 5;

/**
 * Read Polly's current mood off the rolling window of recent stamps. Nothing
 * is stored, nothing accumulates, and there is no threshold to climb — this
 * re-derives the mood from `recent` every time it's called, so the mood
 * reverses on its own as the window rolls forward.
 *
 * DISMISSIVE — she hasn't noticed this player yet. The one state that is
 *   deliberately one-way: she notices the moment they master a word, or once
 *   they've simply kept coming back for a full window of runs. Both inputs
 *   (masteredCount, runsCompleted) only ever grow, so once either door has
 *   opened it cannot close again. She can be rattled again later; she
 *   cannot un-meet someone.
 *
 *   Migration note: a legacy save can have a full runsCompleted (the counter
 *   predates this feature) but an empty or short recent window (the window
 *   is new, or was never populated before). That reads as WATCHFUL — noticed,
 *   but with nothing in the window yet to look rattled or amused about —
 *   until five more runs land and the window fills. That's a one-time
 *   migration artifact, not a bug, and it self-corrects.
 *
 * CONCEDING — two or more clean runs in the window. She's losing regularly.
 * RATTLED — exactly one clean run in the window. A single loss she can't yet
 *   wave off as a fluke, but not yet a pattern.
 * AMUSED — three or more struggle runs in the window (and fewer than two
 *   clean, checked first). She's winning comfortably and it shows.
 * WATCHFUL — the default once noticed: nothing in the window rises to
 *   CONCEDING, RATTLED, or AMUSED. Neither confident nor rattled.
 */
export function resolveRivalryState(input: {
  recent: HuntPerformance[];
  masteredCount: number;
  runsCompleted: number;
}): BookRivalryState {
  const { recent, masteredCount, runsCompleted } = input;

  const hasNoticed = masteredCount >= 1 || runsCompleted >= NOTICED_AFTER_RUNS;
  if (!hasNoticed) {
    return 'DISMISSIVE';
  }

  const cleanCount = recent.filter(result => result === 'clean').length;
  const struggleCount = recent.filter(result => result === 'struggle').length;

  if (cleanCount >= 2) return 'CONCEDING';
  if (cleanCount === 1) return 'RATTLED';
  if (struggleCount >= 3) return 'AMUSED';
  return 'WATCHFUL';
}
