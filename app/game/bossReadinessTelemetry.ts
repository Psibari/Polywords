export type BossReadinessState = {
  stepIndex: number | null;
  enteredAt: number | null;
  playableRecorded: boolean;
};

export function createBossReadinessState(): BossReadinessState {
  return { stepIndex: null, enteredAt: null, playableRecorded: false };
}

export function markBossEntered(
  state: BossReadinessState,
  stepIndex: number,
  at: number,
): { state: BossReadinessState; shouldRecord: boolean } {
  if (state.stepIndex === stepIndex) return { state, shouldRecord: false };
  return {
    state: { stepIndex, enteredAt: at, playableRecorded: false },
    shouldRecord: true,
  };
}

export function markBossPlayable(
  state: BossReadinessState,
  stepIndex: number,
  at: number,
): { state: BossReadinessState; transitionMs: number | null } {
  if (
    state.stepIndex !== stepIndex ||
    state.enteredAt === null ||
    state.playableRecorded
  ) {
    return { state, transitionMs: null };
  }
  return {
    state: { ...state, playableRecorded: true },
    transitionMs: Math.max(0, at - state.enteredAt),
  };
}
