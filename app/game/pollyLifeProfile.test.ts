import assert from 'node:assert/strict';
import { getPollyLifeProfile, homeBeatForSession, resolvePollyLifeProfile } from './pollyLifeProfile';
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
    firstHauntedAt: '2026-09-01',
    lastHauntAt: '2026-09-02',
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
  context: { ...base, playerWinStreak: 1, recent: ['steady', 'struggle', 'struggle'] },
}).name, 'rattled');
assert.equal(resolvePollyLifeProfile({
  context: { ...base, recent: ['struggle', 'struggle', 'struggle'] },
}).name, 'cocky');

assert.ok(getPollyLifeProfile('cocky').dozeDelayMultiplier < 1);
assert.ok(getPollyLifeProfile('rattled').dozeDelayMultiplier > 1);
assert.ok(getPollyLifeProfile('watchful').ambientIntensity > 1);

// Home: the "back after an absence" look lasts until the first Hunt of the
// session, then relaxes; other beats are left alone.
{
  const returning = { beat: 'returningAfterAbsence' as const, wordRivalry: null };
  const slump = { beat: 'veteranSlump' as const, wordRivalry: null };
  // No Hunt yet this session: still watchful.
  assert.equal(homeBeatForSession(returning, 12, 12), returning);
  assert.equal(
    resolvePollyLifeProfile({ context: base, decision: homeBeatForSession(returning, 12, 12) }).name,
    'watchful',
  );
  // One Hunt completed since the session started: relaxes to the normal profile.
  assert.equal(homeBeatForSession(returning, 12, 13), null);
  assert.equal(
    resolvePollyLifeProfile({ context: base, decision: homeBeatForSession(returning, 12, 13) }).name,
    'neutral',
  );
  // Other beats and no beat pass through unchanged.
  assert.equal(homeBeatForSession(slump, 12, 13), slump);
  assert.equal(homeBeatForSession(null, 12, 13), null);
}

console.log('pollyLifeProfile tests passed');
