import assert from 'node:assert/strict';

import { resolveMusicTargetVolume } from './musicVolumePolicy';

assert.equal(
  resolveMusicTargetVolume({
    activeOwner: 'home',
    state: 'home',
    muted: false,
    transportPaused: false,
    bossOutcomeDucked: false,
  }),
  0.14,
  'Home music keeps a restrained lobby volume beneath navigation and Polly',
);
assert.equal(
  resolveMusicTargetVolume({
    activeOwner: 'home',
    state: 'home',
    muted: false,
    transportPaused: false,
    bossOutcomeDucked: true,
    returningHauntCueActive: true,
  }),
  0.14,
  'stale Hunt-only overlays cannot mute or duck Home music',
);

assert.equal(
  resolveMusicTargetVolume({
    activeOwner: 'hunt',
    state: 'boss',
    muted: false,
    transportPaused: false,
    bossOutcomeDucked: false,
  }),
  0.14,
  'normal boss music retains its authored target before an outcome begins',
);

assert.equal(
  resolveMusicTargetVolume({
    activeOwner: 'hunt',
    state: 'boss',
    muted: false,
    transportPaused: false,
    bossOutcomeDucked: true,
  }),
  0.07,
  'a boss outcome ducks only the active boss track to leave room for outcome SFX',
);

assert.equal(
  resolveMusicTargetVolume({
    activeOwner: 'hunt',
    state: 'rhythm',
    muted: false,
    transportPaused: false,
    bossOutcomeDucked: true,
  }),
  0.20,
  'a stale boss-outcome flag cannot duck a normal Hunt state',
);

assert.equal(
  resolveMusicTargetVolume({
    activeOwner: 'daily',
    state: 'daily',
    muted: false,
    transportPaused: false,
    bossOutcomeDucked: true,
  }),
  0.16,
  'a boss-outcome flag cannot duck Daily music',
);

assert.equal(
  resolveMusicTargetVolume({
    activeOwner: 'hunt',
    state: 'boss',
    muted: true,
    transportPaused: false,
    bossOutcomeDucked: true,
  }),
  0,
  'mute remains authoritative over an active boss outcome duck',
);

assert.equal(
  resolveMusicTargetVolume({
    activeOwner: 'hunt',
    state: 'boss',
    muted: false,
    transportPaused: true,
    bossOutcomeDucked: true,
  }),
  0,
  'background transport pause remains authoritative over an active boss outcome duck',
);

assert.equal(
  resolveMusicTargetVolume({
    activeOwner: 'hunt',
    state: 'neutral',
    muted: false,
    transportPaused: false,
    bossOutcomeDucked: false,
    returningHauntCueActive: true,
  }),
  0,
  'a Returning Haunt cue owns the audio bed while it is playing',
);

console.log('musicVolumePolicy tests passed');
