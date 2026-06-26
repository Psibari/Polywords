import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createGame,
  GameState,
  submitSwipeUp,
  submitSwipeDown,
  submitWrongSwipe,
  submitBossMastery,
  completeWord,
  addBonusScore,
  consumeMilestone as consumeMilestoneFn,
  consumeFeatherMilestone as consumeFeatherMilestoneFn,
} from '../game/polyRunEngine';
import { resetPollyBudget } from '../logic/pollyBudget';
import {
  DailyChallengeState,
  DailyClaimResult,
  DailyResult,
  DailySession,
  GhostMeaning,
  GhostRevenge,
  MasteredWordRecord,
  PlayerProgress,
} from '../game/types';
import { generateHunt } from '../game/huntGenerator';
import {
  buildDailySession,
  claimDailyWord,
  createDailyResult,
  getTodayDateString,
  revealDailyCluesByElapsed,
} from '../game/dailyChallengeEngine';

const GHOSTS_KEY = 'polywords_ghosts';
const PROGRESS_KEY = 'polywords_progress';
const DAILY_ATTEMPT_KEY_PREFIX = 'polywords_daily_attempt_';
const DAILY_RESULT_KEY_PREFIX = 'polywords_daily_result_';
const GOLD_FEATHER_KEY = 'polywords_gold_feather';

type GoldFeatherRecord = {
  available: boolean;
  expiresAt: number;
};

function getLocalMidnight(): number {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0, 0,
  ).getTime();
}

const DEFAULT_PROGRESS: PlayerProgress = {
  masteredWords: [],
  personalBest: 0,
  runsCompleted: 0,
};

function toQuarantinedDailyState(session: DailySession): DailyChallengeState {
  return {
    session,
    date: session.date,
    rounds: session.rounds.map(round => ({
      ...round.word,
      word: round.word.answer,
      meanings: round.word.clues,
      candidates: round.candidates,
    })),
    currentRound: session.currentRoundIndex,
    lives: session.chancesRemaining,
    remainingCandidates: session.rounds.map(round => [...round.candidates]),
    results: session.rounds
      .filter(round => round.solved)
      .map(round => ({
        word: round.word.answer,
        tier: round.word.tier,
        status: 'solved' as const,
        wrongClaims: round.wrongClaims.length,
      })),
    status: session.status === 'active' ? 'playing' : 'complete',
  };
}

type GameStore = {
  game: ReturnType<typeof createGame>;
  ghosts: GhostMeaning[];
  ghostRevenge: GhostRevenge;
  runStartGhostWordIds: string[];
  startGame: () => void;
  submitSwipeUp: (maskId: string) => void;
  submitSwipeDown: (maskId: string) => void;
  submitWrongSwipe: () => void;
  submitBossMastery: () => void;
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
  dailySession: DailySession | null;
  dailyResult: DailyResult | null;
  dailyAttemptDate: string | null;
  dailyLastClaimResult: DailyClaimResult | null;
  loadDailyResult: (date?: string) => Promise<void>;
  startDailyChallenge: (date?: string) => Promise<boolean>;
  claimDailyAnswer: (answer: string) => void;
  revealDailyClues: (elapsedMs: number) => void;
  clearDailyReaction: () => void;
  resetDailyForDev: () => Promise<void>;
  goldFeatherAvailable: boolean;
  goldFeatherExpiresAt: number | null;
  grantGoldFeather: () => Promise<void>;
  spendGoldFeather: () => Promise<void>;
  checkGoldFeatherExpiry: () => Promise<void>;
  loadGoldFeather: () => Promise<void>;
  // Quarantined stale screen adapters. Do not use for new Daily work.
  daily: DailyChallengeState | null;
  submitDailyWrongSwipe: (candidate: string) => void;
  submitDailyCorrectSwipe: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  game: createGame(),
  ghosts: [],
  ghostRevenge: null,
  runStartGhostWordIds: [],
  progress:    { ...DEFAULT_PROGRESS },
  dailySession: null,
  daily:       null,
  dailyResult: null,
  dailyAttemptDate: null,
  dailyLastClaimResult: null,
  goldFeatherAvailable: false,
  goldFeatherExpiresAt: null,

  startGame: () => {
    resetPollyBudget();
    const runStartGhostWordIds = get().ghosts.map(g => g.wordId);
    const steps = generateHunt({
      masteredWords: get().progress.masteredWords.map(m => m.word),
      ghostWordIds: runStartGhostWordIds,
    });
    set({ game: createGame(runStartGhostWordIds, steps), ghostRevenge: null, runStartGhostWordIds });
  },

  submitSwipeUp: (maskId) =>
    set((s) => ({ game: submitSwipeUp(s.game, maskId) })),

  submitSwipeDown: (maskId) =>
    set((s) => ({ game: submitSwipeDown(s.game, maskId) })),

  submitWrongSwipe: () =>
    set((s) => ({ game: submitWrongSwipe(s.game) })),

  submitBossMastery: () =>
    set((s) => ({ game: submitBossMastery(s.game) })),

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

  loadDailyResult: async (date = getTodayDateString()) => {
    const attemptKey = DAILY_ATTEMPT_KEY_PREFIX + date;
    const resultKey = DAILY_RESULT_KEY_PREFIX + date;

    try {
      const [attempt, rawResult] = await Promise.all([
        AsyncStorage.getItem(attemptKey),
        AsyncStorage.getItem(resultKey),
      ]);
      const dailyResult = rawResult
        ? JSON.parse(rawResult) as DailyResult
        : null;

      set({
        dailyAttemptDate: attempt === date ? date : null,
        dailyResult,
      });

      get().loadGoldFeather();
    } catch {
      set({
        dailyAttemptDate: null,
        dailyResult: null,
      });
    }
  },

  startDailyChallenge: async (date = getTodayDateString()) => {
    if (get().dailyAttemptDate === date) return false;

    const attemptKey = DAILY_ATTEMPT_KEY_PREFIX + date;
    try {
      const existingAttempt = await AsyncStorage.getItem(attemptKey);
      if (existingAttempt === date) {
        set({ dailyAttemptDate: date });
        return false;
      }

      await AsyncStorage.setItem(attemptKey, date);
      const dailySession = buildDailySession(date);
      set({
        dailySession,
        daily: toQuarantinedDailyState(dailySession),
        dailyResult: null,
        dailyAttemptDate: date,
        dailyLastClaimResult: null,
      });
      return true;
    } catch {
      return false;
    }
  },

  claimDailyAnswer: (answer: string) => {
    const dailySession = get().dailySession;
    if (!dailySession || dailySession.status !== 'active') return;

    const claim = claimDailyWord(dailySession, answer);
    const dailyResult = claim.session.status === 'active'
      ? null
      : createDailyResult(claim.session);

    set({
      dailySession: claim.session,
      daily: toQuarantinedDailyState(claim.session),
      dailyLastClaimResult: claim.result,
      ...(dailyResult ? { dailyResult } : {}),
    });

    if (dailyResult) {
      const resultKey = DAILY_RESULT_KEY_PREFIX + dailyResult.date;
      AsyncStorage.setItem(resultKey, JSON.stringify(dailyResult)).catch(() => {});
    }

    if (dailyResult?.goldFeatherEarned) {
      get().grantGoldFeather();
    }
  },

  revealDailyClues: (elapsedMs: number) => {
    const dailySession = get().dailySession;
    if (!dailySession || dailySession.status !== 'active') return;

    const nextSession = revealDailyCluesByElapsed(dailySession, elapsedMs);
    if (nextSession === dailySession) return;

    set({
      dailySession: nextSession,
      daily: toQuarantinedDailyState(nextSession),
    });
  },

  clearDailyReaction: () => {
    set({ dailyLastClaimResult: null });
  },

  resetDailyForDev: async () => {
    const date = getTodayDateString();
    const attemptKey = DAILY_ATTEMPT_KEY_PREFIX + date;
    const resultKey  = DAILY_RESULT_KEY_PREFIX  + date;
    try {
      await Promise.all([
        AsyncStorage.removeItem(attemptKey),
        AsyncStorage.removeItem(resultKey),
      ]);
    } catch {}
    set({
      dailySession:          null,
      daily:                 null,
      dailyResult:           null,
      dailyAttemptDate:      null,
      dailyLastClaimResult:  null,
    });
  },

  grantGoldFeather: async () => {
    const expiresAt = getLocalMidnight();
    const record: GoldFeatherRecord = { available: true, expiresAt };
    set({ goldFeatherAvailable: true, goldFeatherExpiresAt: expiresAt });
    try {
      await AsyncStorage.setItem(GOLD_FEATHER_KEY, JSON.stringify(record));
    } catch {}
  },

  spendGoldFeather: async () => {
    set({ goldFeatherAvailable: false, goldFeatherExpiresAt: null });
    try {
      await AsyncStorage.removeItem(GOLD_FEATHER_KEY);
    } catch {}
  },

  checkGoldFeatherExpiry: async () => {
    const { goldFeatherAvailable, goldFeatherExpiresAt } = get();
    if (!goldFeatherAvailable || !goldFeatherExpiresAt) return;
    if (Date.now() >= goldFeatherExpiresAt) {
      set({ goldFeatherAvailable: false, goldFeatherExpiresAt: null });
      try {
        await AsyncStorage.removeItem(GOLD_FEATHER_KEY);
      } catch {}
    }
  },

  loadGoldFeather: async () => {
    try {
      const raw = await AsyncStorage.getItem(GOLD_FEATHER_KEY);
      if (!raw) return;
      const record = JSON.parse(raw) as GoldFeatherRecord;
      if (!record.available || Date.now() >= record.expiresAt) {
        await AsyncStorage.removeItem(GOLD_FEATHER_KEY);
        set({ goldFeatherAvailable: false, goldFeatherExpiresAt: null });
        return;
      }
      set({
        goldFeatherAvailable: record.available,
        goldFeatherExpiresAt: record.expiresAt,
      });
    } catch {}
  },

  submitDailyWrongSwipe: (candidate: string) => {
    get().claimDailyAnswer(candidate);
  },

  submitDailyCorrectSwipe: () => {
    const dailySession = get().dailySession;
    const round = dailySession?.rounds[dailySession.currentRoundIndex];
    if (!round) return;
    get().claimDailyAnswer(round.word.answer);
  },
}));
