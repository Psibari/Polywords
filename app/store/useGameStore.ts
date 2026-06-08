import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createGame,
  GameState,
  submitSwipeUp,
  submitSwipeDown,
  submitWrongSwipe,
  revealHidden,
  completeWord,
  addBonusScore,
  consumeMilestone as consumeMilestoneFn,
} from '../game/polyRunEngine';
import { resetPollyBudget } from '../logic/pollyBudget';
import { GhostMeaning, GhostRevenge } from '../game/types';

const GHOSTS_KEY = 'polywords_ghosts';

type GameStore = {
  game: ReturnType<typeof createGame>;
  ghosts: GhostMeaning[];
  ghostRevenge: GhostRevenge;
  runStartGhostWordIds: string[];
  startGame: () => void;
  submitSwipeUp: (maskId: string) => void;
  submitSwipeDown: (maskId: string) => void;
  submitWrongSwipe: () => void;
  revealHidden: (maskId: string) => void;
  completeWord: () => void;
  clearPollyTrigger: () => void;
  setPollyTrigger: (trigger: GameState['pollyTrigger']) => void;
  addBonusScore: (pts: number) => void;
  consumeMilestone: () => void;
  addGhost: (ghost: GhostMeaning) => void;
  addGhostedMaster: (word: string) => void;
  clearGhost: (wordId: string) => void;
  setGhostRevenge: (data: GhostRevenge) => void;
  loadGhosts: () => Promise<void>;
};

export const useGameStore = create<GameStore>((set, get) => ({
  game: createGame(),
  ghosts: [],
  ghostRevenge: null,
  runStartGhostWordIds: [],

  startGame: () => {
    resetPollyBudget();
    const runStartGhostWordIds = get().ghosts.map(g => g.wordId);
    set({ game: createGame(), ghostRevenge: null, runStartGhostWordIds });
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

  clearPollyTrigger: () =>
    set((s) => ({ game: { ...s.game, pollyTrigger: null } })),

  setPollyTrigger: (trigger) =>
    set((s) => ({ game: { ...s.game, pollyTrigger: trigger } })),

  addBonusScore: (pts) =>
    set((s) => ({ game: addBonusScore(s.game, pts) })),

  consumeMilestone: () =>
    set((s) => ({ game: consumeMilestoneFn(s.game) })),

  addGhost: (ghost) => {
    const existing = get().ghosts.find(g => g.word === ghost.word);
    let next: GhostMeaning[];
    if (existing) {
      next = get().ghosts.map(g =>
        g.wordId === ghost.wordId ? { ...g, runsMissed: g.runsMissed + 1 } : g
      );
    } else {
      next = [...get().ghosts, { ...ghost, runsMissed: 1 }];
    }
    set({ ghosts: next });
    AsyncStorage.setItem(GHOSTS_KEY, JSON.stringify(next)).catch(() => {});
  },

  addGhostedMaster: (word) => {
    const existing = get().ghosts.find(g => g.wordId === word);
    let next: GhostMeaning[];
    if (existing) {
      next = get().ghosts.map(g =>
        g.wordId === word ? { ...g, runsMissed: g.runsMissed + 1 } : g
      );
    } else {
      next = [...get().ghosts, {
        wordId: word,
        word,
        hiddenMeaningReal: '',
        hiddenMeaningTrap: '',
        isGhostedMaster: true,
        runsMissed: 1,
      }];
    }
    set({ ghosts: next });
    AsyncStorage.setItem(GHOSTS_KEY, JSON.stringify(next)).catch(() => {});
  },

  clearGhost: (wordId) => {
    const next = get().ghosts.filter(g => g.wordId !== wordId);
    set({ ghosts: next });
    AsyncStorage.setItem(GHOSTS_KEY, JSON.stringify(next)).catch(() => {});
  },

  setGhostRevenge: (data) => set({ ghostRevenge: data }),

  loadGhosts: async () => {
    try {
      const raw = await AsyncStorage.getItem(GHOSTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GhostMeaning[];
        set(s => ({
          ghosts: parsed,
          runStartGhostWordIds: s.runStartGhostWordIds.length === 0
            ? parsed.map(g => g.wordId)
            : s.runStartGhostWordIds,
        }));
      }
    } catch {}
  },
}));
