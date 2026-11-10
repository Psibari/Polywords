import {
  FIRST_RUN_FINE_MASK_IDS,
  ONBOARDING_VERSION,
  captureHudLessonEvents,
  completeHudLesson,
  createDefaultOnboardingState,
  devMercyArmAllowed,
  devResetHudLessons,
  dismissCompletedOnboardingHandoffOnResume,
  hydrateOnboardingState,
  isOrdinaryWordStep,
  mercyLessonOwnsRevive,
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
import {
  FLEDGLING_MERCY_LIVES,
  FLEDGLING_RUNS,
  GRACE_MERCY_LIVES,
  GRACE_RUNS,
} from './mercyPolicy';
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
for (const lesson of ['feather', 'multiplier', 'streakBreak', 'progress', 'armor', 'mercy'] as const) {
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
  // Deliberate exception to the rule above: armor shipped 2026-11-02, later
  // than every save in the wild, so an established player has never been
  // taught it and must still get it once.
  eq(
    hydratedVeteran.hudLessons.armor,
    false,
    'an older save still gets the armor lesson: it is newer than the save',
  );
  // Same exception for Mercy (2026-11-09): players revived before the lesson
  // existed were never told why, so they are taught it the next time it fires.
  eq(hydratedVeteran.hudLessons.mercy, false, 'an older save still gets the mercy lesson');
  eq(hydratedVeteran.hudLessons.mercyPendingRunSeed, null, 'an older save has no pending mercy lesson');
  const legacyNewcomer = JSON.stringify({ ...fresh, hudLessons: undefined });
  for (const lesson of ['feather', 'multiplier', 'streakBreak', 'progress', 'armor', 'mercy'] as const) {
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
  eq(
    resolveHudLesson(session.onboarding, session.game),
    'armor',
    '8: past 2.5× the armor lesson is due',
  );
  {
    const taught = completeHudLesson(session.onboarding, 'armor');
    eq(
      resolveHudLesson(taught, session.game),
      null,
      '8b: with armor taught, later tier-ups replay no lesson',
    );
  }
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
for (const lesson of ['feather', 'multiplier', 'streakBreak', 'progress', 'armor', 'mercy'] as const) {
  const full = resolveHudLessonPresentation(lesson, false, { mercyFeathers: 3 });
  const reduced = resolveHudLessonPresentation(lesson, true, { mercyFeathers: 3 });
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
  'THESE ARE YOUR FEATHERS. / THEY’RE YOUR LIVES. / WRONG CALLS COST ONE.',
  'feather copy',
);
eq(HUD_LESSON_CONTENT.feather.pollyLine, 'I’ll take that one.', 'feather Polly line');
eq(HUD_LESSON_CONTENT.feather.pollyPose, 'smug', 'feather: Polly is smug');
eq(
  resolveHudLessonPresentation('feather', false).spokenPolly,
  'Polly says, I’ll take that one.',
  'feather: the reply reads naturally to a screen reader',
);
eq(
  resolveHudLessonPresentation('feather', false).spokenCopy,
  'These are your feathers. They’re your lives. Wrong calls cost one.',
  'feather: the rule reads naturally to a screen reader',
);
eq(
  HUD_LESSON_CONTENT.multiplier.lines.join(' / '),
  'YOU’RE ON A RUN. / THREE CORRECT CALLS MOVE YOU UP A TIER. / REACH UNTRAPPABLE AND POLLY CAN’T TOUCH YOUR FEATHERS.',
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
eq(
  HUD_LESSON_CONTENT.armor.lines.join(' / '),
  'NINE CORRECT IN A ROW. / A WRONG CALL CAN’T COST YOU A LIFE WHILE THIS HOLDS. / IT STILL BREAKS YOUR RUN, AND THE SHIELD GOES WITH IT.',
  'armor copy',
);
eq(HUD_LESSON_CONTENT.armor.pollyLine, 'I’ll wait.', 'armor Polly line');
eq(HUD_LESSON_CONTENT.armor.pollyPose, 'rattled', 'Polly is rattled by armor, not smug');

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

// ── Armor lesson (Pete, 2026-11-03) ──────────────────────
{
  const taughtBasics = withLessons(fresh, { feather: true, multiplier: true, streakBreak: true });
  const untrappable = (over: Partial<GameState> = {}): GameState => ({
    ...freshGame(), chainMultiplier: 2.5, streak: 9, ...over,
  });

  eq(
    resolveHudLesson(taughtBasics, untrappable()),
    'armor',
    'armor is due the first time UNTRAPPABLE holds on an ordinary word',
  );
  eq(
    resolveHudLesson(taughtBasics, untrappable({ chainMultiplier: 2.0, streak: 6 })),
    null,
    'RAZOR SHARP is not far enough: no armor lesson below 2.5×',
  );
  // Armor does not exist in the gauntlet, so neither does its lesson.
  eq(
    resolveHudLesson(taughtBasics, untrappable({ gauntletActive: true })),
    null,
    'the gauntlet never makes the armor lesson due',
  );
  // Boss and Haunt own their choreography: the lesson waits, it is not lost.
  eq(
    resolveHudLesson(taughtBasics, untrappable({ stepIndex: bossIndex })),
    null,
    'UNTRAPPABLE first reached on the boss word waits for an ordinary word',
  );
  eq(
    resolveHudLesson(withLessons(taughtBasics, { armor: true }), untrappable()),
    null,
    'armor is taught once and never replays',
  );
  // The feather lesson is not a prerequisite: a clean run can reach
  // UNTRAPPABLE having never lost one, which is why the copy stands alone.
  eq(
    resolveHudLesson(withLessons(fresh, { multiplier: true }), untrappable()),
    'armor',
    'armor still teaches on a run that never lost a feather',
  );
  eq(
    resolveOnboardingInputMode(taughtBasics, untrappable()),
    'locked',
    'the armor lesson locks the next decision',
  );
  eq(HUD_LESSON_CONTENT.armor.target, 'momentumBar', 'armor spotlights the flipped momentum bar');
  ok(
    !HUD_LESSON_CONTENT.multiplier.lines.some(line => /SCORE|3×/.test(line)),
    'the run-meter lesson no longer promises a score or 3×',
  );
}

// ── Mercy lesson (2026-11-09) ───────────────────────────────
{
  // The copy's numbers come from the same constants startGame uses.
  eq(FLEDGLING_RUNS, 3, 'mercy: 3 feathers in Hunts 1-3');
  eq(GRACE_RUNS, 10, 'mercy: the net ends after 10 Hunts');
  eq(FLEDGLING_MERCY_LIVES, 3, 'mercy: fledgling revive gives 3');
  eq(GRACE_MERCY_LIVES, 2, 'mercy: grace revive gives 2');

  const taughtBasics = withLessons(fresh, {
    feather: true, multiplier: true, streakBreak: true, progress: true, armor: true,
  });
  function loseUntilMercy(reviveLives: number, onboarding: FirstRunOnboardingState, runSeed = seed): Session {
    let session: Session = { game: createGame(steps, reviveLives, runSeed, 0), onboarding };
    for (let i = 0; i < 30 && (session.game.mercyUsed ?? 0) === 0; i += 1) {
      session = decide(session, false);
    }
    eq(session.game.mercyUsed, 1, 'mercy: the revive fired');
    eq(session.game.status, 'playing', 'mercy: the Hunt goes on');
    return session;
  }

  const fledgling = loseUntilMercy(FLEDGLING_MERCY_LIVES, taughtBasics);
  eq(fledgling.game.lives, 3, 'mercy: the fledgling revive left 3 feathers');
  eq(resolveHudLesson(fledgling.onboarding, fledgling.game), 'mercy', 'mercy: due the moment the revive fires');
  eq(resolveOnboardingInputMode(fledgling.onboarding, fledgling.game), 'locked', 'mercy: the lesson locks the next decision');
  ok(mercyLessonOwnsRevive(fledgling.onboarding, fledgling.game.runSeed), 'mercy: the lesson replaces the float');
  // GameScreen gives the card the count stored when the revive fired.
  const cardFeathers = (session: Session) => (
    resolveHudLesson(session.onboarding, session.game) === 'mercy'
      ? session.onboarding.hudLessons.mercyPendingFeathers
      : null
  );
  eq(fledgling.onboarding.hudLessons.mercyPendingFeathers, 3, 'mercy: the revive amount is stored as it fires');
  const three = resolveHudLessonPresentation('mercy', false, { mercyFeathers: cardFeathers(fledgling) });
  eq(
    three.lines.join(' / '),
    'YOU’RE OUT OF FEATHERS. / POLLY GIVES 3 MERCY FEATHERS. / ONCE PER HUNT. / ONLY FOR YOUR FIRST 10 HUNTS.',
    'mercy copy, n = 3',
  );

  const grace = loseUntilMercy(GRACE_MERCY_LIVES, taughtBasics);
  eq(grace.game.lives, 2, 'mercy: the grace revive left 2 feathers');
  eq(grace.onboarding.hudLessons.mercyPendingFeathers, 2, 'mercy: the grace revive amount is stored');
  eq(
    resolveHudLessonPresentation('mercy', true, { mercyFeathers: cardFeathers(grace) }).lines.join(' / '),
    'YOU’RE OUT OF FEATHERS. / POLLY GIVES 2 MERCY FEATHERS. / ONCE PER HUNT. / ONLY FOR YOUR FIRST 10 HUNTS.',
    'mercy copy, n = 2',
  );

  // The card keeps the number it was given even if the feathers change after
  // the revive (the screenshot case: a DEV button set them to 1 mid-lesson).
  {
    const changed: Session = { ...fledgling, game: { ...fledgling.game, lives: 1 } };
    eq(resolveHudLesson(changed.onboarding, changed.game), 'mercy', 'mercy: still due after the feathers change');
    eq(
      resolveHudLessonPresentation('mercy', false, { mercyFeathers: cardFeathers(changed) }).lines[1],
      'POLLY GIVES 3 MERCY FEATHERS.',
      'mercy: the card keeps the revive amount, not the current feathers',
    );
  }
  // No stored count (an old or damaged save): the line drops the number cleanly.
  eq(
    resolveHudLessonPresentation('mercy', false, { mercyFeathers: null }).lines[1],
    'POLLY GIVES MERCY FEATHERS.',
    'mercy: with no count the card still reads cleanly',
  );
  ok(
    !resolveHudLessonPresentation('mercy', false).lines.some(line => line.includes('{')),
    'mercy: a missing count never shows the raw token',
  );
  eq(HUD_LESSON_CONTENT.mercy.pollyLine, 'I wasn’t finished watching you lose.', 'mercy Polly line');
  eq(HUD_LESSON_CONTENT.mercy.pollyPose, 'smug', 'mercy: Polly is smug');
  eq(HUD_LESSON_CONTENT.mercy.target, 'feathers', 'mercy spotlights the feather row');
  eq(HUD_LESSON_CONTENT.mercy.lines.length, 4, 'mercy: four lines, no extra jab');

  // Shown once: after it completes, a later Hunt's Mercy keeps the float.
  const taught = completeHudLesson(fledgling.onboarding, 'mercy');
  eq(taught.hudLessons.mercy, true, 'mercy: completing sets the flag');
  eq(taught.hudLessons.mercyPendingRunSeed, null, 'mercy: completing clears the pending Hunt');
  eq(taught.hudLessons.mercyPendingFeathers, null, 'mercy: completing clears the stored count');
  eq(resolveHudLesson(taught, fledgling.game), null, 'mercy: not due again in the same Hunt');
  ok(!mercyLessonOwnsRevive(taught, fledgling.game.runSeed), 'mercy: the float is back once taught');
  const later = loseUntilMercy(GRACE_MERCY_LIVES, taught, seed + 1);
  eq(resolveHudLesson(later.onboarding, later.game), null, 'mercy: shown once per save');
  ok(!mercyLessonOwnsRevive(later.onboarding, later.game.runSeed), 'mercy: later revives keep the float');
  eq(completeHudLesson(taught, 'mercy'), taught, 'mercy: completing twice changes nothing');

  // A revive on Polly's Word teaches nothing, so its float plays as usual.
  {
    const base = freshGame();
    const prev: GameState = { ...base, stepIndex: bossIndex, lives: 1, mistakesOnWord: 0, mercyUsed: 0 };
    const next: GameState = { ...prev, lives: 3, mistakesOnWord: 1, mercyUsed: 1, mercyTriggered: true };
    const captured = captureHudLessonEvents(taughtBasics, prev, next);
    eq(captured.hudLessons.mercyPendingRunSeed, null, 'mercy: a Boss-word revive is not captured');
    eq(captured.hudLessons.mercyPendingFeathers, null, 'mercy: a Boss-word revive stores no count');
    ok(!mercyLessonOwnsRevive(captured, next.runSeed), 'mercy: a Boss-word revive keeps the float');
  }

  // The DEV MERCY button (GameScreen) on a Hunt that has no revive: one
  // feather, revive armed at 3, streak 0. The next wrong swipe runs the real
  // revive and the real lesson capture.
  {
    const veteranGame = createGame(steps, 0, seed + 2, 0);
    eq(veteranGame.mercyReviveLives, 0, 'dev mercy: this Hunt starts with no revive');
    const armed: GameState = {
      ...veteranGame, lives: 1, mercyReviveLives: FLEDGLING_MERCY_LIVES, streak: 0, chainMultiplier: 1,
    };
    const afterMiss = decide({ game: armed, onboarding: taughtBasics }, false);
    eq(afterMiss.game.mercyUsed, 1, 'dev mercy: the next miss fires the real revive');
    eq(afterMiss.game.lives, 3, 'dev mercy: the revive gives 3');
    eq(resolveHudLesson(afterMiss.onboarding, afterMiss.game), 'mercy', 'dev mercy: the lesson is due');
    eq(afterMiss.onboarding.hudLessons.mercyPendingFeathers, 3, 'dev mercy: the card will say 3');
  }

  // The Polly's Word gap: a revive on the last card of the word before Polly's
  // Word. The board completes that word about a second after the swipe, right
  // as the card would appear, and the card cannot show on Polly's Word. So the
  // player must get the float instead: one or the other, never neither.
  {
    function reviveOnLastCard(stepIndex: number, cardsLeft: number): Session {
      const base: GameState = {
        ...freshGame(), stepIndex, lives: 1, mercyReviveLives: FLEDGLING_MERCY_LIVES, streak: 0, chainMultiplier: 1,
      };
      const visible = base.shuffledMasks[stepIndex];
      const judged = visible.slice(0, visible.length - cardsLeft);
      const ready: GameState = {
        ...base,
        swipedUpIds: judged.filter(mask => mask.isReal).map(mask => mask.id),
        swipedDownIds: judged.filter(mask => !mask.isReal).map(mask => mask.id),
      };
      const after = decide({ game: ready, onboarding: taughtBasics }, false);
      eq(after.game.mercyUsed, 1, `gap setup: the revive fired on word ${stepIndex}`);
      return after;
    }
    // What the player gets for this revive: the float now, or the card on this
    // word or the next (the board advances the word after the last card).
    function outcome(session: Session) {
      const gotFloat = !mercyLessonOwnsRevive(session.onboarding, session.game.runSeed);
      const advanced = completeWord(session.game);
      const gotCard = resolveHudLesson(session.onboarding, session.game) === 'mercy' &&
        resolveHudLesson(session.onboarding, advanced) === 'mercy';
      return { gotFloat, gotCard };
    }

    const lastOrdinary = bossIndex - 1;
    ok(isOrdinaryWordStep({ ...freshGame(), stepIndex: lastOrdinary }), 'gap setup: the word before Polly’s Word is ordinary');
    ok(isOrdinaryWordStep({ ...freshGame(), stepIndex: lastOrdinary - 1 }), 'gap setup: the word before that is ordinary');

    const beforeBoss = outcome(reviveOnLastCard(lastOrdinary, 1));
    ok(beforeBoss.gotFloat, 'gap: a revive on the last card before Polly’s Word plays the float');
    ok(!beforeBoss.gotCard, 'gap: and no card is promised that could not show');
    ok(beforeBoss.gotFloat !== beforeBoss.gotCard, 'gap: the player gets exactly one of card or float');

    const cardsRemain = outcome(reviveOnLastCard(lastOrdinary, 2));
    ok(!cardsRemain.gotFloat, 'gap control: with cards left on the word, the card owns the revive');
    eq(resolveHudLesson(reviveOnLastCard(lastOrdinary, 2).onboarding, reviveOnLastCard(lastOrdinary, 2).game), 'mercy', 'gap control: the card is due while cards remain');

    const beforeOrdinary = outcome(reviveOnLastCard(lastOrdinary - 1, 1));
    ok(!beforeOrdinary.gotFloat, 'gap control: before an ordinary word the card owns the revive');
    ok(beforeOrdinary.gotCard, 'gap control: and the card carries on to the next ordinary word');
  }

  // DEV MERCY guard: only on a live ordinary word with no lesson due or showing.
  {
    const allTaught = withLessons(fresh, {
      feather: true, multiplier: true, streakBreak: true, progress: true, armor: true, mercy: true,
    });
    const clean = freshGame();
    ok(devMercyArmAllowed(allTaught, clean), 'guard: allowed on a live ordinary word with no lesson due');
    ok(!devMercyArmAllowed(fledgling.onboarding, fledgling.game), 'guard: blocked while the Mercy card is due');
    const featherDue = {
      ...allTaught,
      hudLessons: { ...allTaught.hudLessons, feather: false, featherPendingRunSeed: clean.runSeed },
    };
    eq(resolveHudLesson(featherDue, clean), 'feather', 'guard setup: feather lesson due');
    ok(!devMercyArmAllowed(featherDue, clean), 'guard: blocked while the feather card is due');
    const armorDue = withLessons(allTaught, { armor: false });
    const armored: GameState = { ...clean, streak: 9, chainMultiplier: 2.5 };
    eq(resolveHudLesson(armorDue, armored), 'armor', 'guard setup: armor lesson due');
    ok(!devMercyArmAllowed(armorDue, armored), 'guard: blocked while the armor card is due');
    ok(!devMercyArmAllowed(allTaught, { ...clean, stepIndex: bossIndex }), 'guard: blocked on Polly’s Word');
    ok(!devMercyArmAllowed(allTaught, { ...clean, status: 'gameOver' }), 'guard: blocked when the Hunt is over');
  }

  // Saves: the flag and the stored count round-trip, old or damaged saves load
  // with no count, and DEV REPLAY LESSONS clears both.
  const saved = hydrateOnboardingState(JSON.stringify(fledgling.onboarding));
  eq(saved.hudLessons.mercyPendingRunSeed, fledgling.game.runSeed >>> 0, 'mercy: a pending lesson survives a resume');
  eq(saved.hudLessons.mercyPendingFeathers, 3, 'mercy: the stored count survives a reload');
  {
    const { mercyPendingFeathers: _dropped, ...withoutCount } = fledgling.onboarding.hudLessons;
    const oldSave = hydrateOnboardingState(JSON.stringify({ ...fledgling.onboarding, hudLessons: withoutCount }));
    eq(oldSave.hudLessons.mercyPendingFeathers, null, 'mercy: an old save loads with no count');
    for (const bad of [0, -2, 2.5, '3', true, null]) {
      const damaged = hydrateOnboardingState(JSON.stringify({
        ...fledgling.onboarding,
        hudLessons: { ...fledgling.onboarding.hudLessons, mercyPendingFeathers: bad },
      }));
      eq(damaged.hudLessons.mercyPendingFeathers, null, `mercy: a stored count of ${JSON.stringify(bad)} loads as none`);
    }
  }
  eq(hydrateOnboardingState(JSON.stringify(taught)).hudLessons.mercy, true, 'mercy: a taught flag survives a reload');
  const replayed = devResetHudLessons(fledgling.onboarding);
  eq(replayed.hudLessons.mercy, false, 'mercy: DEV REPLAY LESSONS clears the flag');
  eq(replayed.hudLessons.mercyPendingRunSeed, null, 'mercy: DEV REPLAY LESSONS clears the pending Hunt');
  eq(replayed.hudLessons.mercyPendingFeathers, null, 'mercy: DEV REPLAY LESSONS clears the stored count');
}

console.log('hudLessons tests passed');
