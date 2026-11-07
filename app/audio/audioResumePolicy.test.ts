import assert from 'node:assert/strict';

import {
  AUDIO_REBUILD_AFTER_AWAY_MS,
  createAwayTracker,
  shouldRebuildAudioOnReturn,
} from './audioResumePolicy';

// A short app switch keeps the audio objects it already has.
assert.equal(shouldRebuildAudioOnReturn(0), false, 'no time away: keep audio');
assert.equal(
  shouldRebuildAudioOnReturn(AUDIO_REBUILD_AFTER_AWAY_MS - 1),
  false,
  'just under the threshold: keep audio',
);

// A long absence rebuilds, at the threshold and beyond.
assert.equal(
  shouldRebuildAudioOnReturn(AUDIO_REBUILD_AFTER_AWAY_MS),
  true,
  'exactly at the threshold: rebuild',
);
assert.equal(shouldRebuildAudioOnReturn(30 * 60 * 1000), true, '30 minutes away: rebuild');

// Anything we cannot trust never triggers a rebuild.
assert.equal(shouldRebuildAudioOnReturn(null), false, 'no recorded departure (cold start): keep audio');
assert.equal(shouldRebuildAudioOnReturn(Number.NaN), false, 'NaN: keep audio');
assert.equal(shouldRebuildAudioOnReturn(-5000), false, 'clock moved backwards: keep audio');
assert.equal(shouldRebuildAudioOnReturn(Number.POSITIVE_INFINITY), false, 'non-finite: keep audio');

// The tracker measures from the FIRST time the app stopped being active.
// iOS reports inactive and then background, so the later event must not reset the clock.
const tracker = createAwayTracker();
assert.equal(tracker.returned(1000), null, 'returning with no recorded departure reports null');
tracker.left(10_000);
tracker.left(12_000);
assert.equal(tracker.returned(70_000), 60_000, 'away time counts from the first departure');
assert.equal(tracker.returned(80_000), null, 'a return clears the departure');
tracker.left(100_000);
assert.equal(tracker.returned(101_000), 1000, 'a second absence is measured on its own');

console.log('audioResumePolicy.test.ts passed');
