import assert from 'node:assert/strict';
import { resolveHomeRestingPose } from './pollyHomeRestingPose';

const calm = { lifeProfileName: 'neutral' as const, playerWinStreak: 0, pollyWinStreak: 0 };

// 4. Nothing going on: idle.
assert.equal(resolveHomeRestingPose(calm), 'idle');

// 3. Polly's win streak or the cocky profile: smug.
assert.equal(resolveHomeRestingPose({ ...calm, pollyWinStreak: 2 }), 'smug');
assert.equal(resolveHomeRestingPose({ ...calm, lifeProfileName: 'cocky' }), 'smug');

// 2. The player's win streak beats Polly's streak and cocky.
assert.equal(resolveHomeRestingPose({ ...calm, playerWinStreak: 1 }), 'angry');
assert.equal(
  resolveHomeRestingPose({ lifeProfileName: 'cocky', playerWinStreak: 1, pollyWinStreak: 3 }),
  'angry',
);

// 1. The rattled profile beats everything.
assert.equal(resolveHomeRestingPose({ ...calm, lifeProfileName: 'rattled' }), 'embarrassed');
assert.equal(
  resolveHomeRestingPose({ lifeProfileName: 'rattled', playerWinStreak: 2, pollyWinStreak: 2 }),
  'embarrassed',
);

// Other profiles rest on idle or smug by the streak rules alone.
assert.equal(resolveHomeRestingPose({ ...calm, lifeProfileName: 'watchful' }), 'idle');
assert.equal(resolveHomeRestingPose({ ...calm, lifeProfileName: 'hauntFocused' }), 'idle');

// A session of Hunts: the pose follows the streaks as they change. The perch
// re-runs this on every change of its live inputs, so this is the sequence
// she shows on Home between Hunts (no app restart).
{
  const sequence: [number, number, string][] = [
    // [playerWinStreak, pollyWinStreak, expected]
    [0, 0, 'idle'],       // fresh
    [1, 0, 'angry'],      // player beat her
    [2, 0, 'angry'],      // and again
    [0, 1, 'smug'],       // she won one back
    [0, 0, 'idle'],       // a completed run without a beat or a loss
  ];
  for (const [playerWinStreak, pollyWinStreak, expected] of sequence) {
    assert.equal(
      resolveHomeRestingPose({ lifeProfileName: 'neutral', playerWinStreak, pollyWinStreak }),
      expected,
      `streaks ${playerWinStreak}/${pollyWinStreak}`,
    );
  }
}

console.log('pollyHomeRestingPose tests passed');
