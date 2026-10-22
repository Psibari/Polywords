// The terrace Home's three buttons come out of the console the way the Daily answer blocks come out
// of the wall (Pete, 2026-10-21: "the whole treatment, how the Daily Castle has now", every time
// Home is shown). All timing, scale, drop, tremble and cue constants are the Daily's own
// (ui/dailyPlaqueEntrance.ts); only the slot count (three) and the cue map differ. RN-free.
import {
  dailyPlaqueEntranceDelay,
  dailyPlaqueEntranceMs,
  dailyWallTrembleMs,
} from './dailyPlaqueEntrance';

/** DAILY CHALLENGE (index 0), then ENTER THE HUNT (index 1), then POLYBOOK (index 2). */
export const TERRACE_BUTTON_COUNT = 3;

/** When a button starts to move, from the entrance starting. */
export function terraceEntranceDelay(index: number): number {
  return dailyPlaqueEntranceDelay(index);
}

/** From the entrance starting to the last button flush. Reduced motion: 0. */
export function terraceEntranceMs(motion: boolean): number {
  return dailyPlaqueEntranceMs(motion, TERRACE_BUTTON_COUNT);
}

/** How long the console and wall tremble: first button's start to last button flush. */
export function terraceTrembleMs(): number {
  return dailyWallTrembleMs(TERRACE_BUTTON_COUNT);
}

export type TerraceEntranceCues = {
  /** The masonry grind, with the first button; the tremble starts with it. */
  shift: boolean;
  /** The seat thud (and haptic) this button carries, at its farthest point. */
  seatRow: number | null;
};

/**
 * Three buttons, so each seats with its own thud (Daily, Hunt, Polybook: the Daily's three stone
 * pitches). Reduced motion has no movement: one thud for the set.
 */
export function terraceEntranceCues(index: number, motion: boolean): TerraceEntranceCues {
  if (!motion) return { shift: false, seatRow: index === 0 ? 0 : null };
  return { shift: index === 0, seatRow: index };
}
