import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const viewer = readFileSync(new URL('./PollyAnimationDevViewer.tsx', import.meta.url), 'utf8');
const rig = readFileSync(new URL('./PollyPerchRig.tsx', import.meta.url), 'utf8');

assert.ok(viewer.includes('POLLY_ACTING_SPRITE_ORDER'), 'Motion Lab must render the new acting sprite inventory');
assert.ok(viewer.includes('POLLY_LAUGH_SEQUENCE'), 'Motion Lab must preview the three-frame laugh sequence');
assert.ok(viewer.includes('<PollyPerchRig'), 'Motion Lab must compare the existing Home rig against the new neutral sprite');
assert.ok(viewer.includes('NEW ACTING SPRITES'), 'New acting set must be clearly separated from legacy motion references');
assert.ok(rig.includes('const BROW_FOLLOW = 0.33'), 'Device-approved Home blink brow follow must stay locked at 0.33');

console.log('Polly acting sprite viewer contract passed');
