import { GameState, Meaning, UpgradeChoice, WordEntry } from "./types";
import { WORDS } from "./words";

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function getRandomWord(excludeWord?: string): WordEntry {
  const pool = WORDS.filter((word) => word.word !== excludeWord);
  return pickRandom(pool.length > 0 ? pool : WORDS);
}

function getMeaningById(word: WordEntry, meaningId: string): Meaning {
  const meaning = word.meanings.find((item) => item.id === meaningId);
  if (!meaning) {
    throw new Error(`Meaning not found: ${meaningId}`);
  }
  return meaning;
}

function getWrongAnswerPool(word: WordEntry, selectedMeaningId: string): string[] {
  return WORDS.flatMap((entry) =>
    entry.meanings
      .filter(
        (meaning) => !(entry.word === word.word && meaning.id === selectedMeaningId)
      )
      .flatMap((meaning) => meaning.links)
  );
}

function generateAnswers(
  word: WordEntry,
  meaningId: string
): { answers: string[]; correctAnswer: string } {
  const meaning = getMeaningById(word, meaningId);
  const correctAnswer = pickRandom(meaning.links);

  const wrongPool = shuffle(getWrongAnswerPool(word, meaningId)).filter(
    (item) => item !== correctAnswer
  );

  const wrongAnswers = wrongPool.slice(0, 3);
  const answers = shuffle([correctAnswer, ...wrongAnswers]);

  return { answers, correctAnswer };
}

function buildRound(word: WordEntry, selectedMeaningId?: string) {
  const chosenMeaningId = selectedMeaningId ?? pickRandom(word.meanings).id;
  const { answers, correctAnswer } = generateAnswers(word, chosenMeaningId);

  return {
    selectedMeaningId: chosenMeaningId,
    answers,
    correctAnswer,
  };
}

export function createGame(): GameState {
  const currentWord = getRandomWord();
  const round = buildRound(currentWord);

  return {
    currentWord,
    selectedMeaningId: round.selectedMeaningId,
    answers: round.answers,
    correctAnswer: round.correctAnswer,
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

export function selectMeaning(state: GameState, meaningId: string): GameState {
  if (state.status !== "playing") {
    return state;
  }

  const round = buildRound(state.currentWord, meaningId);

  return {
    ...state,
    selectedMeaningId: round.selectedMeaningId,
    answers: round.answers,
    correctAnswer: round.correctAnswer,
  };
}

export function submitAnswer(state: GameState, answer: string): GameState {
  if (state.status !== "playing") {
    return state;
  }

  const isCorrect = answer === state.correctAnswer;

  if (!isCorrect) {
    const nextLives = state.shieldActive ? state.lives : state.lives - 1;
    const nextTime = Math.max(0, state.timeLeft - 2);

    return {
      ...state,
      combo: 0,
      lives: nextLives,
      shieldActive: false,
      timeLeft: nextTime,
      status: nextLives <= 0 || nextTime <= 0 ? "gameOver" : "playing",
    };
  }

  const nextCorrectMoves = state.correctMoves + 1;
  const nextWord = getRandomWord(state.currentWord.word);
  const nextRound = buildRound(nextWord);
  const nextCombo = state.combo + 1;
  const nextTime = Math.min(state.maxTime, state.timeLeft + 2);
  const nextScore = state.score + 10 * nextCombo;
  const nextStatus = nextCorrectMoves % 7 === 0 ? "upgrade" : "playing";

  return {
    ...state,
    currentWord: nextWord,
    selectedMeaningId: nextRound.selectedMeaningId,
    answers: nextRound.answers,
    correctAnswer: nextRound.correctAnswer,
    score: nextScore,
    combo: nextCombo,
    correctMoves: nextCorrectMoves,
    timeLeft: nextTime,
    status: nextStatus,
  };
}

export function tickGame(state: GameState): GameState {
  if (state.status !== "playing") {
    return state;
  }

  const nextTime = Math.max(0, state.timeLeft - 1);
  const nextCombo = Math.max(0, state.combo - 1);

  return {
    ...state,
    timeLeft: nextTime,
    combo: nextCombo,
    status: nextTime <= 0 ? "gameOver" : "playing",
  };
}

export function applyUpgrade(
  state: GameState,
  upgrade: UpgradeChoice
): GameState {
  if (state.status !== "upgrade") {
    return state;
  }

  switch (upgrade) {
    case "timeBuffer": {
      const nextMaxTime = state.maxTime + 2;
      return {
        ...state,
        maxTime: nextMaxTime,
        timeLeft: Math.min(nextMaxTime, state.timeLeft + 3),
        status: "playing",
      };
    }

    case "comboJuice": {
      return {
        ...state,
        combo: state.combo + 1,
        score: state.score + 25,
        status: "playing",
      };
    }

    case "panicShield": {
      return {
        ...state,
        shieldActive: true,
        status: "playing",
      };
    }

    default:
      return {
        ...state,
        status: "playing",
      };
  }
}