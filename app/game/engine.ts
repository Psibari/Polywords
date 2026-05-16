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
  
  // ⚡ PACING CLOCK (Tracks time elapsed between choices)
  lastActionTimestamp: number; 
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
    lastActionTimestamp: Date.now(), // Sets initial clock anchor
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
  const now = Date.now();
  
  // Calculate precise speed of the player response
  const secondsElapsed = (now - state.lastActionTimestamp) / 1000;

  // ❌ WRONG ANSWER LOGIC
  if (!correct) {
    // High stakes pacing: Boss words deal double damage to create tension
    const damage = step.eventType === "bossWord" ? 2 : 1;
    const lives = Math.max(0, state.lives - damage);

    let feedback = "Mistake!";
    if (step.eventType === "bossWord") {
      feedback = "💥 BOSS HIT! -2 LIVES";
    } else if (step.emotionalRole === "hesitation") {
      feedback = "❌ Caught by the decoy!";
    } else {
      feedback = "💔 STREAK BROKEN!";
    }

    return {
      ...state,
      lives,
      combo: 0,
      mistakesInWord: state.mistakesInWord + 1,
      feedback,
      status: lives <= 0 ? "gameOver" : "playing",
      lastActionTimestamp: now, // Reset timer anchor on failure
    };
  }

  // ✅ CORRECT ANSWER LOGIC
  let points = 100;
  let feedback = "Correct!";
  let consecutiveSwitches = state.consecutiveSwitches;

  // ⚡ DYNAMIC SPEED SCALING BASED ON YOUR EVENT TYPES
  let speedMultiplier = 1;
  
  if (step.eventType === "speedRound") {
    // Hyper-aggressive scoring scaling for "BAT" and "CAN"
    if (secondsElapsed <= 2.0) {
      speedMultiplier = 3.0; 
      feedback = "⚡ LIGHTNING BLITZ x3!";
    } else if (secondsElapsed <= 4.0) {
      speedMultiplier = 2.0;
      feedback = "⏱️ SPEED BONUS x2!";
    } else {
      feedback = "Too slow for Speed Round!";
    }
  } else {
    // Standard level pacing thresholds
    if (secondsElapsed <= 3.0) {
      speedMultiplier = 1.5;
      feedback = "🔥 Quick Switch!";
    }
  }

  // Handle polysemy semantic shifting (switching meanings)
  if (
    state.previousCorrectMeaningId &&
    state.previousCorrectMeaningId !== meaningId
  ) {
    points += 50;
    consecutiveSwitches += 1;
  } else {
    consecutiveSwitches = 0;
  }

  // Reward continuous flow
  if (consecutiveSwitches >= 3) {
    points *= 2;
    feedback = "🌊 PERFECT FLOW STATUS!";
    consecutiveSwitches = 0;
  }

  // Hidden meaning discovery mechanics (e.g., SPRING -> waterSource)
  let revealedMeanings = { ...state.revealedMeanings };
  const meaning = step.meanings.find((m) => m.id === meaningId);

  if (meaning?.hidden && !revealedMeanings[meaningId]) {
    revealedMeanings[meaningId] = true;
    points += 300;
    feedback = "💎 UNCOVERED HIDDEN MEANING +300!";
  }

  // Event flavor contextual adjustments
  if (step.eventType === "slangDrop") {
    feedback = `😎 SLANG UNLOCKED: ${feedback}`;
  } else if (step.eventType === "bossWord") {
    points *= 2;
    feedback = `🛡️ BOSS DAMAGE: ${feedback}`;
  }

  // Handle total math operations
  const score = state.score + Math.round(points * speedMultiplier);
  const combo = state.combo + 1;

  // Celebrate macro hit streaks
  if (combo % 5 === 0) {
    feedback = `🔥 ${combo} COMBO STREAK!`;
  }

  const nextClueIndex = state.currentClueIndex + 1;

  // ✅ WORD STEP ENTIRELY CLEARED
  if (nextClueIndex >= step.clues.length) {
    const nextStepIndex = state.currentStepIndex + 1;
    let bonus = 0;

    if (state.mistakesInWord === 0) {
      bonus = 500;
      feedback = `🏆 PERFECT CLEAR: ${step.word} +500!`;
    } else {
      feedback = `✨ ${step.word} Cleared!`;
    }

    // Check if total session run is out of steps
    if (nextStepIndex >= SESSION.length) {
      return {
        ...state,
        score: score + bonus,
        combo,
        status: "complete",
        lastActionTimestamp: now,
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
      status: nextStep.kind === "phraseBreak" ? "phraseBreak" : "playing",
      feedback,
      lastActionTimestamp: now, // Fresh time anchor lock for the new layout
    };
  }

  // Move to next clue within the same word
  return {
    ...state,
    currentClueIndex: nextClueIndex,
    score,
    combo,
    previousCorrectMeaningId: meaningId,
    consecutiveSwitches,
    revealedMeanings,
    feedback,
    lastActionTimestamp: now, // Fresh time anchor lock for next clue
  };
}

export function submitPhraseAnswer(
  state: GameState,
  choice: string
): GameState {
  const step = getCurrentStep(state);
  if (step.kind !== "phraseBreak") return state;

  const correct = choice === step.correctChoice;
  const now = Date.now();

  let score = state.score;
  let feedback = "Wrong Origin Story!";

  if (correct) {
    score += 500;
    feedback = "🎉 COGNITIVE BREAKOUT! +500";
  }

  return {
    ...state,
    currentStepIndex: state.currentStepIndex + 1,
    currentClueIndex: 0,
    score,
    status: "playing",
    feedback,
    lastActionTimestamp: now, // Clear clock for the coming puzzle
  };
}