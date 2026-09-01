import assert from 'node:assert/strict';

import {
  resolveBossOutcomePlaqueFeedback,
  resolveBossOutcomeSequenceFeedback,
  resolveOutcomeRevealSfx,
  resolveRankUpFeedback,
} from './huntOutcomeFeedback';

assert.deepEqual(
  resolveBossOutcomeSequenceFeedback('mastered'),
  {
    startSfx: 'masteredTransform',
    impact: {
      delayMs: 270,
      sfx: 'masteredBookSlam',
      hapticCue: 'masteredBookImpact',
      boardShake: false,
    },
  },
  'boss mastery starts with its transform and reserves one synchronized physical slam beat',
);
assert.deepEqual(
  resolveBossOutcomeSequenceFeedback('haunted'),
  {
    startSfx: 'hauntedTransformSlam',
    impact: {
      delayMs: 580,
      sfx: null,
      hapticCue: 'hauntedBookImpact',
      boardShake: true,
    },
  },
  'boss haunting starts the combo immediately but delays physical impact feedback until the close',
);

assert.deepEqual(
  resolveBossOutcomePlaqueFeedback('mastered'),
  { sfx: 'masteredResult', hapticCue: 'mastery' },
  'the visible MASTERED plaque owns the result sting and success notification',
);
assert.deepEqual(
  resolveBossOutcomePlaqueFeedback('haunted'),
  { sfx: null, hapticCue: null },
  'the visible HAUNTED plaque adds no result sound, haptic, or physical impact',
);

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
