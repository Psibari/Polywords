import { create } from 'zustand';
import { GameState } from '../game/types';
import { createGame, handleAnswer } from '../game/engine';

type GameStore = {
  game: GameState;
  startGame: () => void;
  answer: (promptId: string, meaningId: string) => void;
  tick: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  game: createGame(),

  startGame: () => set({ game: createGame() }),

  answer: (promptId, meaningId) =>
    set((state: any) => ({
      game: handleAnswer(state.game, promptId, meaningId),
    })),

  tick: () =>
    set((state: any) => {
      if (state.game.gameOver) return state;

      const newTime = state.game.timeLeft - 1;

      return {
        game: {
          ...state.game,
          timeLeft: newTime,
          gameOver: newTime <= 0,
        },
      };
    }),
}));