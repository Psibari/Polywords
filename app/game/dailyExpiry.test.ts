import { buildDailySession, getChallengeNumber } from './dailyChallengeEngine';
import { encodeDailySessionSnapshot } from './dailySessionPersistence';
import { isDailySessionExpired, readExpiredDailyNumber } from './dailyExpiry';
import { dailyExpiredTitle } from '../ui/dailyExpiredCopy';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const YESTERDAY = '2026-10-28';
const TODAY = '2026-10-29';
const old = buildDailySession(YESTERDAY);
const current = buildDailySession(TODAY);

// ── isDailySessionExpired ─────────────────────────────────────────
eq(isDailySessionExpired(old, TODAY), true, "an unfinished Daily from an earlier date is expired");
eq(isDailySessionExpired(current, TODAY), false, "today's Daily is not expired");
eq(isDailySessionExpired(null, TODAY), false, 'no session: nothing to expire');
eq(isDailySessionExpired({ ...old, status: 'won' }, TODAY), false, 'a finished win keeps its date');
eq(isDailySessionExpired({ ...old, status: 'lost' }, TODAY), false, 'a finished loss keeps its date');
eq(isDailySessionExpired(buildDailySession('2026-10-30'), TODAY), false, 'a future date is never expired');

// ── readExpiredDailyNumber ────────────────────────────────────────
eq(
  readExpiredDailyNumber(encodeDailySessionSnapshot(old), TODAY),
  getChallengeNumber(YESTERDAY),
  "an unfinished older Daily gives its own challenge number",
);
eq(readExpiredDailyNumber(encodeDailySessionSnapshot(current), TODAY), null, "today's session: no notice");
eq(
  readExpiredDailyNumber(encodeDailySessionSnapshot({ ...old, status: 'lost', chancesRemaining: 0 }), TODAY),
  null,
  'a finished older session: no notice',
);
eq(readExpiredDailyNumber(null, TODAY), null, 'nothing saved: no notice');
eq(readExpiredDailyNumber('not json', TODAY), null, 'corrupt snapshot: no notice');
eq(readExpiredDailyNumber('{"version":1,"session":{"date":"2026-10-28"}}', TODAY), null, 'a snapshot that does not validate: no notice');
eq(readExpiredDailyNumber('{"version":1}', TODAY), null, 'no session in the snapshot: no notice');

// ── copy ──────────────────────────────────────────────────────────
eq(dailyExpiredTitle(42), "TIME'S UP FOR DAILY #42", 'the card line is Pete\'s wording');

console.log('dailyExpiry.test.ts passed');
