import assert from 'node:assert/strict';

import { resolveLiveHuntControl, resolveHuntHud, resolveHuntResultLabel } from './huntControl';

assert.equal(resolveLiveHuntControl(1, 6).label, 'STEADY');
assert.equal(resolveLiveHuntControl(1.49, 6).label, 'STEADY');
assert.equal(resolveLiveHuntControl(1.5, 6).label, 'FLOW');
assert.equal(resolveLiveHuntControl(1.99, 6).label, 'FLOW');
assert.equal(resolveLiveHuntControl(2, 4).label, 'IN CONTROL');
assert.equal(resolveLiveHuntControl(3, 1).label, 'HUNTED');
assert.equal(resolveLiveHuntControl(3, 2).label, 'IN CONTROL');

assert.equal(resolveHuntHud({ chainMultiplier: 1, lives: 6 }).contextLabel, null);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 1, lives: 6, isHauntReturn: true }),
  {
    tier: 'steady',
    label: 'STEADY',
    description: 'One read at a time.',
    contextLabel: 'RETURNING HAUNT',
  },
);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 2, lives: 4, isMasteredReturn: true }),
  {
    tier: 'control',
    label: 'IN CONTROL',
    description: 'You are reading her pattern.',
    contextLabel: 'MASTERED RETURN',
  },
);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 1, lives: 6, isBossWord: true }),
  {
    tier: 'steady',
    label: 'STEADY',
    description: 'One read at a time.',
    contextLabel: "POLLY'S WORD",
  },
);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 3, lives: 3, isBossWord: true, isGauntletActive: true }),
  {
    tier: 'control',
    label: 'GAUNTLET',
    description: "Face Polly's final test.",
    contextLabel: "POLLY'S WORD",
  },
);
assert.deepEqual(
  resolveHuntHud({ chainMultiplier: 1, lives: 1, isHauntReturn: true, isGauntletActive: true }),
  {
    tier: 'rattled',
    label: 'GAUNTLET',
    description: 'Face the word that got you.',
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
