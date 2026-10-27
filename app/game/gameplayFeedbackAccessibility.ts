export type GameplayFeedbackAccessibility = {
  animateMotion: boolean;
  animateFlashes: boolean;
};

/**
 * Shared policy for short gameplay feedback effects. A pending system motion
 * read takes the conservative static path, matching the existing hooks.
 */
export function resolveGameplayFeedbackAccessibility(
  reduceMotion: boolean | null,
  reduceFlashes: boolean,
): GameplayFeedbackAccessibility {
  const animateMotion = reduceMotion === false;
  return {
    animateMotion,
    animateFlashes: animateMotion && !reduceFlashes,
  };
}
