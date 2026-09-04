// Polly's Polybook work log — the pure part. One row per DAY.
//
// The design rule: STORE FACTS, NEVER SENTENCES AND NEVER A BUCKET NAME. A
// row holds counts and word names; whether that reads as a quiet, light or
// heavy day is decided at render time from the pools in pollyBookLines.ts.
// That way a bucket added later can be derived from rows already collected
// (Mercy arrived exactly this way), and rewriting her copy strands nothing.
//
// NOT BACKFILLABLE. No run history exists anywhere else in the app, so every
// day this does not record is a day that never existed. The display can come
// later; the recording cannot.
//
// Pure by contract: no React, no AsyncStorage, no Math.random. `Date` enters
// only through localDateKey(), which takes the date as an argument.

import { BookDayRecord } from './types';

/** Rows kept. Lifetime totals live in their own fields, so trimming here can
 *  never move a total. */
export const BOOK_LOG_CAP = 200;

/**
 * LOCAL YYYY-MM-DD — deliberately not toISOString(), which is UTC and would
 * file an 8pm New York run under the next day.
 */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The per-run facts that fold into a day's row. */
export type BookRunFacts = Omit<BookDayRecord, 'date'>;

/**
 * Fold one finished run into the log.
 *
 * Same local date as the newest row -> merge into it (counts add, word arrays
 * concatenate). Otherwise prepend a new row. Then trim to BOOK_LOG_CAP.
 *
 * Only the FIRST row is considered for merging: the log is most-recent-first
 * and a run always lands on today, so an older matching row cannot exist. If
 * one somehow did, prepending is the safe outcome — it never loses a fact.
 */
export function foldRunIntoBookLog(
  log: BookDayRecord[] | undefined,
  date: string,
  facts: BookRunFacts,
): BookDayRecord[] {
  const existing = Array.isArray(log) ? log : [];
  const head = existing[0];

  if (head && head.date === date) {
    const merged: BookDayRecord = {
      date,
      runs: head.runs + facts.runs,
      gotPast: head.gotPast + facts.gotPast,
      bossHeld: head.bossHeld + facts.bossHeld,
      bossLost: head.bossLost + facts.bossLost,
      mastered: [...head.mastered, ...facts.mastered],
      hauntLeft: [...head.hauntLeft, ...facts.hauntLeft],
      hauntBroken: [...head.hauntBroken, ...facts.hauntBroken],
      mercy: head.mercy + facts.mercy,
    };
    return [merged, ...existing.slice(1)].slice(0, BOOK_LOG_CAP);
  }

  return [{ date, ...facts }, ...existing].slice(0, BOOK_LOG_CAP);
}
