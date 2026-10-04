import assert from 'node:assert/strict';
import { getPollyLifeProfile, resolvePollyLifeProfile } from './pollyLifeProfile';
import type { PollyRelationshipContext } from './pollyRelationship';

const base: PollyRelationshipContext = {
  todayMood: 'WATCHFUL',
  runsCompleted: 12,
  masteredCount: 3,
  playerHuntsWon: 4,
  pollyHuntsWon: 4,
  playerWinStreak: 0,
  pollyWinStreak: 0,
  longestPlayerWinStreak: 3,
  longestPollyWinStreak: 3,
  recent: [],
  awayMs: 0,
  relevantWordRivalry: null,
};

assert.equal(resolvePollyLifeProfile({ context: base }).name, 'neutral');
assert.equal(resolvePollyLifeProfile({
  context: base,
  decision: { beat: 'returningAfterAbsence', wordRivalry: null },
}).name, 'watchful');
assert.equal(resolvePollyLifeProfile({
  context: base,
  decision: { beat: 'comeback', wordRivalry: null },
}).name, 'rattled');
assert.equal(resolvePollyLifeProfile({
  context: base,
  decision: { beat: 'veteranSlump', wordRivalry: null },
}).name, 'cocky');
assert.equal(resolvePollyLifeProfile({
  context: base,
  decision: { beat: 'hauntRematch', wordRivalry: {
    word: 'CASE',
    hauntHolds: 1,
    banished: false,
    firstHauntedAt: 1,
    lastHauntAt: 2,
    banishedAt: null,
  } },
}).name, 'hauntFocused');

assert.equal(resolvePollyLifeProfile({
  context: { ...base, playerWinStreak: 2 },
}).name, 'watchful');
assert.equal(resolvePollyLifeProfile({
  context: { ...base, pollyWinStreak: 2 },
}).name, 'cocky');


assert.equal(resolvePollyLifeProfile({
  context: { ...base, playerWinStreak: 1, recent: ['strong', 'struggle', 'struggle'] },
}).name, 'rattled');
assert.equal(resolvePollyLifeProfile({
  context: { ...base, recent: ['struggle', 'struggle', 'struggle'] },
}).name, 'cocky');

assert.ok(getPollyLifeProfile('cocky').dozeDelayMultiplier < 1);
assert.ok(getPollyLifeProfile('rattled').dozeDelayMultiplier > 1);
assert.ok(getPollyLifeProfile('watchful').ambientIntensity > 1);

console.log('pollyLifeProfile tests passed');
