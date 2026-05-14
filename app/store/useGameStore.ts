import { create } from "zustand";
import { GameState, UpgradeChoice } from "../game/types";
import {
  createGame,
  submitMeaning,
  tickGame,
  applyUpgrade,
} from "../game/engine";

type GameStore = {
  game: GameState;
  startGame: () => void;
  submitMeaningChoice: (meaningId: string) => void;
  tick: () => void;
  pickUpgrade: (upgrade: UpgradeChoice) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  game: createGame(),

  startGame: () => set({ game: createGame() }),

  submitMeaningChoice: (meaningId) =>
    set((state) => ({
      game: submitMeaning(state.game, meaningId),
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