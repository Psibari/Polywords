// Run with: npx.cmd -y tsx app/game/dailyStreak.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import { applyDailyStreak, getDisplayStreak, getPreviousDateString } from './dailyStreak';
import { PlayerProgress } from './types';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function progress(overrides: Partial<PlayerProgress> = {}): PlayerProgress {
  return {
    masteredWords: [],
    personalBest: 0,
    runsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    ...overrides,
  };
}

// ── getPreviousDateString ────────────────────────────────────────
eq(getPreviousDateString('2026-07-07'), '2026-07-06', 'previous.plain');
eq(getPreviousDateString('2026-07-01'), '2026-06-30', 'previous.monthRollover');
eq(getPreviousDateString('2026-01-01'), '2025-12-31', 'previous.yearRollover');

// ── applyDailyStreak ──────────────────────────────────────────────

// First ever completion
{
  const p = applyDailyStreak(progress(), '2026-07-07');
  eq(p.currentStreak, 1, 'first.currentStreak');
  eq(p.longestStreak, 1, 'first.longestStreak');
  eq(p.lastStreakDate, '2026-07-07', 'first.lastStreakDate');
}

// Consecutive day increments
{
  const start = progress({ currentStreak: 4, longestStreak: 4, lastStreakDate: '2026-07-06' });
  const p = applyDailyStreak(start, '2026-07-07');
  eq(p.currentStreak, 5, 'consecutive.currentStreak');
  eq(p.longestStreak, 5, 'consecutive.longestStreak');
}

// Gap day resets to 1, longest is preserved
{
  const start = progress({ currentStreak: 5, longestStreak: 5, lastStreakDate: '2026-07-01' });
  const p = applyDailyStreak(start, '2026-07-07');
  eq(p.currentStreak, 1, 'gap.currentStreak');
  eq(p.longestStreak, 5, 'gap.longestStreakPreserved');
}

// Same day called twice is idempotent
{
  const start = progress({ currentStreak: 3, longestStreak: 3, lastStreakDate: '2026-07-07' });
  const p = applyDailyStreak(start, '2026-07-07');
  eq(p.currentStreak, 3, 'idempotent.currentStreak');
  eq(p, start, 'idempotent.sameReference');
}

// ── getDisplayStreak ──────────────────────────────────────────────

// Played today
eq(
  getDisplayStreak(progress({ currentStreak: 3, lastStreakDate: '2026-07-07' }), '2026-07-07'),
  3,
  'display.playedToday',
);

// Played yesterday, not yet today — streak still shows (not yet lapsed)
eq(
  getDisplayStreak(progress({ currentStreak: 3, lastStreakDate: '2026-07-06' }), '2026-07-07'),
  3,
  'display.playedYesterday',
);

// Missed 2+ days — shows 0 even though stored currentStreak is stale
eq(
  getDisplayStreak(progress({ currentStreak: 3, lastStreakDate: '2026-07-01' }), '2026-07-07'),
  0,
  'display.lapsed',
);

// Never played
eq(getDisplayStreak(progress(), '2026-07-07'), 0, 'display.never');

console.log('OK');
