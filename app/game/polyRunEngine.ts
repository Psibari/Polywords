// ============================================================
// POLY RUN ENGINE
// Pure function state machine. No side effects.
// ============================================================

import { Mask, SessionStep } from './types';

// Retuned 2026-07-13: bonus feathers now land where struggling and mid-tier
// players actually are (avg-run p50 ≈ 3200), instead of expert-only territory.
const FEATHER_MILESTONES = [3000, 10000] as const;

export type FeatherMilestone = (typeof FEATHER_MILESTONES)[number];

// ─── SCORING — single source of truth for chain multiplier + point math ─

export const BOSS_MYSTERY_BASE = 600;

export function chainMultiplierForStreak(streak: number): number {
  return Math.min(1 + Math.floor(streak / 3) * 0.5, 3.0);
}

export function realMaskPoints(opts: { isRare?: boolean; isBoss: boolean; chainMultiplier: number }): number {
  const base = opts.isRare ? 300 : 100;
  return Math.round(base * opts.chainMultiplier * (opts.isBoss ? 2 : 1));
}

export function trapMaskPoints(opts: { isBoss: boolean; chainMultiplier: number }): number {
  return Math.round((opts.isBoss ? 100 : 50) * opts.chainMultiplier);
}

export function mysteryMasteryPoints(chainMultiplier: number): number {
  return Math.round(BOSS_MYSTERY_BASE * chainMultiplier);
}

// Mercy: during a player's early hunts the run refuses to die once — Polly
// revives her prey instead of ending the game. How many feathers she leaves
// behind tapers as the player racks up runs (see FLEDGLING/GRACE tiers in
// useGameStore) — a hard full/nothing cliff felt unfair, so this now
// accepts the revive amount per game rather than hardcoding one value.

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
  // 0 = no mercy left/available this game; >0 = lives granted on next revive.
  mercyReviveLives: number;
  mercyTriggered: boolean;
  bossOutcome: 'pending' | 'mastered' | 'haunted';
  bossFlawless: boolean;
  mysteryTotal: number;
  mysteryResolved: number;
  // UI-session state for the boss gauntlet's feather-row inert visual and
  // (future) count-up indicator — not engine logic, so no pure functions
  // here beyond this type/initial value.
  gauntletActive: boolean;
  gauntletCorrectCount: number;
};

type SwipeHistory = Pick<GameState, 'swipedUpIds' | 'swipedDownIds'>;

export function isMaskResolved(state: SwipeHistory, maskId: string): boolean {
  return state.swipedUpIds.includes(maskId) || state.swipedDownIds.includes(maskId);
}

export function getUnresolvedMaskIds(
  state: SwipeHistory,
  masks: readonly Mask[],
): string[] {
  return masks
    .filter(mask => !isMaskResolved(state, mask.id))
    .map(mask => mask.id);
}

function shuffleMasks(masks: Mask[]): Mask[] {
  const arr = [...masks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGame(
  steps: SessionStep[],
  mercyReviveLives = 0,
): GameState {
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
    lives: 6,
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
    mercyReviveLives,
    mercyTriggered: false,
    bossOutcome: 'pending',
    bossFlawless: false,
    mysteryTotal: 0,
    mysteryResolved: 0,
    gauntletActive: false,
    gauntletCorrectCount: 0,
  };
}

// ─── LIFE LOSS — shared resolution incl. Mercy revive ────────

type LifeLossResult = Pick<
  GameState,
  'lives' | 'mercyReviveLives' | 'mercyTriggered' | 'status'
>;

function resolveLifeLoss(state: GameState): LifeLossResult {
  const rawLives = state.lives - 1;
  if (rawLives <= 0 && state.mercyReviveLives > 0) {
    return {
      lives: state.mercyReviveLives,
      mercyReviveLives: 0,
      mercyTriggered: true,
      status: 'playing',
    };
  }
  const lives = Math.max(rawLives, 0);
  return {
    lives,
    mercyReviveLives: state.mercyReviveLives,
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
  const chainMultiplier = chainMultiplierForStreak(streak);
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
  if (isMaskResolved(state, maskId)) return state;

  const now = Date.now();
  const swipedUpIds = [...state.swipedUpIds, maskId];

  if (mask.isReal) {
    const su = computeStreakUpdate(state.streak);
    const points = realMaskPoints({ isRare: mask.isRare, isBoss: step.eventType === 'bossWord', chainMultiplier: su.chainMultiplier });
    const newCombo = state.combo + 1;
    const newScore = state.score + points;
    const hitMilestone = FEATHER_MILESTONES.find(
      m => newScore >= m && !state.featherMilestonesHit.includes(m)
    ) ?? null;
    // Economy lock: milestones no longer grant lives. The old score->life net was
    // regressive (only reached players already winning). Milestone still fires
    // for FX/celebration; lives are now flat.
    const newLives = state.lives;
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
  if (loss.status === 'gameOver') {
    const finalized = finalizeCurrentWordResult(nextState);
    const bossDied = step.kind === 'word' && step.eventType === 'bossWord';
    return bossDied ? { ...finalized, bossOutcome: 'haunted' as const } : finalized;
  }
  return nextState;
}

// ─── SWIPE DOWN — player rejects mask as a trap ───────────────

export function submitSwipeDown(state: GameState, maskId: string): GameState {
  if (state.status !== 'playing') return state;
  const step = currentStep(state);
  if (step.kind !== 'word') return state;

  const mask = step.masks.find(m => m.id === maskId);
  if (!mask) return state;
  if (isMaskResolved(state, maskId)) return state;

  const now = Date.now();
  const swipedDownIds = [...state.swipedDownIds, maskId];

  if (!mask.isReal) {
    const su = computeStreakUpdate(state.streak);
    const points = trapMaskPoints({ isBoss: step.eventType === 'bossWord', chainMultiplier: su.chainMultiplier });
    const newCombo = state.combo + 1;
    const newScore = state.score + points;
    const hitMilestone = FEATHER_MILESTONES.find(
      m => newScore >= m && !state.featherMilestonesHit.includes(m)
    ) ?? null;
    // Economy lock: milestones no longer grant lives. The old score->life net was
    // regressive (only reached players already winning). Milestone still fires
    // for FX/celebration; lives are now flat.
    const newLives = state.lives;
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
  if (loss.status === 'gameOver') {
    const finalized = finalizeCurrentWordResult(nextState);
    const bossDied = step.kind === 'word' && step.eventType === 'bossWord';
    return bossDied ? { ...finalized, bossOutcome: 'haunted' as const } : finalized;
  }
  return nextState;
}

// ─── BOSS MASTERY — scoring for the boss mystery tile judged correctly ─

export function submitBossMastery(state: GameState): GameState {
  const points = mysteryMasteryPoints(state.chainMultiplier);
  const newCombo = state.combo + 1;
  const newScore = state.score + points;
  const hitMilestone = FEATHER_MILESTONES.find(
    m => newScore >= m && !state.featherMilestonesHit.includes(m)
  ) ?? null;
  // Economy lock: milestones no longer grant lives (see the two sites above).
  const newLives = state.lives;
  return {
    ...state,
    score: newScore,
    lives: newLives,
    combo: newCombo,
    bestCombo: Math.max(state.bestCombo, newCombo),
    streak: state.streak + 1,
    chainMultiplier: chainMultiplierForStreak(state.streak + 1),
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

// ─── MYSTERY TILE RESOLUTION — single source of truth for boss/haunt outcome ─

export function beginMysteryGauntlet(state: GameState, total: number): GameState {
  return { ...state, mysteryTotal: total, mysteryResolved: 0 };
}

export function resolveMysteryTile(
  state: GameState,
  opts: { correct: boolean; visiblePerfect: boolean },
): GameState {
  const step = currentStep(state);
  const isBoss = step.kind === 'word' && step.eventType === 'bossWord';
  if (!isBoss) return state; // Returning Haunt: no score/outcome change here

  const resolved = state.mysteryResolved + 1;
  const total = Math.max(1, state.mysteryTotal);

  if (!opts.correct) {
    // Abort on first wrong — the gauntlet ends here.
    return { ...state, mysteryResolved: resolved, bossOutcome: 'haunted' };
  }

  if (resolved < total) {
    // Survived this tile, gauntlet continues. No outcome, no mastery score.
    return { ...state, mysteryResolved: resolved };
  }

  const scored = submitBossMastery(state);
  return {
    ...scored,
    mysteryResolved: resolved,
    bossOutcome: 'mastered',
    bossFlawless: opts.visiblePerfect,
  };
}

export function isMysteryTerminal(state: GameState, correct: boolean): boolean {
  if (!correct) return true;
  return state.mysteryResolved + 1 >= Math.max(1, state.mysteryTotal);
}

// ─── WRONG SWIPE — penalise without recording a specific mask ─

export function submitWrongSwipe(state: GameState): GameState {
  const step = currentStep(state);
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
  if (loss.status === 'gameOver') {
    const finalized = finalizeCurrentWordResult(nextState);
    const bossDied = step.kind === 'word' && step.eventType === 'bossWord';
    return bossDied ? { ...finalized, bossOutcome: 'haunted' as const } : finalized;
  }
  return nextState;
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

// Revive a failed Hunt in place. The fatal word result is removed because the
// same word is still active and must be finalized again after the player
// continues.
export function applyGoldFeather(state: GameState): GameState {
  if (state.status !== 'gameOver' || state.lives > 0) return state;

  const currentWordId = String(state.stepIndex);
  return {
    ...state,
    lives: 1,
    status: 'playing',
    feedback: 'Gold Feather',
    lastActionAt: Date.now(),
    pollyTrigger: null,
    wordResults: state.wordResults.filter(result => result.wordId !== currentWordId),
    bossOutcome: 'pending',
    bossFlawless: false,
    mysteryTotal: 0,
    mysteryResolved: 0,
  };
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
