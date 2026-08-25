import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dailyScreenSource = readFileSync(
  new URL('./DailyChallengeScreen.tsx', import.meta.url),
  'utf8',
);
const settingsScreenSource = readFileSync(
  new URL('./SettingsScreen.tsx', import.meta.url),
  'utf8',
);

for (const forbiddenReference of [
  'DailyScrollTuningPanel',
]) {
  assert.equal(
    dailyScreenSource.includes(forbiddenReference),
    false,
    `Daily Challenge must not render or wire the development control: ${forbiddenReference}`,
  );
}

assert.match(
  dailyScreenSource,
  /await resetDailyForDev\(\);\s*await startDailyChallenge\(\);/s,
  'Daily development override must reset and immediately start a fresh attempt',
);
assert.equal(
  dailyScreenSource.includes('DEV - RESET DAILY'),
  true,
  'Daily results must expose the development override',
);
assert.equal(
  settingsScreenSource.includes('Replay Daily Challenge'),
  false,
  'Daily replay override must not be duplicated in Settings',
);

console.log('Daily Challenge development-override placement test passed');
