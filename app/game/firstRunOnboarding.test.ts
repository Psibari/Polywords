import {
  FINE_RECOGNITION_EXAMPLES,
  FIRST_RUN_FINE_MASK_IDS,
  ONBOARDING_CAPTION_RESERVE,
  createDefaultOnboardingState,
  dismissCompletedOnboardingHandoffOnResume,
  finishOnboardingHandoff,
  fineRecognitionStepDurationMs,
  hydrateOnboardingState,
  recognitionOpensWithHold,
  reconcileOnboardingRun,
  resolveHudLesson,
  resolveOnboardingBoardPresentation,
  resolveOnboardingCaption,
  resolveOnboardingCaptionReserve,
  resolveFineRecognitionExamples,
  resolveOnboardingInputMode,
  shouldRenderDecisionStack,
  type FirstRunOnboardingState,
  type OnboardingCorePhase,
} from './firstRunOnboarding';
import { createGame, submitSwipeDown, submitSwipeUp, type GameState } from './polyRunEngine';
import { generateHunt } from './huntGenerator';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

const defaults = createDefaultOnboardingState();
eq(defaults.version, 1, 'onboarding state is versioned');
eq(defaults.home.completed, false, 'fresh install keeps Home beat pending');
eq(defaults.coreCompleted, false, 'fresh install keeps core onboarding pending');
eq(defaults.activeRun, null, 'fresh install has no active onboarding Hunt');

const fineRecognitionExamples = [
  "I'M FINE.",
  'PAY A FINE.',
  'FINE DINING.',
  'READ THE FINE PRINT.',
];
eq(
  JSON.stringify(FINE_RECOGNITION_EXAMPLES),
  JSON.stringify(fineRecognitionExamples),
  'FINE recognition keeps the approved example copy and order',
);
for (let step = 0; step < fineRecognitionExamples.length; step += 1) {
  eq(
    JSON.stringify(resolveFineRecognitionExamples(step)),
    JSON.stringify(fineRecognitionExamples.slice(0, step + 1)),
    `FINE recognition step ${step + 1} retains every revealed example`,
  );
}
eq(resolveFineRecognitionExamples(4).length, 0, 'follow-up copy begins after the example stack');
ok(
  fineRecognitionStepDurationMs(3) >= 1750 &&
    fineRecognitionStepDurationMs(3) > fineRecognitionStepDurationMs(2),
  'the completed four-line stack holds before the next onboarding beat',
);

const legacyComplete = hydrateOnboardingState(null, true);
eq(legacyComplete.home.completed, true, 'legacy completed intro does not replay first-ever Home');
eq(legacyComplete.coreCompleted, true, 'legacy completed intro migrates as core complete');

const seed = 0x0f1e2d3c;
const steps = generateHunt({ length: 8, gentle: true, seed, firstRunOnboarding: true });
ok(steps[0]?.kind === 'word' && steps[0].word === 'FINE', 'first-run Hunt replaces round one with FINE');
eq(steps.length, 8, 'first-run Hunt preserves the fledgling eight-round arc');
if (steps[0]?.kind !== 'word') throw new Error('first onboarding step must be a word');
for (const id of FIRST_RUN_FINE_MASK_IDS) {
  ok(steps[0].masks.some(mask => mask.id === id), `FINE visible pool contains ${id}`);
}

let game = createGame(steps, 3, seed, 0, {
  onboardingMode: 'first-run',
  openingMaskIds: FIRST_RUN_FINE_MASK_IDS,
});
eq(game.shuffledMasks[0][0].id, 'fine_r03', 'guided REAL is the first live mask');
eq(game.shuffledMasks[0][1].id, 'fine_t00', 'guided TRAP is the second live mask');
eq(game.shuffledMasks[0][2].id, 'fine_r04', 'unaided decision is the third live mask');

const aheadPresentation: FirstRunOnboardingState = {
  ...createDefaultOnboardingState(),
  coreCompleted: true,
  activeRun: {
    runSeed: seed,
    mode: 'first-run',
    phase: 'complete',
    presentationStep: 0,
    unaidedAttempts: 1,
    helperVisible: false,
    featherExplained: false,
  },
};
const repairedFromGame = reconcileOnboardingRun(aheadPresentation, game);
eq(repairedFromGame.activeRun?.phase, 'guided-real', 'saved Hunt repairs presentation that ran ahead');
eq(repairedFromGame.coreCompleted, false, 'saved Hunt prevents premature first-run completion');
eq(repairedFromGame.activeRun?.helperVisible, true, 'repair restores the unaided helper contract');

let onboarding = createDefaultOnboardingState();
onboarding = {
  ...onboarding,
  activeRun: {
    runSeed: seed,
    mode: 'first-run',
    phase: 'guided-real',
    presentationStep: 0,
    unaidedAttempts: 0,
    helperVisible: true,
    featherExplained: false,
  },
};
const recognitionPresentation = resolveOnboardingBoardPresentation({
  ...onboarding,
  activeRun: { ...onboarding.activeRun!, phase: 'recognition' },
}, game);
eq(recognitionPresentation.showDecisionCard, false, 'recognition hides the live decision card');
eq(recognitionPresentation.swipeCueMode, 'none', 'recognition hides normal swipe cues');

const challengePresentation = resolveOnboardingBoardPresentation({
  ...onboarding,
  activeRun: { ...onboarding.activeRun!, phase: 'challenge' },
}, game);
eq(challengePresentation.showDecisionCard, false, 'Polly challenge hides the live decision card');
eq(challengePresentation.swipeCueMode, 'none', 'Polly challenge hides normal swipe cues');

const guidedRealPresentation = resolveOnboardingBoardPresentation(onboarding, game);
eq(guidedRealPresentation.showDecisionCard, true, 'guided REAL reveals the pinned live card');
eq(guidedRealPresentation.swipeCueMode, 'up', 'guided REAL shows only the UP cue');
eq(resolveOnboardingInputMode(onboarding, game), 'up-only', 'guided REAL exposes only UP');

game = submitSwipeUp(game, 'fine_r03');
onboarding = reconcileOnboardingRun(onboarding, game);
eq(onboarding.activeRun?.phase, 'guided-real-result', 'committed guided REAL reconciles forward');
const realResultPresentation = resolveOnboardingBoardPresentation(onboarding, game);
eq(realResultPresentation.showDecisionCard, false, 'REAL MEANING beat keeps the next card off the board');
eq(realResultPresentation.swipeCueMode, 'none', 'REAL MEANING beat shows no swipe cues');
eq(resolveOnboardingInputMode(onboarding, game), 'locked', 'guided REAL result locks the next mask');

onboarding = {
  ...onboarding,
  activeRun: { ...onboarding.activeRun!, phase: 'guided-trap' },
};
const guidedTrapPresentation = resolveOnboardingBoardPresentation(onboarding, game);
eq(guidedTrapPresentation.showDecisionCard, true, 'guided TRAP keeps the live card visible');
eq(guidedTrapPresentation.swipeCueMode, 'right', 'guided TRAP shows only the RIGHT cue');
eq(resolveOnboardingInputMode(onboarding, game), 'right-only', 'guided TRAP exposes only RIGHT');
game = submitSwipeDown(game, 'fine_t00');
onboarding = reconcileOnboardingRun(onboarding, game);
eq(onboarding.activeRun?.phase, 'guided-trap-result', 'committed guided TRAP reconciles forward');
eq(resolveOnboardingInputMode(onboarding, game), 'locked', 'guided TRAP result locks the next mask');
const trapResultPresentation = resolveOnboardingBoardPresentation(onboarding, game);
eq(trapResultPresentation.showDecisionCard, false, 'TRAP beat keeps the next card off the board');
eq(trapResultPresentation.swipeCueMode, 'none', 'TRAP beat shows no swipe cues');

onboarding = {
  ...onboarding,
  activeRun: { ...onboarding.activeRun!, phase: 'unaided' },
};
const unaidedPresentation = resolveOnboardingBoardPresentation(onboarding, game);
eq(unaidedPresentation.showDecisionCard, true, 'unaided judgment keeps the live card visible');
eq(unaidedPresentation.swipeCueMode, 'none', 'unaided judgment uses only its temporary helper');
eq(resolveOnboardingInputMode(onboarding, game), 'both', 'unaided judgment exposes both Hunt directions');
game = submitSwipeUp(game, 'fine_r04');
onboarding = reconcileOnboardingRun(onboarding, game);
eq(onboarding.coreCompleted, true, 'correct unaided decision completes core onboarding');
eq(onboarding.activeRun?.phase, 'complete', 'reconciliation never replays a committed unaided decision');
// Guided REAL + guided TRAP + the unaided call are three in a row: 1.5×. The
// multiplier lesson lands on this last guided FINE decision and holds FINE's
// remaining cards until it is done.
eq(game.chainMultiplier, 1.5, 'the unaided FINE decision is the third straight correct call');
eq(resolveHudLesson(onboarding, game), 'multiplier', 'the multiplier lesson is due on the unaided FINE decision');
eq(resolveOnboardingInputMode(onboarding, game), 'locked', 'the multiplier lesson locks the rest of FINE');
onboarding = { ...onboarding, hudLessons: { ...onboarding.hudLessons, multiplier: true } };
eq(resolveOnboardingInputMode(onboarding, game), 'both', 'FINE plays on once the multiplier lesson is done');

const nextWordGame = {
  ...game,
  stepIndex: 1,
  swipedUpIds: [],
  swipedDownIds: [],
};
const handoffPresentation = resolveOnboardingBoardPresentation(onboarding, nextWordGame);
eq(handoffPresentation.showDecisionCard, false, 'FINE handoff hides the next word decision card');
eq(handoffPresentation.swipeCueMode, 'none', 'FINE handoff hides all normal swipe cues');
eq(resolveOnboardingInputMode(onboarding, nextWordGame), 'locked', 'FINE handoff locks the next word');
// Resumed inside the hand-off before the round-progress lesson: the hand-off
// stays open so the lesson owns it, the next card still hidden and locked.
const resumedBeforeProgressLesson = dismissCompletedOnboardingHandoffOnResume(onboarding, nextWordGame);
eq(resumedBeforeProgressLesson, onboarding, 'resume keeps the hand-off open for the untaught progress lesson');
eq(resolveHudLesson(resumedBeforeProgressLesson, nextWordGame), 'progress', 'resume re-shows the progress lesson');
eq(resolveOnboardingInputMode(resumedBeforeProgressLesson, nextWordGame), 'locked', 'resumed hand-off keeps the next word locked');
// Once the player has had it, a resumed hand-off simply closes.
const taughtOnboarding: FirstRunOnboardingState = {
  ...onboarding,
  hudLessons: { ...onboarding.hudLessons, progress: true },
};
const resumedAfterFine = dismissCompletedOnboardingHandoffOnResume(taughtOnboarding, nextWordGame);
eq(resumedAfterFine.activeRun, null, 'resume after FINE never restores the handoff overlay');
const normalPresentation = resolveOnboardingBoardPresentation(resumedAfterFine, nextWordGame);
eq(normalPresentation.showDecisionCard, true, 'resume after FINE restores the normal decision card');
eq(normalPresentation.swipeCueMode, 'both', 'resume after FINE restores normal swipe cues');

let retryGame = createGame(steps, 3, seed, 0, {
  onboardingMode: 'first-run',
  openingMaskIds: FIRST_RUN_FINE_MASK_IDS,
});
let retryOnboarding: FirstRunOnboardingState = {
  ...createDefaultOnboardingState(),
  activeRun: {
    runSeed: seed,
    mode: 'first-run' as const,
    phase: 'unaided' as const,
    presentationStep: 0,
    unaidedAttempts: 0,
    helperVisible: true,
    featherExplained: false,
  },
};
retryGame = submitSwipeUp(retryGame, 'fine_r03');
retryGame = submitSwipeDown(retryGame, 'fine_t00');
retryGame = submitSwipeDown(retryGame, 'fine_r04');
retryOnboarding = reconcileOnboardingRun(retryOnboarding, retryGame);
eq(retryOnboarding.activeRun?.phase, 'unaided', 'incorrect unaided decision keeps guidance active');
eq(retryOnboarding.activeRun?.helperVisible, true, 'incorrect unaided decision keeps helper visible');
const retryMask = retryGame.shuffledMasks[0][3];
retryGame = retryMask.isReal
  ? submitSwipeUp(retryGame, retryMask.id)
  : submitSwipeDown(retryGame, retryMask.id);
retryOnboarding = reconcileOnboardingRun(retryOnboarding, retryGame);
eq(retryOnboarding.activeRun?.phase, 'complete', 'next correct unaided decision completes onboarding');
eq(retryOnboarding.activeRun?.helperVisible, false, 'first correct unaided decision removes helper');

// While the decision card is hidden, the stack renders only for a judged
// card that is still leaving: its exit plays in full, then the stack drops
// before the next card is promoted, and a promoted card never flashes.
eq(shouldRenderDecisionStack(true, null), true, 'a shown decision card always renders the stack');
eq(
  shouldRenderDecisionStack(true, { judged: false, exitFinished: false }),
  true,
  'a shown decision card renders an idle top card',
);
eq(
  shouldRenderDecisionStack(false, { judged: true, exitFinished: false }),
  true,
  'a judged card mid-exit keeps rendering through the result beat',
);
eq(
  shouldRenderDecisionStack(false, { judged: true, exitFinished: true }),
  false,
  'once the judged card has left, the stack drops before the next card is promoted',
);
eq(
  shouldRenderDecisionStack(false, { judged: false, exitFinished: false }),
  false,
  'a promoted next card is hidden from its first frame',
);
eq(shouldRenderDecisionStack(false, null), false, 'a hidden decision card with no top card renders nothing');

// Instruction captions: one per beat, laid out above the live card.
{
  const captionGame = createGame(steps, 3, seed, 0, {
    onboardingMode: 'first-run',
    openingMaskIds: FIRST_RUN_FINE_MASK_IDS,
  });
  const at = (
    phase: OnboardingCorePhase,
    helperVisible = true,
  ): FirstRunOnboardingState => ({
    ...createDefaultOnboardingState(),
    activeRun: {
      runSeed: seed,
      mode: 'first-run',
      phase,
      presentationStep: 0,
      unaidedAttempts: 0,
      helperVisible,
      featherExplained: false,
    },
  });
  const guidedReal = resolveOnboardingCaption(at('guided-real'), captionGame);
  eq(guidedReal?.text, 'BELONGS TO FINE?', 'guided REAL asks only the question');
  eq(guidedReal?.kind, 'question', 'guided REAL caption is a question');
  eq(guidedReal?.accessibilityLabel, 'BELONGS TO FINE?', 'guided REAL is announced as written');
  const guidedTrap = resolveOnboardingCaption(at('guided-trap'), captionGame);
  eq(guidedTrap?.text, 'DOESN’T BELONG?', 'guided TRAP asks only the question');
  eq(guidedTrap?.kind, 'question', 'guided TRAP caption is a question');
  const helper = resolveOnboardingCaption(at('unaided'), captionGame);
  eq(helper?.text, '↑ CLAIM A MEANING     → REJECT A TRAP', 'unaided shows the helper');
  eq(helper?.kind, 'helper', 'unaided caption is the helper');
  eq(
    resolveOnboardingCaption(at('unaided', false), captionGame),
    null,
    'unaided without the helper shows no caption',
  );
  // The retired end-of-FINE feather caption: a wrong unaided call keeps the
  // helper, and completion shows nothing. Feathers are taught by the HUD
  // lesson on a real loss instead.
  eq(
    resolveOnboardingCaption(at('unaided'), { ...captionGame, mistakesOnWord: 1 })?.kind,
    'helper',
    'a wrong unaided call no longer swaps the helper for a feather rule',
  );
  for (const phase of [
    'recognition',
    'challenge',
    'guided-real-result',
    'guided-trap-result',
    'complete',
  ] as const) {
    eq(resolveOnboardingCaption(at(phase), captionGame), null, `${phase} has no board caption`);
  }
  eq(
    resolveOnboardingCaption(createDefaultOnboardingState(), captionGame),
    null,
    'no active run shows no caption',
  );
  eq(
    resolveOnboardingCaption(at('guided-real'), { ...captionGame, runSeed: seed + 1 }),
    null,
    'another Hunt never shows this run’s caption',
  );
  eq(
    resolveOnboardingCaption(at('guided-real'), { ...captionGame, onboardingMode: undefined }),
    null,
    'a Hunt without onboarding shows no caption',
  );
}

// The automatic end-of-FINE feather lesson is retired: completing FINE with
// no feather lost and no run built makes no lesson due at all.
for (const mode of ['first-run', 'replay'] as const) {
  const featherGame = createGame(steps, 3, seed, 0, {
    onboardingMode: mode,
    openingMaskIds: FIRST_RUN_FINE_MASK_IDS,
  });
  const completed: FirstRunOnboardingState = {
    ...createDefaultOnboardingState(),
    coreCompleted: true,
    activeRun: {
      runSeed: seed,
      mode,
      phase: 'complete',
      presentationStep: 0,
      unaidedAttempts: 1,
      helperVisible: false,
      featherExplained: false,
    },
  };
  eq(resolveHudLesson(completed, featherGame), null, `${mode}: FINE completing never teaches feathers by itself`);
  eq(resolveOnboardingInputMode(completed, featherGame), 'both', `${mode}: completed FINE plays on with no feather beat`);
}

// The opening hold: only at the very start of a recognition phase, in both
// modes, and never for another Hunt. It adds no saved state.
for (const mode of ['first-run', 'replay'] as const) {
  const holdGame = createGame(steps, 3, seed, 0, {
    onboardingMode: mode,
    openingMaskIds: FIRST_RUN_FINE_MASK_IDS,
  });
  const run = (phase: OnboardingCorePhase, presentationStep: number): FirstRunOnboardingState => ({
    ...createDefaultOnboardingState(),
    activeRun: {
      runSeed: seed,
      mode,
      phase,
      presentationStep,
      unaidedAttempts: 0,
      helperVisible: true,
      featherExplained: false,
    },
  });
  eq(recognitionOpensWithHold(run('recognition', 0), holdGame), true, `${mode}: FINE stands alone first`);
  eq(recognitionOpensWithHold(run('recognition', 3), holdGame), false, `${mode}: a resume mid-recognition does not hold`);
  eq(recognitionOpensWithHold(run('challenge', 0), holdGame), false, `${mode}: the challenge never holds`);
  eq(recognitionOpensWithHold(run('guided-real', 0), holdGame), false, `${mode}: guided play never holds`);
  eq(
    recognitionOpensWithHold(run('recognition', 0), { ...holdGame, runSeed: seed + 1 }),
    false,
    `${mode}: another Hunt never holds for this run`,
  );
  const saved = JSON.parse(JSON.stringify(run('recognition', 0)));
  eq(
    JSON.stringify(hydrateOnboardingState(JSON.stringify(saved))),
    JSON.stringify(hydrateOnboardingState(JSON.stringify(run('recognition', 0)))),
    `${mode}: the hold adds nothing to the saved state`,
  );
}
eq(recognitionOpensWithHold(createDefaultOnboardingState(), createGame(steps, 3, seed, 0)), false, 'no run, no hold');

// The caption reserve belongs to the FINE tutorial word only, in both modes,
// and never depends on the phase.
for (const mode of ['first-run', 'replay'] as const) {
  const tutorialWord = createGame(steps, 3, seed, 0, {
    onboardingMode: mode,
    openingMaskIds: FIRST_RUN_FINE_MASK_IDS,
  });
  eq(
    resolveOnboardingCaptionReserve(tutorialWord),
    ONBOARDING_CAPTION_RESERVE,
    `${mode}: the FINE tutorial word reserves caption room`,
  );
  eq(
    resolveOnboardingCaptionReserve({ ...tutorialWord, stepIndex: 1 }),
    0,
    `${mode}: later words keep the normal board`,
  );
}
eq(ONBOARDING_CAPTION_RESERVE, 20, 'caption reserve is 20 pt');
eq(
  resolveOnboardingCaptionReserve(createGame(steps, 3, seed, 0)),
  0,
  'a Hunt without onboarding keeps the normal board',
);

// A finished hand-off stays finished. The Hunt keeps onboardingMode for its
// whole life, so every later game update runs reconcile against the state the
// hand-off left behind; it must never build a fresh run for the same seed.
for (const mode of ['first-run', 'replay'] as const) {
  let finishedGame = createGame(steps, 3, seed, 0, {
    onboardingMode: mode,
    openingMaskIds: FIRST_RUN_FINE_MASK_IDS,
  });
  let finished: FirstRunOnboardingState = {
    ...createDefaultOnboardingState(),
    activeRun: {
      runSeed: seed,
      mode,
      phase: 'unaided',
      presentationStep: 0,
      unaidedAttempts: 0,
      helperVisible: true,
      featherExplained: false,
    },
  };
  finishedGame = submitSwipeUp(finishedGame, 'fine_r03');
  finishedGame = submitSwipeDown(finishedGame, 'fine_t00');
  finishedGame = submitSwipeUp(finishedGame, 'fine_r04');
  finished = reconcileOnboardingRun(finished, finishedGame);
  eq(finished.activeRun?.phase, 'complete', `${mode}: FINE completes before the hand-off`);
  finished = {
    ...finished,
    activeRun: { ...finished.activeRun!, featherExplained: true },
  };
  finished = finishOnboardingHandoff(finished);
  eq(finished.finishedRunSeed, seed, `${mode}: the hand-off records its finished seed`);

  // Walk the next word's masks, one swipe per game update, and count how
  // many times reconcile brings a finished run back to life.
  let laterGame: GameState = { ...finishedGame, stepIndex: 1, swipedUpIds: [], swipedDownIds: [] };
  let restarts = 0;
  const nextMasks = laterGame.shuffledMasks[1];
  for (const mask of nextMasks.slice(0, 4)) {
    laterGame = mask.isReal ? submitSwipeUp(laterGame, mask.id) : submitSwipeDown(laterGame, mask.id);
    const reconciled = reconcileOnboardingRun(finished, laterGame);
    if (reconciled.activeRun) {
      restarts += 1;
      // What the component does with a rebuilt run: feather banner, hand-off.
      finished = finishOnboardingHandoff(reconciled);
    } else {
      finished = reconciled;
    }
  }
  eq(restarts, 0, `${mode}: a finished hand-off never restarts on later swipes`);

  // A later onboarding Hunt has its own seed and still gets its own run.
  const nextSeed = seed + 1;
  const nextHunt = createGame(steps, 3, nextSeed, 0, {
    onboardingMode: mode,
    openingMaskIds: FIRST_RUN_FINE_MASK_IDS,
  });
  const nextRun = reconcileOnboardingRun(finished, nextHunt);
  eq(nextRun.activeRun?.runSeed, nextSeed, `${mode}: a new Hunt seed still starts its own run`);
  eq(nextRun.activeRun?.phase, `recognition`, `${mode}: a new Hunt run starts at recognition`);
}

// Resuming after FINE closes the hand-off the same way, so the next swipe
// after a resume does not rebuild it either.
const resumedFinished = dismissCompletedOnboardingHandoffOnResume(taughtOnboarding, nextWordGame);
eq(resumedFinished.finishedRunSeed, seed, `resume after FINE records the finished seed`);
const nextWordMask = nextWordGame.shuffledMasks[1][0];
const afterResumeSwipe = nextWordMask.isReal
  ? submitSwipeUp(nextWordGame, nextWordMask.id)
  : submitSwipeDown(nextWordGame, nextWordMask.id);
eq(
  reconcileOnboardingRun(resumedFinished, afterResumeSwipe).activeRun,
  null,
  `the first swipe after a resume never restarts the finished run`,
);

// Saves written before finishedRunSeed existed hydrate with it unset.
const legacySave = JSON.stringify({ ...createDefaultOnboardingState(), finishedRunSeed: undefined });
eq(hydrateOnboardingState(legacySave).finishedRunSeed, null, `saves without finishedRunSeed hydrate as null`);
eq(hydrateOnboardingState(legacySave).version, 1, `saves without finishedRunSeed keep their version`);
const savedFinished = JSON.stringify({ ...createDefaultOnboardingState(), finishedRunSeed: seed });
eq(hydrateOnboardingState(savedFinished).finishedRunSeed, seed, `finishedRunSeed survives a save round trip`);

console.log('firstRunOnboarding tests passed');
