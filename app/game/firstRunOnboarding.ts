import type { GameState } from './polyRunEngine';

// Bumping this resets every saved onboarding state (see hydrateOnboardingState),
// so new fields are added with hydrate-time defaults instead.
export const ONBOARDING_VERSION = 1 as const;

export const FIRST_RUN_FINE_MASK_IDS = [
  'fine_r03',
  'fine_t00',
  'fine_r04',
] as const;

export const FINE_RECOGNITION_EXAMPLES = [
  "I'M FINE.",
  'PAY A FINE.',
  'FINE DINING.',
  'READ THE FINE PRINT.',
] as const;

const FINE_RECOGNITION_REVEAL_MS = 1250;
const FINE_RECOGNITION_STACK_HOLD_MS = 1800;

export function resolveFineRecognitionExamples(presentationStep: number): readonly string[] {
  if (presentationStep < 0 || presentationStep >= FINE_RECOGNITION_EXAMPLES.length) return [];
  return FINE_RECOGNITION_EXAMPLES.slice(0, presentationStep + 1);
}

export function fineRecognitionStepDurationMs(presentationStep: number): number {
  if (presentationStep < FINE_RECOGNITION_EXAMPLES.length - 1) {
    return FINE_RECOGNITION_REVEAL_MS;
  }
  if (presentationStep === FINE_RECOGNITION_EXAMPLES.length - 1) {
    return FINE_RECOGNITION_STACK_HOLD_MS;
  }
  return presentationStep === 5 || presentationStep === 7 ? 2200 : 1650;
}

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
  // Retired: the automatic end-of-FINE feather beat is gone and nothing gates
  // on this any more. Still read and written so older saves round-trip as-is.
  featherExplained: boolean;
};

// HUD lessons are taught when the player first lives through each mechanic.
// They are global and monotonic: a lesson flag only ever goes false → true,
// and it lives outside activeRun because activeRun is cleared at the FINE
// hand-off while later lessons can land on any later ordinary word.
export type HudLessonId = 'feather' | 'multiplier' | 'streakBreak' | 'progress';

export type HudLessonState = {
  feather: boolean;
  multiplier: boolean;
  streakBreak: boolean;
  progress: boolean;
  // Feather and streak-break are events, not durable Hunt state, so the store
  // captures them when the wrong call lands. Keyed by the Hunt's runSeed so a
  // pending lesson never leaks into a different Hunt.
  featherPendingRunSeed: number | null;
  streakBreakPendingRunSeed: number | null;
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
  // the next game update and replay the hand-off.
  finishedRunSeed: number | null;
  hudLessons: HudLessonState;
  trackedEvents: string[];
};

function createHudLessonState(completed: boolean): HudLessonState {
  return {
    feather: completed,
    multiplier: completed,
    streakBreak: completed,
    progress: completed,
    featherPendingRunSeed: null,
    streakBreakPendingRunSeed: null,
  };
}

export function createDefaultOnboardingState(): FirstRunOnboardingState {
  return {
    version: ONBOARDING_VERSION,
    home: { completed: false, step: 0 },
    coreCompleted: false,
    replayRequested: false,
    activeRun: null,
    finishedRunSeed: null,
    hudLessons: createHudLessonState(false),
    trackedEvents: [],
  };
}

function hydratePendingSeed(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value >>> 0 : null;
}

// Saves written before HUD lessons existed carry no hudLessons. A player who
// already finished core onboarding is treated as having learned the HUD, so
// nobody is suddenly tutorialized; a player still in their first run gets them.
function hydrateHudLessons(value: unknown, coreCompleted: boolean): HudLessonState {
  if (!value || typeof value !== 'object') return createHudLessonState(coreCompleted);
  const saved = value as Partial<HudLessonState>;
  return {
    feather: saved.feather === true,
    multiplier: saved.multiplier === true,
    streakBreak: saved.streakBreak === true,
    progress: saved.progress === true,
    featherPendingRunSeed: hydratePendingSeed(saved.featherPendingRunSeed),
    streakBreakPendingRunSeed: hydratePendingSeed(saved.streakBreakPendingRunSeed),
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
      hudLessons: createHudLessonState(true),
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
      hudLessons: hydrateHudLessons(value.hudLessons, value.coreCompleted === true),
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
  // A due HUD lesson holds the next decision from the render it becomes due,
  // through its explanation and Polly's reply, including after the hand-off.
  if (resolveHudLesson(state, game) !== null) return 'locked';
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

// ─── HUD lessons ────────────────────────────────────────────

// Boss and Returning Haunt words own locked choreography; no lesson lands on them.
function isOrdinaryWordStep(game: GameState): boolean {
  const step = game.session[game.stepIndex];
  return step?.kind === 'word' &&
    step.eventType !== 'bossWord' &&
    step.isHauntReturn !== true;
}

// The FINE hand-off window: the opening word is done, the next word is on the
// board with its card hidden and locked, and the run has not been closed yet.
export function isOnboardingHandoffOpen(
  state: FirstRunOnboardingState,
  game: GameState,
): boolean {
  const active = state.activeRun;
  return active !== null &&
    active.phase === 'complete' &&
    game.stepIndex > 0 &&
    game.onboardingVersion === ONBOARDING_VERSION &&
    game.onboardingMode === active.mode &&
    game.runSeed === active.runSeed;
}

// The one HUD lesson that owns the screen right now, or null. Pure and derived
// from saved state, so it can lock input in the same render as the swipe that
// made it due, and a resumed Hunt shows an unfinished lesson again without
// replaying the decision that earned it. Flags are only set once a lesson has
// fully finished, so the answer never flips to a different lesson mid-show:
// input is locked while any lesson is due, and the only Hunt change that can
// still happen (the judged word completing) makes nothing higher-priority due.
//
// Order: a multiplier just earned, then a real feather loss, then the short
// streak-break reinforcement, then the round-progress lesson in the hand-off.
export function resolveHudLesson(
  state: FirstRunOnboardingState,
  game: GameState,
): HudLessonId | null {
  if (game.status !== 'playing') return null;
  const lessons = state.hudLessons;
  if (isOrdinaryWordStep(game)) {
    if (!lessons.multiplier && game.chainMultiplier >= 1.5) return 'multiplier';
    if (!lessons.feather && lessons.featherPendingRunSeed === game.runSeed) return 'feather';
    if (
      !lessons.streakBreak &&
      lessons.multiplier &&
      lessons.streakBreakPendingRunSeed === game.runSeed
    ) {
      return 'streakBreak';
    }
  }
  if (!lessons.progress && isOnboardingHandoffOpen(state, game)) return 'progress';
  return null;
}

// Called by the store where a decision commits, with the Hunt before and after.
// A life loss is a new mistake on the same word; that counts Mercy revives too,
// where lives jump back up in the same update. A fatal loss is never captured:
// the death hold and Results own that moment.
export function captureHudLessonEvents(
  state: FirstRunOnboardingState,
  prev: GameState,
  next: GameState,
): FirstRunOnboardingState {
  if (next === prev) return state;
  const lostLife = next.mistakesOnWord > prev.mistakesOnWord &&
    next.stepIndex === prev.stepIndex;
  if (!lostLife || next.status !== 'playing' || !isOrdinaryWordStep(prev)) return state;

  const lessons = state.hudLessons;
  let hudLessons = lessons;
  if (!lessons.feather && lessons.featherPendingRunSeed !== next.runSeed) {
    hudLessons = { ...hudLessons, featherPendingRunSeed: next.runSeed };
  }
  if (
    lessons.multiplier &&
    !lessons.streakBreak &&
    prev.chainMultiplier >= 1.5 &&
    next.fellOffSeverity !== null &&
    lessons.streakBreakPendingRunSeed !== next.runSeed
  ) {
    hudLessons = { ...hudLessons, streakBreakPendingRunSeed: next.runSeed };
  }
  return hudLessons === lessons ? state : { ...state, hudLessons };
}

// Marks a lesson finished once its explanation and Polly's reply are done.
// The progress lesson is the FINE hand-off, so it closes the run in the same
// update; the board unlocks exactly when the hand-off is recorded.
export function completeHudLesson(
  state: FirstRunOnboardingState,
  lesson: HudLessonId,
): FirstRunOnboardingState {
  const lessons = state.hudLessons;
  if (lessons[lesson]) return state;
  const hudLessons: HudLessonState = {
    ...lessons,
    [lesson]: true,
    ...(lesson === 'feather' ? { featherPendingRunSeed: null } : {}),
    ...(lesson === 'streakBreak' ? { streakBreakPendingRunSeed: null } : {}),
  };
  const next = { ...state, hudLessons };
  return lesson === 'progress' ? finishOnboardingHandoff(next) : next;
}

export type OnboardingCaption = {
  kind: 'question' | 'helper';
  text: string;
  accessibilityLabel: string;
};

// Instruction text that sits above a live card, laid out by the board in the
// band between the plate and the swipe-up cue.
export function resolveOnboardingCaption(
  state: FirstRunOnboardingState,
  game: GameState,
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

// A Hunt resumed inside the hand-off closes it, unless the round-progress
// lesson has not been taught yet: then the hand-off stays open and the lesson
// owns it, with the next card still hidden and locked. That only moves
// forward: the lesson has no decision to replay.
export function dismissCompletedOnboardingHandoffOnResume(
  state: FirstRunOnboardingState,
  game: GameState,
): FirstRunOnboardingState {
  if (!isOnboardingHandoffOpen(state, game)) return state;
  if (!state.hudLessons.progress && game.stepIndex === 1 && game.status === 'playing') {
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
