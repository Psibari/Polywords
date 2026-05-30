import { create } from 'zustand';
import {
  createGame,
  GameState,
  submitSwipeUp,
  submitSwipeDown,
  submitWrongSwipe,
  revealHidden,
  completeWord,
  submitPhraseAnswer,
  addBonusScore,
  completeSwitchback,
  consumeMilestone as consumeMilestoneFn,
} from '../game/polyRunEngine';
import { resetPollyBudget } from '../logic/pollyBudget';

type GameStore = {
  game: ReturnType<typeof createGame>;
  startGame: () => void;
  submitSwipeUp: (maskId: string) => void;
  submitSwipeDown: (maskId: string) => void;
  submitWrongSwipe: () => void;
  revealHidden: (maskId: string) => void;
  completeWord: () => void;
  submitPhraseAnswer: (choice: string) => void;
  completeSwitchback: (bonusScore: number, correct: boolean, wrongSwipes: number) => void;
  clearPollyTrigger: () => void;
  setPollyTrigger: (trigger: GameState['pollyTrigger']) => void;
  addBonusScore: (pts: number) => void;
  consumeMilestone: () => void;
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

  submitWrongSwipe: () =>
    set((s) => ({ game: submitWrongSwipe(s.game) })),

  revealHidden: (maskId) =>
    set((s) => ({ game: revealHidden(s.game, maskId) })),

  completeWord: () =>
    set((s) => ({ game: completeWord(s.game) })),

  submitPhraseAnswer: (choice) =>
    set((s) => ({ game: submitPhraseAnswer(s.game, choice) })),

  completeSwitchback: (bonusScore, correct, wrongSwipes) =>
    set((s) => ({ game: completeSwitchback(s.game, bonusScore, correct, wrongSwipes) })),

  clearPollyTrigger: () =>
    set((s) => ({ game: { ...s.game, pollyTrigger: null } })),

  setPollyTrigger: (trigger) =>
    set((s) => ({ game: { ...s.game, pollyTrigger: trigger } })),

  addBonusScore: (pts) =>
    set((s) => ({ game: addBonusScore(s.game, pts) })),

  consumeMilestone: () =>
    set((s) => ({ game: consumeMilestoneFn(s.game) })),
}));
