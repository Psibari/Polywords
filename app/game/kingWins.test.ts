import assert from 'node:assert/strict';
import { applyKingWin, hydrateKingWins, kingWinId, sanitizeKingWins } from './kingWins';
import type { PlayerProgress } from './types';

const base: PlayerProgress = {
  masteredWords: [],
  personalBest: 0,
  runsCompleted: 3,
  currentStreak: 0,
  longestStreak: 0,
  lastStreakDate: null,
  kingWins: 0,
};

const id = kingWinId(1700000000000, 9, ' bank ');
assert.equal(id, '1700000000000:9:BANK');

// A rematch win adds 1 and records the win id.
const won = applyKingWin(base, { isMasteryRematch: true, won: true, winId: id });
assert.equal(won.kingWins, 1);
assert.equal(won.lastKingWinId, id);

// A rematch loss adds 0.
assert.equal(applyKingWin(base, { isMasteryRematch: true, won: false, winId: id }), base);

// A normal (non-rematch) Boss win adds 0.
assert.equal(applyKingWin(base, { isMasteryRematch: false, won: true, winId: id }), base);

// The same win again (a restored Hunt replaying the verdict) adds 0.
assert.equal(applyKingWin(won, { isMasteryRematch: true, won: true, winId: id }), won);

// A different rematch win (a later Hunt) adds 1 more.
const next = applyKingWin(won, { isMasteryRematch: true, won: true, winId: kingWinId(1700000999999, 9, 'BAT') });
assert.equal(next.kingWins, 2);

// Nothing else in progress changes.
assert.equal(won.runsCompleted, 3);
assert.equal(won.masteredWords, base.masteredWords);

// An older save without the field loads as 0, and a win from there gives 1.
{
  const { kingWins: _k, ...old } = base;
  const loaded = hydrateKingWins(old as PlayerProgress);
  assert.equal(loaded.kingWins, 0);
  assert.equal(loaded.lastKingWinId, undefined);
  assert.equal(applyKingWin(old as PlayerProgress, { isMasteryRematch: true, won: true, winId: id }).kingWins, 1);
}

// Sanitizing: non-integer, negative, non-number and NaN become 0; whole numbers stay.
for (const bad of [-1, 1.5, '3', null, undefined, Number.NaN, Number.POSITIVE_INFINITY, {}]) {
  assert.equal(sanitizeKingWins(bad), 0, `bad value ${String(bad)}`);
}
assert.equal(sanitizeKingWins(0), 0);
assert.equal(sanitizeKingWins(7), 7);
{
  const loaded = hydrateKingWins({ ...base, kingWins: -4, lastKingWinId: '' as string });
  assert.equal(loaded.kingWins, 0);
  assert.ok(!('lastKingWinId' in loaded), 'empty id dropped');
}
// A clean save loads unchanged (same object).
const clean = { ...base, kingWins: 2, lastKingWinId: id };
assert.equal(hydrateKingWins(clean), clean);

console.log('kingWins tests passed');
