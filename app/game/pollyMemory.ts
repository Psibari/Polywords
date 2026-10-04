import { POLLY_LINES, PollyLineId, PollyMoment, pollyMoment } from './pollyCharacter';
// No cycle: pollyVisitPolicy imports only from pollyCharacter.
import { pickFreshLine } from './pollyVisitPolicy';

export const POLLY_MEMORY_VERSION = 2 as const;
const RECENT_LINE_LIMIT = 5;

export type PollyHuntOutcome = 'pollyWon' | 'playerCompleted' | 'playerBeatPolly';
export type PollyDailyOutcome = 'won' | 'lost';

export type PollyWordRivalry = {
  word: string;
  hauntHolds: number;
  banished: boolean;
  firstHauntedAt: string | null;
  lastHauntAt: string | null;
  banishedAt: string | null;
};

export type PollyMemory = {
  version: typeof POLLY_MEMORY_VERSION;
  huntsRemembered: number;
  lastHuntOutcome: PollyHuntOutcome | null;
  playerWinStreak: number;
  pollyWinStreak: number;
  /** Lifetime Hunt wins, never reset. Written from the same place as the
   *  streaks above so the two can never drift apart. A streak answers "what is
   *  happening now"; these answer "what has happened", which the Polybook's
   *  rivalry states need and a five-entry window cannot give. */
  playerHuntsWon: number;
  pollyHuntsWon: number;
  lastHuntScore: number;
  lastBossWord: string | null;
  lastHauntWord: string | null;
  dailyChallengesRemembered: number;
  lastDailyOutcome: PollyDailyOutcome | null;
  lastDailyDate: string | null;
  homeGreetingCursor: number;
  recentLineIds: PollyLineId[];
  /** Previous meaningful visit time. Updated on app background, not on every
   *  foreground transition, so the next launch can measure a real absence. */
  lastVisitAt: number | null;
  longestPlayerWinStreak: number;
  longestPollyWinStreak: number;
  /** Durable history for words that became personal Haunts. Active Ghost
   *  state can disappear after resolution; this intentionally does not. */
  wordRivalries: Record<string, PollyWordRivalry>;
};

export const DEFAULT_POLLY_MEMORY: PollyMemory = {
  version: POLLY_MEMORY_VERSION,
  huntsRemembered: 0,
  lastHuntOutcome: null,
  playerWinStreak: 0,
  pollyWinStreak: 0,
  playerHuntsWon: 0,
  pollyHuntsWon: 0,
  lastHuntScore: 0,
  lastBossWord: null,
  lastHauntWord: null,
  dailyChallengesRemembered: 0,
  lastDailyOutcome: null,
  lastDailyDate: null,
  homeGreetingCursor: 0,
  recentLineIds: [],
  lastVisitAt: null,
  longestPlayerWinStreak: 0,
  longestPollyWinStreak: 0,
  wordRivalries: {},
};

const HOME_ROTATION: PollyLineId[] = [
  'homeBackAgain',
  'homeMissMe',
  'homeMissingMeanings',
  'homeLoseFeathers',
  'homeWordsAsked',
  'homeYourHighness',
  'homeCrown',
];

function isPollyLineId(value: unknown): value is PollyLineId {
  return typeof value === 'string' && value in POLLY_LINES;
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function safeTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : null;
}

function safeDate(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function safeWord(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const word = value.trim().toUpperCase();
  return word.length > 0 && word.length <= 40 ? word : null;
}

function hydrateWordRivalries(value: unknown): Record<string, PollyWordRivalry> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, PollyWordRivalry> = {};
  for (const rawValue of Object.values(value as Record<string, unknown>)) {
    if (!rawValue || typeof rawValue !== 'object') continue;
    const raw = rawValue as Partial<PollyWordRivalry>;
    const word = safeWord(raw.word);
    if (!word) continue;
    result[word] = {
      word,
      hauntHolds: safeCount(raw.hauntHolds),
      banished: raw.banished === true,
      firstHauntedAt: safeDate(raw.firstHauntedAt),
      lastHauntAt: safeDate(raw.lastHauntAt),
      banishedAt: safeDate(raw.banishedAt),
    };
  }
  return result;
}

export function hydratePollyMemory(value: unknown): PollyMemory {
  if (!value || typeof value !== 'object') return { ...DEFAULT_POLLY_MEMORY };
  const raw = value as Partial<PollyMemory>;
  const recentLineIds = Array.isArray(raw.recentLineIds)
    ? raw.recentLineIds.filter(isPollyLineId).slice(-RECENT_LINE_LIMIT)
    : [];
  const lastHuntOutcome =
    raw.lastHuntOutcome === 'pollyWon' ||
    raw.lastHuntOutcome === 'playerCompleted' ||
    raw.lastHuntOutcome === 'playerBeatPolly'
      ? raw.lastHuntOutcome
      : null;
  const lastDailyOutcome = raw.lastDailyOutcome === 'won' || raw.lastDailyOutcome === 'lost'
    ? raw.lastDailyOutcome
    : null;

  return {
    version: POLLY_MEMORY_VERSION,
    huntsRemembered: safeCount(raw.huntsRemembered),
    lastHuntOutcome,
    playerWinStreak: safeCount(raw.playerWinStreak),
    pollyWinStreak: safeCount(raw.pollyWinStreak),
    // safeCount hydrates an absent field to 0, so saves written before these
    // existed migrate cleanly — as undercounts, not as wrong numbers.
    playerHuntsWon: safeCount(raw.playerHuntsWon),
    pollyHuntsWon: safeCount(raw.pollyHuntsWon),
    lastHuntScore: safeCount(raw.lastHuntScore),
    lastBossWord: safeWord(raw.lastBossWord),
    lastHauntWord: safeWord(raw.lastHauntWord),
    dailyChallengesRemembered: safeCount(raw.dailyChallengesRemembered),
    lastDailyOutcome,
    lastDailyDate: typeof raw.lastDailyDate === 'string' ? raw.lastDailyDate : null,
    homeGreetingCursor: safeCount(raw.homeGreetingCursor),
    recentLineIds,
    lastVisitAt: safeTimestamp(raw.lastVisitAt),
    // V1 saves have no historical peaks. The current streak is the only peak
    // we can prove, so migrate to that rather than inventing past history.
    longestPlayerWinStreak: Math.max(
      safeCount(raw.longestPlayerWinStreak),
      safeCount(raw.playerWinStreak),
    ),
    longestPollyWinStreak: Math.max(
      safeCount(raw.longestPollyWinStreak),
      safeCount(raw.pollyWinStreak),
    ),
    wordRivalries: hydrateWordRivalries(raw.wordRivalries),
  };
}

export function rememberPollyLine(
  memory: PollyMemory,
  lineId: PollyLineId,
  surface: 'home' | 'hunt' | 'daily' | 'results',
): PollyMemory {
  return {
    ...memory,
    homeGreetingCursor:
      surface === 'home' ? memory.homeGreetingCursor + 1 : memory.homeGreetingCursor,
    recentLineIds: [...memory.recentLineIds.filter(id => id !== lineId), lineId]
      .slice(-RECENT_LINE_LIMIT),
  };
}

export function rememberHunt(
  memory: PollyMemory,
  input: {
    outcome: PollyHuntOutcome;
    score: number;
    bossWord?: string | null;
    hauntWord?: string | null;
  },
): PollyMemory {
  const playerWon = input.outcome === 'playerBeatPolly';
  const pollyWon = input.outcome === 'pollyWon';
  return {
    ...memory,
    huntsRemembered: memory.huntsRemembered + 1,
    lastHuntOutcome: input.outcome,
    playerWinStreak: playerWon ? memory.playerWinStreak + 1 : 0,
    pollyWinStreak: pollyWon ? memory.pollyWinStreak + 1 : 0,
    playerHuntsWon: memory.playerHuntsWon + (playerWon ? 1 : 0),
    pollyHuntsWon: memory.pollyHuntsWon + (pollyWon ? 1 : 0),
    lastHuntScore: Math.max(0, Math.floor(input.score)),
    lastBossWord: safeWord(input.bossWord),
    lastHauntWord: safeWord(input.hauntWord) ?? memory.lastHauntWord,
    longestPlayerWinStreak: Math.max(
      memory.longestPlayerWinStreak,
      playerWon ? memory.playerWinStreak + 1 : 0,
    ),
    longestPollyWinStreak: Math.max(
      memory.longestPollyWinStreak,
      pollyWon ? memory.pollyWinStreak + 1 : 0,
    ),
  };
}

export function rememberVisit(memory: PollyMemory, visitedAt: number): PollyMemory {
  const safeVisitedAt = safeTimestamp(visitedAt);
  if (safeVisitedAt === null || safeVisitedAt === memory.lastVisitAt) return memory;
  return { ...memory, lastVisitAt: safeVisitedAt };
}

export function rememberHauntCreated(
  memory: PollyMemory,
  wordInput: string,
  date: string,
): PollyMemory {
  const word = safeWord(wordInput);
  if (!word) return memory;
  const existing = memory.wordRivalries[word];
  if (existing) return memory;
  const safeDay = safeDate(date);
  return {
    ...memory,
    wordRivalries: {
      ...memory.wordRivalries,
      [word]: {
        word,
        hauntHolds: 0,
        banished: false,
        firstHauntedAt: safeDay,
        lastHauntAt: safeDay,
        banishedAt: null,
      },
    },
  };
}

export function rememberHauntResolution(
  memory: PollyMemory,
  wordInput: string,
  outcome: 'haunted' | 'banished',
  date: string,
): PollyMemory {
  const word = safeWord(wordInput);
  if (!word) return memory;
  const safeDay = safeDate(date);
  const existing = memory.wordRivalries[word] ?? {
    word,
    hauntHolds: 0,
    banished: false,
    firstHauntedAt: null,
    lastHauntAt: null,
    banishedAt: null,
  };
  // A banish is permanent relationship history. A stale/replayed failure must
  // never resurrect it. Store wiring calls this only after the Ghost resolver's
  // idempotency gate says the resolution actually changed state.
  if (existing.banished) return memory;
  const next: PollyWordRivalry = outcome === 'banished'
    ? { ...existing, banished: true, lastHauntAt: safeDay, banishedAt: safeDay }
    : { ...existing, hauntHolds: existing.hauntHolds + 1, lastHauntAt: safeDay };
  return {
    ...memory,
    wordRivalries: { ...memory.wordRivalries, [word]: next },
  };
}

export function rememberDaily(
  memory: PollyMemory,
  outcome: PollyDailyOutcome,
  date: string,
): PollyMemory {
  if (memory.lastDailyDate === date) return memory;
  return {
    ...memory,
    dailyChallengesRemembered: memory.dailyChallengesRemembered + 1,
    lastDailyOutcome: outcome,
    lastDailyDate: date,
  };
}

function firstFresh(memory: PollyMemory, candidates: PollyLineId[]): PollyLineId {
  return candidates.find(id => !memory.recentLineIds.includes(id)) ?? candidates[0];
}

export function resolveHomePollyMoment(memory: PollyMemory): PollyMoment {
  if (
    memory.homeGreetingCursor === 0 &&
    memory.huntsRemembered === 0 &&
    memory.dailyChallengesRemembered === 0
  ) {
    return pollyMoment('homeFirstMeeting');
  }
  if (memory.playerWinStreak > 0) {
    return pollyMoment(firstFresh(memory, [
      'homeWordsAsked', 'homeBackAgain', 'homeCracker',
      'homeGoAgain', 'homeReady', 'homeDoubleOrNothing',
    ]));
  }
  if (memory.pollyWinStreak >= 2) {
    return pollyMoment(firstFresh(memory, ['homeLoseFeathers', 'homeMissMe', 'homeChamp']));
  }
  if (memory.lastHauntWord) {
    return pollyMoment(firstFresh(memory, ['homeMissingMeanings']));
  }
  const rotated = HOME_ROTATION[memory.homeGreetingCursor % HOME_ROTATION.length];
  return pollyMoment(firstFresh(memory, [rotated, ...HOME_ROTATION]));
}

const RESULTS_FLAWLESS_LINES: PollyLineId[] = [
  'resultsNobodySaw', 'resultsNeverHappened', 'resultsAMoment', 'resultsRude',
  'resultsDareYou', 'resultsThatWasGood', 'resultsReadEveryOne',
  'resultsNothingToSay', 'resultsIWroteThose', 'resultsTakingNotes',
];
const RESULTS_PLAYER_STREAK_LINES: PollyLineId[] = [
  'resultsGettingOld', 'resultsEnjoyIt', 'resultsAdjustments',
  'resultsDontGetComfortable', 'resultsNewOnesTonight',
  'resultsLuckyLately', 'resultsIveNoticed',
];
const RESULTS_MASTERED_LINES: PollyLineId[] = [
  'resultsManyMore', 'resultsSecondBest', 'resultsGotOne',
];

export function resolveResultsPollyMoment(
  memory: PollyMemory,
  input: {
    isComplete: boolean;
    allPerfect: boolean;
    bossMastered: boolean;
    hasMissed: boolean;
  },
  roll: number,
): PollyMoment | null {
  if (!input.isComplete) {
    return memory.pollyWinStreak > 0
      ? pollyMoment('resultsTrapsRemember')
      : pollyMoment('resultsMeaningsHaunt');
  }
  if (input.allPerfect) {
    return pollyMoment(pickFreshLine(RESULTS_FLAWLESS_LINES, memory.recentLineIds, roll));
  }
  if (memory.playerWinStreak > 0) {
    return pollyMoment(pickFreshLine(RESULTS_PLAYER_STREAK_LINES, memory.recentLineIds, roll));
  }
  if (input.bossMastered) {
    return pollyMoment(pickFreshLine(RESULTS_MASTERED_LINES, memory.recentLineIds, roll));
  }
  if (input.hasMissed) return pollyMoment('resultsMeaningsPast');
  return null;
}
