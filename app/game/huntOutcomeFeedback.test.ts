import assert from 'node:assert/strict';

import {
  resolveOutcomeRevealSfx,
  resolveRankUpFeedback,
} from './huntOutcomeFeedback';

assert.equal(
  resolveOutcomeRevealSfx('mastered'),
  'mastered',
  'mastery reveal owns exactly the mastery cue',
);
assert.equal(
  resolveOutcomeRevealSfx('haunted'),
  'haunted',
  'haunted reveal owns exactly the haunted cue',
);

assert.deepEqual(
  resolveRankUpFeedback(false),
  { sfx: 'mastered', successHaptic: true, heavyPulse: true },
  'a rank-up after a surviving run keeps the existing celebration bundle',
);
assert.deepEqual(
  resolveRankUpFeedback(true),
  { sfx: null, successHaptic: false, heavyPulse: false },
  'a rank-up on a lost run never talks over the loss with success feedback',
);

console.log('huntOutcomeFeedback tests passed');
