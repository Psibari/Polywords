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
const scrollTuningSource = readFileSync(
  new URL('../dev/dailyScrollTuning.ts', import.meta.url),
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

// ── DEV-ONLY dailyScrollTuning knob contract ──────────────────────
// This is a plain node script (no jest, no @types/node test runner) —
// dailyScrollTuning.ts is TypeScript, so its defaults/clamp behaviour are
// verified the same way the rest of this file verifies source shape: regex
// against the raw text, plus a local reimplementation of the same clamp
// formula (Math.max(min, Math.min(max, v))) to actually exercise the
// extracted bounds rather than merely asserting they appear in the file.

function matchOne(source, pattern, label) {
  const match = source.match(pattern);
  assert.ok(match, `${label}: pattern not found in dailyScrollTuning.ts`);
  return match;
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// scrollHeight: default 252, clamp [160, 340]
{
  const [, defaultValue] = matchOne(
    scrollTuningSource,
    /scrollHeight: (\d+),/,
    'scrollHeight default',
  );
  assert.equal(Number(defaultValue), 252, 'scrollHeight default is 252');

  const [, min, max] = matchOne(
    scrollTuningSource,
    /setScrollHeight: \(v\) => set\(\{ scrollHeight: clamp\(v, (-?\d+), (-?\d+)\) \}\),/,
    'scrollHeight clamp bounds',
  );
  assert.equal(Number(min), 160, 'scrollHeight clamp floor is 160');
  assert.equal(Number(max), 340, 'scrollHeight clamp ceiling is 340');
  assert.equal(clamp(0, Number(min), Number(max)), 160, 'scrollHeight clamps below floor to 160');
  assert.equal(clamp(9999, Number(min), Number(max)), 340, 'scrollHeight clamps above ceiling to 340');
}

// headerVisible: default false, boolean passthrough (no clamp)
{
  const [, defaultValue] = matchOne(
    scrollTuningSource,
    /headerVisible: (true|false),/,
    'headerVisible default',
  );
  assert.equal(defaultValue, 'false', 'headerVisible default is false');

  matchOne(
    scrollTuningSource,
    /setHeaderVisible: \(v\) => set\(\{ headerVisible: v \}\),/,
    'headerVisible setter passes the boolean through unclamped',
  );
}

// cardHeight: default 64, clamp [48, 96]
{
  const [, defaultValue] = matchOne(
    scrollTuningSource,
    /cardHeight: (\d+),/,
    'cardHeight default',
  );
  assert.equal(Number(defaultValue), 64, 'cardHeight default is 64');

  const [, min, max] = matchOne(
    scrollTuningSource,
    /setCardHeight: \(v\) => set\(\{ cardHeight: clamp\(v, (-?\d+), (-?\d+)\) \}\),/,
    'cardHeight clamp bounds',
  );
  assert.equal(Number(min), 48, 'cardHeight clamp floor is 48');
  assert.equal(Number(max), 96, 'cardHeight clamp ceiling is 96');
  assert.equal(clamp(0, Number(min), Number(max)), 48, 'cardHeight clamps below floor to 48');
  assert.equal(clamp(9999, Number(min), Number(max)), 96, 'cardHeight clamps above ceiling to 96');
}

// rodOffsetY: default 0, clamp [-24, 24]
{
  const [, defaultValue] = matchOne(
    scrollTuningSource,
    /rodOffsetY: (-?\d+),/,
    'rodOffsetY default',
  );
  assert.equal(Number(defaultValue), 0, 'rodOffsetY default is 0');

  const [, min, max] = matchOne(
    scrollTuningSource,
    /setRodOffsetY: \(v\) => set\(\{ rodOffsetY: clamp\(v, (-?\d+), (-?\d+)\) \}\),/,
    'rodOffsetY clamp bounds',
  );
  assert.equal(Number(min), -24, 'rodOffsetY clamp floor is -24');
  assert.equal(Number(max), 24, 'rodOffsetY clamp ceiling is 24');
  assert.equal(clamp(-9999, Number(min), Number(max)), -24, 'rodOffsetY clamps below floor to -24');
  assert.equal(clamp(9999, Number(min), Number(max)), 24, 'rodOffsetY clamps above ceiling to 24');
}

console.log('Daily Challenge development-override placement test passed');
