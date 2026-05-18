import { create } from "zustand";
import {
  createGame,
  submitAnswer,
  submitPhraseAnswer,
} from "../game/polyRunEngine";
import { resetPollyBudget } from "../components/PollyController";

type GameStore = {
  game: ReturnType<typeof createGame>;
  startGame: () => void;
  submitAnswer: (meaningId: string) => void;
  submitPhraseAnswer: (choice: string) => void;
  clearPollyTrigger: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  game: createGame(),

  startGame: () => {
    resetPollyBudget();
    set({ game: createGame() });
  },

  submitAnswer: (meaningId) =>
    set((state) => ({
      game: submitAnswer(state.game, meaningId),
    })),

  submitPhraseAnswer: (choice) =>
    set((state) => ({
      game: submitPhraseAnswer(state.game, choice),
    })),

  clearPollyTrigger: () =>
    set((s) => ({ game: { ...s.game, pollyTrigger: null } })),
}));
