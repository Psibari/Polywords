import { POLLY_LINES, PollyLineId, PollyMoment, pollyMoment } from './pollyCharacter';

export const POLLY_MEMORY_VERSION = 1 as const;
const RECENT_LINE_LIMIT = 5;

export type PollyHuntOutcome = 'pollyWon' | 'playerCompleted' | 'playerBeatPolly';
export type PollyDailyOutcome = 'won' | 'lost';

export type PollyMemory = {
  version: typeof POLLY_MEMORY_VERSION;
  huntsRemembered: number;
  lastHuntOutcome: PollyHuntOutcome | null;
  playerWinStreak: number;
  pollyWinStreak: number;
  lastHuntScore: number;
  lastBossWord: string | null;
  lastHauntWord: string | null;
  dailyChallengesRemembered: number;
  lastDailyOutcome: PollyDailyOutcome | null;
  lastDailyDate: string | null;
  homeGreetingCursor: number;
  recentLineIds: PollyLineId[];
};

export const DEFAULT_POLLY_MEMORY: PollyMemory = {
  version: POLLY_MEMORY_VERSION,
  huntsRemembered: 0,
  lastHuntOutcome: null,
  playerWinStreak: 0,
  pollyWinStreak: 0,
  lastHuntScore: 0,
  lastBossWord: null,
  lastHauntWord: null,
  dailyChallengesRemembered: 0,
  lastDailyOutcome: null,
  lastDailyDate: null,
  homeGreetingCursor: 0,
  recentLineIds: [],
};

const HOME_ROTATION: PollyLineId[] = [
  'homeBackAgain',
  'homeMissMe',
  'homeMissingMeanings',
  'homeLoseFeathers',
  'homeWordsAsked',
  'homeTakeTime',
];

function isPollyLineId(value: unknown): value is PollyLineId {
  return typeof value === 'string' && value in POLLY_LINES;
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function safeWord(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const word = value.trim().toUpperCase();
  return word.length > 0 && word.length <= 40 ? word : null;
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
    lastHuntScore: safeCount(raw.lastHuntScore),
    lastBossWord: safeWord(raw.lastBossWord),
    lastHauntWord: safeWord(raw.lastHauntWord),
    dailyChallengesRemembered: safeCount(raw.dailyChallengesRemembered),
    lastDailyOutcome,
    lastDailyDate: typeof raw.lastDailyDate === 'string' ? raw.lastDailyDate : null,
    homeGreetingCursor: safeCount(raw.homeGreetingCursor),
    recentLineIds,
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
    lastHuntScore: Math.max(0, Math.floor(input.score)),
    lastBossWord: safeWord(input.bossWord),
    lastHauntWord: safeWord(input.hauntWord) ?? memory.lastHauntWord,
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
    return pollyMoment(firstFresh(memory, ['homeWordsAsked', 'homeBackAgain']));
  }
  if (memory.pollyWinStreak >= 2) {
    return pollyMoment(firstFresh(memory, ['homeLoseFeathers', 'homeMissMe']));
  }
  if (memory.lastHauntWord) {
    return pollyMoment(firstFresh(memory, ['homeMissingMeanings', 'homeTakeTime']));
  }
  const rotated = HOME_ROTATION[memory.homeGreetingCursor % HOME_ROTATION.length];
  return pollyMoment(firstFresh(memory, [rotated, ...HOME_ROTATION]));
}

export function resolveResultsPollyMoment(
  memory: PollyMemory,
  input: {
    isComplete: boolean;
    allPerfect: boolean;
    bossMastered: boolean;
    hasMissed: boolean;
  },
): PollyMoment | null {
  if (!input.isComplete) {
    return memory.pollyWinStreak > 0
      ? pollyMoment('resultsTrapsRemember')
      : pollyMoment('resultsMeaningsHaunt');
  }
  if (input.allPerfect) return pollyMoment('resultsEmptyVault');
  if (memory.playerWinStreak > 0) return pollyMoment('resultsWantBack');
  if (input.bossMastered) return pollyMoment('resultsKeepWord');
  if (input.hasMissed) return pollyMoment('resultsMeaningsPast');
  return null;
}
