import { GameState, Prompt, UpgradeChoice, WordEntry } from "./types";
import { WORDS } from "./words";

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getRandomWord(exclude?: string): WordEntry {
  const pool = WORDS.filter(w => w.word !== exclude);
  return pickRandom(pool.length ? pool : WORDS);
}

function createPrompt(word: WordEntry): Prompt {
  const meaning = pickRandom(word.meanings);
  const text = pickRandom(meaning.links);

  return {
    id: `${Date.now()}-${Math.random()}`,
    text,
    meaningId: meaning.id,
  };
}

function buildRound(word: WordEntry) {
  return {
    currentWord: word,
    currentPrompt: createPrompt(word),
  };
}

export function createGame(): GameState {
  const round = buildRound(getRandomWord());

  return {
    currentWord: round.currentWord,
    currentPrompt: round.currentPrompt,
    score: 0,
    combo: 0,
    correctMoves: 0,
    lives: 3,
    timeLeft: 8,
    maxTime: 8,
    status: "playing",
    shieldActive: false,
  };
}

export function submitMeaning(
  state: GameState,
  meaningId: string
): GameState {
  if (state.status !== "playing") return state;

  const correct = meaningId === state.currentPrompt.meaningId;

  // ❌ WRONG
  if (!correct) {
    const lives = state.shieldActive ? state.lives : state.lives - 1;
    const time = Math.max(0, state.timeLeft - 2);

    return {
      ...state,
      combo: 0,
      lives,
      shieldActive: false,
      timeLeft: time,
      status: lives <= 0 || time <= 0 ? "gameOver" : "playing",
    };
  }

  // ✅ CORRECT
  const correctMoves = state.correctMoves + 1;
  const combo = state.combo + 1;
  const score = state.score + 10 * combo;
  const timeLeft = Math.min(state.maxTime, state.timeLeft + 1);

  // rotate word every 3 correct answers
  const nextWord =
    correctMoves % 3 === 0
      ? getRandomWord(state.currentWord.word)
      : state.currentWord;

  const nextRound = buildRound(nextWord);

  return {
    ...state,
    currentWord: nextRound.currentWord,
    currentPrompt: nextRound.currentPrompt,
    score,
    combo,
    correctMoves,
    timeLeft,
    status: correctMoves % 7 === 0 ? "upgrade" : "playing",
  };
}

export function tickGame(state: GameState): GameState {
  if (state.status !== "playing") return state;

  const timeLeft = Math.max(0, state.timeLeft - 1);
  const combo = Math.max(0, state.combo - 1);

  return {
    ...state,
    timeLeft,
    combo,
    status: timeLeft <= 0 ? "gameOver" : "playing",
  };
}

export function applyUpgrade(
  state: GameState,
  upgrade: UpgradeChoice
): GameState {
  if (state.status !== "upgrade") return state;

  switch (upgrade) {
    case "timeBuffer":
      const maxTime = state.maxTime + 2;
      return {
        ...state,
        maxTime,
        timeLeft: Math.min(maxTime, state.timeLeft + 3),
        status: "playing",
      };

    case "comboJuice":
      return {
        ...state,
        combo: state.combo + 1,
        score: state.score + 25,
        status: "playing",
      };

    case "panicShield":
      return {
        ...state,
        shieldActive: true,
        status: "playing",
      };

    default:
      return { ...state, status: "playing" };
  }
}