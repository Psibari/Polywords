import assert from 'node:assert/strict';
import { resolveGameplayFeedbackAccessibility as resolvePolicy } from './gameplayFeedbackAccessibility';

assert.deepEqual(
  resolvePolicy(false, false),
  { animateMotion: true, animateFlashes: true },
  'default settings preserve the complete feedback animation',
);

assert.deepEqual(
  resolvePolicy(false, true),
  { animateMotion: true, animateFlashes: false },
  'Reduce Flashes removes only flash and pulse channels',
);

assert.deepEqual(
  resolvePolicy(true, true),
  { animateMotion: false, animateFlashes: false },
  'Reduce Motion removes unnecessary movement and its implied flash channel',
);

assert.deepEqual(
  resolvePolicy(null, true),
  { animateMotion: false, animateFlashes: false },
  'an unresolved system preference takes the conservative static path',
);

console.log('gameplayFeedbackAccessibility tests passed');
