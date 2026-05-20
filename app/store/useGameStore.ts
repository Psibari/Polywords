import { create } from "zustand";
import {
  createGame,
  submitAnswer,
  submitPhraseAnswer,
  markTileMissed,
  skipClue,
} from "../game/polyRunEngine";
import { Clue } from "../game/types";
import { resetPollyBudget } from "../components/PollyController";

type GameStore = {
  game: ReturnType<typeof createGame>;
  startGame: () => void;
  submitAnswer: (meaningId: string) => void;
  submitPhraseAnswer: (choice: string) => void;
  clearPollyTrigger: () => void;
  markTileMissed: (clue: Clue) => void;
  skipClue: () => void;
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

  markTileMissed: (clue) =>
    set((s) => ({ game: markTileMissed(s.game, clue) })),

  skipClue: () =>
    set((s) => ({ game: skipClue(s.game) })),
}));
