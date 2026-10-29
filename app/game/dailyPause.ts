import type { DailyClaimPresentationPhase } from './dailyClaimPresentation';

/**
 * Whether the Daily's pause card may open now (Pete, 2026-10-29). Only while
 * the Daily is being played with nothing in flight: an active session, input
 * free, no claim phase or claim presentation running, Polly neither reacting
 * nor flying out, and the card not already open. A tap that fails this is
 * ignored, never queued.
 */
export function canOpenDailyPause(state: {
  sessionActive: boolean;
  inputLocked: boolean;
  claimPhase: DailyClaimPresentationPhase;
  presentationActive: boolean;
  pollyReacting: boolean;
  pollyExitPending: boolean;
  paused: boolean;
}): boolean {
  return state.sessionActive &&
    !state.inputLocked &&
    state.claimPhase === 'idle' &&
    !state.presentationActive &&
    !state.pollyReacting &&
    !state.pollyExitPending &&
    !state.paused;
}
