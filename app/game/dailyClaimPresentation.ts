export type DailyClaimPresentation<TSession> = {
  session: TSession;
  candidate: string;
  outcome: 'correct' | 'wrong';
  roundElapsedMsAtClaim: number;
};

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
): TSession | null {
  return presentation?.session ?? committedSession;
}

export function shouldShowDailyResult(
  committedComplete: boolean,
  presentation: DailyClaimPresentation<unknown> | null,
): boolean {
  return committedComplete && presentation === null;
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
