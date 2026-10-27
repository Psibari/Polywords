import assert from 'node:assert/strict';
import {
  isHuntExitGuardBypassed,
  withHuntExitGuardBypass,
} from './huntPauseNavigation';

assert.equal(isHuntExitGuardBypassed(), false);

withHuntExitGuardBypass(() => {
  assert.equal(isHuntExitGuardBypassed(), true);
  withHuntExitGuardBypass(() => {
    assert.equal(isHuntExitGuardBypassed(), true);
  });
  assert.equal(isHuntExitGuardBypassed(), true);
});

assert.equal(isHuntExitGuardBypassed(), false);

assert.throws(() => {
  withHuntExitGuardBypass(() => {
    throw new Error('navigation failed');
  });
}, /navigation failed/);

assert.equal(isHuntExitGuardBypassed(), false);

console.log('huntPauseNavigation tests passed');
