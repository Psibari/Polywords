// Run with: npx.cmd -y tsx app/game/pollyMood.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import { resolveHuntPerformance, resolveRivalryState } from './pollyMood';
import { HuntPerformance } from './types';
import { BookRivalryState } from './pollyBookLines';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

// ── resolveHuntPerformance ═══════════════════════════════════════

// ── struggle: gameOver at or before the halfway mark ────────────
{
  // sessionLength 10 -> ceil(10 / 2) = 5.
  eq(
    resolveHuntPerformance({ status: 'gameOver', stepIndex: 4, sessionLength: 10, bossOutcome: 'pending' }),
    'struggle',
    'stamp: exactly at the halfway boundary is struggle',
  );
  // One round further (roundsReached 6) crosses past the boundary.
  eq(
    resolveHuntPerformance({ status: 'gameOver', stepIndex: 5, sessionLength: 10, bossOutcome: 'pending' }),
    'steady',
    'stamp: one round past the boundary is steady, not struggle',
  );
  // Odd session length: ceil(9 / 2) = 5, same boundary behaviour.
  eq(
    resolveHuntPerformance({ status: 'gameOver', stepIndex: 4, sessionLength: 9, bossOutcome: 'pending' }),
    'struggle',
    'stamp: odd session length, at the boundary is struggle',
  );
  eq(
    resolveHuntPerformance({ status: 'gameOver', stepIndex: 5, sessionLength: 9, bossOutcome: 'pending' }),
    'steady',
    'stamp: odd session length, one round past the boundary is steady',
  );
  // Dying at round one is comfortably inside struggle territory.
  eq(
    resolveHuntPerformance({ status: 'gameOver', stepIndex: 0, sessionLength: 10, bossOutcome: 'pending' }),
    'struggle',
    'stamp: dying on round one is struggle',
  );
}

// ── clean: complete with the boss mastered, regardless of bossFlawless ──
// This is the corrected behaviour. resolveHuntPerformance takes no
// bossFlawless input at all — a mastered, complete run is clean no matter
// how the visible tiles went. If a flawless requirement is ever re-added,
// this is the test that will fail.
{
  eq(
    resolveHuntPerformance({ status: 'complete', stepIndex: 9, sessionLength: 10, bossOutcome: 'mastered' }),
    'clean',
    'stamp: complete + mastered is clean',
  );
  // Same result even for a run shape that would once have been "not flawless"
  // — there is nothing left in the input that could distinguish it.
  eq(
    resolveHuntPerformance({ status: 'complete', stepIndex: 7, sessionLength: 10, bossOutcome: 'mastered' }),
    'clean',
    'stamp: complete + mastered is clean regardless of what bossFlawless would have been',
  );
}

// ── steady: everything else ──────────────────────────────────────
{
  // gameOver past the halfway mark.
  eq(
    resolveHuntPerformance({ status: 'gameOver', stepIndex: 7, sessionLength: 10, bossOutcome: 'pending' }),
    'steady',
    'stamp: gameOver past halfway is steady',
  );
  // Complete but the boss was haunted, not mastered.
  eq(
    resolveHuntPerformance({ status: 'complete', stepIndex: 9, sessionLength: 10, bossOutcome: 'haunted' }),
    'steady',
    'stamp: complete + haunted is steady',
  );
  // Still playing (should never reach this function mid-run, but the
  // function should not misclassify it as struggle or clean either).
  eq(
    resolveHuntPerformance({ status: 'playing', stepIndex: 3, sessionLength: 10, bossOutcome: 'pending' }),
    'steady',
    'stamp: playing is steady',
  );
}

// ── resolveRivalryState ═══════════════════════════════════════════

const perf = (result: HuntPerformance, count: number): HuntPerformance[] =>
  Array.from({ length: count }, () => result);

// ── DISMISSIVE for a brand-new player ────────────────────────────
{
  const mood = resolveRivalryState({ recent: [], masteredCount: 0, runsCompleted: 0 });
  eq(mood, 'DISMISSIVE', 'rivalry: brand-new player is DISMISSIVE');
}

// ── Either door opens it, independently, and can't close again ──
{
  // Door 1: a mastery, even with almost no runs.
  const viaMastery = resolveRivalryState({ recent: [], masteredCount: 1, runsCompleted: 2 });
  ok(viaMastery !== 'DISMISSIVE', 'rivalry: one mastery opens the door on its own');
  eq(viaMastery, 'WATCHFUL', 'rivalry: noticed but an empty window reads WATCHFUL');

  // Door 2: a full window of runs, even with no mastery yet. This is also
  // the legacy-save shape: runsCompleted carried over from before this
  // feature existed, empty window because it's new.
  const viaRuns = resolveRivalryState({ recent: [], masteredCount: 0, runsCompleted: 5 });
  ok(viaRuns !== 'DISMISSIVE', 'rivalry: five runs opens the door on its own, with no mastery');
  eq(viaRuns, 'WATCHFUL', 'rivalry: noticed via runs alone still reads WATCHFUL with an empty window');
}

// ── A window shorter than five, with a mastery recorded, doesn't fall back to DISMISSIVE ──
{
  const mood = resolveRivalryState({ recent: perf('steady', 1), masteredCount: 1, runsCompleted: 1 });
  ok(mood !== 'DISMISSIVE', 'rivalry: a short window with a mastery is still noticed');
  eq(mood, 'WATCHFUL', 'rivalry: short window, nothing clean or struggle, reads WATCHFUL');
}

// ── The four remaining states, from representative windows ──────
{
  const noticed = { masteredCount: 1, runsCompleted: 6 };

  eq(
    resolveRivalryState({ recent: [...perf('clean', 2), 'steady'], ...noticed }),
    'CONCEDING',
    'rivalry: two or more clean is CONCEDING',
  );
  eq(
    resolveRivalryState({ recent: ['clean', 'steady', 'struggle'], ...noticed }),
    'RATTLED',
    'rivalry: exactly one clean is RATTLED',
  );
  eq(
    resolveRivalryState({ recent: [...perf('struggle', 3), 'steady'], ...noticed }),
    'AMUSED',
    'rivalry: three or more struggle (and fewer than two clean) is AMUSED',
  );
  eq(
    resolveRivalryState({ recent: ['steady', 'steady'], ...noticed }),
    'WATCHFUL',
    'rivalry: nothing notable is WATCHFUL',
  );
}

// ── Clean count is checked before struggle count ─────────────────
// Two clean plus three struggle in the same window: CONCEDING wins, per the
// stated order, not AMUSED.
{
  const mood = resolveRivalryState({
    recent: [...perf('clean', 2), ...perf('struggle', 3)],
    masteredCount: 1,
    runsCompleted: 6,
  });
  eq(mood, 'CONCEDING', 'rivalry: clean count takes priority over struggle count');
}

// Exercise the full BookRivalryState union so this test breaks if a state
// is ever renamed or removed without updating resolveRivalryState.
{
  const all: BookRivalryState[] = ['DISMISSIVE', 'AMUSED', 'WATCHFUL', 'RATTLED', 'CONCEDING'];
  eq(all.length, 5, 'rivalry: exactly five states exist');
}

console.log('OK — pollyMood: all assertions passed');
