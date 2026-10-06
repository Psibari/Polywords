import assert from 'node:assert/strict';
import { POLLY_ACTING_SPRITE_ORDER, POLLY_LAUGH_FRAME_MS } from './pollyActingSprites';

assert.deepEqual(POLLY_ACTING_SPRITE_ORDER, [
  'neutral',
  'smug',
  'smirk',
  'blink',
  'laugh01',
  'laugh02',
  'laugh03',
  'bigLaugh',
  'shocked',
  'shockJump',
  'embarrassed',
  'sulk',
  'angry',
]);
assert.equal(POLLY_LAUGH_FRAME_MS, 145);

console.log('Polly acting sprite constants passed');
