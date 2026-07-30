import {
  DAILY_ROUND_COUNT,
  buildDailySession,
  getChallengeNumber,
} from './dailyChallengeEngine';
import { DailyRound, DailySession } from './types';

const DAILY_SESSION_SNAPSHOT_VERSION = 1;

type DailySessionSnapshot = {
  version: typeof DAILY_SESSION_SNAPSHOT_VERSION;
  session: DailySession;
};

export type DailySessionRecovery = {
  session: DailySession | null;
  repaired: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown, length?: number): value is string[] {
  return (
    Array.isArray(value) &&
    (length === undefined || value.length === length) &&
    value.every(item => typeof item === 'string')
  );
}

function isStoredRound(value: unknown, index: number): value is DailyRound {
  if (!isRecord(value) || value.roundIndex !== index) return false;
  if (![1, 2, 3].includes(value.revealedClueCount as number)) return false;
  if (typeof value.solved !== 'boolean') return false;
  if (!isStringArray(value.wrongClaims)) return false;
  if (!isStringArray(value.candidates, 6)) return false;

  const word = value.word;
  if (!isRecord(word)) return false;
  if (typeof word.id !== 'string' || typeof word.answer !== 'string') return false;
  if (![1, 2, 3].includes(word.tier as number)) return false;
  if (!isStringArray(word.clues, 3)) return false;
  if (!isStringArray(word.candidates, 6)) return false;
  return true;
}

function normalizeStoredSession(
  value: unknown,
  expectedDate: string,
): DailySession | null {
  if (!isRecord(value)) return null;
  if (value.date !== expectedDate) return null;
  if (value.challengeNumber !== getChallengeNumber(expectedDate)) return null;
  if (!Array.isArray(value.rounds) || value.rounds.length !== DAILY_ROUND_COUNT) {
    return null;
  }
  if (!value.rounds.every((round, index) => isStoredRound(round, index))) {
    return null;
  }
  if (
    !Number.isInteger(value.currentRoundIndex) ||
    (value.currentRoundIndex as number) < 0 ||
    (value.currentRoundIndex as number) >= DAILY_ROUND_COUNT
  ) {
    return null;
  }
  if (![0, 1, 2].includes(value.chancesRemaining as number)) return null;
  if (!['active', 'won', 'lost'].includes(value.status as string)) return null;
  if (
    !Number.isInteger(value.solvedCount) ||
    (value.solvedCount as number) < 0 ||
    (value.solvedCount as number) > DAILY_ROUND_COUNT
  ) {
    return null;
  }
  if (!isFiniteNumber(value.startedAt)) return null;
  if (value.completedAt !== undefined && !isFiniteNumber(value.completedAt)) {
    return null;
  }

  const solvedCount = value.rounds.filter(round => round.solved).length;
  if (solvedCount !== value.solvedCount) return null;
  if (value.status === 'active' && value.chancesRemaining === 0) return null;
  if (value.status === 'won' && solvedCount !== DAILY_ROUND_COUNT) return null;
  if (value.status === 'lost' && value.chancesRemaining !== 0) return null;

  const roundElapsedMs = isFiniteNumber(value.roundElapsedMs)
    ? Math.max(0, Math.min(8000, value.roundElapsedMs))
    : 0;

  return {
    ...(value as unknown as DailySession),
    roundElapsedMs,
  };
}

export function encodeDailySessionSnapshot(session: DailySession): string {
  const snapshot: DailySessionSnapshot = {
    version: DAILY_SESSION_SNAPSHOT_VERSION,
    session,
  };
  return JSON.stringify(snapshot);
}

export function decodeDailySessionSnapshot(
  raw: string | null,
  expectedDate: string,
): DailySession | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== DAILY_SESSION_SNAPSHOT_VERSION) {
      return null;
    }
    return normalizeStoredSession(parsed.session, expectedDate);
  } catch {
    return null;
  }
}

export function recoverDailySession(
  raw: string | null,
  date: string,
  attemptRecorded: boolean,
): DailySessionRecovery {
  const restored = decodeDailySessionSnapshot(raw, date);
  if (restored) return { session: restored, repaired: false };
  if (attemptRecorded) {
    return { session: buildDailySession(date), repaired: true };
  }
  return { session: null, repaired: raw !== null };
}
