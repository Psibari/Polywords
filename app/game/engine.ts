import { GameState, WordEntry } from "./types";
import { WORDS } from "./words";

function getRandomWord(): WordEntry {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function generateAnswers(word: WordEntry, meaningId: string) {
  const meaning = word.meanings.find(m => m.id === meaningId)!;

  const correct =
    meaning.links[Math.floor(Math.random() * meaning.links.length)];

  const wrongPool = WORDS.flatMap(w =>
    w.meanings.flatMap(m => m.links)
  ).filter(l => !meaning.links.includes(l));

  const wrong = wrongPool.sort(() => 0.5 - Math.random()).slice(0, 3);

  const answers = [correct, ...wrong].sort(() => 0.5 - Math.random());

  return { answers, correct };
}

export function createGame(): GameState {
  const word = getRandomWord();
  const meaning = word.meanings[0];

  const { answers, correct } = generateAnswers(word, meaning.id);

  return {
    currentWord: word,
    selectedMeaningId: meaning.id,
    answers,
    correctAnswer: correct,
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

export function selectMeaning(state: GameState, meaningId: string) {
  const { answers, correct } = generateAnswers(
    state.currentWord,
    meaningId
  );

  return {
    ...state,
    selectedMeaningId: meaningId,
    answers,
    correctAnswer: correct,
  };
}

export function submitAnswer(state: GameState, answer: string): GameState {
  const correct = answer === state.correctAnswer;

  if (correct) {
    const newWord = getRandomWord();
    const newMeaning = newWord.meanings[0];

    const { answers, correct: newCorrect } = generateAnswers(
      newWord,
      newMeaning.id
    );

    return {
      ...state,
      currentWord: newWord,
      selectedMeaningId: newMeaning.id,
      answers,
      correctAnswer: newCorrect,
      score: state.score + 10 * (state.combo + 1),
      combo: state.combo + 1,
      correctMoves: state.correctMoves + 1,
      timeLeft: Math.min(state.timeLeft + 2, state.maxTime),
    };
  }

  return {
    ...state,
    lives: state.lives - 1,
    combo: 0,
    timeLeft: state.timeLeft - 2,
    status: state.lives - 1 <= 0 ? "gameOver" : "playing",
  };
}