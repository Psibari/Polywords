// Polly's Polybook work log — turns stored day rows into what she wrote.
//
// bookLog.ts records facts. This file reads them: which pool a day belongs
// to, which gap days get a quiet row she never actually recorded, and which
// line she drew for each one. Nothing here renders — there is no screen yet.
//
// Pure by contract, same as bookLog.ts: no React, no AsyncStorage, no Date,
// no Math.random. Dates arrive as local YYYY-MM-DD strings; this module
// never reads the wall clock, and never builds a JS Date to get there —
// all date arithmetic below is plain integer/string math so the result
// depends only on its inputs.

import { BookDayRecord } from './types';
import { deriveSeed, createSeededRng } from './seededRandom';
import {
  BOOK_LINE_POOLS,
  BookLinePoolName,
  BookLogRow,
  POLLY_BOOK_LINES,
  PRE_INSTALL_GENERAL,
  PRE_INSTALL_CRACKER,
  pickBookLine,
} from './pollyBookLines';
import { BOOK_LOG_CAP } from './bookLog';

/** More than this many meanings taken in a day and she calls it a heavy day.
 *  Roughly a run and a half — one ordinary session doesn't rattle her, a real
 *  sitting does. An estimate from average round length and typical accuracy,
 *  not measured from live play, and deliberately cheap to change: the log
 *  stores facts, not sentences, so retuning this restates every past day
 *  without stranding a single record. */
export const HEAVY_DAY_CLAIMS = 20;

/** One row as it renders on the page. */
export type WorkLogRow = {
  date: string;              // local YYYY-MM-DD
  word?: string;             // set only on word-naming rows; renders on its own line
  lines: string[];           // one or two lines of her handwriting
};

/**
 * Decide which pool a day belongs to.
 *
 * Order matters and is deliberate: specific events beat the general reading
 * of the day, because losing a word is the most interesting thing that can
 * happen and must never be buried under "a bad afternoon." LIGHT_DAY is the
 * default rather than a middle band between LIGHT and HEAVY — an average day
 * is one she spins as a win, which is in character for someone who never
 * credits the player.
 */
export function readDayBucket(row: BookDayRecord): BookLinePoolName {
  if (row.runs === 0) return 'QUIET_DAY';
  if (row.mastered.length > 0) return 'BOSS_LOST';
  if (row.hauntBroken.length > 0) return 'HAUNT_BROKEN';
  if (row.hauntLeft.length > 0) return 'HAUNT_LEFT';
  if (row.bossHeld > 0) return 'BOSS_HELD';
  if (row.mercy > 0) return 'MERCY';
  if (row.claims > HEAVY_DAY_CLAIMS) return 'HEAVY_DAY';
  return 'LIGHT_DAY';
}

// ── Pure calendar arithmetic — no Date object anywhere below ──────

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

function parseDateKey(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Add (or subtract, with a negative delta) whole days to a local date key. */
function addDays(date: string, delta: number): string {
  let { year, month, day } = parseDateKey(date);
  day += delta;
  while (day > daysInMonth(year, month)) {
    day -= daysInMonth(year, month);
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  while (day < 1) {
    month -= 1;
    if (month < 1) { month = 12; year -= 1; }
    day += daysInMonth(year, month);
  }
  return formatDateKey(year, month, day);
}

// Zero-padded YYYY-MM-DD sorts correctly as a plain string, so date range
// walks below compare dates with <= rather than parsing them again.

/** The word a word-naming bucket puts on its own line — the first name in
 *  the day's array, so a day with two masteries still reads the same way on
 *  every render. Not a word-naming bucket (or a synthetic gap day with no
 *  stored row): no word. */
function wordForBucket(bucket: BookLinePoolName, row: BookDayRecord | null): string | undefined {
  if (!row) return undefined;
  switch (bucket) {
    case 'BOSS_LOST': return row.mastered[0];
    case 'HAUNT_LEFT': return row.hauntLeft[0];
    case 'HAUNT_BROKEN': return row.hauntBroken[0];
    default: return undefined;
  }
}

/**
 * Draw the line for one day.
 *
 * A day's line depends ONLY on that day's own date and bookSeed — rolled
 * with deriveSeed(bookSeed, date) into createSeededRng, then pickBookLine
 * with an EMPTY recent list. Deliberately no running "recently used" list
 * threaded through the walk: that would make every past day's line depend
 * on its neighbours, so trimming the log at the cap, or simply playing
 * again and shifting what counts as "recent," could silently rewrite what
 * she wrote about a day months ago. A diary that changes what it said
 * about last Tuesday is not a diary. Two nearby days may occasionally draw
 * the same line — that is the accepted cost, and a small one against pools
 * this deep. Do not "fix" this by threading state through the walk; that is
 * the single most likely well-intentioned change to break this file.
 */
function drawLine(bucket: BookLinePoolName, date: string, bookSeed: number): string {
  const rng = createSeededRng(deriveSeed(bookSeed, date));
  const { line } = pickBookLine(BOOK_LINE_POOLS[bucket], [], rng());
  return line;
}

/**
 * Build the work-log rows the player would see, most-recent-first.
 */
export function buildWorkLog(input: {
  log: BookDayRecord[];   // most-recent-first, as stored
  today: string;          // local date key
  bookSeed: number;
  maxRows?: number;       // default 60
}): WorkLogRow[] {
  const { log, today, bookSeed, maxRows = 60 } = input;
  if (log.length === 0) return [];

  const byDate = new Map(log.map(row => [row.date, row]));
  const oldestDate = log[log.length - 1].date;

  // Today only appears if it was played — she writes at the end of a day,
  // so a "nobody came" line before the day is over is wrong. An unplayed
  // today simply isn't walked at all.
  const todayPlayed = byDate.has(today);
  const endDate = todayPlayed ? today : addDays(today, -1);

  // The oldest stored row reads FIRST_DAY instead of its computed bucket,
  // but only below the cap. Once the log has hit BOOK_LOG_CAP, the row that
  // is oldest today is not the player's actual first day — an earlier one
  // was trimmed off to make room — and calling it "first" would be a lie.
  const oldestIsFirstDay = log.length < BOOK_LOG_CAP;

  const rows: WorkLogRow[] = [];
  let cursor = oldestDate;
  while (cursor <= endDate) {
    // Days before the oldest stored row are not filled — the walk starts at
    // oldestDate and never goes earlier, so pre-player history is never
    // invented here. That ground belongs to buildPreInstallRows.
    const stored = byDate.get(cursor) ?? null;
    const bucket: BookLinePoolName = stored
      ? (cursor === oldestDate && oldestIsFirstDay ? 'FIRST_DAY' : readDayBucket(stored))
      : 'QUIET_DAY';
    const line = drawLine(bucket, cursor, bookSeed);
    const word = wordForBucket(bucket, stored);
    rows.push(word ? { date: cursor, word, lines: [line] } : { date: cursor, lines: [line] });
    cursor = addDays(cursor, 1);
  }

  rows.reverse();
  return rows.slice(0, maxRows);
}

/**
 * Build the dated rows that exist in the book before the player's history
 * begins — see docs/POLYBOOK.md and docs/POLLY_POLYBOOK_LOG_LINES.md §1.8.
 *
 * Rolled from deriveSeed(bookSeed, 'preInstall'), independent of any day's
 * own roll, so these rows never shift as the log grows or trims.
 */
export function buildPreInstallRows(input: {
  firstDate: string;  // the oldest date the player owns
  bookSeed: number;
  count?: number;     // default 4
}): WorkLogRow[] {
  const { firstDate, bookSeed, count = 4 } = input;
  const rng = createSeededRng(deriveSeed(bookSeed, 'preInstall'));

  // Exactly one row is the cracker — Pete's ruling: every player meets it.
  const crackerSlot = Math.floor(rng() * count);
  const crackerRow: BookLogRow = PRE_INSTALL_CRACKER[Math.floor(rng() * PRE_INSTALL_CRACKER.length)];

  // The rest are general rows, sampled without replacement so they're
  // always distinct from one another.
  const generalPool = [...PRE_INSTALL_GENERAL];
  const generalRows: BookLogRow[] = [];
  for (let i = 0; i < count - 1; i++) {
    const index = Math.floor(rng() * generalPool.length);
    generalRows.push(generalPool[index]);
    generalPool.splice(index, 1);
  }

  const rowsInOrder: BookLogRow[] = [];
  let generalIndex = 0;
  for (let slot = 0; slot < count; slot++) {
    if (slot === crackerSlot) {
      rowsInOrder.push(crackerRow);
    } else {
      rowsInOrder.push(generalRows[generalIndex]);
      generalIndex += 1;
    }
  }

  // Dated the `count` days immediately before firstDate, oldest first.
  return rowsInOrder.map((row, i) => ({
    date: addDays(firstDate, i - count),
    lines: row.map(id => POLLY_BOOK_LINES[id]),
  }));
}
