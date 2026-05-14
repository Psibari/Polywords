import { create } from "zustand";
import { GameState, UpgradeChoice } from "../game/types";
import {
  applyUpgrade,
  createGame,
  selectMeaning,
  submitAnswer,
  tickGame,
} from "../game/engine";

type GameStore = {
  game: GameState;
  startGame: () => void;
  chooseMeaning: (meaningId: string) => void;
  submit: (answer: string) => void;
  tick: () => void;
  pickUpgrade: (upgrade: UpgradeChoice) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  game: createGame(),

  startGame: () => set({ game: createGame() }),

  chooseMeaning: (meaningId) =>
    set((state) => ({
      game: selectMeaning(state.game, meaningId),
    })),

  submit: (answer) =>
    set((state) => ({
      game: submitAnswer(state.game, answer),
    })),

  tick: () =>
    set((state) => ({
      game: tickGame(state.game),
    })),

  pickUpgrade: (upgrade) =>
    set((state) => ({
      game: applyUpgrade(state.game, upgrade),
    })),
}));