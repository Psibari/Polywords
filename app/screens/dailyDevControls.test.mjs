import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { register } from 'tsx/esm/api';

const castleTuningUrl = new URL('../dev/dailyCastleTuning.ts', import.meta.url);
const castleTuningPanelUrl = new URL('../dev/DailyCastleTuningPanel.tsx', import.meta.url);

assert.equal(
  existsSync(castleTuningUrl),
  true,
  'Daily castle tuning store must exist for live on-device calibration',
);
assert.equal(
  existsSync(castleTuningPanelUrl),
  true,
  'Daily castle tuning panel must exist for live on-device calibration',
);

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
const castleTuningPanelSource = readFileSync(castleTuningPanelUrl, 'utf8');
const castleStageSource = readFileSync(
  new URL('../components/DailyCastleStage.tsx', import.meta.url),
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

// ── Castle calibration and registered castle art ──────────────────
{
  const unregisterTsx = register();
  const { DAILY_CASTLE_TUNING_DEFAULTS, useDailyCastleTuning } = await import(castleTuningUrl);
  await unregisterTsx();
  // Arch and wall share one export canvas, so neither is tunable on its own.
  assert.deepEqual(Object.keys(DAILY_CASTLE_TUNING_DEFAULTS), ['gate', 'grid', 'clues']);
  assert.equal(DAILY_CASTLE_TUNING_DEFAULTS.grid.cardWidth, 136);
  assert.equal(DAILY_CASTLE_TUNING_DEFAULTS.grid.cardHeight, 72);
  useDailyCastleTuning.getState().setValue('gate', 'y', 10);
  assert.equal(useDailyCastleTuning.getState().gate.y, 10);
  assert.equal(useDailyCastleTuning.getState().grid.x, 0);
  useDailyCastleTuning.getState().reset();
  assert.equal(useDailyCastleTuning.getState().gate.y, 0);
}

assert.ok(castleStageSource.includes('dailycastle/ARCHNEW.png'));
assert.ok(castleStageSource.includes('dailycastle/answerwall_framed.png'));
assert.ok(readFileSync(new URL('../components/DailyGate.tsx', import.meta.url), 'utf8').includes('dailycastle/gate_scroll.png'));
for (const retired of ['castledeep2.png', 'cavlewall.png', 'cornerwall.png', '3darch5.png', 'fullarchrev5.png']) {
  assert.ok(!castleStageSource.includes(retired), `castle stage must not use retired art ${retired}`);
  assert.ok(!dailyScreenSource.includes(retired), `Daily screen must not use retired art ${retired}`);
}
assert.ok(castleStageSource.includes('if (index >= 6) return null'));
assert.ok(castleTuningPanelSource.includes('ANSWER GRID'));
assert.ok(!castleTuningPanelSource.includes('CASTLE ARCH'));
assert.ok(!castleTuningPanelSource.includes('CASTLE WALL'));
assert.ok(dailyScreenSource.includes('CASTLE TUNE'));
assert.ok(dailyScreenSource.includes('DailyCastleTuningPanel'));

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

// scrollHeight: default null (= use QuillScrollPanel's derived reservation),
// numeric overrides clamp [160, 340].
//
// The default used to be the literal 252, which REPLACED the derived
// reservation rather than overriding it — the shipped app then reserved a
// hard-coded, device-blind height and resolveReservedTextHeight was never
// called in production. null is the sentinel that keeps the derived value
// shipped and makes the knob a true override, so this asserts the sentinel
// as well as the clamp it still applies to real numbers.
{
  matchOne(
    scrollTuningSource,
    /^ {2}scrollHeight: null,$/m,
    'scrollHeight default is null (derived reservation)',
  );
  assert.equal(
    /^ {2}scrollHeight: \d/m.test(scrollTuningSource),
    false,
    'scrollHeight must not default to a hard-coded number — that replaces the derived value',
  );

  const [, min, max] = matchOne(
    scrollTuningSource,
    /setScrollHeight: \(v\) => set\(\{ scrollHeight: v === null \? null : clamp\(v, (-?\d+), (-?\d+)\) \}\),/,
    'scrollHeight sentinel passthrough + clamp bounds',
  );
  assert.equal(Number(min), 160, 'scrollHeight clamp floor is 160');
  assert.equal(Number(max), 340, 'scrollHeight clamp ceiling is 340');
  assert.equal(clamp(0, Number(min), Number(max)), 160, 'scrollHeight clamps below floor to 160');
  assert.equal(clamp(9999, Number(min), Number(max)), 340, 'scrollHeight clamps above ceiling to 340');
}

// The panel must never be wired into the Daily screen (asserted above), so
// it has to be reachable somewhere else or the knobs are unreachable
// constants. Settings owns development utilities.
assert.equal(
  settingsScreenSource.includes('DailyScrollTuningPanel'),
  true,
  'Settings must host the Daily scroll tuning panel so the knobs are reachable in __DEV__',
);

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
