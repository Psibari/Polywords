import { create } from 'zustand';
import {
  createGame,
  GameState,
  submitSwipeUp,
  submitSwipeDown,
  revealHidden,
  completeWord,
  submitPhraseAnswer,
} from '../game/polyRunEngine';
import { resetPollyBudget } from '../logic/pollyBudget';

type GameStore = {
  game: ReturnType<typeof createGame>;
  startGame: () => void;
  submitSwipeUp: (maskId: string) => void;
  submitSwipeDown: (maskId: string) => void;
  revealHidden: (maskId: string) => void;
  completeWord: () => void;
  submitPhraseAnswer: (choice: string) => void;
  clearPollyTrigger: () => void;
  setPollyTrigger: (trigger: GameState['pollyTrigger']) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  game: createGame(),

  startGame: () => {
    resetPollyBudget();
    set({ game: createGame() });
  },

  submitSwipeUp: (maskId) =>
    set((s) => ({ game: submitSwipeUp(s.game, maskId) })),

  submitSwipeDown: (maskId) =>
    set((s) => ({ game: submitSwipeDown(s.game, maskId) })),

  revealHidden: (maskId) =>
    set((s) => ({ game: revealHidden(s.game, maskId) })),

  completeWord: () =>
    set((s) => ({ game: completeWord(s.game) })),

  submitPhraseAnswer: (choice) =>
    set((s) => ({ game: submitPhraseAnswer(s.game, choice) })),

  clearPollyTrigger: () =>
    set((s) => ({ game: { ...s.game, pollyTrigger: null } })),

  setPollyTrigger: (trigger) =>
    set((s) => ({ game: { ...s.game, pollyTrigger: trigger } })),
}));
