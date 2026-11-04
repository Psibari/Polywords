export type DailyClaimPresentation<TSession> = {
  session: TSession;
  candidate: string;
  outcome: 'correct' | 'wrong';
  roundElapsedMsAtClaim: number;
};

/**
 * How hard the castle celebrates a correct claim, from how many clues the
 * player needed (Pete, 2026-11-03).
 *
 * The three clues are a deliberate hint ladder — the workbook labels them
 * "Clue 1 (Hardest)" through "Clue 3 (Easiest)" — so claiming on one clue
 * means the player cracked the hardest reading, and claiming on three means
 * they took the giveaway. Until now every correct claim looked identical, so
 * the one moment of real nerve in the mode was celebrated like a lookup.
 *
 * 'solved' is today's presentation unchanged: waiting is part of the game and
 * must never feel punished. 'sharp' and 'cold' add on top of it.
 */
export type DailyCelebrationGrade = 'solved' | 'sharp' | 'cold';

export function resolveDailyCelebrationGrade(
  revealedClueCount: number,
): DailyCelebrationGrade {
  if (revealedClueCount <= 1) return 'cold';
  if (revealedClueCount === 2) return 'sharp';
  return 'solved';
}

/**
 * The claim's haptic, by grade. Named cues only — the screen fires them, this
 * stays RN-free. 'solved' keeps the cue the Daily already used.
 */
export function dailyCelebrationHaptic(
  grade: DailyCelebrationGrade,
): 'standardCorrect' | 'claimMedium' | 'heightenedCorrect' {
  if (grade === 'cold') return 'heightenedCorrect';
  if (grade === 'sharp') return 'claimMedium';
  return 'standardCorrect';
}

export type DailyClaimPresentationPhase =
  | 'idle'
  | 'settling'
  | 'landed'
  | 'inking'
  | 'covering'
  | 'reward'
  | 'revealing';

export function isDailyClaimInputLocked(
  phase: DailyClaimPresentationPhase,
): boolean {
  return phase !== 'idle';
}

export function canBeginDailyClaim(
  roundCompleted: boolean,
  inputLocked: boolean,
): boolean {
  return !roundCompleted && !inputLocked;
}

/**
 * Whether a round's blocks may take input. Not before audio is ready, not once
 * the round is solved, and not while the blocks are still punching out of the
 * wall (ui/dailyPlaqueEntrance.ts).
 */
export function canUnlockDailyRound(state: {
  audioReady: boolean;
  roundActive: boolean;
  roundCompleted: boolean;
  plaquesPresenting: boolean;
}): boolean {
  return state.audioReady &&
    state.roundActive &&
    !state.roundCompleted &&
    !state.plaquesPresenting;
}

function usesOutgoingDailySnapshot(
  phase: DailyClaimPresentationPhase,
): boolean {
  return phase === 'settling' || phase === 'landed' || phase === 'inking' || phase === 'covering';
}

export function createDailyClaimPresentation<TSession>(
  session: TSession,
  candidate: string,
  outcome: DailyClaimPresentation<TSession>['outcome'],
  roundElapsedMsAtClaim: number,
): DailyClaimPresentation<TSession> {
  return { session, candidate, outcome, roundElapsedMsAtClaim };
}

export function beginDailyCommittedPresentation<TSession>(
  session: TSession,
  candidate: string,
  outcome: DailyClaimPresentation<TSession>['outcome'],
  roundElapsedMsAtClaim: number,
  publishPresentation: (
    presentation: DailyClaimPresentation<TSession>,
  ) => void,
  commitClaim: (candidate: string) => void,
): DailyClaimPresentation<TSession> {
  const presentation = createDailyClaimPresentation(
    session,
    candidate,
    outcome,
    roundElapsedMsAtClaim,
  );
  publishPresentation(presentation);
  commitClaim(candidate);
  return presentation;
}

export function selectDailyDisplaySession<TSession>(
  committedSession: TSession | null,
  presentation: DailyClaimPresentation<TSession> | null,
  phase: DailyClaimPresentationPhase = presentation ? 'settling' : 'idle',
): TSession | null {
  return presentation && usesOutgoingDailySnapshot(phase)
    ? presentation.session
    : committedSession;
}

export function shouldShowDailyResult(
  committedComplete: boolean,
  presentation: DailyClaimPresentation<unknown> | null,
  phase: DailyClaimPresentationPhase = presentation ? 'settling' : 'idle',
): boolean {
  return committedComplete && presentation === null && phase === 'idle';
}

export function shouldHideCompletedDailyClue(
  committedComplete: boolean,
  phase: DailyClaimPresentationPhase,
): boolean {
  return committedComplete && isDailyClaimInputLocked(phase);
}

export function resolveDailyActiveElapsedMs({
  presentationActive,
  paused = false,
  committedRoundElapsedMs,
  presentationRoundElapsedMs,
  roundStartedAtMs,
  nowMs,
}: {
  presentationActive: boolean;
  /** The pause card is open: the clock is frozen at its saved value, like a presentation. */
  paused?: boolean;
  committedRoundElapsedMs: number;
  presentationRoundElapsedMs: number;
  roundStartedAtMs: number;
  nowMs: number;
}): number {
  if (presentationActive || paused) {
    return Math.max(0, committedRoundElapsedMs, presentationRoundElapsedMs);
  }
  return Math.max(0, committedRoundElapsedMs, nowMs - roundStartedAtMs);
}
