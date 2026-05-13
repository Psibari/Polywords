import { GameState, Prompt } from './types';

export function createGame(): GameState {
  return {
    word: 'BARK',
    meanings: [
      { id: 'dog', label: 'dog sound' },
      { id: 'tree', label: 'tree outer layer' },
    ],
    queue: generatePrompts(),
    score: 0,
    combo: 0,
    gameOver: false,
    timeLeft: 10,
  };
}

function generatePrompts(): Prompt[] {
  return [
    { id: '1', text: 'howl', meaningId: 'dog' },
    { id: '2', text: 'trunk', meaningId: 'tree' },
    { id: '3', text: 'puppy', meaningId: 'dog' },
    { id: '4', text: 'forest', meaningId: 'tree' },
  ];
}

export function handleAnswer(
  state: GameState,
  promptId: string,
  selectedMeaning: string
): GameState {
  const prompt = state.queue.find(p => p.id === promptId);
  if (!prompt) return state;

  const correct = prompt.meaningId === selectedMeaning;

  const newQueue = state.queue.filter(p => p.id !== promptId);

  const newTime = correct ? state.timeLeft + 2 : state.timeLeft - 2;

  return {
    ...state,
    queue: newQueue,
    score: correct ? state.score + 10 : state.score,
    combo: correct ? state.combo + 1 : 0,
    timeLeft: newTime,
    gameOver: newQueue.length === 0 || newTime <= 0,
  };
}