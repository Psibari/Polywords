export type DailyClaimPresentation<TSession> = {
  session: TSession;
  candidate: string;
  outcome: 'correct' | 'wrong';
  roundElapsedMsAtClaim: number;
};

export type DailyClaimPresentationPhase =
  | 'idle'
  | 'settling'
  | 'landed'
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

function usesOutgoingDailySnapshot(
  phase: DailyClaimPresentationPhase,
): boolean {
  return phase === 'settling' || phase === 'landed' || phase === 'covering';
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
  committedRoundElapsedMs,
  presentationRoundElapsedMs,
  roundStartedAtMs,
  nowMs,
}: {
  presentationActive: boolean;
  committedRoundElapsedMs: number;
  presentationRoundElapsedMs: number;
  roundStartedAtMs: number;
  nowMs: number;
}): number {
  if (presentationActive) {
    return Math.max(0, committedRoundElapsedMs, presentationRoundElapsedMs);
  }
  return Math.max(0, committedRoundElapsedMs, nowMs - roundStartedAtMs);
}
