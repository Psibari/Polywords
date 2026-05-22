import { create } from 'zustand';
import {
  createGame,
  submitAnswer,
  submitPhraseAnswer,
  lockRound,
} from '../game/polyRunEngine';
import { resetPollyBudget } from '../components/PollyController';

type GameStore = {
  game: ReturnType<typeof createGame>;
  startGame: () => void;
  submitAnswer: (maskId: string) => void;
  submitPhraseAnswer: (choice: string) => void;
  lockRound: () => void;
  clearPollyTrigger: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  game: createGame(),

  startGame: () => {
    resetPollyBudget();
    set({ game: createGame() });
  },

  submitAnswer: (maskId) =>
    set((state) => ({
      game: submitAnswer(state.game, maskId),
    })),

  submitPhraseAnswer: (choice) =>
    set((state) => ({
      game: submitPhraseAnswer(state.game, choice),
    })),

  lockRound: () =>
    set((state) => ({
      game: lockRound(state.game),
    })),

  clearPollyTrigger: () =>
    set((s) => ({ game: { ...s.game, pollyTrigger: null } })),
}));
