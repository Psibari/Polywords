import type { GameState } from './polyRunEngine';

export const ONBOARDING_VERSION = 1 as const;

export const FIRST_RUN_FINE_MASK_IDS = [
  'fine_r03',
  'fine_t00',
  'fine_r04',
] as const;

export type HuntInputMode = 'locked' | 'up-only' | 'right-only' | 'both';
export type HuntSwipeCueMode = 'none' | 'up' | 'right' | 'both';
export type OnboardingMode = 'first-run' | 'replay';
export type OnboardingCorePhase =
  | 'recognition'
  | 'challenge'
  | 'guided-real'
  | 'guided-real-result'
  | 'guided-trap'
  | 'guided-trap-result'
  | 'unaided'
  | 'complete';

export type ActiveOnboardingRun = {
  runSeed: number;
  mode: OnboardingMode;
  phase: OnboardingCorePhase;
  presentationStep: number;
  unaidedAttempts: number;
  helperVisible: boolean;
  featherExplained: boolean;
};

export type FirstRunOnboardingState = {
  version: typeof ONBOARDING_VERSION;
  home: {
    completed: boolean;
    step: number;
  };
  coreCompleted: boolean;
  replayRequested: boolean;
  activeRun: ActiveOnboardingRun | null;
  trackedEvents: string[];
};

export function createDefaultOnboardingState(): FirstRunOnboardingState {
  return {
    version: ONBOARDING_VERSION,
    home: { completed: false, step: 0 },
    coreCompleted: false,
    replayRequested: false,
    activeRun: null,
    trackedEvents: [],
  };
}

export function hydrateOnboardingState(
  raw: string | null,
  legacyIntroCompleted = false,
): FirstRunOnboardingState {
  if (!raw) {
    if (!legacyIntroCompleted) return createDefaultOnboardingState();
    return {
      ...createDefaultOnboardingState(),
      home: { completed: true, step: 4 },
      coreCompleted: true,
    };
  }

  try {
    const value = JSON.parse(raw) as Partial<FirstRunOnboardingState>;
    if (value.version !== ONBOARDING_VERSION) return createDefaultOnboardingState();
    const defaults = createDefaultOnboardingState();
    const active = value.activeRun;
    return {
      version: ONBOARDING_VERSION,
      home: {
        completed: value.home?.completed === true,
        step: Number.isInteger(value.home?.step) ? Math.max(0, value.home!.step) : 0,
      },
      coreCompleted: value.coreCompleted === true,
      replayRequested: value.replayRequested === true,
      activeRun: active && Number.isFinite(active.runSeed)
        ? {
            runSeed: active.runSeed >>> 0,
            mode: active.mode === 'replay' ? 'replay' : 'first-run',
            phase: active.phase ?? 'recognition',
            presentationStep: Number.isInteger(active.presentationStep)
              ? Math.max(0, active.presentationStep)
              : 0,
            unaidedAttempts: Number.isInteger(active.unaidedAttempts)
              ? Math.max(0, active.unaidedAttempts)
              : 0,
            helperVisible: active.helperVisible !== false,
            featherExplained: active.featherExplained === true,
          }
        : null,
      trackedEvents: Array.isArray(value.trackedEvents)
        ? value.trackedEvents.filter((event): event is string => typeof event === 'string')
        : defaults.trackedEvents,
    };
  } catch {
    return createDefaultOnboardingState();
  }
}

function isCorrectDecision(game: GameState, maskId: string, direction: 'up' | 'right'): boolean {
  for (const step of game.session) {
    if (step.kind !== 'word') continue;
    const mask = step.masks.find(candidate => candidate.id === maskId);
    if (!mask) continue;
    return direction === 'up' ? mask.isReal : !mask.isReal;
  }
  return false;
}

function hasCorrectUnaidedDecision(game: GameState): boolean {
  const guided = new Set<string>(FIRST_RUN_FINE_MASK_IDS.slice(0, 2));
  return game.swipedUpIds.some(id => !guided.has(id) && isCorrectDecision(game, id, 'up')) ||
    game.swipedDownIds.some(id => !guided.has(id) && isCorrectDecision(game, id, 'right'));
}

export function reconcileOnboardingRun(
  state: FirstRunOnboardingState,
  game: GameState,
): FirstRunOnboardingState {
  const gameMode = game.onboardingMode;
  if (game.onboardingVersion !== ONBOARDING_VERSION || !gameMode) return state;

  let active = state.activeRun;
  if (!active || active.runSeed !== game.runSeed) {
    active = {
      runSeed: game.runSeed,
      mode: gameMode,
      phase: 'recognition',
      presentationStep: 0,
      unaidedAttempts: 0,
      helperVisible: true,
      featherExplained: false,
    };
  }

  const guidedRealResolved = game.swipedUpIds.includes(FIRST_RUN_FINE_MASK_IDS[0]);
  const guidedTrapResolved = game.swipedDownIds.includes(FIRST_RUN_FINE_MASK_IDS[1]);
  const unaidedCorrect = hasCorrectUnaidedDecision(game);
  let phase = active.phase;

  // The active Hunt is authoritative. These branches can move a lagging
  // presentation forward after a committed decision, or repair presentation
  // state that reached a result phase before the debounced Hunt snapshot made
  // it to disk. Once FINE has advanced, its per-word swipe arrays are cleared,
  // so stepIndex is the durable proof that the core decisions finished.
  if (game.stepIndex > 0 || unaidedCorrect) {
    phase = 'complete';
  } else if (guidedTrapResolved) {
    if (
      phase === 'recognition' ||
      phase === 'challenge' ||
      phase === 'guided-real' ||
      phase === 'guided-real-result' ||
      phase === 'guided-trap'
    ) {
      phase = 'guided-trap-result';
    } else if (phase === 'complete') {
      phase = 'unaided';
    }
  } else if (guidedRealResolved) {
    if (phase === 'recognition' || phase === 'challenge' || phase === 'guided-real') {
      phase = 'guided-real-result';
    } else if (phase !== 'guided-real-result') {
      phase = 'guided-trap';
    }
  } else if (
    phase !== 'recognition' &&
    phase !== 'challenge'
  ) {
    phase = 'guided-real';
  }

  const coreCompleted = active.mode === 'replay'
    ? state.coreCompleted || phase === 'complete'
    : phase === 'complete';
  const helperVisible = phase !== 'complete';
  if (
    phase === active.phase &&
    helperVisible === active.helperVisible &&
    coreCompleted === state.coreCompleted &&
    active === state.activeRun
  ) {
    return state;
  }
  return {
    ...state,
    coreCompleted,
    activeRun: { ...active, phase, helperVisible },
  };
}

export function resolveOnboardingInputMode(
  state: FirstRunOnboardingState,
  game: GameState,
): HuntInputMode {
  const active = state.activeRun;
  if (
    !active ||
    game.onboardingVersion !== ONBOARDING_VERSION ||
    game.onboardingMode !== active.mode ||
    game.runSeed !== active.runSeed
  ) {
    return 'both';
  }

  if (active.phase === 'guided-real') return 'up-only';
  if (active.phase === 'guided-trap') return 'right-only';
  if (active.phase === 'unaided') return 'both';
  if (active.phase === 'complete') return game.stepIndex > 0 ? 'locked' : 'both';
  return 'locked';
}

export function resolveOnboardingBoardPresentation(
  state: FirstRunOnboardingState,
  game: GameState,
): { showDecisionCard: boolean; swipeCueMode: HuntSwipeCueMode } {
  const active = state.activeRun;
  if (
    !active ||
    game.onboardingVersion !== ONBOARDING_VERSION ||
    game.onboardingMode !== active.mode ||
    game.runSeed !== active.runSeed
  ) {
    return { showDecisionCard: true, swipeCueMode: 'both' };
  }

  if (active.phase === 'recognition' || active.phase === 'challenge') {
    return { showDecisionCard: false, swipeCueMode: 'none' };
  }
  if (active.phase === 'guided-real') {
    return { showDecisionCard: true, swipeCueMode: 'up' };
  }
  if (active.phase === 'guided-trap') {
    return { showDecisionCard: true, swipeCueMode: 'right' };
  }
  if (active.phase === 'complete') {
    return game.stepIndex > 0
      ? { showDecisionCard: false, swipeCueMode: 'none' }
      : { showDecisionCard: true, swipeCueMode: 'both' };
  }
  return { showDecisionCard: true, swipeCueMode: 'none' };
}

export function dismissCompletedOnboardingHandoffOnResume(
  state: FirstRunOnboardingState,
  game: GameState,
): FirstRunOnboardingState {
  const active = state.activeRun;
  if (
    !active ||
    active.phase !== 'complete' ||
    game.stepIndex === 0 ||
    game.onboardingVersion !== ONBOARDING_VERSION ||
    game.onboardingMode !== active.mode ||
    game.runSeed !== active.runSeed
  ) {
    return state;
  }
  return { ...state, activeRun: null };
}
