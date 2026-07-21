import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createGame,
  GameState,
  submitSwipeUp,
  submitSwipeDown,
  submitWrongSwipe,
  submitBossMastery,
  resolveMysteryTile,
  completeWord,
  addBonusScore,
  applyGoldFeather,
  consumeMilestone as consumeMilestoneFn,
  consumeFeatherMilestone as consumeFeatherMilestoneFn,
  consumeMercy as consumeMercyFn,
} from '../game/polyRunEngine';
import {
  DailyChallengeState,
  DailyClaimResult,
  DailyResult,
  DailySession,
  GhostMeaning,
  GhostRevenge,
  MasteredWordRecord,
  PlayerProgress,
  WordStep,
} from '../game/types';
import { generateHunt } from '../game/huntGenerator';
import {
  buildDailySession,
  claimDailyWord,
  createDailyResult,
  getTodayDateString,
  revealDailyCluesByElapsed,
} from '../game/dailyChallengeEngine';
import { applyDailyStreak, getStreakMilestone } from '../game/dailyStreak';
import { setMusicEnabled } from '../audio/MusicEngine';
import { PollyLineId } from '../game/pollyCharacter';
import {
  DEFAULT_POLLY_MEMORY,
  PollyMemory,
  hydratePollyMemory,
  rememberDaily,
  rememberHunt,
  rememberPollyLine,
} from '../game/pollyMemory';

// Onboarding taper: a hard cliff from full protection to zero protection at
// run 4 felt unfair in simulation (finish rate fell from ~32% to ~6% for an
// unchanged player). Fledgling gets the full ramp; Grace keeps a lighter
// safety net for several more runs before the game goes full stakes.
const FLEDGLING_RUNS = 3;
const GRACE_RUNS = 10;
const FLEDGLING_MERCY_LIVES = 3;
const GRACE_MERCY_LIVES = 2;

const GHOSTS_KEY = 'polywords_ghosts';
const PROGRESS_KEY = 'polywords_progress';
const DAILY_ATTEMPT_KEY_PREFIX = 'polywords_daily_attempt_';
const DAILY_RESULT_KEY_PREFIX = 'polywords_daily_result_';
const GOLD_FEATHER_KEY = 'polywords_gold_feather';
const SETTINGS_KEY = 'polywords_settings';
const POLLY_MEMORY_KEY = 'polywords_polly_memory_v1';

type PlayerSettings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

const DEFAULT_SETTINGS: PlayerSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
};

type GoldFeatherRecord = {
  available: boolean;
  expiresAt: number;
};

type FailedBossStep = Pick<
  WordStep,
  'word' | 'eventType' | 'isHauntReturn' | 'hiddenMeaning' | 'hiddenTrap'
>;

type HauntReturnStep = Pick<WordStep, 'word' | 'isHauntReturn'>;

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
  currentStreak: 0,
  longestStreak: 0,
  lastStreakDate: null,
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
        cluesUsed: round.revealedClueCount,
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
  resolveMystery: (correct: boolean, visiblePerfect: boolean) => void;
  completeWord: () => void;
  clearPollyTrigger: () => void;
  setPollyTrigger: (trigger: GameState['pollyTrigger']) => void;
  addBonusScore: (pts: number) => void;
  consumeMilestone: () => void;
  consumeFeatherMilestone: () => void;
  consumeMercy: () => void;
  queueFailedBoss: (step: FailedBossStep) => void;
  banishHaunt: (step: HauntReturnStep) => void;
  retainFailedHaunt: (step: HauntReturnStep) => void;
  setGhostRevenge: (data: GhostRevenge) => void;
  loadGhosts: () => Promise<void>;
  progress: PlayerProgress;
  recordMastery: (word: string, isBoss: boolean, hiddenMeaningFound: string, flawless: boolean) => void;
  recordRunComplete: (finalScore: number) => void;
  loadProgress: () => Promise<void>;
  pollyMemory: PollyMemory;
  pollyMemoryLoaded: boolean;
  loadPollyMemory: () => Promise<void>;
  rememberPollyLine: (
    lineId: PollyLineId,
    surface: 'home' | 'hunt' | 'daily' | 'results',
  ) => void;
  dailySession: DailySession | null;
  dailyResult: DailyResult | null;
  dailyAttemptDate: string | null;
  dailyLastClaimResult: DailyClaimResult | null;
  streakMilestoneReward: number | null;
  loadDailyResult: (date?: string) => Promise<void>;
  startDailyChallenge: (date?: string) => Promise<boolean>;
  claimDailyAnswer: (answer: string) => void;
  revealDailyClues: (elapsedMs: number) => void;
  clearDailyReaction: () => void;
  clearStreakMilestoneReward: () => void;
  resetDailyForDev: () => Promise<void>;
  resetProgressForDev: () => Promise<void>;
  goldFeatherAvailable: boolean;
  goldFeatherExpiresAt: number | null;
  grantGoldFeather: () => Promise<void>;
  useGoldFeatherInHunt: () => Promise<boolean>;
  checkGoldFeatherExpiry: () => Promise<void>;
  loadGoldFeather: () => Promise<void>;
  // Quarantined stale screen adapters. Do not use for new Daily work.
  daily: DailyChallengeState | null;
  submitDailyWrongSwipe: (candidate: string) => void;
  submitDailyCorrectSwipe: () => void;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  loadSettings: () => Promise<void>;
};

export const useGameStore = create<GameStore>((set, get) => ({
  game: createGame(),
  ghosts: [],
  ghostRevenge: null,
  runStartGhostWordIds: [],
  progress:    { ...DEFAULT_PROGRESS },
  pollyMemory: { ...DEFAULT_POLLY_MEMORY },
  pollyMemoryLoaded: false,
  dailySession: null,
  daily:       null,
  dailyResult: null,
  dailyAttemptDate: null,
  dailyLastClaimResult: null,
  streakMilestoneReward: null,
  goldFeatherAvailable: false,
  goldFeatherExpiresAt: null,
  soundEnabled: DEFAULT_SETTINGS.soundEnabled,
  hapticsEnabled: DEFAULT_SETTINGS.hapticsEnabled,

  startGame: () => {
    const runStartGhostWordIds = get().ghosts.map(g => g.wordId);
    const runsCompleted = get().progress.runsCompleted;
    // Fledgling: first 3 runs get the shorter 8-round arc, an easy-biased
    // draw, and a full revive-to-3 mercy. Grace: runs 4-9 return to the
    // standard 10-round draw but keep a lighter revive-to-2 safety net, so
    // the jump to full stakes is a taper instead of a cliff. Run 10+: no net.
    const isFledgling = runsCompleted < FLEDGLING_RUNS;
    const isGrace = !isFledgling && runsCompleted < GRACE_RUNS;
    const mercyReviveLives = isFledgling
      ? FLEDGLING_MERCY_LIVES
      : isGrace
      ? GRACE_MERCY_LIVES
      : 0;
    const steps = generateHunt({
      masteredWords: get().progress.masteredWords.map(m => m.word),
      ghostWordIds: runStartGhostWordIds,
      ...(isFledgling ? { length: 8, gentle: true } : {}),
    });
    set({
      game: createGame(runStartGhostWordIds, steps, mercyReviveLives),
      ghostRevenge: null,
      runStartGhostWordIds,
    });
  },

  submitSwipeUp: (maskId) => {
    const prev = get().game;
    const next = submitSwipeUp(prev, maskId);
    set({ game: next });
    if (next.bossOutcome === 'haunted' && prev.bossOutcome !== 'haunted') {
      const bossStep = next.session.find(s => s.kind === 'word' && s.eventType === 'bossWord');
      if (bossStep && bossStep.kind === 'word') get().queueFailedBoss(bossStep);
    }
  },

  submitSwipeDown: (maskId) => {
    const prev = get().game;
    const next = submitSwipeDown(prev, maskId);
    set({ game: next });
    if (next.bossOutcome === 'haunted' && prev.bossOutcome !== 'haunted') {
      const bossStep = next.session.find(s => s.kind === 'word' && s.eventType === 'bossWord');
      if (bossStep && bossStep.kind === 'word') get().queueFailedBoss(bossStep);
    }
  },

  submitWrongSwipe: () => {
    const prev = get().game;
    const next = submitWrongSwipe(prev);
    set({ game: next });
    if (next.bossOutcome === 'haunted' && prev.bossOutcome !== 'haunted') {
      const bossStep = next.session.find(s => s.kind === 'word' && s.eventType === 'bossWord');
      if (bossStep && bossStep.kind === 'word') get().queueFailedBoss(bossStep);
    }
  },

  submitBossMastery: () =>
    set((s) => ({ game: submitBossMastery(s.game) })),

  resolveMystery: (correct, visiblePerfect) => {
    const prev = get().game;
    const step = prev.session[prev.stepIndex];
    const next = resolveMysteryTile(prev, { correct, visiblePerfect });
    set({ game: next });
    if (step.kind !== 'word') return;
    const isBoss = step.eventType === 'bossWord';
    const isHaunt = step.isHauntReturn === true;
    if (isBoss) {
      if (correct) {
        get().recordMastery(step.word, true, step.hiddenMeaning ?? '', visiblePerfect);
        // invariant: a mastered word is never also a pending ghost (covers die→revive→master)
        const wordId = step.word.trim().toUpperCase();
        const pruned = get().ghosts.filter(g => g.wordId !== wordId);
        if (pruned.length !== get().ghosts.length) {
          set({ ghosts: pruned });
          AsyncStorage.setItem(GHOSTS_KEY, JSON.stringify(pruned)).catch(() => {});
        }
      } else {
        get().queueFailedBoss(step);
      }
    } else if (isHaunt) {
      if (correct) get().banishHaunt(step);
      else get().retainFailedHaunt(step);
    }
  },

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

  consumeMercy: () =>
    set((s) => ({ game: consumeMercyFn(s.game) })),

  queueFailedBoss: (step) => {
    if (step.eventType !== 'bossWord' || step.isHauntReturn === true) return;

    const wordId = step.word.trim().toUpperCase();
    const existing = get().ghosts.find(g => g.wordId === wordId);
    let next: GhostMeaning[];
    if (existing) {
      next = get().ghosts.map(g =>
        g.wordId === wordId
          ? {
              ...g,
              word: wordId,
              hiddenMeaningReal: step.hiddenMeaning ?? g.hiddenMeaningReal,
              hiddenMeaningTrap: step.hiddenTrap ?? g.hiddenMeaningTrap,
              runsMissed: g.runsMissed + 1,
            }
          : g
      );
    } else {
      next = [...get().ghosts, {
        wordId,
        word: wordId,
        hiddenMeaningReal: step.hiddenMeaning ?? '',
        hiddenMeaningTrap: step.hiddenTrap ?? '',
        isGhostedMaster: true,
        runsMissed: 1,
      }];
    }
    set({ ghosts: next });
    AsyncStorage.setItem(GHOSTS_KEY, JSON.stringify(next)).catch(() => {});
  },

  banishHaunt: (step) => {
    if (step.isHauntReturn !== true) return;

    const wordId = step.word.trim().toUpperCase();
    const next = get().ghosts.filter(g => g.wordId !== wordId);
    if (next.length === get().ghosts.length) return;
    set({ ghosts: next });
    AsyncStorage.setItem(GHOSTS_KEY, JSON.stringify(next)).catch(() => {});
  },

  retainFailedHaunt: (step) => {
    if (step.isHauntReturn !== true) return;

    const wordId = step.word.trim().toUpperCase();
    const current = get().ghosts;
    const existing = current.find(g => g.wordId === wordId);
    if (!existing) return;

    const next = [
      ...current.filter(g => g.wordId !== wordId),
      { ...existing, runsMissed: existing.runsMissed + 1 },
    ];
    set({ ghosts: next });
    AsyncStorage.setItem(GHOSTS_KEY, JSON.stringify(next)).catch(() => {});
  },

  setGhostRevenge: (data) => set({ ghostRevenge: data }),

  recordMastery: (word, isBoss, hiddenMeaningFound, flawless) => {
    const current = get().progress;
    const existing = current.masteredWords.find(m => m.word === word);
    let masteredWords: MasteredWordRecord[];
    if (existing) {
      masteredWords = current.masteredWords.map(m =>
        m.word === word
          ? { ...m, dateMastered: new Date().toISOString(), hiddenMeaningFound, flawless }
          : m
      );
    } else {
      masteredWords = [...current.masteredWords, {
        word,
        isBoss,
        hiddenMeaningFound,
        dateMastered: new Date().toISOString(),
        flawless,
      }];
    }
    const next = { ...current, masteredWords };
    set({ progress: next });
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next)).catch(() => {});
  },

  recordRunComplete: (finalScore) => {
    const current = get().progress;
    const game = get().game;
    const bossStep = game.session.find(
      step => step.kind === 'word' && step.eventType === 'bossWord',
    );
    const hauntStep = game.session.find(
      step => step.kind === 'word' && step.isHauntReturn === true,
    );
    const outcome = game.status === 'gameOver'
      ? 'pollyWon' as const
      : finalScore >= 15000
      ? 'playerBeatPolly' as const
      : 'playerCompleted' as const;
    const pollyMemory = rememberHunt(get().pollyMemory, {
      outcome,
      score: finalScore,
      bossWord: bossStep?.kind === 'word' ? bossStep.word : null,
      hauntWord: hauntStep?.kind === 'word' ? hauntStep.word : null,
    });
    const next: PlayerProgress = {
      ...current,
      runsCompleted: current.runsCompleted + 1,
      personalBest: finalScore > current.personalBest ? finalScore : current.personalBest,
    };
    set({ progress: next, pollyMemory });
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next)).catch(() => {});
    AsyncStorage.setItem(POLLY_MEMORY_KEY, JSON.stringify(pollyMemory)).catch(() => {});
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

  loadPollyMemory: async () => {
    try {
      const raw = await AsyncStorage.getItem(POLLY_MEMORY_KEY);
      const pollyMemory = raw
        ? hydratePollyMemory(JSON.parse(raw))
        : { ...DEFAULT_POLLY_MEMORY };
      set({ pollyMemory, pollyMemoryLoaded: true });
    } catch {
      set({ pollyMemory: { ...DEFAULT_POLLY_MEMORY }, pollyMemoryLoaded: true });
    }
  },

  rememberPollyLine: (lineId, surface) => {
    const pollyMemory = rememberPollyLine(get().pollyMemory, lineId, surface);
    set({ pollyMemory });
    AsyncStorage.setItem(POLLY_MEMORY_KEY, JSON.stringify(pollyMemory)).catch(() => {});
  },

  setSoundEnabled: (value: boolean) => {
    set({ soundEnabled: value });
    setMusicEnabled(value);
    const next: PlayerSettings = { soundEnabled: value, hapticsEnabled: get().hapticsEnabled };
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
  },

  setHapticsEnabled: (value: boolean) => {
    set({ hapticsEnabled: value });
    const next: PlayerSettings = { soundEnabled: get().soundEnabled, hapticsEnabled: value };
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
  },

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged: PlayerSettings = { ...DEFAULT_SETTINGS, ...parsed };
        set(merged);
        setMusicEnabled(merged.soundEnabled);
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
        streakMilestoneReward: null,
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

    const progress = dailyResult
      ? applyDailyStreak(get().progress, dailyResult.date)
      : get().progress;
    const pollyMemory = dailyResult
      ? rememberDaily(get().pollyMemory, dailyResult.status, dailyResult.date)
      : get().pollyMemory;
    const streakMilestone = dailyResult ? getStreakMilestone(progress.currentStreak) : null;

    set({
      dailySession: claim.session,
      daily: toQuarantinedDailyState(claim.session),
      dailyLastClaimResult: claim.result,
      ...(dailyResult ? { dailyResult } : {}),
      progress,
      pollyMemory,
      streakMilestoneReward: streakMilestone,
    });

    if (dailyResult) {
      const resultKey = DAILY_RESULT_KEY_PREFIX + dailyResult.date;
      AsyncStorage.setItem(resultKey, JSON.stringify(dailyResult)).catch(() => {});
      AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
      AsyncStorage.setItem(POLLY_MEMORY_KEY, JSON.stringify(pollyMemory)).catch(() => {});
    }

    if (dailyResult?.goldFeatherEarned || streakMilestone) {
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

  clearStreakMilestoneReward: () => {
    set({ streakMilestoneReward: null });
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
      streakMilestoneReward: null,
    });
  },

  resetProgressForDev: async () => {
    // Mirrors GameScreen.tsx's INTRO_SEEN_KEY — kept as a literal here to
    // avoid a cross-file export just for a dev tool.
    const INTRO_SEEN_KEY = 'polywords_intro_seen';
    const date = getTodayDateString();
    const attemptKey = DAILY_ATTEMPT_KEY_PREFIX + date;
    const resultKey  = DAILY_RESULT_KEY_PREFIX  + date;
    try {
      await Promise.all([
        AsyncStorage.removeItem(GHOSTS_KEY),
        AsyncStorage.removeItem(PROGRESS_KEY),
        AsyncStorage.removeItem(POLLY_MEMORY_KEY),
        AsyncStorage.removeItem(GOLD_FEATHER_KEY),
        AsyncStorage.removeItem(INTRO_SEEN_KEY),
        AsyncStorage.removeItem(attemptKey),
        AsyncStorage.removeItem(resultKey),
      ]);
    } catch {}
    set({
      ghosts: [],
      runStartGhostWordIds: [],
      progress: { ...DEFAULT_PROGRESS },
      pollyMemory: { ...DEFAULT_POLLY_MEMORY },
      dailySession: null,
      daily: null,
      dailyResult: null,
      dailyAttemptDate: null,
      dailyLastClaimResult: null,
      streakMilestoneReward: null,
      goldFeatherAvailable: false,
      goldFeatherExpiresAt: null,
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

  useGoldFeatherInHunt: async () => {
    const { game, goldFeatherAvailable, goldFeatherExpiresAt } = get();
    if (
      game.status !== 'gameOver' ||
      game.lives > 0 ||
      !goldFeatherAvailable ||
      goldFeatherExpiresAt === null ||
      Date.now() >= goldFeatherExpiresAt
    ) {
      await get().checkGoldFeatherExpiry();
      return false;
    }

    const revivedGame = applyGoldFeather(game);
    if (revivedGame === game || revivedGame.status !== 'playing') return false;

    set({
      game: revivedGame,
      goldFeatherAvailable: false,
      goldFeatherExpiresAt: null,
    });
    try {
      await AsyncStorage.removeItem(GOLD_FEATHER_KEY);
    } catch {}
    return true;
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
