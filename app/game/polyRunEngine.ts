// ============================================================
// POLY RUN ENGINE
// Pure function state machine. No side effects.
// All game logic lives here. UI just calls these functions.
// ============================================================

import { SESSION } from './session';
import { SessionStep, WordStep } from './types';

export type GameStatus = 'playing' | 'phraseBreak' | 'gameOver' | 'complete';

export type GameState = {
  stepIndex: number;
  selectedMaskIds: string[];
  score: number;
  lives: number;
  combo: number;
  mistakesOnWord: number;
  revealedHiddenMasks: Record<string, boolean>;
  feedback: string | null;
  status: GameStatus;
  lastActionAt: number;
  pollyTrigger: null | 'intro' | 'perfect' | 'nearMiss' | 'bossEntry' | 'streak5';
};

export function createGame(): GameState {
  return {
    stepIndex: 0,
    selectedMaskIds: [],
    score: 0,
    lives: 3,
    combo: 0,
    mistakesOnWord: 0,
    revealedHiddenMasks: {},
    feedback: null,
    status: 'playing',
    lastActionAt: Date.now(),
    pollyTrigger: null,
  };
}

export function currentStep(state: GameState): SessionStep {
  return SESSION[state.stepIndex];
}

// ─── TOGGLE MASK SELECTION ───────────────────────────────────

export function submitAnswer(state: GameState, maskId: string): GameState {
  if (state.status !== 'playing') return state;

  const step = currentStep(state);
  if (step.kind !== 'word') return state;

  const already = state.selectedMaskIds.includes(maskId);
  const selectedMaskIds = already
    ? state.selectedMaskIds.filter(id => id !== maskId)
    : [...state.selectedMaskIds, maskId];

  return { ...state, selectedMaskIds, lastActionAt: Date.now() };
}

// ─── LOCK ROUND ──────────────────────────────────────────────

export function lockRound(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  const step = currentStep(state);
  if (step.kind !== 'word') return state;

  const maskMap = new Map(step.masks.map(m => [m.id, m]));
  const now = Date.now();
  const newRevealedHidden = { ...state.revealedHiddenMasks };

  const correct = state.selectedMaskIds.filter(id => maskMap.get(id)?.isReal);
  const wrong   = state.selectedMaskIds.filter(id => !maskMap.get(id)?.isReal);
  const realMasks = step.masks.filter(m => m.isReal);
  const missed  = realMasks.filter(m => !state.selectedMaskIds.includes(m.id));

  const perfectClear = missed.length === 0 && wrong.length === 0;

  let points = 0;
  for (const id of correct) {
    const mask = maskMap.get(id)!;
    if (mask.isRare) {
      points += 300;
    } else if (mask.isHidden && !newRevealedHidden[id]) {
      newRevealedHidden[id] = true;
      points += 300;
    } else {
      points += 100;
    }
  }

  if (perfectClear) points += 500;
  if (step.eventType === 'bossWord') points *= 2;

  const lives = Math.max(state.lives - wrong.length, 0);
  const mistakesOnWord = state.mistakesOnWord + wrong.length + missed.length;

  const feedbackParts: string[] = [];
  if (perfectClear) feedbackParts.push('PERFECT CLEAR +500');
  if (step.eventType === 'bossWord') feedbackParts.push('BOSS x2');
  const feedback = feedbackParts.length > 0
    ? feedbackParts.join(' · ')
    : `+${points}`;

  if (lives <= 0) {
    return {
      ...state,
      score: state.score + points,
      lives: 0,
      mistakesOnWord,
      revealedHiddenMasks: newRevealedHidden,
      feedback,
      status: 'gameOver',
      lastActionAt: now,
      pollyTrigger: null,
    };
  }

  return advanceStep(state, {
    score: state.score + points,
    combo: perfectClear ? state.combo + 1 : 0,
    lives,
    mistakesOnWord,
    revealedHiddenMasks: newRevealedHidden,
    feedback,
    lastActionAt: now,
    pollyTrigger: perfectClear ? 'perfect' : null,
  });
}

// ─── SUBMIT PHRASE ANSWER ────────────────────────────────────

export function submitPhraseAnswer(state: GameState, choice: string): GameState {
  if (state.status !== 'phraseBreak') return state;

  const step = currentStep(state);
  if (step.kind !== 'phraseBreak') return state;

  const correct = choice === step.correctChoice;
  const now = Date.now();

  return advanceStep(state, {
    score: state.score + (correct ? 500 : 0),
    combo: correct ? state.combo + 1 : state.combo,
    lives: state.lives,
    mistakesOnWord: 0,
    revealedHiddenMasks: state.revealedHiddenMasks,
    feedback: correct ? 'COGNITIVE BREAKOUT +500' : 'Wrong origin story',
    lastActionAt: now,
    pollyTrigger: null,
  });
}

// ─── STEP ADVANCEMENT ────────────────────────────────────────

type StepUpdate = {
  score: number;
  combo: number;
  lives: number;
  mistakesOnWord: number;
  revealedHiddenMasks: Record<string, boolean>;
  feedback: string;
  lastActionAt: number;
  pollyTrigger: GameState['pollyTrigger'];
};

function advanceStep(state: GameState, update: StepUpdate): GameState {
  const nextStepIndex = state.stepIndex + 1;

  if (nextStepIndex >= SESSION.length) {
    return { ...state, ...update, selectedMaskIds: [], status: 'complete' };
  }

  const nextStep = SESSION[nextStepIndex];
  return {
    ...state,
    ...update,
    stepIndex: nextStepIndex,
    selectedMaskIds: [],
    mistakesOnWord: 0,
    status: nextStep.kind === 'phraseBreak' ? 'phraseBreak' : 'playing',
  };
}
