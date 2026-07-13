// ============================================================
// POLY RUN ENGINE
// Pure function state machine. No side effects.
// ============================================================

import { buildRunSession } from './session';
import { Mask, SessionStep } from './types';

// Retuned 2026-07-13: bonus feathers now land where struggling and mid-tier
// players actually are (avg-run p50 ≈ 3200), instead of expert-only territory.
const FEATHER_MILESTONES = [3000, 10000] as const;

export type FeatherMilestone = (typeof FEATHER_MILESTONES)[number];

// Fledgling Mercy: during a player's first hunts the run refuses to die once —
// Polly revives her prey with this many feathers instead of ending the game.
const MERCY_REVIVE_LIVES = 3;

export type GameStatus = 'playing' | 'gameOver' | 'complete';

export type WordResult = {
  wordId: string;
  roundKind: 'word' | 'phraseBreak' | 'switchback';
  word: string;
  correctUp: number;
  correctDown: number;
  wrongSwipes: number;
  missedMaskIds: string[];   // real masks the player rejected (swiped down)
  wrongMaskIds: string[];    // trap masks the player claimed as real (swiped up)
  isBossWord: boolean;
  totalRealMasks: number;    // non-hidden real masks available
};

export type GameState = {
  session: SessionStep[];
  stepIndex: number;
  swipedUpIds: string[];
  swipedDownIds: string[];
  revealedHiddenMasks: Record<string, boolean>;
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  streak: number;
  streakMilestone: 3 | 5 | 7 | null;
  chainMultiplier: number;
  mistakesOnWord: number;
  feedback: string | null;
  status: GameStatus;
  lastActionAt: number;
  pollyTrigger: null | 'intro' | 'perfect' | 'nearMiss' | 'bossEntry' | 'bossWord' | 'streak5' | 'locked' | 'cleanSplit' | 'bossMastery' | 'phraseBreak' | 'slangDrop' | 'slangCorrect' | 'slangMiss' | 'switchback' | 'switchbackFirst' | 'switchbackSecond' | 'switchbackFail' | 'ghostIntro' | 'ghostCorrect' | 'ghostWrong';
  wordResults: WordResult[];
  shuffledMasks: Record<number, Mask[]>;
  featherMilestone:     FeatherMilestone | null;
  featherMilestonesHit: number[];
  fledglingMercyAvailable: boolean;
  mercyTriggered: boolean;
};

function shuffleMasks(masks: Mask[]): Mask[] {
  const arr = [...masks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGame(
  ghostWordIds: string[] = [],
  session?: SessionStep[],
  fledgling = false,
): GameState {
  const steps = session ?? buildRunSession(ghostWordIds);
  const shuffledMasks: Record<number, Mask[]> = {};
  steps.forEach((step, i) => {
    if (step.kind === 'word') {
      shuffledMasks[i] = shuffleMasks(step.masks.filter(m => !m.isHidden));
    }
  });

  return {
    session: steps,
    stepIndex: 0,
    swipedUpIds: [],
    swipedDownIds: [],
    revealedHiddenMasks: {},
    score: 0,
    lives: 5,
    combo: 0,
    bestCombo: 0,
    streak: 0,
    streakMilestone: null,
    chainMultiplier: 1,
    mistakesOnWord: 0,
    feedback: null,
    status: 'playing',
    lastActionAt: Date.now(),
    pollyTrigger: null,
    wordResults: [],
    shuffledMasks,
    featherMilestone:     null,
    featherMilestonesHit: [],
    fledglingMercyAvailable: fledgling,
    mercyTriggered: false,
  };
}

// ─── LIFE LOSS — shared resolution incl. Fledgling Mercy ─────

type LifeLossResult = Pick<
  GameState,
  'lives' | 'fledglingMercyAvailable' | 'mercyTriggered' | 'status'
>;

function resolveLifeLoss(state: GameState): LifeLossResult {
  const rawLives = state.lives - 1;
  if (rawLives <= 0 && state.fledglingMercyAvailable) {
    return {
      lives: MERCY_REVIVE_LIVES,
      fledglingMercyAvailable: false,
      mercyTriggered: true,
      status: 'playing',
    };
  }
  const lives = Math.max(rawLives, 0);
  return {
    lives,
    fledglingMercyAvailable: state.fledglingMercyAvailable,
    mercyTriggered: state.mercyTriggered,
    status: lives <= 0 ? 'gameOver' : 'playing',
  };
}

export function currentStep(state: GameState): SessionStep {
  return state.session[state.stepIndex];
}

function buildCurrentWordResult(state: GameState): WordResult | null {
  const step = currentStep(state);
  if (step.kind !== 'word') return null;

  const realMasks = step.masks.filter(mask => mask.isReal);
  const trapMasks = step.masks.filter(mask => !mask.isReal);
  const nonHiddenReal = realMasks.filter(mask => !mask.isHidden);

  return {
    wordId: String(state.stepIndex),
    roundKind: 'word',
    word: step.word,
    correctUp: nonHiddenReal.filter(mask => state.swipedUpIds.includes(mask.id)).length,
    correctDown: trapMasks.filter(mask => state.swipedDownIds.includes(mask.id)).length,
    wrongSwipes: state.mistakesOnWord,
    missedMaskIds: realMasks
      .filter(mask => state.swipedDownIds.includes(mask.id))
      .map(mask => mask.id),
    wrongMaskIds: trapMasks
      .filter(mask => state.swipedUpIds.includes(mask.id))
      .map(mask => mask.id),
    isBossWord: step.eventType === 'bossWord',
    totalRealMasks: nonHiddenReal.length,
  };
}

function finalizeCurrentWordResult(state: GameState): GameState {
  const wordResult = buildCurrentWordResult(state);
  if (!wordResult) return state;

  const alreadyRecorded = state.wordResults.some(
    result => result.wordId === wordResult.wordId,
  );
  if (alreadyRecorded) return state;

  return {
    ...state,
    wordResults: [...state.wordResults, wordResult],
  };
}

// ─── STREAK HELPER ───────────────────────────────────────────

function computeStreakUpdate(currentStreak: number): {
  streak: number;
  chainMultiplier: number;
  streakMilestone: 3 | 5 | 7 | null;
} {
  const streak = currentStreak + 1;
  const chainMultiplier = Math.min(1 + Math.floor(streak / 3) * 0.5, 3.0);
  let streakMilestone: 3 | 5 | 7 | null = null;
  if (streak === 3 || streak === 5 || streak === 7) streakMilestone = streak as 3 | 5 | 7;
  return { streak, chainMultiplier, streakMilestone };
}

// ─── SWIPE UP — player claims mask as a real meaning ─────────

export function submitSwipeUp(state: GameState, maskId: string): GameState {
  if (state.status !== 'playing') return state;
  const step = currentStep(state);
  if (step.kind !== 'word') return state;

  const mask = step.masks.find(m => m.id === maskId);
  if (!mask) return state;

  const now = Date.now();
  const swipedUpIds = [...state.swipedUpIds, maskId];

  if (mask.isReal) {
    const su = computeStreakUpdate(state.streak);
    let points = Math.round((mask.isRare ? 300 : 100) * su.chainMultiplier);
    if (step.eventType === 'bossWord') points *= 2;
    const newCombo = state.combo + 1;
    const newScore = state.score + points;
    const hitMilestone = FEATHER_MILESTONES.find(
      m => newScore >= m && !state.featherMilestonesHit.includes(m)
    ) ?? null;
    const newLives = hitMilestone
      ? Math.min(state.lives + 1, 6)
      : state.lives;
    const newMilestonesHit = hitMilestone
      ? [...state.featherMilestonesHit, hitMilestone]
      : state.featherMilestonesHit;
    return {
      ...state,
      swipedUpIds,
      score: newScore,
      lives: newLives,
      combo: newCombo,
      bestCombo: Math.max(state.bestCombo, newCombo),
      streak: su.streak,
      chainMultiplier: su.chainMultiplier,
      streakMilestone: su.streakMilestone,
      featherMilestone:     hitMilestone as FeatherMilestone | null,
      featherMilestonesHit: newMilestonesHit,
      feedback: `+${points}`,
      lastActionAt: now,
      pollyTrigger: null,
    };
  }

  // wrong: claimed a trap as real
  const loss = resolveLifeLoss(state);
  const nextState: GameState = {
    ...state,
    ...loss,
    swipedUpIds,
    combo: 0,
    streak: 0,
    streakMilestone: null,
    chainMultiplier: 1,
    mistakesOnWord: state.mistakesOnWord + 1,
    feedback: 'Not a meaning',
    lastActionAt: now,
    pollyTrigger: 'nearMiss',
  };
  return loss.status === 'gameOver' ? finalizeCurrentWordResult(nextState) : nextState;
}

// ─── SWIPE DOWN — player rejects mask as a trap ───────────────

export function submitSwipeDown(state: GameState, maskId: string): GameState {
  if (state.status !== 'playing') return state;
  const step = currentStep(state);
  if (step.kind !== 'word') return state;

  const mask = step.masks.find(m => m.id === maskId);
  if (!mask) return state;

  const now = Date.now();
  const swipedDownIds = [...state.swipedDownIds, maskId];

  if (!mask.isReal) {
    const su = computeStreakUpdate(state.streak);
    const points = Math.round((step.eventType === 'bossWord' ? 100 : 50) * su.chainMultiplier);
    const newCombo = state.combo + 1;
    const newScore = state.score + points;
    const hitMilestone = FEATHER_MILESTONES.find(
      m => newScore >= m && !state.featherMilestonesHit.includes(m)
    ) ?? null;
    const newLives = hitMilestone
      ? Math.min(state.lives + 1, 6)
      : state.lives;
    const newMilestonesHit = hitMilestone
      ? [...state.featherMilestonesHit, hitMilestone]
      : state.featherMilestonesHit;
    return {
      ...state,
      swipedDownIds,
      score: newScore,
      lives: newLives,
      combo: newCombo,
      bestCombo: Math.max(state.bestCombo, newCombo),
      streak: su.streak,
      chainMultiplier: su.chainMultiplier,
      streakMilestone: su.streakMilestone,
      featherMilestone:     hitMilestone as FeatherMilestone | null,
      featherMilestonesHit: newMilestonesHit,
      feedback: `Trap spotted +${points}`,
      lastActionAt: now,
      pollyTrigger: null,
    };
  }

  // wrong: rejected a real meaning
  const loss = resolveLifeLoss(state);
  const nextState: GameState = {
    ...state,
    ...loss,
    swipedDownIds,
    combo: 0,
    streak: 0,
    streakMilestone: null,
    chainMultiplier: 1,
    mistakesOnWord: state.mistakesOnWord + 1,
    feedback: 'Actually a meaning',
    lastActionAt: now,
    pollyTrigger: 'nearMiss',
  };
  return loss.status === 'gameOver' ? finalizeCurrentWordResult(nextState) : nextState;
}

// ─── BOSS MASTERY — scoring for the boss mystery tile judged correctly ─

export function submitBossMastery(state: GameState): GameState {
  const points = Math.round(600 * state.chainMultiplier);
  const newCombo = state.combo + 1;
  const newScore = state.score + points;
  const hitMilestone = FEATHER_MILESTONES.find(
    m => newScore >= m && !state.featherMilestonesHit.includes(m)
  ) ?? null;
  const newLives = hitMilestone ? Math.min(state.lives + 1, 6) : state.lives;
  return {
    ...state,
    score: newScore,
    lives: newLives,
    combo: newCombo,
    bestCombo: Math.max(state.bestCombo, newCombo),
    streak: state.streak + 1,
    chainMultiplier: Math.min(1 + Math.floor((state.streak + 1) / 3) * 0.5, 3.0),
    streakMilestone: null,
    featherMilestone: hitMilestone as FeatherMilestone | null,
    featherMilestonesHit: hitMilestone
      ? [...state.featherMilestonesHit, hitMilestone]
      : state.featherMilestonesHit,
    feedback: `+${points}`,
    lastActionAt: Date.now(),
    pollyTrigger: 'bossMastery',
  };
}

// ─── WRONG SWIPE — penalise without recording a specific mask ─

export function submitWrongSwipe(state: GameState): GameState {
  const loss = resolveLifeLoss(state);
  const nextState: GameState = {
    ...state,
    ...loss,
    combo: 0,
    streak: 0,
    streakMilestone: null,
    chainMultiplier: 1,
    mistakesOnWord: state.mistakesOnWord + 1,
    feedback: 'Wrong call.',
    lastActionAt: Date.now(),
  };
  return loss.status === 'gameOver' ? finalizeCurrentWordResult(nextState) : nextState;
}

// ─── CONSUME MERCY — clear the revive flag after UI has handled it ─

export function consumeMercy(state: GameState): GameState {
  return { ...state, mercyTriggered: false };
}

// ─── CONSUME MILESTONE — clear milestone after UI has handled it ─

export function consumeMilestone(state: GameState): GameState {
  return { ...state, streakMilestone: null };
}

export function consumeFeatherMilestone(state: GameState): GameState {
  return { ...state, featherMilestone: null };
}

// ─── ADD BONUS SCORE — for split tile results ─────────────────

export function addBonusScore(state: GameState, points: number): GameState {
  return {
    ...state,
    score:        state.score + points,
    feedback:     `+${points}`,
    lastActionAt: Date.now(),
  };
}

// ─── COMPLETE WORD — called by UI after all tiles are judged ─

export function completeWord(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  const step = currentStep(state);
  if (step.kind !== 'word') return state;

  const finalizedState = finalizeCurrentWordResult(state);
  const perfect = state.mistakesOnWord === 0;

  return advanceStep(finalizedState, {
    score: state.score,
    lives: state.lives,
    combo: perfect ? state.combo : 0,
    feedback: state.feedback,
    lastActionAt: Date.now(),
    pollyTrigger: null,
    wordResults: finalizedState.wordResults,
  });
}

// ─── STEP ADVANCEMENT ────────────────────────────────────────

type StepUpdate = {
  score: number;
  lives: number;
  combo: number;
  feedback: string | null;
  lastActionAt: number;
  pollyTrigger: GameState['pollyTrigger'];
  wordResults: WordResult[];
};

function advanceStep(state: GameState, update: StepUpdate): GameState {
  const base: GameState = {
    ...state,
    ...update,
    swipedUpIds: [],
    swipedDownIds: [],
    mistakesOnWord: 0,
    revealedHiddenMasks: {},
  };

  const nextStepIndex = state.stepIndex + 1;
  if (nextStepIndex >= state.session.length) {
    return { ...base, status: 'complete' };
  }

  return {
    ...base,
    stepIndex: nextStepIndex,
    status: 'playing',
  };
}
