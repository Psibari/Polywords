// A new round's answer blocks punch out of the answer wall. RN-free so the
// timing runs under node (dailyPlaqueEntrance.test.ts).
//
// Each block starts flush in its slot, full size. It punches out of the wall
// toward the player, then settles back flush. The cue is depth, not size: the
// wall is vertical and seen from a little above, so a block coming forward
// drops a few points and shows its top face (the held pop's own art) and a
// deeper shadow on the wall; its scale barely changes. The blocks go one
// after another in reading order, so the wall presents the six rather than
// all six pulsing at once.
//
// DailyCastleStage runs one progress value per slot: 0 flush before the punch,
// DAILY_PLAQUE_PEAK the punch's farthest point, 1 flush again. DailyAnswerCard
// reads it through the keyframes below.

export const DAILY_PLAQUE_ENTRANCE = {
  /** From the slots mounting to the first block moving. */
  leadInMs: 60,
  /** Between one block's punch and the next's. */
  staggerMs: 60,
  /** Flush to its farthest point. */
  punchMs: 120,
  /** Back to flush. */
  settleMs: 170,
} as const;

export const DAILY_PLAQUE_SLOT_COUNT = 6;

/** Progress at the punch's farthest point. */
export const DAILY_PLAQUE_PEAK = 0.6;
export const DAILY_PLAQUE_INPUT = [0, DAILY_PLAQUE_PEAK, 1];
/** The block's scale: flush, out, flush. 1 is the slot exactly. */
export const DAILY_PLAQUE_SCALE = [1, 1.018, 1];
/** Screen points the block drops as it comes out of the wall. */
export const DAILY_PLAQUE_DROP = [0, 8, 0];
/**
 * How far the block stands out of the wall, as a fraction of its full held pop
 * (the top face and wall shadow DailyAnswerCard shows under the finger).
 */
export const DAILY_PLAQUE_PROUD = [0, 0.9, 0];

/**
 * The seat thuds, one per row, heaviest at the bottom. Playback rate, so
 * pitch: the three rows read as three stones, not one sample three times.
 */
export const DAILY_STONE_SEAT_RATES = [1.05, 1, 0.95] as const;

/** When a slot's block starts to move, from the slots mounting. */
export function dailyPlaqueEntranceDelay(index: number): number {
  return DAILY_PLAQUE_ENTRANCE.leadInMs + index * DAILY_PLAQUE_ENTRANCE.staggerMs;
}

/** When a slot's block reaches its farthest point, from the slots mounting. */
export function dailyPlaqueImpactMs(index: number): number {
  return dailyPlaqueEntranceDelay(index) + DAILY_PLAQUE_ENTRANCE.punchMs;
}

/**
 * From the slots mounting to the last block flush. Nothing is claimable before
 * this. Under reduced motion the blocks are simply in the wall: 0.
 */
export function dailyPlaqueEntranceMs(
  motion: boolean,
  slotCount: number = DAILY_PLAQUE_SLOT_COUNT,
): number {
  if (!motion || slotCount <= 0) return 0;
  return dailyPlaqueImpactMs(slotCount - 1) + DAILY_PLAQUE_ENTRANCE.settleMs;
}

export type DailyPlaqueEntranceCues = {
  /** The masonry grind under the whole set, as the first block moves. */
  shift: boolean;
  /** The row whose seat thud (and haptic) this block carries, at its impact. */
  seatRow: number | null;
};

/**
 * Which sounds a slot's block carries. One grind for the set and one thud per
 * row, on the row's first block, so six blocks make three thuds 120 ms apart,
 * never six. Reduced motion: no movement to hear, one thud for the set.
 */
export function dailyPlaqueEntranceCues(
  index: number,
  motion: boolean,
): DailyPlaqueEntranceCues {
  if (!motion) return { shift: false, seatRow: index === 0 ? 0 : null };
  return {
    shift: index === 0,
    seatRow: index % 2 === 0 ? index / 2 : null,
  };
}
