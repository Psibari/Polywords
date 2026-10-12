// A new round's answer blocks come out of the answer wall. RN-free so the
// timing runs under node (dailyPlaqueEntrance.test.ts).
//
// Each slot starts empty: the block is hidden, small and deep in the wall's
// dark panel. On its turn it fades in as it zooms forward past flush, then
// settles back flush, ready to play (Pete, 2026-10-11). At the farthest point
// it also drops a few points and shows its top face (the held pop's own art)
// and a deeper shadow on the wall, so the zoom reads as depth. The blocks go
// one after another in reading order, so the wall presents the six rather
// than all six popping at once. While they come out the whole wall trembles,
// starting with the first block and the grind, ending at exactly zero offset
// when the last block is flush.
//
// DailyCastleStage runs one progress value per slot: 0 hidden in the wall
// (before its turn), DAILY_PLAQUE_PEAK the zoom's farthest point, 1 flush.
// DailyAnswerCard reads it through the keyframes below. All numbers here are
// starting values for tuning on device.

export const DAILY_PLAQUE_ENTRANCE = {
  /** From the slots mounting to the first block moving. */
  leadInMs: 60,
  /** Between one block's start and the next's. */
  staggerMs: 60,
  /** Hidden in the wall to its farthest point. */
  punchMs: 160,
  /** Back to flush. */
  settleMs: 170,
} as const;

export const DAILY_PLAQUE_SLOT_COUNT = 6;

/**
 * While the reduce-motion preference is still unknown the blocks wait hidden
 * and input stays locked. If it is still unknown after this long, the round
 * behaves as reduced motion: blocks in place, input released.
 */
export const DAILY_PLAQUE_MOTION_FAILSAFE_MS = 600;

/** Where every slot's progress starts each round: hidden, so no first frame shows a finished block. */
export const DAILY_PLAQUE_INITIAL_PROGRESS = 0;

/** Progress at the zoom's farthest point. */
export const DAILY_PLAQUE_PEAK = 0.6;
export const DAILY_PLAQUE_INPUT = [0, DAILY_PLAQUE_PEAK, 1];
/** The block's scale: small and deep, past flush, flush. 1 is the slot exactly. */
export const DAILY_PLAQUE_SCALE = [0.8, 1.06, 1];
/** Screen points the block drops as it comes out of the wall. */
export const DAILY_PLAQUE_DROP = [0, 8, 0];
/**
 * How far the block stands out of the wall, as a fraction of its full held pop
 * (the top face and wall shadow DailyAnswerCard shows under the finger).
 */
export const DAILY_PLAQUE_PROUD = [0, 0.9, 0];
/** The block's opacity: hidden until its turn, fully visible early in the zoom. */
export const DAILY_PLAQUE_OPACITY_INPUT = [0, 0.2];
export const DAILY_PLAQUE_OPACITY = [0, 1];

/** The block's opacity at a progress, clamped exactly as DailyAnswerCard's interpolation is. */
export function dailyPlaqueOpacity(progress: number): number {
  const [from, to] = DAILY_PLAQUE_OPACITY_INPUT;
  const [hidden, shown] = DAILY_PLAQUE_OPACITY;
  if (progress <= from) return hidden;
  if (progress >= to) return shown;
  return hidden + ((progress - from) / (to - from)) * (shown - hidden);
}

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

/**
 * How a round's blocks enter, from the reduce-motion preference:
 * - 'waiting': unknown yet, blocks hidden and input held;
 * - 'still': reduced motion, or unknown past the failsafe: blocks in place;
 * - 'motion': the full entrance.
 */
export type DailyPlaqueEntranceMode = 'waiting' | 'still' | 'motion';

export function dailyPlaqueEntranceMode(
  reduceMotion: boolean | null,
  failsafeExpired: boolean,
): DailyPlaqueEntranceMode {
  if (reduceMotion === null) return failsafeExpired ? 'still' : 'waiting';
  return reduceMotion ? 'still' : 'motion';
}

/**
 * How long input stays locked for the blocks, from now. 'waiting' holds it
 * until the failsafe, at most; if the preference then resolves to motion the
 * entrance adds its own span, so the lock never exceeds failsafe + entrance.
 */
export function dailyPlaqueLockMs(
  mode: DailyPlaqueEntranceMode,
  slotCount: number = DAILY_PLAQUE_SLOT_COUNT,
): number {
  if (mode === 'waiting') return DAILY_PLAQUE_MOTION_FAILSAFE_MS;
  return dailyPlaqueEntranceMs(mode === 'motion', slotCount);
}

export type DailyPlaqueEntranceCues = {
  /** The masonry grind under the whole set, as the first block moves. The wall trembles from here. */
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

// ── The wall's tremble ────────────────────────────────────────────────────
// A pure copy of the boss gauntlet's lead-in tremble (wallShake.ts: the same
// amplitude, zigzag and building envelope), on a Daily-local value so the
// Hunt wall's shared channel is never touched. Keep these in step with
// wallShake.ts: WALL_TREMBLE_AMP, SAMPLES_PER_CYCLE, VERTICAL_RATIO,
// TREMBLE_PEAK, buildingEnvelope and the tremble's 5 / 6 cycle counts.

/** Points; WALL_TREMBLE_AMP in wallShake.ts. */
export const DAILY_WALL_TREMBLE_AMP = 2.5;
/** Swings across the whole tremble, per axis (the gauntlet's counts). */
export const DAILY_WALL_TREMBLE_CYCLES = { x: 5, y: 6 } as const;
const TREMBLE_SAMPLES_PER_CYCLE = 8;
const TREMBLE_VERTICAL_RATIO = 0.7;
const TREMBLE_PEAK = 0.88;

/** wallShake.ts's buildingEnvelope: rises to full at 0.88, back to exactly 0 at 1. */
export function dailyWallTrembleEnvelope(t: number): number {
  return t < TREMBLE_PEAK ? t / TREMBLE_PEAK : (1 - t) / (1 - TREMBLE_PEAK);
}

/** The zigzag as interpolation keyframes over a 0 → 1 value; exactly 0 at both ends. */
function dailyWallTrembleKeyframes(amp: number, cycles: number, invert: boolean) {
  const samples = Math.round(cycles * TREMBLE_SAMPLES_PER_CYCLE);
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const swing = amp * dailyWallTrembleEnvelope(t) * Math.sin(2 * Math.PI * cycles * t);
    inputRange.push(t);
    // `|| 0` turns -0 into 0, so a resting value is exactly zero.
    outputRange.push((invert ? -swing : swing) || 0);
  }
  return { inputRange, outputRange };
}

export const DAILY_WALL_TREMBLE_X = dailyWallTrembleKeyframes(
  DAILY_WALL_TREMBLE_AMP,
  DAILY_WALL_TREMBLE_CYCLES.x,
  false,
);
export const DAILY_WALL_TREMBLE_Y = dailyWallTrembleKeyframes(
  DAILY_WALL_TREMBLE_AMP * TREMBLE_VERTICAL_RATIO,
  DAILY_WALL_TREMBLE_CYCLES.y,
  true,
);

/** When the tremble starts, from the slots mounting: with the first block and the grind. */
export function dailyWallTrembleStartMs(): number {
  return dailyPlaqueEntranceDelay(0);
}

/** How long the tremble runs: from the first block's start to the last block flush. */
export function dailyWallTrembleMs(slotCount: number = DAILY_PLAQUE_SLOT_COUNT): number {
  return Math.max(0, dailyPlaqueEntranceMs(true, slotCount) - dailyWallTrembleStartMs());
}
