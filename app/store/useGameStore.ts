import { create } from 'zustand';
import { GameState } from '../game/types';
import { createGame, handleAnswer } from '../game/engine';

type GameStore = {
  game: GameState;
  startGame: () => void;
  answer: (promptId: string, meaningId: string) => void;
};

export const useGameStore = create<GameStore>((set: any) => ({
  game: createGame(),

  startGame: () => set({ game: createGame() }),

  answer: (promptId: string, meaningId: string) =>
    set((state: any) => ({
      game: handleAnswer(state.game, promptId, meaningId),
    })),
}));