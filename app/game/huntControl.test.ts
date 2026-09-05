import assert from 'node:assert/strict';

import { resolveLiveHuntControl, resolveHuntHud, resolveHuntResultLabel } from './huntControl';

assert.equal(resolveLiveHuntControl(1, 6).label, 'STEADY');
assert.equal(resolveLiveHuntControl(1.49, 6).label, 'STEADY');
assert.equal(resolveLiveHuntControl(1.5, 6).label, 'READING');
assert.equal(resolveLiveHuntControl(1.99, 6).label, 'READING');
assert.equal(resolveLiveHuntControl(2, 4).label, 'GETTING PAST');
assert.equal(resolveLiveHuntControl(3, 1).label, 'HUNTED');
assert.equal(resolveLiveHuntControl(3, 2).label, 'GETTING PAST');

// readTier is derived from chainMultiplier alone and is never overridden by
// low lives: HUNTED describes the danger, readTier keeps reporting the streak.
assert.equal(resolveLiveHuntControl(1, 6).readTier, 'steady');
assert.equal(resolveLiveHuntControl(1.75, 6).readTier, 'flow');
assert.equal(resolveLiveHuntControl(2.0, 1).label, 'HUNTED');
assert.equal(resolveLiveHuntControl(2.0, 1).readTier, 'control');

assert.equal(resolveHuntHud({ chainMultiplier: 1, lives: 6 }).contextLabel, null);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 1, lives: 6, isHauntReturn: true }),
  {
    tier: 'steady',
    label: 'STEADY',
    description: 'One read at a time.',
    readTier: 'steady',
    contextLabel: 'RETURNING HAUNT',
  },
);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 2, lives: 4, isMasteredReturn: true }),
  {
    tier: 'control',
    label: 'GETTING PAST',
    description: 'You are getting past her clean.',
    readTier: 'control',
    contextLabel: 'MASTERED RETURN',
  },
);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 1, lives: 6, isBossWord: true }),
  {
    tier: 'steady',
    label: 'STEADY',
    description: 'One read at a time.',
    readTier: 'steady',
    contextLabel: "POLLY'S WORD",
  },
);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 3, lives: 3, isBossWord: true, isGauntletActive: true }),
  {
    tier: 'control',
    label: 'GAUNTLET',
    description: "Face Polly's final test.",
    readTier: 'control',
    contextLabel: "POLLY'S WORD",
  },
);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 1, lives: 1, isHauntReturn: true, isGauntletActive: true }),
  {
    tier: 'rattled',
    label: 'GAUNTLET',
    description: 'Face the word that got you.',
    readTier: 'steady',
    contextLabel: 'RETURNING HAUNT',
  },
);

assert.equal(
  resolveHuntResultLabel({ status: 'complete', bossMastered: true, haunted: false }),
  'MASTERED',
);
assert.equal(
  resolveHuntResultLabel({ status: 'complete', bossMastered: false, haunted: false }),
  "CLOSE, BUT CLOSE DOESN'T COUNT.",
);
assert.equal(
  resolveHuntResultLabel({ status: 'complete', bossMastered: false, haunted: true }),
  'HAUNTED',
);
assert.equal(
  resolveHuntResultLabel({ status: 'gameOver', bossMastered: false, haunted: false }),
  'YOU WERE HUNTED',
);

assert.equal(
  resolveHuntResultLabel({ status: 'gameOver', bossMastered: false, haunted: true }),
  'HAUNTED',
);

console.log('huntControl tests passed');
