import { SESSION } from "./session";
import { SessionStep, WordStep, PhraseBreakStep } from "./types";

export type GameState = {
  currentStepIndex: number;
  currentClueIndex: number;
  score: number;
  combo: number;
  lives: number;
  previousCorrectMeaningId: string | null;
  consecutiveSwitches: number;
  feedback: string | null;
  status: "playing" | "phraseBreak" | "gameOver" | "complete";
};

export function createGame(): GameState {
  return {
    currentStepIndex: 0,
    currentClueIndex: 0,
    score: 0,
    combo: 0,
    lives: 3,
    previousCorrectMeaningId: null,
    consecutiveSwitches: 0,
    feedback: null,
    status: "playing",
  };
}

function getCurrentStep(state: GameState): SessionStep {
  return SESSION[state.currentStepIndex];
}

export function submitAnswer(
  state: GameState,
  meaningId: string
): GameState {
  if (state.status !== "playing") return state;

  const step = getCurrentStep(state);

  if (step.kind !== "word") return state;

  const clue = step.clues[state.currentClueIndex];

  const correct = clue.correctMeaningId === meaningId;

  // ❌ WRONG
  if (!correct) {
    const lives = state.lives - 1;

    return {
      ...state,
      lives,
      combo: 0,
      feedback: "Wrong",
      status: lives <= 0 ? "gameOver" : "playing",
    };
  }

  // ✅ CORRECT
  let points = 100;

  let consecutiveSwitches = state.consecutiveSwitches;
  let feedback = "Correct";

  // Switch bonus
  if (
    state.previousCorrectMeaningId &&
    state.previousCorrectMeaningId !== meaningId
  ) {
    points += 50;
    consecutiveSwitches += 1;
    feedback = "Clean switch +50";
  } else {
    consecutiveSwitches = 0;
  }

  // Semantic flow
  if (consecutiveSwitches >= 3) {
    points *= 2;
    feedback = "Semantic Flow x2";
    consecutiveSwitches = 0;
  }

  // Event modifiers
  if (step.eventType === "speedRound") {
    points *= 2;
  }

  if (step.eventType === "bossWord") {
    points *= 2;
  }

  if (clue.isSlangClue) {
    points *= 2;
  }

  if (clue.isModernEraClue) {
    points += 300;
    feedback = "Era Bonus +300";
  }

  const score = state.score + points;
  const combo = state.combo + 1;

  const nextClueIndex = state.currentClueIndex + 1;

  // Move to next step if word finished
  if (nextClueIndex >= step.clues.length) {
    const nextStepIndex = state.currentStepIndex + 1;

    if (nextStepIndex >= SESSION.length) {
      return {
        ...state,
        score,
        combo,
        status: "complete",
      };
    }

    const nextStep = SESSION[nextStepIndex];

    if (nextStep.kind === "phraseBreak") {
      return {
        ...state,
        currentStepIndex: nextStepIndex,
        currentClueIndex: 0,
        score,
        combo,
        status: "phraseBreak",
        feedback: "Word cleared",
      };
    }

    return {
      ...state,
      currentStepIndex: nextStepIndex,
      currentClueIndex: 0,
      score,
      combo,
      previousCorrectMeaningId: meaningId,
      consecutiveSwitches,
      feedback: "Word cleared",
    };
  }

  return {
    ...state,
    currentClueIndex: nextClueIndex,
    score,
    combo,
    previousCorrectMeaningId: meaningId,
    consecutiveSwitches,
    feedback,
  };
}

export function submitPhraseAnswer(
  state: GameState,
  choice: string
): GameState {
  const step = getCurrentStep(state);

  if (step.kind !== "phraseBreak") return state;

  const correct = choice === step.correctChoice;

  let score = state.score;

  let feedback = "Wrong";

  if (correct) {
    score += 500;
    feedback = "Phrase cracked +500";
  }

  const nextStepIndex = state.currentStepIndex + 1;

  return {
    ...state,
    currentStepIndex: nextStepIndex,
    currentClueIndex: 0,
    score,
    status: "playing",
    feedback,
  };
}