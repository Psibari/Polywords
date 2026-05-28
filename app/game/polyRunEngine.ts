// ============================================================
// POLY RUN ENGINE
// Pure function state machine. No side effects.
// ============================================================

import { SESSION } from './session';
import { Mask, SessionStep } from './types';

export type GameStatus = 'playing' | 'phraseBreak' | 'gameOver' | 'complete';

export type WordResult = {
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
  stepIndex: number;
  swipedUpIds: string[];
  swipedDownIds: string[];
  revealedHiddenMasks: Record<string, boolean>;
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  mistakesOnWord: number;
  feedback: string | null;
  status: GameStatus;
  lastActionAt: number;
  pollyTrigger: null | 'intro' | 'perfect' | 'nearMiss' | 'bossEntry' | 'streak5' | 'locked' | 'cleanSplit' | 'hiddenReveal';
  wordResults: WordResult[];
  shuffledMasks: Record<number, Mask[]>;
};

function shuffleMasks(masks: Mask[]): Mask[] {
  const arr = [...masks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createGame(): GameState {
  const shuffledMasks: Record<number, Mask[]> = {};
  SESSION.forEach((step, i) => {
    if (step.kind === 'word') {
      shuffledMasks[i] = shuffleMasks(step.masks.filter(m => !m.isHidden));
    }
  });

  return {
    stepIndex: 0,
    swipedUpIds: [],
    swipedDownIds: [],
    revealedHiddenMasks: {},
    score: 0,
    lives: 3,
    combo: 0,
    bestCombo: 0,
    mistakesOnWord: 0,
    feedback: null,
    status: 'playing',
    lastActionAt: Date.now(),
    pollyTrigger: null,
    wordResults: [],
    shuffledMasks,
  };
}

export function currentStep(state: GameState): SessionStep {
  return SESSION[state.stepIndex];
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
    let points = mask.isRare ? 300 : 100;
    if (step.eventType === 'bossWord') points *= 2;
    const newCombo = state.combo + 1;
    return {
      ...state,
      swipedUpIds,
      score: state.score + points,
      combo: newCombo,
      bestCombo: Math.max(state.bestCombo, newCombo),
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
    const points = step.eventType === 'bossWord' ? 100 : 50;
    const newCombo = state.combo + 1;
    return {
      ...state,
      swipedDownIds,
      score: state.score + points,
      combo: newCombo,
      bestCombo: Math.max(state.bestCombo, newCombo),
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
    mistakesOnWord: state.mistakesOnWord + 1,
    feedback: 'Wrong call.',
    status: lives <= 0 ? 'gameOver' : 'playing',
    lastActionAt: Date.now(),
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

// ─── REVEAL HIDDEN — player tapped word to expose hidden mask ─

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
    pollyTrigger: null,
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
    .filter(m => !state.swipedUpIds.includes(m.id))
    .map(m => m.id);

  console.log('[completeWord]', {
    swipedUpIds: [...state.swipedUpIds],
    allRealMaskIds: step.masks
      .filter(m => m.isReal && !m.isHidden)
      .map(m => m.id),
    missedMaskIds,
  });

  const wordResult: WordResult = {
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

  const perfect = state.mistakesOnWord === 0;

  return advanceStep(state, {
    score: state.score,
    lives: state.lives,
    combo: perfect ? state.combo : 0,
    feedback: state.feedback,
    lastActionAt: Date.now(),
    pollyTrigger: null,
    wordResults: [...state.wordResults, wordResult],
  });
}

// ─── SUBMIT PHRASE ANSWER ────────────────────────────────────

export function submitPhraseAnswer(state: GameState, choice: string): GameState {
  if (state.status !== 'phraseBreak') return state;
  const step = currentStep(state);
  if (step.kind !== 'phraseBreak') return state;

  const correct = choice === step.correctChoice;
  const bonus = correct ? 500 : 0;

  const wordResult: WordResult = {
    word: step.phrase,
    correctUp: correct ? 1 : 0,
    correctDown: 0,
    wrongSwipes: correct ? 0 : 1,
    hiddenFound: false,
    missedMaskIds: [],
    wrongMaskIds: [],
    isBossWord: false,
    totalRealMasks: 1,
  };

  return advanceStep(state, {
    score: state.score + bonus,
    lives: state.lives,
    combo: correct ? state.combo + 1 : state.combo,
    feedback: correct ? 'COGNITIVE BREAKOUT +500' : 'Wrong origin story',
    lastActionAt: Date.now(),
    pollyTrigger: null,
    wordResults: [...state.wordResults, wordResult],
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
  };

  const nextStepIndex = state.stepIndex + 1;
  if (nextStepIndex >= SESSION.length) {
    return { ...base, status: 'complete' };
  }

  const nextStep = SESSION[nextStepIndex];
  return {
    ...base,
    stepIndex: nextStepIndex,
    status: nextStep.kind === 'phraseBreak' ? 'phraseBreak' : 'playing',
  };
}
