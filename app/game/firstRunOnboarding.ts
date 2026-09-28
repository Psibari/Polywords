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
  // The runSeed whose hand-off already closed. The Hunt keeps onboardingMode
  // for its whole life, so without this reconcile would rebuild that run on
  // the next game update and replay the feather banner and hand-off.
  finishedRunSeed: number | null;
  trackedEvents: string[];
};

export function createDefaultOnboardingState(): FirstRunOnboardingState {
  return {
    version: ONBOARDING_VERSION,
    home: { completed: false, step: 0 },
    coreCompleted: false,
    replayRequested: false,
    activeRun: null,
    finishedRunSeed: null,
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
      finishedRunSeed: Number.isFinite(value.finishedRunSeed)
        ? value.finishedRunSeed! >>> 0
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
  if (state.finishedRunSeed === game.runSeed) return state;

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
  // The verdict label names the card just judged, so the next card waits
  // off the board until the result beat is over.
  if (active.phase === 'guided-real-result' || active.phase === 'guided-trap-result') {
    return { showDecisionCard: false, swipeCueMode: 'none' };
  }
  if (active.phase === 'complete') {
    return game.stepIndex > 0
      ? { showDecisionCard: false, swipeCueMode: 'none' }
      : { showDecisionCard: true, swipeCueMode: 'both' };
  }
  return { showDecisionCard: true, swipeCueMode: 'none' };
}

export type OnboardingCaption = {
  kind: 'question' | 'helper' | 'feather';
  text: string;
  accessibilityLabel: string;
};

const FEATHER_CAPTION: OnboardingCaption = {
  kind: 'feather',
  text: 'WRONG CALLS COST A FEATHER.\nRUN OUT, AND POLLY WINS THE HUNT.',
  accessibilityLabel: 'Wrong calls cost a feather. Run out, and Polly wins the Hunt.',
};

// The feather rule is due once the core is complete, or after a wrong call in
// the unaided beat, until Polly has explained it. The overlay fires the beat
// from this rule, and GameScreen derives the board caption from it.
export function isOnboardingFeatherDue(
  state: FirstRunOnboardingState,
  game: GameState,
): boolean {
  const active = state.activeRun;
  return active !== null &&
    game.runSeed === active.runSeed &&
    game.onboardingMode === active.mode &&
    !active.featherExplained &&
    (active.phase === 'complete' || (active.phase === 'unaided' && game.mistakesOnWord > 0));
}

// Whether the board shows the feather caption. Derived in GameScreen's own
// render rather than waiting for the overlay to report its state up through an
// effect: the swipe that makes the rule due can also bring the swipe cues
// back, and the caption has to hide them in that same render. Like the
// overlay, it holds back while another onboarding visit is still under way;
// once the overlay's own feather beat is showing, that visit is its own.
export function resolveFeatherCaptionVisible(
  state: FirstRunOnboardingState,
  game: GameState,
  overlayFeatherShowing: boolean,
  onboardingVisitActive: boolean,
): boolean {
  return isOnboardingFeatherDue(state, game) &&
    (overlayFeatherShowing || !onboardingVisitActive);
}

// Instruction text that sits above a live card, laid out by the board in the
// band between the plate and the swipe-up cue. The feather rule wins when it
// overlaps the unaided helper: it is the beat Polly is speaking to.
export function resolveOnboardingCaption(
  state: FirstRunOnboardingState,
  game: GameState,
  featherVisible: boolean,
): OnboardingCaption | null {
  const active = state.activeRun;
  if (
    !active ||
    game.onboardingVersion !== ONBOARDING_VERSION ||
    game.onboardingMode !== active.mode ||
    game.runSeed !== active.runSeed
  ) {
    return null;
  }

  if (featherVisible) return FEATHER_CAPTION;
  if (active.phase === 'guided-real') {
    return { kind: 'question', text: 'BELONGS TO FINE?', accessibilityLabel: 'BELONGS TO FINE?' };
  }
  if (active.phase === 'guided-trap') {
    return { kind: 'question', text: 'DOESN’T BELONG?', accessibilityLabel: 'DOESN’T BELONG?' };
  }
  if (active.phase === 'unaided' && active.helperVisible) {
    return {
      kind: 'helper',
      text: '↑ CLAIM A MEANING     → REJECT A TRAP',
      accessibilityLabel: '↑ CLAIM A MEANING     → REJECT A TRAP',
    };
  }
  return null;
}

// FINE stands alone on the board for a beat before the first premise line,
// so the player can think of their own meaning first. Only the very start of
// a recognition phase holds; a resume at a later step shows its line at once.
// Nothing about the hold is saved.
export function recognitionOpensWithHold(
  state: FirstRunOnboardingState,
  game: GameState,
): boolean {
  const active = state.activeRun;
  return active !== null &&
    game.onboardingVersion === ONBOARDING_VERSION &&
    game.onboardingMode === active.mode &&
    game.runSeed === active.runSeed &&
    active.phase === 'recognition' &&
    active.presentationStep === 0;
}

// Room reserved above the deck on the FINE tutorial word so the caption band
// holds a line on a 375 x 667 phone without pushing the swipe-right cue into
// the pause button (36 did). It depends only on the Hunt, never on the phase,
// so the deck does not move while a caption comes and goes.
export const ONBOARDING_CAPTION_RESERVE = 20;

export function resolveOnboardingCaptionReserve(game: GameState): number {
  return game.onboardingVersion === ONBOARDING_VERSION &&
    Boolean(game.onboardingMode) &&
    game.stepIndex === 0
    ? ONBOARDING_CAPTION_RESERVE
    : 0;
}

// A hidden decision card still lets a judged card finish leaving: the stack
// keeps rendering while the top card is mid-exit and drops the moment that
// exit completes, so the next card is never on the board underneath it.
export function shouldRenderDecisionStack(
  showDecisionCard: boolean,
  topCard: { judged: boolean; exitFinished: boolean } | null,
): boolean {
  if (showDecisionCard) return true;
  return topCard !== null && topCard.judged && !topCard.exitFinished;
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
  return finishOnboardingHandoff(state);
}

export function finishOnboardingHandoff(
  state: FirstRunOnboardingState,
): FirstRunOnboardingState {
  if (!state.activeRun) return state;
  return { ...state, activeRun: null, finishedRunSeed: state.activeRun.runSeed };
}
