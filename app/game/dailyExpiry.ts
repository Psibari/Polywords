import { getChallengeNumber } from './dailyChallengeEngine';
import { decodeDailySessionSnapshot } from './dailySessionPersistence';
import type { DailySession } from './types';

// A Daily lasts one local day (Pete, 2026-10-29): an unfinished Daily is lost
// when the day ends. No result, no streak, no Gold Feather. A new puzzle starts
// and the player is told once: TIME'S UP FOR DAILY #N.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * True when a Daily that is still being played belongs to an earlier date than
 * today's. Finished sessions (won/lost) are never "expired": their result is
 * already recorded under the date they were played.
 */
export function isDailySessionExpired(
  session: Pick<DailySession, 'date' | 'status'> | null | undefined,
  today: string,
): boolean {
  if (!session || session.status !== 'active') return false;
  return DATE_PATTERN.test(session.date) && session.date < today;
}

/**
 * The challenge number of the unfinished Daily saved in `raw`, when that Daily
 * belongs to an earlier date than `today`. Null for anything else: nothing
 * saved, today's own session, a finished session, or a snapshot that does not
 * validate (a notice is never built from corrupt data).
 */
export function readExpiredDailyNumber(raw: string | null, today: string): number | null {
  if (!raw) return null;
  let date: unknown;
  try {
    const parsed: unknown = JSON.parse(raw);
    const session = (parsed as { session?: { date?: unknown } } | null)?.session;
    date = session?.date;
  } catch {
    return null;
  }
  if (typeof date !== 'string' || !DATE_PATTERN.test(date) || date >= today) return null;
  const session = decodeDailySessionSnapshot(raw, date);
  if (!session || session.status !== 'active') return null;
  return getChallengeNumber(session.date);
}
