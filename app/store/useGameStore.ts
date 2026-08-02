import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createGame,
  GameState,
  submitSwipeUp,
  submitSwipeDown,
  submitWrongSwipe,
  resolveMysteryTile,
  beginMysteryGauntlet as beginMysteryGauntletFn,
  isMysteryTerminal,
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
  pauseDailyRound,
  revealDailyCluesByElapsed,
} from '../game/dailyChallengeEngine';
import {
  encodeDailySessionSnapshot,
  recoverDailySession,
} from '../game/dailySessionPersistence';
import { applyDailyStreak, getRewardedStreakMilestone } from '../game/dailyStreak';
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
import { INTRO_SEEN_KEY, BOSS_INTRO_SEEN_KEY } from '../constants/storageKeys';

// Onboarding taper: a hard cliff from full protection to zero protection at
// run 4 felt unfair in simulation (finish rate fell from ~32% to ~6% for an
// unchanged player). Fledgling gets the full ramp; Grace keeps a lighter
// safety net for several more runs before the game goes full stakes.
const FLEDGLING_RUNS = 3;
const GRACE_RUNS = 10;
const FLEDGLING_MERCY_LIVES = 3;
const GRACE_MERCY_LIVES = 2;

const GAME_KEY = 'polywords_active_game';
const GHOSTS_KEY = 'polywords_ghosts';
const PROGRESS_KEY = 'polywords_progress';
const DAILY_ATTEMPT_KEY_PREFIX = 'polywords_daily_attempt_';
const DAILY_RESULT_KEY_PREFIX = 'polywords_daily_result_';
const DAILY_ACTIVE_SESSION_KEY = 'polywords_daily_active_session_v1';
const GOLD_FEATHER_KEY = 'polywords_gold_feather';
const SETTINGS_KEY = 'polywords_settings';
const POLLY_MEMORY_KEY = 'polywords_polly_memory_v1';

let dailyPersistenceQueue: Promise<void> = Promise.resolve();

function enqueueDailyPersistence(operation: () => Promise<void>): Promise<void> {
  dailyPersistenceQueue = dailyPersistenceQueue
    .catch(() => {})
    .then(operation);
  return dailyPersistenceQueue;
}

function persistActiveDailySession(session: DailySession): Promise<void> {
  return enqueueDailyPersistence(() =>
    AsyncStorage.setItem(
      DAILY_ACTIVE_SESSION_KEY,
      encodeDailySessionSnapshot(session),
    ),
  );
}

function parseDailyResult(raw: string | null, date: string): DailyResult | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const candidate = value as Partial<DailyResult>;
    if (candidate.date !== date) return null;
    if (candidate.status !== 'won' && candidate.status !== 'lost') return null;
    if (typeof candidate.challengeNumber !== 'number') return null;
    if (typeof candidate.solvedCount !== 'number') return null;
    if (![0, 1, 2].includes(candidate.chancesRemaining as number)) return null;
    if (typeof candidate.goldFeatherEarned !== 'boolean') return null;
    if (typeof candidate.completedAt !== 'number') return null;
    if (typeof candidate.title !== 'string') return null;
    if (![0, 1, 2].includes(candidate.livesLeft as number)) return null;
    if (typeof candidate.shareText !== 'string') return null;
    if (!Array.isArray(candidate.wordResults)) return null;
    return candidate as DailyResult;
  } catch {
    return null;
  }
}

type PlayerSettings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  // Adds to (never removes) the system Reduce Motion setting — see
  // useReducedMotionPreference. A player can ask the app for less motion
  // than their phone does; the app should never force more.
  reduceMotionOverride: boolean;
  playerName: string;
};

const DEFAULT_SETTINGS: PlayerSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  reduceMotionOverride: false,
  playerName: 'Word Hunter',
};

// Single write path for the settings blob — every setter below reads
// current state and writes all four fields together, so no setter can
// accidentally clobber a sibling field it doesn't know about.
function persistSettings(state: PlayerSettings): void {
  const next: PlayerSettings = {
    soundEnabled: state.soundEnabled,
    hapticsEnabled: state.hapticsEnabled,
    reduceMotionOverride: state.reduceMotionOverride,
    playerName: state.playerName,
  };
  AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
}

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
  // True only when `game` was hydrated from a real saved run via loadGame()
  // — the store's placeholder default game (set at module load, before
  // anyone has ever played) also has status 'playing', so that field alone
  // can't tell "never played" apart from "genuinely mid-run." Home reads
  // this to decide between RESUME HUNT and ENTER THE HUNT.
  hasResumableGame: boolean;
  ghosts: GhostMeaning[];
  ghostRevenge: GhostRevenge;
  runStartGhostWordIds: string[];
  startGame: () => void;
  loadGame: () => Promise<boolean>;
  forfeitGame: () => Promise<void>;
  submitSwipeUp: (maskId: string) => void;
  submitSwipeDown: (maskId: string) => void;
  submitWrongSwipe: () => void;
  resolveMystery: (
    correct: boolean,
    visiblePerfect: boolean,
    failedPair?: { real: string; trap: string },
  ) => void;
  beginMysteryGauntlet: (total: number) => void;
  completeWord: () => void;
  clearPollyTrigger: () => void;
  setPollyTrigger: (trigger: GameState['pollyTrigger']) => void;
  setGauntletActive: (active: boolean) => void;
  incrementGauntletCorrectCount: () => void;
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
  pauseDailyChallenge: (elapsedMs: number) => void;
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
  reduceMotionOverride: boolean;
  playerName: string;
  setSoundEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setReduceMotionOverride: (value: boolean) => void;
  setPlayerName: (name: string) => void;
  loadSettings: () => Promise<void>;
};

export const useGameStore = create<GameStore>((set, get) => ({
  game: createGame(generateHunt({})),
  hasResumableGame: false,
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
  reduceMotionOverride: DEFAULT_SETTINGS.reduceMotionOverride,
  playerName: DEFAULT_SETTINGS.playerName,

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
      game: createGame(steps, mercyReviveLives),
      ghostRevenge: null,
      runStartGhostWordIds,
    });
  },

  // Hydrates a saved run after the app was backgrounded/killed mid-Hunt
  // (see the debounced save subscription below), but never navigates on
  // its own — Home always shows first; it just switches its button to
  // RESUME HUNT via hasResumableGame when this finds something real.
  // A saved snapshot that isn't 'playing' is stale (the run finished
  // normally last time) and gets discarded rather than resumed.
  loadGame: async () => {
    try {
      const raw = await AsyncStorage.getItem(GAME_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw) as GameState;
      if (saved.status !== 'playing') {
        await AsyncStorage.removeItem(GAME_KEY);
        return false;
      }
      // gauntletActive/gauntletCorrectCount are transient UI-session state
      // (the actual gauntlet phase lives in useBoardMechanics component
      // state, not here) — force them back to their idle values on resume
      // so a snapshot saved mid-gauntlet can't leave the feather-row HUD
      // stuck dimmed after the app is backgrounded/killed and reopened.
      set({
        game: { ...saved, gauntletActive: false, gauntletCorrectCount: 0 },
        hasResumableGame: true,
      });
      return true;
    } catch {
      return false;
    }
  },

  // Deliberately leaving via PollyExitConfirm doesn't change game.status —
  // the in-memory run just stops being navigated to. Without this, force-
  // quitting before starting a fresh run would resume the very run the
  // player just chose to forfeit, contradicting the whole point of asking.
  forfeitGame: async () => {
    set({ hasResumableGame: false });
    try {
      await AsyncStorage.removeItem(GAME_KEY);
    } catch {}
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

  beginMysteryGauntlet: (total) =>
    set((s) => ({ game: beginMysteryGauntletFn(s.game, total) })),

  resolveMystery: (correct, visiblePerfect, failedPair) => {
    const prev = get().game;
    const step = prev.session[prev.stepIndex];
    const terminal = isMysteryTerminal(prev, correct);
    const next = resolveMysteryTile(prev, { correct, visiblePerfect });
    set({ game: next });
    if (!terminal) return;
    if (step.kind !== 'word') return;
    const isBoss = step.eventType === 'bossWord';
    const isHaunt = step.isHauntReturn === true;
    if (isBoss) {
      if (correct) {
        get().recordMastery(step.word, true, step.hiddenPairs?.[0]?.real ?? step.hiddenMeaning ?? '', visiblePerfect);
        // invariant: a mastered word is never also a pending ghost (covers die→revive→master)
        const wordId = step.word.trim().toUpperCase();
        const pruned = get().ghosts.filter(g => g.wordId !== wordId);
        if (pruned.length !== get().ghosts.length) {
          set({ ghosts: pruned });
          AsyncStorage.setItem(GHOSTS_KEY, JSON.stringify(pruned)).catch(() => {});
        }
      } else {
        get().queueFailedBoss(
          failedPair
            ? { ...step, hiddenMeaning: failedPair.real, hiddenTrap: failedPair.trap }
            : step,
        );
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

  setGauntletActive: (active) =>
    set((s) => ({
      game: {
        ...s.game,
        gauntletActive: active,
        gauntletCorrectCount: active ? 0 : s.game.gauntletCorrectCount,
      },
    })),

  incrementGauntletCorrectCount: () =>
    set((s) => ({
      game: { ...s.game, gauntletCorrectCount: Math.min(3, s.game.gauntletCorrectCount + 1) },
    })),

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
      : game.bossOutcome === 'mastered'
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
    persistSettings(get());
  },

  setHapticsEnabled: (value: boolean) => {
    set({ hapticsEnabled: value });
    persistSettings(get());
  },

  setReduceMotionOverride: (value: boolean) => {
    set({ reduceMotionOverride: value });
    persistSettings(get());
  },

  setPlayerName: (name: string) => {
    const trimmed = name.trim();
    set({ playerName: trimmed.length > 0 ? trimmed : DEFAULT_SETTINGS.playerName });
    persistSettings(get());
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
      await dailyPersistenceQueue.catch(() => {});
      const [attempt, rawResult, rawSession] = await Promise.all([
        AsyncStorage.getItem(attemptKey),
        AsyncStorage.getItem(resultKey),
        AsyncStorage.getItem(DAILY_ACTIVE_SESSION_KEY),
      ]);
      const attemptRecorded = attempt === date;
      const dailyResult = parseDailyResult(rawResult, date);

      if (dailyResult) {
        set({
          dailySession: null,
          daily: null,
          dailyAttemptDate: date,
          dailyResult,
          dailyLastClaimResult: null,
        });
        await enqueueDailyPersistence(async () => {
          await AsyncStorage.multiSet([[attemptKey, date]]);
          await AsyncStorage.removeItem(DAILY_ACTIVE_SESSION_KEY);
        });
        await get().loadGoldFeather();
        return;
      }

      const recovery = recoverDailySession(rawSession, date, attemptRecorded);
      const recoveredSession = recovery.session;

      if (!recoveredSession) {
        set({
          dailySession: null,
          daily: null,
          dailyAttemptDate: null,
          dailyResult: null,
          dailyLastClaimResult: null,
        });
        if (recovery.repaired) {
          await enqueueDailyPersistence(() =>
            AsyncStorage.removeItem(DAILY_ACTIVE_SESSION_KEY),
          );
        }
        await get().loadGoldFeather();
        return;
      }

      if (recoveredSession.status === 'active') {
        set({
          dailySession: recoveredSession,
          daily: toQuarantinedDailyState(recoveredSession),
          dailyAttemptDate: date,
          dailyResult: null,
          dailyLastClaimResult: null,
        });
        await enqueueDailyPersistence(() =>
          AsyncStorage.multiSet([
            [attemptKey, date],
            [
              DAILY_ACTIVE_SESSION_KEY,
              encodeDailySessionSnapshot(recoveredSession),
            ],
          ]),
        );
        await get().loadGoldFeather();
        return;
      }

      const recoveredResult = createDailyResult(recoveredSession);
      const progress = applyDailyStreak(get().progress, recoveredResult.date);
      const pollyMemory = rememberDaily(
        get().pollyMemory,
        recoveredResult.status,
        recoveredResult.date,
      );
      const streakMilestone = getRewardedStreakMilestone(
        progress.currentStreak,
        recoveredResult.goldFeatherEarned,
      );

      set({
        dailySession: recoveredSession,
        daily: toQuarantinedDailyState(recoveredSession),
        dailyAttemptDate: date,
        dailyResult: recoveredResult,
        dailyLastClaimResult: null,
        progress,
        pollyMemory,
        streakMilestoneReward: streakMilestone,
      });

      await enqueueDailyPersistence(async () => {
        await AsyncStorage.multiSet([
          [attemptKey, date],
          [resultKey, JSON.stringify(recoveredResult)],
          [PROGRESS_KEY, JSON.stringify(progress)],
          [POLLY_MEMORY_KEY, JSON.stringify(pollyMemory)],
        ]);
        await AsyncStorage.removeItem(DAILY_ACTIVE_SESSION_KEY);
      });
      if (recoveredResult.goldFeatherEarned) {
        await get().grantGoldFeather();
      } else {
        await get().loadGoldFeather();
      }
    } catch {
      set({
        dailySession: null,
        daily: null,
        dailyAttemptDate: null,
        dailyResult: null,
        dailyLastClaimResult: null,
      });
    }
  },

  startDailyChallenge: async (date = getTodayDateString()) => {
    if (get().dailyAttemptDate === date) return false;

    const attemptKey = DAILY_ATTEMPT_KEY_PREFIX + date;
    try {
      const existingAttempt = await AsyncStorage.getItem(attemptKey);
      if (existingAttempt === date) {
        await get().loadDailyResult(date);
        return false;
      }

      const dailySession = buildDailySession(date);
      await enqueueDailyPersistence(() =>
        AsyncStorage.multiSet([
          [attemptKey, date],
          [
            DAILY_ACTIVE_SESSION_KEY,
            encodeDailySessionSnapshot(dailySession),
          ],
        ]),
      );
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
    const streakMilestone = dailyResult
      ? getRewardedStreakMilestone(
          progress.currentStreak,
          dailyResult.goldFeatherEarned,
        )
      : null;

    set({
      dailySession: claim.session,
      daily: toQuarantinedDailyState(claim.session),
      dailyLastClaimResult: claim.result,
      ...(dailyResult ? { dailyResult } : {}),
      progress,
      pollyMemory,
      streakMilestoneReward: streakMilestone,
    });

    if (!dailyResult) {
      void persistActiveDailySession(claim.session);
    } else {
      const resultKey = DAILY_RESULT_KEY_PREFIX + dailyResult.date;
      const attemptKey = DAILY_ATTEMPT_KEY_PREFIX + dailyResult.date;
      void enqueueDailyPersistence(async () => {
        await AsyncStorage.setItem(
          DAILY_ACTIVE_SESSION_KEY,
          encodeDailySessionSnapshot(claim.session),
        );
        await AsyncStorage.multiSet([
          [attemptKey, dailyResult.date],
          [resultKey, JSON.stringify(dailyResult)],
          [PROGRESS_KEY, JSON.stringify(progress)],
          [POLLY_MEMORY_KEY, JSON.stringify(pollyMemory)],
        ]);
        await AsyncStorage.removeItem(DAILY_ACTIVE_SESSION_KEY);
      });
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
    void persistActiveDailySession(nextSession);
  },

  pauseDailyChallenge: (elapsedMs: number) => {
    const dailySession = get().dailySession;
    if (!dailySession || dailySession.status !== 'active') return;
    const pausedSession = pauseDailyRound(dailySession, elapsedMs);
    if (pausedSession === dailySession) return;
    set({
      dailySession: pausedSession,
      daily: toQuarantinedDailyState(pausedSession),
    });
    void persistActiveDailySession(pausedSession);
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
      await dailyPersistenceQueue.catch(() => {});
      await Promise.all([
        AsyncStorage.removeItem(attemptKey),
        AsyncStorage.removeItem(resultKey),
        AsyncStorage.removeItem(DAILY_ACTIVE_SESSION_KEY),
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
    const date = getTodayDateString();
    const attemptKey = DAILY_ATTEMPT_KEY_PREFIX + date;
    const resultKey  = DAILY_RESULT_KEY_PREFIX  + date;
    try {
      await dailyPersistenceQueue.catch(() => {});
      await Promise.all([
        AsyncStorage.removeItem(GHOSTS_KEY),
        AsyncStorage.removeItem(PROGRESS_KEY),
        AsyncStorage.removeItem(POLLY_MEMORY_KEY),
        AsyncStorage.removeItem(GOLD_FEATHER_KEY),
        AsyncStorage.removeItem(INTRO_SEEN_KEY),
        AsyncStorage.removeItem(BOSS_INTRO_SEEN_KEY),
        AsyncStorage.removeItem(GAME_KEY),
        AsyncStorage.removeItem(attemptKey),
        AsyncStorage.removeItem(resultKey),
        AsyncStorage.removeItem(DAILY_ACTIVE_SESSION_KEY),
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
      hasResumableGame: false,
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

// ── Active-run persistence ──────────────────────────────────────
// Backgrounding, an OS kill, or a crash mid-Hunt shouldn't erase the run —
// only the exit-confirm dialog (PollyExitConfirm) should be able to end it
// early. Debounced so a burst of swipes doesn't hit AsyncStorage on every
// single state change; reads fresh state at fire time to avoid a stale
// closure. Cleared as soon as the run leaves 'playing' (finished normally
// or a fresh run started), so a stale snapshot never resumes twice.
let saveGameTimer: ReturnType<typeof setTimeout> | null = null;

export async function flushActiveGamePersistence(): Promise<void> {
  if (saveGameTimer) {
    clearTimeout(saveGameTimer);
    saveGameTimer = null;
  }

  const { game } = useGameStore.getState();
  if (game.status !== 'playing') return;
  await AsyncStorage.setItem(GAME_KEY, JSON.stringify(game));
}

useGameStore.subscribe((state, prevState) => {
  if (state.game === prevState.game) return;
  if (saveGameTimer) {
    clearTimeout(saveGameTimer);
    saveGameTimer = null;
  }

  if (state.game.status !== 'playing') {
    AsyncStorage.removeItem(GAME_KEY).catch(() => {});
    if (state.hasResumableGame) useGameStore.setState({ hasResumableGame: false });
    return;
  }
  saveGameTimer = setTimeout(() => {
    saveGameTimer = null;
    AsyncStorage.setItem(GAME_KEY, JSON.stringify(useGameStore.getState().game)).catch(() => {});
  }, 400);
});
