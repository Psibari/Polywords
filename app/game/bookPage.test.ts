// Run with: npx.cmd -y tsx app/game/bookPage.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import {
  readDayBucket,
  buildWorkLog,
  buildPreInstallRows,
  HEAVY_DAY_CLAIMS,
  WorkLogRow,
} from './bookPage';
import { BookDayRecord } from './types';
import { BOOK_LOG_CAP } from './bookLog';
import { PRE_INSTALL_GENERAL, PRE_INSTALL_CRACKER, POLLY_BOOK_LINES } from './pollyBookLines';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

// ── Test-only calendar helper — Date is used here for fixture
// construction with fixed, given values, never the wall clock, the same
// convention bookLogRecording.test.ts already uses. ──
function dateKey(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function addDaysTest(date: string, delta: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dateKey(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

const emptyDay: Omit<BookDayRecord, 'date'> = {
  runs: 1,
  gotPast: 0,
  claims: 0,
  offered: 0,
  bossHeld: 0,
  bossLost: 0,
  mastered: [],
  hauntLeft: [],
  hauntBroken: [],
  mercy: 0,
};

const day = (date: string, over: Partial<Omit<BookDayRecord, 'date'>> = {}): BookDayRecord => ({
  date,
  ...emptyDay,
  ...over,
});

// ── readDayBucket: each of the eight buckets ─────────────────────
{
  eq(readDayBucket(day('2026-09-01', { runs: 0 })), 'QUIET_DAY', 'bucket: quiet');
  eq(readDayBucket(day('2026-09-01', { mastered: ['BATTERY'] })), 'BOSS_LOST', 'bucket: boss lost');
  eq(readDayBucket(day('2026-09-01', { hauntBroken: ['STRIKE'] })), 'HAUNT_BROKEN', 'bucket: haunt broken');
  eq(readDayBucket(day('2026-09-01', { hauntLeft: ['STRIKE'] })), 'HAUNT_LEFT', 'bucket: haunt left');
  eq(readDayBucket(day('2026-09-01', { bossHeld: 1 })), 'BOSS_HELD', 'bucket: boss held');
  eq(readDayBucket(day('2026-09-01', { mercy: 1 })), 'MERCY', 'bucket: mercy');
  eq(readDayBucket(day('2026-09-01', { claims: HEAVY_DAY_CLAIMS + 1 })), 'HEAVY_DAY', 'bucket: heavy');
  eq(readDayBucket(day('2026-09-01', {})), 'LIGHT_DAY', 'bucket: light (default)');
}

// ── Priority: a mastery beats a heavy claim count ────────────────
{
  const row = day('2026-09-01', { mastered: ['BATTERY'], claims: HEAVY_DAY_CLAIMS + 50 });
  eq(readDayBucket(row), 'BOSS_LOST', 'priority: mastery beats heavy');
}

// ── HEAVY_DAY_CLAIMS boundary ─────────────────────────────────────
{
  eq(readDayBucket(day('2026-09-01', { claims: HEAVY_DAY_CLAIMS })), 'LIGHT_DAY', 'boundary: exactly at threshold is light');
  eq(readDayBucket(day('2026-09-01', { claims: HEAVY_DAY_CLAIMS + 1 })), 'HEAVY_DAY', 'boundary: one above is heavy');
}

// ── A run of two or more empty days between played days collapses into
// ONE quiet row spanning the whole run — a three-day gap now yields one
// row, not three ───────────────────────────────────────────────────
{
  const log = [day('2026-09-04'), day('2026-09-01')];
  const rows = buildWorkLog({ log, today: '2026-09-04', bookSeed: 42 });
  eq(rows.length, 3, 'gap: row count collapses to one quiet row');
  eq(rows[0].date, '2026-09-04', 'gap: newest first');
  eq(rows[1].date, '2026-09-02', 'gap: collapsed row starts on the first empty day');
  eq(rows[1].endDate, '2026-09-03', 'gap: collapsed row ends on the last empty day');
  ok(rows[1].word === undefined, 'gap: collapsed row has no word');
  eq(rows[2].date, '2026-09-01', 'gap: oldest last');
}

// ── A single empty day is still just a day, not a range ────────────
{
  const log = [day('2026-09-03'), day('2026-09-01')];
  const rows = buildWorkLog({ log, today: '2026-09-03', bookSeed: 11 });
  eq(rows.length, 3, 'single gap day: row count');
  eq(rows[1].date, '2026-09-02', 'single gap day: the one empty day');
  ok(rows[1].endDate === undefined, 'single gap day: no endDate on a lone quiet day');
}

// ── A collapsed range's line is exactly what a single row starting on
// that same date would have drawn — selection keys off the start date
// alone, never the range's length or end ────────────────────────────
{
  const seed = 314;
  const rangeRows = buildWorkLog({
    log: [day('2026-09-05'), day('2026-09-01')],
    today: '2026-09-05',
    bookSeed: seed,
  });
  const collapsed = rangeRows.find(r => r.date === '2026-09-02');
  ok(collapsed !== undefined, 'line match: pre-condition, collapsed row exists');
  eq(collapsed!.endDate, '2026-09-04', 'line match: pre-condition, range spans the full gap');

  const singleDayRows = buildWorkLog({
    log: [day('2026-09-03'), day('2026-09-01')],
    today: '2026-09-03',
    bookSeed: seed,
  });
  const single = singleDayRows.find(r => r.date === '2026-09-02');
  ok(single !== undefined, 'line match: pre-condition, single quiet row exists');

  eq(
    collapsed!.lines[0],
    single!.lines[0],
    'line match: a collapsed range draws the same line as a single row starting on its first day',
  );
}

// ── A collapsed range is stable: a later played day cannot change a
// range that is already bounded by two played days, because a player
// cannot go back and play a past day ─────────────────────────────────
{
  const seed = 4242;
  const first = buildWorkLog({
    log: [day('2026-09-01'), day('2026-08-25')],
    today: '2026-09-01',
    bookSeed: seed,
  });
  const firstRange = first.find(r => r.endDate !== undefined);
  ok(firstRange !== undefined, 'range stability: pre-condition, a collapsed range exists');

  const withNewDay = buildWorkLog({
    log: [day('2026-09-05'), day('2026-09-01'), day('2026-08-25')],
    today: '2026-09-05',
    bookSeed: seed,
  });
  const rangeAfter = withNewDay.find(r => r.date === firstRange!.date);
  ok(rangeAfter !== undefined, 'range stability: the old range is still present');
  eq(
    JSON.stringify(rangeAfter),
    JSON.stringify(firstRange),
    'range stability: appending a new played day leaves a bounded range byte-identical',
  );
}

// ── A collapsed range counts as exactly one row against maxRows ──────
{
  const rows = buildWorkLog({
    log: [day('2026-12-31'), day('2026-01-01')],
    today: '2026-12-31',
    bookSeed: 9,
    maxRows: 3,
  });
  eq(rows.length, 3, 'maxRows: a huge range still leaves room for the oldest row');
  eq(rows[0].date, '2026-12-31', 'maxRows: newest first');
  eq(rows[1].date, '2026-01-02', 'maxRows: the collapsed range starts right after the oldest day');
  eq(rows[1].endDate, '2026-12-30', 'maxRows: the collapsed range ends right before the newest day');
  eq(rows[2].date, '2026-01-01', 'maxRows: the oldest stored row still fits');
}

// ── Today only appears if it was played ───────────────────────────
{
  const unplayedToday = buildWorkLog({ log: [day('2026-09-01')], today: '2026-09-05', bookSeed: 1 });
  ok(!unplayedToday.some(r => r.date === '2026-09-05'), 'unplayed today: no row for today');
  eq(
    unplayedToday[0].date,
    '2026-09-02',
    'unplayed today: newest row is the collapsed range starting the day after the oldest stored day',
  );
  eq(unplayedToday[0].endDate, '2026-09-04', 'unplayed today: collapsed range ends the day before today');
  eq(unplayedToday.length, 2, 'unplayed today: row count collapses the gap to one range plus the oldest day');

  const playedToday = buildWorkLog({
    log: [day('2026-09-05'), day('2026-09-01')],
    today: '2026-09-05',
    bookSeed: 1,
  });
  eq(playedToday[0].date, '2026-09-05', 'played today: row for today exists and is newest');
}

// ── Nothing is generated before the oldest stored row ─────────────
{
  const rows = buildWorkLog({ log: [day('2026-09-10'), day('2026-09-05')], today: '2026-09-10', bookSeed: 7 });
  ok(rows.every(r => r.date >= '2026-09-05'), 'no rows before the oldest stored row');
  eq(rows[rows.length - 1].date, '2026-09-05', 'oldest returned row is the oldest stored row');
}

// ── Determinism: same input, same output ──────────────────────────
{
  const log = [day('2026-09-06', { claims: 3, offered: 5 }), day('2026-09-01', { mastered: ['SPARK'] })];
  const a = buildWorkLog({ log, today: '2026-09-06', bookSeed: 999 });
  const b = buildWorkLog({ log, today: '2026-09-06', bookSeed: 999 });
  eq(JSON.stringify(a), JSON.stringify(b), 'determinism: identical calls produce identical output');
}

// ── Stability: a new day never rewrites an old one ────────────────
{
  const seed = 4242;
  const first = buildWorkLog({ log: [day('2026-09-01')], today: '2026-09-01', bookSeed: seed });
  eq(first.length, 1, 'stability: pre-condition, one row');

  const withNewDay = buildWorkLog({
    log: [day('2026-09-05'), day('2026-09-01')],
    today: '2026-09-05',
    bookSeed: seed,
  });
  const oldestAfter = withNewDay.find(r => r.date === '2026-09-01');
  ok(oldestAfter !== undefined, 'stability: oldest row still present');
  eq(
    JSON.stringify(oldestAfter),
    JSON.stringify(first[0]),
    'stability: appending a new day leaves the old row byte-identical',
  );
}

// ── The oldest row reads FIRST_DAY below the cap, not at the cap ──
{
  // Below cap: a word-naming row at the very start of the log loses its
  // word — FIRST_DAY fully replaces the computed bucket, not just its line.
  const belowCap = buildWorkLog({
    log: [day('2026-09-01', { mastered: ['SPECIAL'] })],
    today: '2026-09-01',
    bookSeed: 5,
  });
  eq(belowCap.length, 1, 'first-day below cap: row count');
  ok(belowCap[0].word === undefined, 'first-day below cap: FIRST_DAY strips the word');

  // At the cap: build BOOK_LOG_CAP rows, oldest first in time (so folding
  // order matches how the store would have built this), with the oldest
  // one carrying a mastery. Once the log is at the cap, that row is read by
  // its real bucket, not FIRST_DAY.
  const newest = '2026-09-01';
  const atCapLog: BookDayRecord[] = [];
  for (let i = 0; i < BOOK_LOG_CAP; i++) {
    const date = addDaysTest(newest, -i);
    atCapLog.push(i === BOOK_LOG_CAP - 1 ? day(date, { mastered: ['SPECIAL'] }) : day(date));
  }
  eq(atCapLog.length, BOOK_LOG_CAP, 'at cap: pre-condition, log length');

  const atCap = buildWorkLog({ log: atCapLog, today: newest, bookSeed: 5, maxRows: BOOK_LOG_CAP + 10 });
  const oldestRow = atCap[atCap.length - 1];
  eq(oldestRow.date, atCapLog[atCapLog.length - 1].date, 'at cap: oldest row is the oldest stored row');
  eq(oldestRow.word, 'SPECIAL', 'at cap: oldest row reads its real (word-naming) bucket, not FIRST_DAY');
}

// ── buildPreInstallRows ═══════════════════════════════════════════

const generalTextSets = new Map<string, string>();
for (const row of PRE_INSTALL_GENERAL) {
  generalTextSets.set(JSON.stringify(row.map(id => POLLY_BOOK_LINES[id])), 'general');
}
const crackerTextSets = new Map<string, string>();
for (const row of PRE_INSTALL_CRACKER) {
  crackerTextSets.set(JSON.stringify(row.map(id => POLLY_BOOK_LINES[id])), 'cracker');
}

function classify(row: WorkLogRow): 'general' | 'cracker' | 'unknown' {
  const sig = JSON.stringify(row.lines);
  if (crackerTextSets.has(sig)) return 'cracker';
  if (generalTextSets.has(sig)) return 'general';
  return 'unknown';
}

// ── Exactly `count` rows, exactly one cracker, the rest distinct ──
{
  const firstDate = '2026-09-10';
  const rows = buildPreInstallRows({ firstDate, bookSeed: 123 });
  eq(rows.length, 4, 'pre-install: default count is 4');

  const kinds = rows.map(classify);
  ok(kinds.every(k => k !== 'unknown'), 'pre-install: every row resolves to a known pool row');
  eq(kinds.filter(k => k === 'cracker').length, 1, 'pre-install: exactly one cracker row');

  const signatures = rows.map(r => JSON.stringify(r.lines));
  eq(new Set(signatures).size, rows.length, 'pre-install: all rows distinct');
}

// ── Dated the days immediately before firstDate, oldest first ────
{
  const firstDate = '2026-09-10';
  const rows = buildPreInstallRows({ firstDate, bookSeed: 123 });
  const expectedDates = [4, 3, 2, 1].map(back => addDaysTest(firstDate, -back));
  eq(JSON.stringify(rows.map(r => r.date)), JSON.stringify(expectedDates), 'pre-install: dates, oldest first');
}

// ── A custom count still yields one cracker and the rest distinct ─
{
  const rows = buildPreInstallRows({ firstDate: '2026-09-10', bookSeed: 77, count: 6 });
  eq(rows.length, 6, 'pre-install: custom count honoured');
  const kinds = rows.map(classify);
  eq(kinds.filter(k => k === 'cracker').length, 1, 'pre-install: custom count, still exactly one cracker');
  const signatures = rows.map(r => JSON.stringify(r.lines));
  eq(new Set(signatures).size, rows.length, 'pre-install: custom count, all rows distinct');
}

// ── Determinism and seed sensitivity ──────────────────────────────
{
  const a = buildPreInstallRows({ firstDate: '2026-09-10', bookSeed: 555 });
  const b = buildPreInstallRows({ firstDate: '2026-09-10', bookSeed: 555 });
  eq(JSON.stringify(a), JSON.stringify(b), 'pre-install: same seed, identical output');

  const c = buildPreInstallRows({ firstDate: '2026-09-10', bookSeed: 556 });
  ok(JSON.stringify(a) !== JSON.stringify(c), 'pre-install: different seed, different output');
}

console.log('OK — bookPage: all assertions passed');
