/**
 * Pinned Boss (Pete, 2026-11-12).
 *
 * A Hunt's Boss stays the same, Hunt after Hunt, until the player reaches it.
 * Reaching it settles it either way: a win masters the word and a loss makes it
 * a Haunt, and both make it ineligible as a Boss, so the next Hunt picks and
 * pins a new one. Dying before the Boss (or quitting from the pause menu)
 * leaves the pin in place. Nothing here clears the pin by hand: the generator
 * simply refuses a pinned word that is mastered, haunted or has no Boss content.
 *
 * A MASTER'S REMATCH (every Boss word mastered) pins nothing.
 */
import type { SessionStep } from './types';

/** A saved pin, cleaned: an uppercase word, or undefined. */
export function sanitizePinnedBossWord(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const word = value.trim().toUpperCase();
  return word.length > 0 ? word : undefined;
}

/** The pin to save once a Hunt has been generated: its Boss word, unless the
 *  Boss is a Master's Rematch (then no pin). */
export function pinnedBossForHunt(steps: readonly SessionStep[]): string | undefined {
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const step = steps[i];
    if (step && step.kind === 'word' && step.eventType === 'bossWord') {
      return step.isMasteryRematch ? undefined : sanitizePinnedBossWord(step.word);
    }
  }
  return undefined;
}
