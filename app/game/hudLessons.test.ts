import {
  FIRST_RUN_FINE_MASK_IDS,
  ONBOARDING_VERSION,
  captureHudLessonEvents,
  completeHudLesson,
  createDefaultOnboardingState,
  dismissCompletedOnboardingHandoffOnResume,
  hydrateOnboardingState,
  reconcileOnboardingRun,
  resolveHudLesson,
  resolveOnboardingBoardPresentation,
  resolveOnboardingInputMode,
  type FirstRunOnboardingState,
  type HudLessonId,
} from './firstRunOnboarding';
import {
  HUD_LESSON_CONTENT,
  SPOTLIGHT_MARGIN,
  hudLessonPollyVisit,
  hudTargetAccessibilityLabel,
  resolveHudLessonPresentation,
  resolveHudSpotlightGeometry,
  roundProgressAccessibilityLabel,
  type Rect,
} from './hudLessons';
import {
  completeWord,
  createGame,
  submitSwipeDown,
  submitSwipeUp,
  type GameState,
} from './polyRunEngine';
import { generateHunt } from './huntGenerator';
import { huntActionsForInputMode } from '../components/tileAccessibility';
import {
  isHuntTileInteractive,
  shouldRestartDecisionClock,
} from '../components/huntDecisionClock';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

const seed = 0x51a7e001;
const steps = generateHunt({ length: 8, gentle: true, seed });
const bossIndex = steps.findIndex(step => step.kind === 'word' && step.eventType === 'bossWord');
ok(bossIndex > 1, 'the Hunt ends on a boss word');

function freshGame(): GameState {
  return createGame(steps, 0, seed, 0);
}

function unresolvedMask(game: GameState) {
  const mask = game.shuffledMasks[game.stepIndex].find(candidate =>
    !game.swipedUpIds.includes(candidate.id) && !game.swipedDownIds.includes(candidate.id));
  if (!mask) throw new Error(`word ${game.stepIndex} has no unresolved mask left`);
  return mask;
}

// One store decision: the engine plus the store's capture, as useGameStore
// commits them in a single update.
type Session = { game: GameState; onboarding: FirstRunOnboardingState };

function decide(session: Session, correct: boolean): Session {
  let game = session.game;
  if (!game.shuffledMasks[game.stepIndex].some(mask =>
    !game.swipedUpIds.includes(mask.id) && !game.swipedDownIds.includes(mask.id))) {
    game = completeWord(game);
  }
  const mask = unresolvedMask(game);
  const next = mask.isReal === correct
    ? submitSwipeUp(game, mask.id)
    : submitSwipeDown(game, mask.id);
  return { game: next, onboarding: captureHudLessonEvents(session.onboarding, game, next) };
}

function withLessons(
  state: FirstRunOnboardingState,
  done: Partial<Record<HudLessonId, boolean>>,
): FirstRunOnboardingState {
  return { ...state, hudLessons: { ...state.hudLessons, ...done } };
}

const fresh = createDefaultOnboardingState();

// ── Persistence defaults (no version bump) ──────────────────
eq(ONBOARDING_VERSION, 1, 'HUD lessons ship without an onboarding version bump');
for (const lesson of ['feather', 'multiplier', 'streakBreak', 'progress'] as const) {
  eq(fresh.hudLessons[lesson], false, `fresh install: ${lesson} lesson pending`);
}
{
  const legacyVeteran = JSON.stringify({ ...fresh, coreCompleted: true, home: { completed: true, step: 4 }, hudLessons: undefined });
  const hydratedVeteran = hydrateOnboardingState(legacyVeteran);
  eq(hydratedVeteran.coreCompleted, true, 'an older save keeps core onboarding complete');
  eq(hydratedVeteran.home.completed, true, 'an older save keeps Home complete');
  for (const lesson of ['feather', 'multiplier', 'streakBreak', 'progress'] as const) {
    eq(hydratedVeteran.hudLessons[lesson], true, `an older save with core complete skips the ${lesson} lesson`);
  }
  const legacyNewcomer = JSON.stringify({ ...fresh, hudLessons: undefined });
  for (const lesson of ['feather', 'multiplier', 'streakBreak', 'progress'] as const) {
    eq(hydrateOnboardingState(legacyNewcomer).hudLessons[lesson], false, `an older mid-first-run save still gets the ${lesson} lesson`);
  }
  eq(hydrateOnboardingState(null, true).hudLessons.feather, true, 'the retired intro migrates as lessons learned');
}

// ── 2–5. Feather lesson ─────────────────────────────────────
{
  let session: Session = { game: freshGame(), onboarding: fresh };
  eq(resolveHudLesson(session.onboarding, session.game), null, 'no lesson before any decision');
  session = decide(session, false);
  eq(session.game.lives, 5, 'the wrong call really cost a feather');
  eq(session.game.status, 'playing', 'the first loss is nonfatal');
  eq(resolveHudLesson(session.onboarding, session.game), 'feather', '2: the first genuine nonfatal loss makes the feather lesson due');
  eq(resolveOnboardingInputMode(session.onboarding, session.game), 'locked', '2: the feather lesson locks the next decision in the same update');
  eq(session.onboarding.hudLessons.featherPendingRunSeed, seed, 'the loss is captured against this Hunt');

  // 18/19: a resume re-derives the lesson from saved state; no decision replays.
  const resumed = hydrateOnboardingState(JSON.stringify(session.onboarding));
  const savedGame: GameState = JSON.parse(JSON.stringify(session.game));
  eq(resolveHudLesson(resumed, savedGame), 'feather', '18: an unfinished feather lesson survives a resume');
  eq(savedGame.swipedDownIds.length + savedGame.swipedUpIds.length, 1, '19: the resumed Hunt holds the one committed decision');
  eq(savedGame.lives, 5, '19: the resumed Hunt does not re-charge the feather');

  const before = JSON.stringify(session.game);
  session = { ...session, onboarding: completeHudLesson(session.onboarding, 'feather') };
  eq(JSON.stringify(session.game), before, '19: finishing a lesson never touches the Hunt');
  eq(session.onboarding.hudLessons.feather, true, 'the feather lesson is recorded');
  eq(session.onboarding.hudLessons.featherPendingRunSeed, null, 'the pending loss clears with it');
  eq(resolveHudLesson(session.onboarding, session.game), null, 'play resumes after the feather lesson');

  session = decide(session, false);
  eq(session.game.lives, 4, 'a later loss still costs a feather');
  eq(resolveHudLesson(session.onboarding, session.game), null, '3: a later loss never replays the feather lesson');
  const roundTrip = hydrateOnboardingState(JSON.stringify(session.onboarding));
  eq(roundTrip.hudLessons.feather, true, '18: a finished lesson survives a save round trip');
}
{
  // 4: a fatal loss is never captured; Results and the death hold own it.
  const lastFeather: GameState = { ...freshGame(), lives: 1, mercyReviveLives: 0 };
  const fatal = decide({ game: lastFeather, onboarding: fresh }, false);
  eq(fatal.game.status, 'gameOver', 'the last feather ends the Hunt');
  eq(fatal.onboarding, fresh, '4: a fatal loss captures no lesson');
  eq(resolveHudLesson(fatal.onboarding, fatal.game), null, '4: no lesson over game over');
  const pendingThenDead = withLessons(fresh, {});
  pendingThenDead.hudLessons.featherPendingRunSeed = seed;
  eq(resolveHudLesson(pendingThenDead, fatal.game), null, '4: even a pending lesson never shows once the Hunt is over');
}
{
  // 5: Mercy revives in the same update, so lives go UP; the loss still counts.
  const mercyGame: GameState = { ...freshGame(), lives: 1, mercyReviveLives: 3 };
  const revived = decide({ game: mercyGame, onboarding: fresh }, false);
  eq(revived.game.status, 'playing', 'Mercy keeps the Hunt alive');
  eq(revived.game.lives, 3, 'Mercy leaves the player more feathers than before the loss');
  eq(revived.game.mercyUsed, 1, 'Mercy fired');
  eq(resolveHudLesson(revived.onboarding, revived.game), 'feather', '5: a Mercy-revived first loss still teaches feathers');
}
{
  // Boss and Haunt choreography never gets a lesson.
  const onBoss: GameState = { ...freshGame(), stepIndex: bossIndex };
  const bossLoss = decide({ game: onBoss, onboarding: fresh }, false);
  eq(bossLoss.onboarding, fresh, 'a loss on the boss word captures no lesson');
  const haunted: GameState = {
    ...freshGame(),
    session: steps.map((step, index) => index === 1 && step.kind === 'word' ? { ...step, isHauntReturn: true } : step),
    stepIndex: 1,
  };
  const hauntLoss = decide({ game: haunted, onboarding: fresh }, false);
  eq(hauntLoss.onboarding, fresh, 'a loss on a Returning Haunt captures no lesson');
  eq(
    resolveHudLesson(fresh, { ...onBoss, chainMultiplier: 1.5 }),
    null,
    'a run reached on the boss word waits for an ordinary word',
  );
}

// ── 6–8. Multiplier lesson ──────────────────────────────────
{
  const noFeatherLesson = withLessons(fresh, { feather: true });
  let session: Session = { game: freshGame(), onboarding: noFeatherLesson };
  session = decide(session, true);
  session = decide(session, true);
  eq(session.game.chainMultiplier, 1, 'two correct calls are still 1.0×');
  eq(resolveHudLesson(session.onboarding, session.game), null, 'no multiplier lesson below 1.5×');
  session = decide(session, true);
  eq(session.game.chainMultiplier, 1.5, 'three correct calls reach 1.5×');
  eq(resolveHudLesson(session.onboarding, session.game), 'multiplier', '6: the first 1.5× makes the multiplier lesson due');
  eq(resolveOnboardingInputMode(session.onboarding, session.game), 'locked', '6: the multiplier lesson locks the next decision');
  session = { ...session, onboarding: completeHudLesson(session.onboarding, 'multiplier') };
  for (let i = 0; i < 6; i += 1) session = decide(session, true);
  ok(session.game.chainMultiplier >= 2.5, 'the run climbs past 2.0× and 2.5×');
  eq(resolveHudLesson(session.onboarding, session.game), null, '8: later tier-ups never replay the multiplier lesson');
}
{
  // Chain math is untouched: 3 per step, capped at 3.0×.
  let session: Session = { game: freshGame(), onboarding: withLessons(fresh, { multiplier: true }) };
  const seen: number[] = [];
  for (let i = 0; i < 13; i += 1) {
    session = decide(session, true);
    seen.push(session.game.chainMultiplier);
  }
  eq(seen.join(','), '1,1,1.5,1.5,1.5,2,2,2,2.5,2.5,2.5,3,3', 'the multiplier still steps 1.0/1.5/2.0/2.5/3.0');
}

// ── 7. Multiplier on the unaided FINE decision ──────────────
const onboardingSteps = generateHunt({ length: 8, gentle: true, seed, firstRunOnboarding: true });
function fineGame(mode: 'first-run' | 'replay' = 'first-run'): GameState {
  return createGame(onboardingSteps, 3, seed, 0, {
    onboardingMode: mode,
    openingMaskIds: FIRST_RUN_FINE_MASK_IDS,
  });
}
function fineOnboarding(mode: 'first-run' | 'replay' = 'first-run'): FirstRunOnboardingState {
  return {
    ...fresh,
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
}
{
  let game = fineGame();
  game = submitSwipeUp(game, 'fine_r03');
  game = submitSwipeDown(game, 'fine_t00');
  let onboarding = reconcileOnboardingRun(fineOnboarding(), game);
  eq(resolveHudLesson(onboarding, game), null, 'the guided calls alone teach nothing');
  const beforeUnaided = game;
  game = submitSwipeUp(game, 'fine_r04');
  onboarding = reconcileOnboardingRun(captureHudLessonEvents(onboarding, beforeUnaided, game), game);
  eq(onboarding.activeRun?.phase, 'complete', 'the unaided FINE call completes core onboarding');
  eq(resolveHudLesson(onboarding, game), 'multiplier', '7: the multiplier lesson lands on the unaided FINE decision');
  eq(resolveOnboardingInputMode(onboarding, game), 'locked', '7: the rest of FINE waits for it');
  eq(resolveOnboardingBoardPresentation(onboarding, game).showDecisionCard, true, '7: FINE keeps its board under the lesson');

  // ── 12–14, 20. Round-progress lesson in the hand-off ──────
  onboarding = completeHudLesson(onboarding, 'multiplier');
  eq(resolveOnboardingInputMode(onboarding, game), 'both', 'FINE plays on after the multiplier lesson');
  game = completeWord(game);
  onboarding = reconcileOnboardingRun(onboarding, game);
  eq(game.stepIndex, 1, 'FINE completes and the Hunt moves to word 2');
  eq(resolveHudLesson(onboarding, game), 'progress', '12: the first word completing makes the progress lesson due');
  const handoff = resolveOnboardingBoardPresentation(onboarding, game);
  eq(handoff.showDecisionCard, false, '13: the next card stays hidden during the progress lesson');
  eq(resolveOnboardingInputMode(onboarding, game), 'locked', '13: the next card stays locked during the progress lesson');
  eq(onboarding.activeRun?.phase, 'complete', 'the hand-off waits: the retired feather beat no longer blocks it');

  onboarding = completeHudLesson(onboarding, 'progress');
  eq(onboarding.activeRun, null, '13: finishing the progress lesson closes the hand-off');
  eq(onboarding.finishedRunSeed, seed, '20: the finished run is recorded');
  eq(resolveOnboardingBoardPresentation(onboarding, game).showDecisionCard, true, '13: the next card appears only now');
  eq(resolveOnboardingInputMode(onboarding, game), 'both', '13: normal play resumes only now');

  // 20: no later game update resurrects the run or its lessons.
  let later = game;
  for (let i = 0; i < 3; i += 1) {
    const mask = unresolvedMask(later);
    later = mask.isReal ? submitSwipeUp(later, mask.id) : submitSwipeDown(later, mask.id);
    onboarding = reconcileOnboardingRun(onboarding, later);
    eq(onboarding.activeRun, null, `20: swipe ${i + 1} after the hand-off never rebuilds onboarding`);
    eq(resolveHudLesson(onboarding, later), null, `20: swipe ${i + 1} after the hand-off shows no lesson`);
  }
  later = completeWord(later);
  onboarding = reconcileOnboardingRun(onboarding, later);
  eq(later.stepIndex, 2, 'the next word completes');
  eq(resolveHudLesson(onboarding, later), null, '14: later word completions never replay the progress lesson');
}
{
  // A Replay whose player already has the progress lesson gets the short
  // banner instead; nothing here waits on a lesson that will never come.
  let game = fineGame('replay');
  game = submitSwipeUp(game, 'fine_r03');
  game = submitSwipeDown(game, 'fine_t00');
  game = submitSwipeUp(game, 'fine_r04');
  const veteran = withLessons(fineOnboarding('replay'), {
    feather: true, multiplier: true, streakBreak: true, progress: true,
  });
  let onboarding = reconcileOnboardingRun(veteran, game);
  eq(resolveHudLesson(onboarding, game), null, 'Replay does not re-teach finished HUD lessons');
  game = completeWord(game);
  onboarding = reconcileOnboardingRun(onboarding, game);
  eq(resolveHudLesson(onboarding, game), null, 'Replay hand-off is not a progress lesson once taught');
  eq(resolveOnboardingInputMode(onboarding, game), 'locked', 'Replay hand-off still holds the next word');
  eq(dismissCompletedOnboardingHandoffOnResume(onboarding, game).activeRun, null, 'a resumed Replay hand-off closes');
}

// ── 9–11. Streak-break reinforcement ────────────────────────
{
  const taught = withLessons(fresh, { feather: true, multiplier: true });
  const atSteady = decide({ game: freshGame(), onboarding: taught }, false);
  eq(atSteady.game.fellOffSeverity, null, 'a wrong call at 1.0× has no FELL OFF');
  eq(atSteady.onboarding.hudLessons.streakBreakPendingRunSeed, null, '9: a wrong call at 1.0× captures no streak break');
  eq(resolveHudLesson(atSteady.onboarding, atSteady.game), null, '9: a wrong call at 1.0× shows no reinforcement');

  let session: Session = { game: freshGame(), onboarding: taught };
  for (let i = 0; i < 3; i += 1) session = decide(session, true);
  session = decide(session, false);
  eq(session.game.fellOffSeverity, 1, 'breaking a 1.5× run is a real FELL OFF');
  eq(resolveHudLesson(session.onboarding, session.game), 'streakBreak', '10: the first FELL OFF after the multiplier lesson reinforces it');
  eq(resolveOnboardingInputMode(session.onboarding, session.game), 'locked', '10: the reinforcement holds the next decision');
  // The HUD consumes fellOffSeverity a moment later; the captured lesson stays.
  const consumed: GameState = { ...session.game, fellOffSeverity: null };
  eq(resolveHudLesson(session.onboarding, consumed), 'streakBreak', 'the reinforcement outlives the FELL OFF flash');
  session = { ...session, onboarding: completeHudLesson(session.onboarding, 'streakBreak') };
  eq(resolveHudLesson(session.onboarding, session.game), null, 'play resumes after the reinforcement');
  for (let i = 0; i < 3; i += 1) session = decide(session, true);
  session = decide(session, false);
  eq(session.game.fellOffSeverity, 1, 'a later run breaks again');
  eq(resolveHudLesson(session.onboarding, session.game), null, '11: a later FELL OFF never replays the reinforcement');
}
{
  // Before the multiplier lesson, a broken run is not captured as a streak break.
  let session: Session = { game: freshGame(), onboarding: withLessons(fresh, { feather: true }) };
  for (let i = 0; i < 3; i += 1) session = decide(session, true);
  const untaught = decide(session, false);
  eq(untaught.game.fellOffSeverity, 1, 'the run really broke');
  eq(untaught.onboarding.hudLessons.streakBreakPendingRunSeed, null, 'no reinforcement before the multiplier lesson');
}

// ── 15. One lesson at a time, in priority order ─────────────
{
  const base = freshGame();
  const pending = (state: FirstRunOnboardingState, feather: boolean, streak: boolean): FirstRunOnboardingState => ({
    ...state,
    hudLessons: {
      ...state.hudLessons,
      featherPendingRunSeed: feather ? seed : null,
      streakBreakPendingRunSeed: streak ? seed : null,
    },
  });
  const running: GameState = { ...base, chainMultiplier: 1.5 };
  eq(resolveHudLesson(pending(fresh, true, false), running), 'multiplier', '15: a run just earned comes first');
  const multiplierDone = withLessons(fresh, { multiplier: true });
  eq(resolveHudLesson(pending(multiplierDone, true, true), base), 'feather', '15: a real feather loss beats the reinforcement');
  const featherDone = withLessons(multiplierDone, { feather: true });
  eq(resolveHudLesson(pending(featherDone, false, true), base), 'streakBreak', '15: then the reinforcement');

  // The same wrong call can break a run AND cost the first feather: the two
  // lessons run one after the other, never together.
  let session: Session = { game: freshGame(), onboarding: withLessons(fresh, { multiplier: true }) };
  for (let i = 0; i < 3; i += 1) session = decide(session, true);
  session = decide(session, false);
  eq(resolveHudLesson(session.onboarding, session.game), 'feather', '15: first the feather lesson');
  session = { ...session, onboarding: completeHudLesson(session.onboarding, 'feather') };
  eq(resolveHudLesson(session.onboarding, session.game), 'streakBreak', '15: then the reinforcement, on its own');
  session = { ...session, onboarding: completeHudLesson(session.onboarding, 'streakBreak') };
  eq(resolveHudLesson(session.onboarding, session.game), null, '15: then play');
}
{
  // A feather loss on FINE's last card: the feather lesson owns the moment
  // first, and the hand-off's progress lesson follows it.
  let game = fineGame();
  game = submitSwipeUp(game, 'fine_r03');
  game = submitSwipeDown(game, 'fine_t00');
  let onboarding = reconcileOnboardingRun(withLessons(fineOnboarding(), { multiplier: true }), game);
  const before = game;
  game = submitSwipeDown(game, 'fine_r04');
  onboarding = reconcileOnboardingRun(captureHudLessonEvents(onboarding, before, game), game);
  eq(resolveHudLesson(onboarding, game), 'feather', 'a wrong unaided FINE call teaches feathers, not the retired caption');
  game = completeWord(game);
  onboarding = reconcileOnboardingRun(onboarding, game);
  eq(resolveHudLesson(onboarding, game), 'feather', '15: the feather lesson holds over the hand-off');
  onboarding = completeHudLesson(onboarding, 'feather');
  eq(resolveHudLesson(onboarding, game), 'progress', '15: the progress lesson follows once feathers are done');
}

// ── 16, 22. Input is locked and the card leaves the a11y tree ─
{
  const lockedState = withLessons(fresh, {});
  lockedState.hudLessons.featherPendingRunSeed = seed;
  const game = freshGame();
  eq(resolveOnboardingInputMode(lockedState, game), 'locked', '16: a due lesson locks a normal (non-onboarding) Hunt');
  eq(huntActionsForInputMode('locked').length, 0, '22: a locked card offers no screen-reader actions');
  eq(isHuntTileInteractive(false, 'locked'), false, '16: a locked card is not interactive');
  eq(isHuntTileInteractive(false, 'both'), true, 'an unlocked, released card is interactive');
  eq(isHuntTileInteractive(true, 'both'), false, 'a card the board has not released is not interactive');
}

// ── 17. Tutorial hold time is excluded from response timing ──
{
  // A card that lands while a lesson holds input, then is released.
  let wasInteractive = false;
  let interactiveAt = 0; // mount-time fallback
  const tick = (now: number, disabled: boolean, mode: 'locked' | 'both') => {
    const interactive = isHuntTileInteractive(disabled, mode);
    if (shouldRestartDecisionClock(wasInteractive, interactive)) interactiveAt = now;
    wasInteractive = interactive;
  };
  tick(0, true, 'locked');       // card mounts under the lesson
  tick(400, false, 'locked');    // board released it, lesson still holds
  tick(6200, false, 'both');     // lesson and Polly done
  const responseMs = 7000 - interactiveAt;
  eq(responseMs, 800, '17: response time counts only from when the card became playable');
  tick(7100, false, 'both');
  eq(interactiveAt, 6200, 'an already-playable card keeps its clock');
}

// ── 21. Reduced Motion keeps every lesson whole ─────────────
for (const lesson of ['feather', 'multiplier', 'streakBreak', 'progress'] as const) {
  const full = resolveHudLessonPresentation(lesson, false);
  const reduced = resolveHudLessonPresentation(lesson, true);
  eq(reduced.lines.join('|'), full.lines.join('|'), `21: ${lesson} keeps every line under Reduce Motion`);
  eq(reduced.requiresAcknowledgement, true, `21: ${lesson} still waits for the player under Reduce Motion`);
  eq(reduced.continueLabel, full.continueLabel, `21: ${lesson} keeps its continue control`);
  eq(reduced.settleMs, full.settleMs, `21: ${lesson} keeps its pacing under Reduce Motion`);
  eq(reduced.pollyLine, full.pollyLine, `21: ${lesson} keeps Polly's reply`);
  eq(reduced.panelFadeMs, 0, `21: ${lesson} drops only the fade`);
  ok(full.panelFadeMs > 0, `${lesson} fades in with motion on`);
  eq(hudLessonPollyVisit(lesson).line, full.pollyLine, `${lesson}: Polly speaks her own line`);
  ok(!reduced.spokenCopy.includes(full.pollyLine), `${lesson}: the rule and Polly are announced separately`);
}

// ── Approved copy ───────────────────────────────────────────
eq(
  HUD_LESSON_CONTENT.feather.lines.join(' / '),
  'THESE ARE YOUR FEATHERS. / THEY’RE YOUR LIVES. / WRONG CALLS COST ONE. / LOSE THEM ALL, AND POLLY WINS THE HUNT.',
  'feather copy',
);
eq(HUD_LESSON_CONTENT.feather.pollyLine, 'And you lost to a bird.', 'feather Polly line');
eq(
  HUD_LESSON_CONTENT.multiplier.lines.join(' / '),
  'YOU’RE ON A RUN. / CONSECUTIVE CORRECT CALLS BOOST YOUR SCORE. / KEEP IT GOING TO REACH 3×.',
  'multiplier copy',
);
eq(HUD_LESSON_CONTENT.multiplier.pollyLine, 'Try not to ruin it.', 'multiplier Polly line');
eq(HUD_LESSON_CONTENT.streakBreak.lines.join(' / '), 'WRONG CALLS BREAK YOUR RUN.', 'streak-break copy');
eq(HUD_LESSON_CONTENT.streakBreak.pollyLine, 'There it is.', 'streak-break Polly line');
ok(
  HUD_LESSON_CONTENT.streakBreak.lines.length < HUD_LESSON_CONTENT.multiplier.lines.length,
  'the reinforcement is shorter than the multiplier lesson',
);
eq(
  HUD_LESSON_CONTENT.progress.lines.join(' / '),
  'ONE WORD DOWN. / EACH MARKER IS ANOTHER WORD IN THE HUNT. / REACH THE CROWN TO FACE POLLY’S WORD.',
  'progress copy',
);
eq(HUD_LESSON_CONTENT.progress.pollyLine, 'Assuming you make it that far.', 'progress Polly line');
eq(HUD_LESSON_CONTENT.feather.target, 'feathers', 'feather lesson points at the feather row');
eq(HUD_LESSON_CONTENT.multiplier.target, 'streak', 'multiplier lesson points at the run meter');
eq(HUD_LESSON_CONTENT.streakBreak.target, 'streak', 'reinforcement points at the run meter');
eq(HUD_LESSON_CONTENT.progress.target, 'rounds', 'progress lesson points at the round markers');

// ── 22. Spotlighted HUD targets have real labels ────────────
eq(
  roundProgressAccessibilityLabel(2, 8),
  "Hunt progress. Word 2 of 8. The crown is Polly's Word.",
  '22: the round markers read as progress, not raw numbers',
);
eq(
  hudTargetAccessibilityLabel('feathers', { lives: 5, streakLabel: 'STEADY', round: 1, totalRounds: 8 }),
  'Feathers. 5 feathers remaining.',
  '22: the feather row label',
);
eq(
  hudTargetAccessibilityLabel('streak', { lives: 5, streakLabel: 'SHARP', round: 1, totalRounds: 8 }),
  'Run meter. SHARP.',
  '22: the run meter label',
);

// ── Spotlight geometry across supported phone widths ────────
for (const width of [320, 375, 390, 393, 402, 430, 440]) {
  const layer: Rect = { x: 0, y: 47, width, height: 780 };
  const hudTop = layer.y + 4;
  const targets: Record<string, Rect> = {
    streak: { x: 14 + 13, y: hudTop + 15, width: width * 0.4, height: 44 },
    feathers: { x: width - 14 - 13 - 156, y: hudTop + 18, width: 156, height: 38 },
    rounds: { x: (width - 273) / 2, y: hudTop + 72, width: 273, height: 26 },
  };
  for (const [name, target] of Object.entries(targets)) {
    const g = resolveHudSpotlightGeometry(target, layer);
    const label = `${width}pt ${name}`;
    eq(g.placement, 'below', `${label}: HUD targets get the panel below them`);
    ok(g.hole.x >= 0 && g.hole.x + g.hole.width <= width, `${label}: the spotlight stays on screen`);
    ok(g.panel.left >= SPOTLIGHT_MARGIN - 0.001, `${label}: panel keeps the left margin`);
    ok(g.panel.left + g.panel.width <= width - SPOTLIGHT_MARGIN + 0.001, `${label}: panel keeps the right margin`);
    ok(g.arrow.centerX > g.panel.left && g.arrow.centerX < g.panel.left + g.panel.width, `${label}: arrow meets the panel`);
    ok(g.arrow.tipY >= g.hole.y + g.hole.height, `${label}: arrow points up at the target from below`);
    eq(g.panel.top, g.arrow.baseY, `${label}: the panel hangs from the arrow`);
    const targetCenter = target.x - layer.x + target.width / 2;
    ok(
      Math.abs(g.arrow.centerX - targetCenter) < 1 || targetCenter < g.panel.left + 30 || targetCenter > g.panel.left + g.panel.width - 30,
      `${label}: arrow is centred on the target unless clamped at the panel edge`,
    );
    ok(g.arrow.centerX >= g.hole.x && g.arrow.centerX <= g.hole.x + g.hole.width, `${label}: arrow points into the spotlight`);
    const covered = g.scrim.top.height + g.scrim.bottom.height + g.hole.height;
    eq(Math.round(covered), layer.height, `${label}: scrim bands and spotlight tile the full height`);
    eq(Math.round(g.scrim.left.width + g.hole.width + g.scrim.right.width), width, `${label}: scrim tiles the spotlight row`);
    ok(
      [g.scrim.top, g.scrim.bottom, g.scrim.left, g.scrim.right].every(r => r.width >= 0 && r.height >= 0),
      `${label}: no negative scrim rect`,
    );
  }
}
{
  // A low target flips the panel above it.
  const layer: Rect = { x: 0, y: 0, width: 390, height: 800 };
  const g = resolveHudSpotlightGeometry({ x: 20, y: 700, width: 100, height: 40 }, layer);
  eq(g.placement, 'above', 'a low target gets the panel above it');
  ok(g.arrow.tipY <= g.hole.y, 'the arrow points down at a low target');
  eq(g.panel.bottom, layer.height - g.arrow.baseY, 'the panel sits on the arrow from above');
}

console.log('hudLessons tests passed');
