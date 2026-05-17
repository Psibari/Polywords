// ============================================================
// POLY RUN ENGINE
// Pure function state machine. No side effects.
// All game logic lives here. UI just calls these functions.
// ============================================================

import { SESSION, pickClues } from './session';
import { SessionStep, WordStep, Clue } from './types';

export type GameStatus = 'playing' | 'phraseBreak' | 'gameOver' | 'complete';

export type GameState = {
  stepIndex: number;
  clueIndex: number;
  selectedClues: Clue[][];
  score: number;
  lives: number;
  combo: number;
  consecutiveSwitches: number;
  previousMeaningId: string | null;
  revealedHiddenMeanings: Record<string, boolean>;
  mistakesOnWord: number;
  feedback: string | null;
  status: GameStatus;
  lastActionAt: number;
};

export function createGame(): GameState {
  return {
    stepIndex: 0,
    clueIndex: 0,
    selectedClues: SESSION.map(step =>
      step.kind === 'word' ? pickClues(step, step.meanings.length + 1) : []
    ),
    score: 0,
    lives: 3,
    combo: 0,
    consecutiveSwitches: 0,
    previousMeaningId: null,
    revealedHiddenMeanings: {},
    mistakesOnWord: 0,
    feedback: null,
    status: 'playing',
    lastActionAt: Date.now(),
  };
}

export function currentStep(state: GameState): SessionStep {
  return SESSION[state.stepIndex];
}

// ─── SUBMIT ANSWER ───────────────────────────────────────────

export function submitAnswer(state: GameState, meaningId: string): GameState {
  if (state.status !== 'playing') return state;

  const step = currentStep(state);
  if (step.kind !== 'word') return state;

  const clue = state.selectedClues[state.stepIndex][state.clueIndex];
  const correct = clue.correctMeaningId === meaningId;
  const now = Date.now();

  if (!correct) {
    const lives = state.lives - 1;
    return {
      ...state,
      lives,
      combo: 0,
      consecutiveSwitches: 0,
      mistakesOnWord: state.mistakesOnWord + 1,
      feedback: wrongFeedback(step),
      status: lives <= 0 ? 'gameOver' : 'playing',
      lastActionAt: now,
    };
  }

  return scoreCorrect(state, step, clue, meaningId, now);
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
    consecutiveSwitches: state.consecutiveSwitches,
    previousMeaningId: state.previousMeaningId,
    revealedHiddenMeanings: state.revealedHiddenMeanings,
    feedback: correct ? 'COGNITIVE BREAKOUT +500' : 'Wrong origin story',
    lastActionAt: now,
  });
}

// ─── SCORING ─────────────────────────────────────────────────

function scoreCorrect(
  state: GameState,
  step: WordStep,
  clue: WordStep['clues'][number],
  meaningId: string,
  now: number,
): GameState {
  let points = 100;
  const feedbackParts: string[] = [];
  const newRevealedHidden = { ...state.revealedHiddenMeanings };

  // Hidden meaning discovery (+300 first time only)
  const meaning = step.meanings.find(m => m.id === meaningId);
  if (meaning?.hidden && !newRevealedHidden[meaningId]) {
    newRevealedHidden[meaningId] = true;
    points += 300;
    feedbackParts.push('HIDDEN +300');
  }

  // Modern era clue bonus (+300)
  if (clue.isModernEraClue) {
    points += 300;
    feedbackParts.push('ERA SHIFT +300');
  }

  // Switch bonus (+50)
  const switched =
    state.previousMeaningId !== null &&
    state.previousMeaningId !== meaningId;
  if (switched) points += 50;

  // Consecutive switches tracking
  const rawConsecSwitches = switched ? state.consecutiveSwitches + 1 : 0;

  // Semantic Flow: 3 consecutive switches → x2, reset counter
  let consecSwitches = rawConsecSwitches;
  if (rawConsecSwitches >= 3) {
    points = Math.round(points * 2);
    consecSwitches = 0;
    feedbackParts.push('SEMANTIC FLOW x2');
  }

  // Event multipliers (speedRound or bossWord — mutually exclusive)
  if (step.eventType === 'speedRound') {
    points = Math.round(points * 2);
    feedbackParts.push('SPEED x2');
  } else if (step.eventType === 'bossWord') {
    points = Math.round(points * 2);
    feedbackParts.push('BOSS x2');
  }

  // Slang clue multiplier (x2, stacks on top)
  if (clue.isSlangClue) {
    points = Math.round(points * 2);
    feedbackParts.push('SLANG x2');
  }

  const feedback = feedbackParts.length > 0
    ? feedbackParts.join(' · ')
    : `+${points}`;

  const score = state.score + points;
  const combo = state.combo + 1;
  const nextClueIndex = state.clueIndex + 1;

  // Word complete — advance to next step
  if (nextClueIndex >= state.selectedClues[state.stepIndex].length) {
    return advanceStep(state, {
      score,
      combo,
      consecutiveSwitches: consecSwitches,
      previousMeaningId: meaningId,
      revealedHiddenMeanings: newRevealedHidden,
      feedback,
      lastActionAt: now,
    });
  }

  return {
    ...state,
    clueIndex: nextClueIndex,
    score,
    combo,
    consecutiveSwitches: consecSwitches,
    previousMeaningId: meaningId,
    revealedHiddenMeanings: newRevealedHidden,
    feedback,
    lastActionAt: now,
  };
}

// ─── STEP ADVANCEMENT ────────────────────────────────────────

type StepUpdate = {
  score: number;
  combo: number;
  consecutiveSwitches: number;
  previousMeaningId: string | null;
  revealedHiddenMeanings: Record<string, boolean>;
  feedback: string;
  lastActionAt: number;
};

function advanceStep(state: GameState, update: StepUpdate): GameState {
  const nextStepIndex = state.stepIndex + 1;

  if (nextStepIndex >= SESSION.length) {
    return { ...state, ...update, status: 'complete' };
  }

  const nextStep = SESSION[nextStepIndex];
  return {
    ...state,
    ...update,
    stepIndex: nextStepIndex,
    clueIndex: 0,
    mistakesOnWord: 0,
    status: nextStep.kind === 'phraseBreak' ? 'phraseBreak' : 'playing',
  };
}

// ─── FEEDBACK ────────────────────────────────────────────────

function wrongFeedback(step: WordStep): string {
  if (step.eventType === 'bossWord') return 'BOSS HITS BACK';
  if (step.emotionalRole === 'hesitation') return 'Caught by the decoy';
  return 'Wrong meaning';
}
