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
  consumeFeatherMilestone as consumeFeatherMilestoneFn,
} from '../game/polyRunEngine';
import { resetPollyBudget } from '../logic/pollyBudget';
import { GhostMeaning, GhostRevenge, MasteredWordRecord, PlayerProgress, DailyChallengeState, DailyResult } from '../game/types';
import {
  createDailyState,
  submitDailyWrongSwipe as dailyWrongFn,
  submitDailyCorrectSwipe as dailyCorrectFn,
  buildDailyResult,
  getTodayDateString,
} from '../game/dailyChallengeEngine';

const GHOSTS_KEY = 'polywords_ghosts';
const PROGRESS_KEY = 'polywords_progress';
const DAILY_KEY_PREFIX = 'polywords_daily_';

const DEFAULT_PROGRESS: PlayerProgress = {
  masteredWords: [],
  personalBest: 0,
  runsCompleted: 0,
};

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
  consumeFeatherMilestone: () => void;
  addGhost: (ghost: GhostMeaning) => void;
  addGhostedMaster: (word: string) => void;
  clearGhost: (wordId: string) => void;
  setGhostRevenge: (data: GhostRevenge) => void;
  loadGhosts: () => Promise<void>;
  progress: PlayerProgress;
  recordMastery: (word: string, isBoss: boolean, hiddenMeaningFound: string) => void;
  recordRunComplete: (finalScore: number) => void;
  loadProgress: () => Promise<void>;
  daily:                    DailyChallengeState | null;
  dailyResult:              DailyResult | null;
  startDailyChallenge:      () => void;
  submitDailyWrongSwipe:    (candidate: string) => void;
  submitDailyCorrectSwipe:  () => void;
  completeDailyChallenge:   () => void;
  loadDailyResult:          () => Promise<void>;
};

export const useGameStore = create<GameStore>((set, get) => ({
  game: createGame(),
  ghosts: [],
  ghostRevenge: null,
  runStartGhostWordIds: [],
  progress:    { ...DEFAULT_PROGRESS },
  daily:       null,
  dailyResult: null,

  startGame: () => {
    resetPollyBudget();
    const runStartGhostWordIds = get().ghosts.map(g => g.wordId);
    set({ game: createGame(runStartGhostWordIds), ghostRevenge: null, runStartGhostWordIds });
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

  consumeFeatherMilestone: () =>
    set((s) => ({ game: consumeFeatherMilestoneFn(s.game) })),

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

  recordMastery: (word, isBoss, hiddenMeaningFound) => {
    const current = get().progress;
    const existing = current.masteredWords.find(m => m.word === word);
    let masteredWords: MasteredWordRecord[];
    if (existing) {
      masteredWords = current.masteredWords.map(m =>
        m.word === word
          ? { ...m, dateMastered: new Date().toISOString(), hiddenMeaningFound }
          : m
      );
    } else {
      masteredWords = [...current.masteredWords, {
        word,
        isBoss,
        hiddenMeaningFound,
        dateMastered: new Date().toISOString(),
      }];
    }
    const next = { ...current, masteredWords };
    set({ progress: next });
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next)).catch(() => {});
  },

  recordRunComplete: (finalScore) => {
    const current = get().progress;
    const next: PlayerProgress = {
      ...current,
      runsCompleted: current.runsCompleted + 1,
      personalBest: finalScore > current.personalBest ? finalScore : current.personalBest,
    };
    set({ progress: next });
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next)).catch(() => {});
  },

  loadProgress: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged: PlayerProgress = { ...DEFAULT_PROGRESS, ...parsed };
        set({ progress: merged });
      }
    } catch {}
  },

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

  startDailyChallenge: () => {
    const today = getTodayDateString();
    const state = createDailyState(today);
    set({ daily: state, dailyResult: null });
  },

  submitDailyWrongSwipe: (candidate: string) => {
    const daily = get().daily;
    if (!daily || daily.status !== 'playing') return;
    const next = dailyWrongFn(daily, candidate);
    set({ daily: next });
    if (next.status === 'complete') {
      get().completeDailyChallenge();
    }
  },

  submitDailyCorrectSwipe: () => {
    const daily = get().daily;
    if (!daily || daily.status !== 'playing') return;
    const next = dailyCorrectFn(daily);
    set({ daily: next });
    if (next.status === 'complete') {
      get().completeDailyChallenge();
    }
  },

  completeDailyChallenge: () => {
    const daily = get().daily;
    if (!daily) return;
    const result = buildDailyResult(daily);
    set({ dailyResult: result });
    const key = DAILY_KEY_PREFIX + daily.date;
    AsyncStorage.setItem(key, JSON.stringify(result)).catch(() => {});
  },

  loadDailyResult: async () => {
    const today = getTodayDateString();
    const key   = DAILY_KEY_PREFIX + today;
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const result = JSON.parse(raw) as DailyResult;
        set({ dailyResult: result });
      } else {
        set({ dailyResult: null });
      }
    } catch {}
  },
}));
