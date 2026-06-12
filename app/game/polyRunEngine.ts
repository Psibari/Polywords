// ============================================================
// POLY RUN ENGINE
// Pure function state machine. No side effects.
// ============================================================

import { buildRunSession } from './session';
import { Mask, SessionStep } from './types';

const FEATHER_MILESTONES = [8000, 16000] as const;

export type GameStatus = 'playing' | 'gameOver' | 'complete';

export type WordResult = {
  wordId: string;
  roundKind: 'word' | 'phraseBreak' | 'switchback';
  word: string;
  correctUp: number;
  correctDown: number;
  wrongSwipes: number;
  hiddenFound: boolean;
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
  pollyTrigger: null | 'intro' | 'perfect' | 'nearMiss' | 'bossEntry' | 'bossWord' | 'streak5' | 'locked' | 'cleanSplit' | 'hiddenReveal' | 'phraseBreak' | 'slangDrop' | 'slangCorrect' | 'slangMiss' | 'switchback' | 'switchbackFirst' | 'switchbackSecond' | 'switchbackFail' | 'ghostIntro' | 'ghostCorrect' | 'ghostWrong';
  wordResults: WordResult[];
  shuffledMasks: Record<number, Mask[]>;
  featherMilestone:     8000 | 16000 | null;
  featherMilestonesHit: number[];
};

function shuffleMasks(masks: Mask[]): Mask[] {
  const arr = [...masks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGame(ghostWordIds: string[] = [], session?: SessionStep[]): GameState {
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
  };
}

export function currentStep(state: GameState): SessionStep {
  return state.session[state.stepIndex];
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
      featherMilestone:     hitMilestone as 8000 | 16000 | null,
      featherMilestonesHit: newMilestonesHit,
      feedback: `+${points}`,
      lastActionAt: now,
      pollyTrigger: null,
    };
  }

  // wrong: claimed a trap as real
  const lives = Math.max(state.lives - 1, 0);
  return {
    ...state,
    swipedUpIds,
    lives,
    combo: 0,
    streak: 0,
    streakMilestone: null,
    chainMultiplier: 1,
    mistakesOnWord: state.mistakesOnWord + 1,
    feedback: 'Not a meaning',
    status: lives <= 0 ? 'gameOver' : 'playing',
    lastActionAt: now,
    pollyTrigger: 'nearMiss',
  };
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
      featherMilestone:     hitMilestone as 8000 | 16000 | null,
      featherMilestonesHit: newMilestonesHit,
      feedback: `Trap spotted +${points}`,
      lastActionAt: now,
      pollyTrigger: null,
    };
  }

  // wrong: rejected a real meaning
  const lives = Math.max(state.lives - 1, 0);
  return {
    ...state,
    swipedDownIds,
    lives,
    combo: 0,
    streak: 0,
    streakMilestone: null,
    chainMultiplier: 1,
    mistakesOnWord: state.mistakesOnWord + 1,
    feedback: 'Actually a meaning',
    status: lives <= 0 ? 'gameOver' : 'playing',
    lastActionAt: now,
    pollyTrigger: 'nearMiss',
  };
}

// ─── WRONG SWIPE — penalise without recording a specific mask ─

export function submitWrongSwipe(state: GameState): GameState {
  const lives = Math.max(state.lives - 1, 0);
  return {
    ...state,
    lives,
    combo: 0,
    streak: 0,
    streakMilestone: null,
    chainMultiplier: 1,
    mistakesOnWord: state.mistakesOnWord + 1,
    feedback: 'Wrong call.',
    status: lives <= 0 ? 'gameOver' : 'playing',
    lastActionAt: Date.now(),
  };
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

// ─── REVEAL HIDDEN — player swiped to expose hidden mask ─

export function revealHidden(state: GameState, maskId: string): GameState {
  if (state.status !== 'playing') return state;
  const step = currentStep(state);
  if (step.kind !== 'word') return state;

  const mask = step.masks.find(m => m.id === maskId);
  if (!mask?.isHidden) return state;
  if (state.revealedHiddenMasks[maskId]) return state;

  const points = step.eventType === 'bossWord' ? 600 : 300;
  const newCombo = state.combo + 1;
  return {
    ...state,
    revealedHiddenMasks: { ...state.revealedHiddenMasks, [maskId]: true },
    score: state.score + points,
    combo: newCombo,
    bestCombo: Math.max(state.bestCombo, newCombo),
    feedback: `Hidden found! +${points}`,
    lastActionAt: Date.now(),
    pollyTrigger: 'hiddenReveal',
  };
}

// ─── COMPLETE WORD — called by UI after all tiles are judged ─

export function completeWord(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  const step = currentStep(state);
  if (step.kind !== 'word') return state;

  const realMasks = step.masks.filter(m => m.isReal);
  const trapMasks = step.masks.filter(m => !m.isReal);
  const hiddenMask = step.masks.find(m => m.isHidden);
  const nonHiddenReal = realMasks.filter(m => !m.isHidden);

  // Capture before advanceStep resets swipedUpIds / swipedDownIds
  const missedMaskIds = nonHiddenReal
    .filter(m => !state.swipedUpIds.includes(m.id) && !state.swipedDownIds.includes(m.id))
    .map(m => m.id);

  console.log('[completeWord]', {
    swipedUpIds: [...state.swipedUpIds],
    allRealMaskIds: step.masks
      .filter(m => m.isReal && !m.isHidden)
      .map(m => m.id),
    missedMaskIds,
  });

  const wordId = String(state.stepIndex);
  const wordResult: WordResult = {
    wordId,
    roundKind: 'word',
    word: step.word,
    correctUp: nonHiddenReal.filter(m => state.swipedUpIds.includes(m.id)).length,
    correctDown: trapMasks.filter(m => state.swipedDownIds.includes(m.id)).length,
    wrongSwipes: state.mistakesOnWord,
    hiddenFound: hiddenMask ? !!state.revealedHiddenMasks[hiddenMask.id] : false,
    missedMaskIds,
    wrongMaskIds: trapMasks
      .filter(m => state.swipedUpIds.includes(m.id))
      .map(m => m.id),
    isBossWord: step.eventType === 'bossWord',
    totalRealMasks: nonHiddenReal.length,
  };

  const alreadyRecorded = state.wordResults.some(r => r.wordId === wordId);
  const newWordResults = alreadyRecorded
    ? state.wordResults
    : [...state.wordResults, wordResult];

  const perfect = state.mistakesOnWord === 0;

  return advanceStep(state, {
    score: state.score,
    lives: state.lives,
    combo: perfect ? state.combo : 0,
    feedback: state.feedback,
    lastActionAt: Date.now(),
    pollyTrigger: null,
    wordResults: newWordResults,
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
