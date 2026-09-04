// Run with: npx.cmd -y tsx app/game/bookLogRecording.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import { foldRunIntoBookLog, localDateKey, BOOK_LOG_CAP, BookRunFacts } from './bookLog';
import { BookDayRecord, Mask, PlayerProgress, SessionStep, WordStep } from './types';
import { createGame, consumeMercy, submitWrongSwipe } from './polyRunEngine';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

const emptyRun: BookRunFacts = {
  runs: 1,
  gotPast: 0,
  bossHeld: 0,
  bossLost: 0,
  mastered: [],
  hauntLeft: [],
  hauntBroken: [],
  mercy: 0,
};

const run = (over: Partial<BookRunFacts> = {}): BookRunFacts => ({ ...emptyRun, ...over });

// ── A second run on the same date merges rather than appending ──
{
  const first = foldRunIntoBookLog(undefined, '2026-09-04', run({
    gotPast: 4, bossLost: 1, mastered: ['CONCENTRATION'], mercy: 1,
  }));
  eq(first.length, 1, 'first run: row count');

  const second = foldRunIntoBookLog(first, '2026-09-04', run({
    gotPast: 3, bossHeld: 1, hauntLeft: ['BATTERY'],
  }));
  eq(second.length, 1, 'same date: still one row');
  eq(second[0].date, '2026-09-04', 'same date: date');
  eq(second[0].runs, 2, 'same date: runs added');
  eq(second[0].gotPast, 7, 'same date: gotPast added');
  eq(second[0].bossLost, 1, 'same date: bossLost carried');
  eq(second[0].bossHeld, 1, 'same date: bossHeld added');
  eq(second[0].mercy, 1, 'same date: mercy carried');
  eq(second[0].mastered.join(','), 'CONCENTRATION', 'same date: mastered concatenated');
  eq(second[0].hauntLeft.join(','), 'BATTERY', 'same date: hauntLeft concatenated');

  // A third merge keeps accumulating rather than replacing.
  const third = foldRunIntoBookLog(second, '2026-09-04', run({
    gotPast: 1, mastered: ['STRIKE'], mercy: 1,
  }));
  eq(third.length, 1, 'third run: still one row');
  eq(third[0].runs, 3, 'third run: runs');
  eq(third[0].gotPast, 8, 'third run: gotPast');
  eq(third[0].mercy, 2, 'third run: mercy');
  eq(third[0].mastered.join(','), 'CONCENTRATION,STRIKE', 'third run: mastered order');
}

// ── Merging never mutates the row it was given ──────────────────
{
  const first = foldRunIntoBookLog(undefined, '2026-09-04', run({ gotPast: 2, mastered: ['BANK'] }));
  const snapshotGotPast = first[0].gotPast;
  const snapshotMastered = first[0].mastered.length;
  foldRunIntoBookLog(first, '2026-09-04', run({ gotPast: 5, mastered: ['CHECK'] }));
  eq(first[0].gotPast, snapshotGotPast, 'no mutation: gotPast');
  eq(first[0].mastered.length, snapshotMastered, 'no mutation: mastered array');
}

// ── A run on a new date prepends, most-recent-first ─────────────
{
  const day1 = foldRunIntoBookLog(undefined, '2026-09-03', run({ gotPast: 2 }));
  const day2 = foldRunIntoBookLog(day1, '2026-09-04', run({ gotPast: 9 }));
  eq(day2.length, 2, 'new date: row count');
  eq(day2[0].date, '2026-09-04', 'new date: newest is first');
  eq(day2[1].date, '2026-09-03', 'new date: older is second');
  eq(day2[0].gotPast, 9, 'new date: new row facts');
  eq(day2[1].gotPast, 2, 'new date: old row untouched');
}

// ── The array caps at 200 rows, dropping the oldest ─────────────
{
  let log: BookDayRecord[] = [];
  // 250 consecutive days, oldest first in time -> each fold prepends.
  for (let i = 0; i < 250; i++) {
    const day = String(i).padStart(3, '0');
    log = foldRunIntoBookLog(log, `2026-01-${day}`, run({ gotPast: i }));
  }
  eq(BOOK_LOG_CAP, 200, 'cap constant');
  eq(log.length, 200, 'cap: row count');
  eq(log[0].date, '2026-01-249', 'cap: newest kept');
  eq(log[199].date, '2026-01-050', 'cap: oldest kept is the 200th back');
  ok(!log.some(r => r.date === '2026-01-049'), 'cap: row 201 back was dropped');
}

// ── Capping also applies on a same-date merge ───────────────────
{
  let log: BookDayRecord[] = [];
  for (let i = 0; i < 205; i++) {
    log = foldRunIntoBookLog(log, `2026-02-${String(i).padStart(3, '0')}`, run());
  }
  eq(log.length, 200, 'merge cap: pre-condition');
  const merged = foldRunIntoBookLog(log, log[0].date, run({ gotPast: 3 }));
  eq(merged.length, 200, 'merge cap: still capped');
  eq(merged[0].runs, 2, 'merge cap: head merged not prepended');
}

// ── An existing save with no bookLog migrates cleanly ───────────
{
  const legacy: PlayerProgress = {
    masteredWords: [],
    personalBest: 4200,
    runsCompleted: 17,
    currentStreak: 2,
    longestStreak: 5,
    lastStreakDate: null,
  };
  ok(legacy.bookLog === undefined, 'migration: pre-condition, no bookLog');
  const migrated = foldRunIntoBookLog(legacy.bookLog, '2026-09-04', run({ gotPast: 6 }));
  eq(migrated.length, 1, 'migration: first row created');
  eq(migrated[0].gotPast, 6, 'migration: facts recorded');
  eq(migrated[0].runs, 1, 'migration: run counted');
  // Nothing is invented for the 17 runs that predate the log — it is not
  // backfillable, and a fabricated history would be worse than a short one.
  ok(migrated.every(r => r.date === '2026-09-04'), 'migration: no backfilled rows');
}

// ── A non-array bookLog (corrupt save) is tolerated ─────────────
{
  const recovered = foldRunIntoBookLog(
    undefined as unknown as BookDayRecord[],
    '2026-09-04',
    run(),
  );
  eq(recovered.length, 1, 'corrupt save: recovers to one row');
}

// ── localDateKey uses LOCAL time, not UTC ───────────────────────
{
  // 8pm New York on 4 Sep is 00:00 UTC on 5 Sep. The diary must say the 4th.
  // Built from local components so the assertion holds in any zone: this is
  // a local 2026-09-04 20:00 whatever the runner's offset.
  const evening = new Date(2026, 8, 4, 20, 0, 0);
  eq(localDateKey(evening), '2026-09-04', 'local date: 8pm stays on its own day');

  const nearMidnight = new Date(2026, 8, 4, 23, 59, 59);
  eq(localDateKey(nearMidnight), '2026-09-04', 'local date: 23:59 stays on its own day');

  const justAfter = new Date(2026, 8, 5, 0, 0, 1);
  eq(localDateKey(justAfter), '2026-09-05', 'local date: 00:00 rolls over');

  // Zero-padding for single-digit months and days.
  eq(localDateKey(new Date(2026, 0, 7, 12, 0, 0)), '2026-01-07', 'local date: padding');

  // The bug this guards: toISOString() is UTC and would file a late-evening
  // run under tomorrow wherever the local offset is negative.
  const offsetMinutes = evening.getTimezoneOffset();
  if (offsetMinutes > 0) {
    ok(
      evening.toISOString().slice(0, 10) !== localDateKey(evening),
      'local date: UTC and local genuinely differ here, and local won',
    );
  }
}

// ── Two runs either side of local midnight land on different rows ──
{
  const before = new Date(2026, 8, 4, 23, 50, 0);
  const after = new Date(2026, 8, 5, 0, 10, 0);
  const log1 = foldRunIntoBookLog(undefined, localDateKey(before), run({ gotPast: 1 }));
  const log2 = foldRunIntoBookLog(log1, localDateKey(after), run({ gotPast: 2 }));
  eq(log2.length, 2, 'midnight: two rows');
  eq(log2[0].date, '2026-09-05', 'midnight: newest row');
  eq(log2[1].date, '2026-09-04', 'midnight: older row');
}

// ── mercyUsed survives consumeMercy, which mercyTriggered does not ──
// This is the whole reason a counter exists: mercyTriggered is a UI flag the
// board clears once the reveal has played, so it is normally false by run end
// and cannot be read at completion.
{
  const masks: Mask[] = [
    { id: 'r1', phrase: 'REAL ONE', isReal: true },
    { id: 't1', phrase: 'TRAP ONE', isReal: false },
  ];
  const word = (name: string): WordStep => ({
    kind: 'word',
    word: name,
    emotionalRole: 'confidence',
    eventType: 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    meanings: [],
    masks: masks.map(m => ({ ...m })),
  });
  const steps: SessionStep[] = [word('ALPHA'), word('OMEGA')];

  // mercyReviveLives 3 = a fledgling run's safety net.
  let game = createGame(steps, 3, 1234, 40);
  eq(game.mercyUsed, 0, 'mercy: starts at zero');
  eq(game.runStartRealMaskCount, 40, 'baseline: recorded at run start');

  // Burn all six feathers. The sixth loss trips Mercy instead of ending it.
  for (let i = 0; i < 6; i++) game = submitWrongSwipe(game);
  eq(game.status, 'playing', 'mercy: run revived rather than ending');
  eq(game.mercyTriggered, true, 'mercy: UI flag raised');
  eq(game.mercyUsed, 1, 'mercy: counted');
  eq(game.mercyReviveLives, 0, 'mercy: net spent');

  // The UI handles the reveal and clears the flag — the count must survive.
  game = consumeMercy(game);
  eq(game.mercyTriggered, false, 'mercy: UI flag cleared');
  eq(game.mercyUsed, 1, 'mercy: count survives consumeMercy');

  // Losing the rest of the feathers ends the run with the count intact.
  for (let i = 0; i < 3; i++) game = submitWrongSwipe(game);
  eq(game.status, 'gameOver', 'mercy: run ends the second time');
  eq(game.mercyUsed, 1, 'mercy: count survives to run completion');
  eq(game.runStartRealMaskCount, 40, 'baseline: survives to run completion');

  // And a run with no net never counts one.
  let netless = createGame(steps, 0, 1234, 0);
  for (let i = 0; i < 6; i++) netless = submitWrongSwipe(netless);
  eq(netless.status, 'gameOver', 'no-net run: ends');
  eq(netless.mercyUsed, 0, 'no-net run: no mercy counted');
}

// ── gotPast is the run's own contribution, not the lifetime total ──
// Mirrors the arithmetic in useGameStore's run-completion block.
{
  const gotPast = (baseline: number | undefined, totalNow: number): number => {
    const clamped = Number.isFinite(baseline)
      ? Math.min(baseline as number, totalNow)
      : totalNow;
    return Math.max(0, totalNow - clamped);
  };
  eq(gotPast(40, 47), 7, 'gotPast: new claims only');
  eq(gotPast(40, 40), 0, 'gotPast: a run that claimed nothing new');
  eq(gotPast(0, 5), 5, 'gotPast: very first run');
  // No baseline (a run already in flight when this shipped): record 0 rather
  // than the whole lifetime total, which would be wildly wrong and permanent.
  eq(gotPast(undefined, 812), 0, 'gotPast: unknown baseline records zero');
  // A baseline larger than the total can only mean corrupt state; clamp
  // rather than emitting a negative count.
  eq(gotPast(900, 812), 0, 'gotPast: impossible baseline clamps to zero');
}

console.log('OK — bookLogRecording: all assertions passed');
