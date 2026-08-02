import {
  HUNT_SWIPE_THRESHOLD,
  resolveHuntSwipeDirection,
} from './huntSwipeDirection';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

eq(resolveHuntSwipeDirection(0, -60), 'up', 'vertical claim');
eq(resolveHuntSwipeDirection(60, 0), 'right', 'horizontal reject');
eq(resolveHuntSwipeDirection(42, -80), 'up', 'up-dominant diagonal');
eq(resolveHuntSwipeDirection(80, -42), 'right', 'right-dominant diagonal');
eq(resolveHuntSwipeDirection(70, -70), null, 'ambiguous diagonal');
eq(resolveHuntSwipeDirection(-80, -45), null, 'leftward drag never commits');
eq(resolveHuntSwipeDirection(0, -HUNT_SWIPE_THRESHOLD), null, 'threshold is deliberate');
eq(resolveHuntSwipeDirection(12, -18, 0), 'up', 'preview uses same resolver');

console.log('huntSwipeDirection tests passed');
