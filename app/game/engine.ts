import { SESSION } from "./session";
import { SessionStep } from "./types";

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

  revealedMeanings: Record<string, boolean>;
  mistakesInWord: number;
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
    revealedMeanings: {},
    mistakesInWord: 0,
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
      mistakesInWord: state.mistakesInWord + 1,
      feedback: "Mistake!",
      status: lives <= 0 ? "gameOver" : "playing",
    };
  }

  // ✅ CORRECT
  let points = 100;
  let feedback = "Correct";
  let consecutiveSwitches = state.consecutiveSwitches;

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

  if (consecutiveSwitches >= 3) {
    points *= 2;
    feedback = "Flow x2";
    consecutiveSwitches = 0;
  }

  let revealedMeanings = { ...state.revealedMeanings };
  const meaning = step.meanings.find((m) => m.id === meaningId);

  if (meaning?.hidden && !revealedMeanings[meaningId]) {
    revealedMeanings[meaningId] = true;
    points += 300;
    feedback = "Discovered +300";
  }

  if (step.eventType === "speedRound") points *= 2;
  if (step.eventType === "bossWord") points *= 2;

  const score = state.score + points;
  const combo = state.combo + 1;

  const nextClueIndex = state.currentClueIndex + 1;

  // ✅ WORD COMPLETE
  if (nextClueIndex >= step.clues.length) {
    const nextStepIndex = state.currentStepIndex + 1;

    let bonus = 0;

    // 🔥 PERFECT CLEAR
    if (state.mistakesInWord === 0) {
      bonus = 500;
      feedback = "PERFECT +500";
    } else {
      feedback = "Word cleared";
    }

    if (nextStepIndex >= SESSION.length) {
      return {
        ...state,
        score: score + bonus,
        combo,
        status: "complete",
      };
    }

    const nextStep = SESSION[nextStepIndex];

    return {
      ...state,
      currentStepIndex: nextStepIndex,
      currentClueIndex: 0,
      score: score + bonus,
      combo,
      mistakesInWord: 0,
      previousCorrectMeaningId: meaningId,
      consecutiveSwitches,
      revealedMeanings,
      status:
        nextStep.kind === "phraseBreak" ? "phraseBreak" : "playing",
      feedback,
    };
  }

  return {
    ...state,
    currentClueIndex: nextClueIndex,
    score,
    combo,
    previousCorrectMeaningId: meaningId,
    consecutiveSwitches,
    revealedMeanings,
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

  return {
    ...state,
    currentStepIndex: state.currentStepIndex + 1,
    currentClueIndex: 0,
    score,
    status: "playing",
    feedback,
  };
}