import { create } from "zustand";
import {
  createGame,
  submitAnswer,
  submitPhraseAnswer,
} from "../game/polyRunEngine";

type GameStore = {
  game: ReturnType<typeof createGame>;
  startGame: () => void;
  submitAnswer: (meaningId: string) => void;
  submitPhraseAnswer: (choice: string) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  game: createGame(),

  startGame: () => set({ game: createGame() }),

  submitAnswer: (meaningId) =>
    set((state) => ({
      game: submitAnswer(state.game, meaningId),
    })),

  submitPhraseAnswer: (choice) =>
    set((state) => ({
      game: submitPhraseAnswer(state.game, choice),
    })),
}));