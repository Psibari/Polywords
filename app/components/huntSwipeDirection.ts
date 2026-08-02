export type HuntSwipeDirection = 'up' | 'right' | null;

export const HUNT_SWIPE_THRESHOLD = 40;
const DIRECTION_DOMINANCE_RATIO = 1.15;

// Preview and release must call this same resolver. Requiring a modestly
// dominant axis makes ambiguous diagonals spring home instead of committing a
// different action from the one the card appeared to preview.
export function resolveHuntSwipeDirection(
  dx: number,
  dy: number,
  threshold = HUNT_SWIPE_THRESHOLD,
): HuntSwipeDirection {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (dy < -threshold && absY >= absX * DIRECTION_DOMINANCE_RATIO) {
    return 'up';
  }

  if (dx > threshold && absX >= absY * DIRECTION_DOMINANCE_RATIO) {
    return 'right';
  }

  return null;
}
