import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DAILY_CASTLE_TUNING_DEFAULTS, useDailyCastleTuning } from '../dev/dailyCastleTuning';

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
  // Arch and wall share one export canvas, so neither is tunable on its own.
  assert.deepEqual(Object.keys(DAILY_CASTLE_TUNING_DEFAULTS), ['gate', 'grid', 'clues']);
  // Blocks fill their panels (Pete, 2026-09-27): 465 px panel less two 14 px
  // mortar gaps, and a third of the 742 px panel less four.
  assert.ok(Math.abs(DAILY_CASTLE_TUNING_DEFAULTS.grid.cardWidth - (465 - 28) / 3) < 1e-9);
  assert.ok(Math.abs(DAILY_CASTLE_TUNING_DEFAULTS.grid.cardHeight - (742 - 56) / 9) < 1e-9);
  useDailyCastleTuning.getState().setValue('gate', 'y', 10);
  assert.equal(useDailyCastleTuning.getState().gate.y, 10);
  assert.equal(useDailyCastleTuning.getState().grid.x, 0);
  useDailyCastleTuning.getState().reset();
  assert.equal(useDailyCastleTuning.getState().gate.y, 0);
}

assert.ok(castleStageSource.includes('dailycastle/castle_cartoon.png'));
assert.ok(castleStageSource.includes('dailycastle/answerwall_framed.png'));
assert.ok(readFileSync(new URL('../components/DailyGate.tsx', import.meta.url), 'utf8').includes('dailycastle/gate_door.png'));
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

// The scroll-era tuning panel and the old tree scene were removed with their
// art (Pete, 2026-09-27): nothing may wire them back in.
for (const retired of ['DailyScrollTuningPanel', 'dailyScrollTuning', 'DailyTreeScene', 'QuillScrollPanel']) {
  assert.ok(!settingsScreenSource.includes(retired), `Settings must not use retired ${retired}`);
  assert.ok(!dailyScreenSource.includes(retired), `Daily screen must not use retired ${retired}`);
}

console.log('Daily Challenge development-override placement test passed');
