import {
  DAILY_BREACH_POLLY_HIT_HOLD_MS,
  DAILY_BREACH_POLLY_HIT_MOVE_SEGMENTS_MS,
  DAILY_BREACH_POLLY_SMASH_HOLD_MS,
  DAILY_BREACH_POLLY_SMASH_MOVE_SEGMENTS_MS,
  dailyBreachPollyMoveStartMs,
  type DailyBreachKeyframes,
} from './dailyBreach';
// Type only: pollyScreenPoses pulls in the pose art.
import type { PollyScreenPoseName } from './pollyScreenPoses';

/**
 * Polly's breach moves on the Daily perch (Pete, 2026-11-04; the approved
 * mock's numbers). RN-free: the perch reads these as keyframes on the tier's
 * breach clock (ms from the claim), so she moves on the same native clock as
 * the plaque and the castle and cannot drift from them.
 *
 * Offsets are points, the same unscaled kind as the perch's reactX/reactY;
 * rotation is degrees. The two-clue jump stays in the strip left of the castle;
 * the one-clue blast takes her off the screen and she flies back in.
 */

/** A pose held on the clock from `fromMs` to `toMs`. */
export type PollyBreachSegment = { pose: PollyScreenPoseName; fromMs: number; toMs: number };

export type PollyBreachTimeline = {
  startMs: number;
  endMs: number;
  segments: PollyBreachSegment[];
  x: DailyBreachKeyframes;
  y: DailyBreachKeyframes;
  rotateDeg: DailyBreachKeyframes;
};

/** A value must jump between two keyframes this close together. */
const EDGE_MS = 0.5;
const STILL: DailyBreachKeyframes = { inputRange: [0, 1], outputRange: [0, 0] };

// ── Two clues: the jump ──

/**
 * The jump's height through its 933 ms (ms from the jump's start → y in pt;
 * linear between samples). From Pete's video: video px × 187.5 / 304. The
 * first sample, -27.8, is measured and was approved in the mock: kept, not
 * smoothed. If it pops on the phone, that is Pete's call.
 */
export const POLLY_HIT_JUMP_Y: readonly (readonly [number, number])[] = [
  [0, -27.8], [33, -49.4], [67, -66.0], [100, -87.0], [133, -88.8], [200, -89.5],
  [300, -90.1], [333, -88.8], [367, -86.4], [400, -77.7], [433, -70.9], [467, -62.9],
  [500, -50.0], [533, -45.7], [567, -32.1], [600, -28.4], [633, -18.5], [667, -12.3],
  [700, -9.9], [767, -6.8], [867, -3.7], [900, -0.6], [933, 0],
];

/** The jump's y at `tMs` from its start: the table, linear between samples, 0 before and after. */
export function pollyHitJumpY(tMs: number): number {
  const table = POLLY_HIT_JUMP_Y;
  if (tMs < 0 || tMs >= table[table.length - 1][0]) return 0;
  for (let i = 1; i < table.length; i += 1) {
    const [t1, y1] = table[i];
    if (tMs <= t1) {
      const [t0, y0] = table[i - 1];
      return y0 + ((y1 - y0) * (tMs - t0)) / (t1 - t0);
    }
  }
  return 0;
}

function hitTimeline(): PollyBreachTimeline {
  const start = dailyBreachPollyMoveStartMs('hit');
  const [shockMs, jumpMs] = DAILY_BREACH_POLLY_HIT_MOVE_SEGMENTS_MS;
  const jumpAt = start + shockMs;
  const holdAt = jumpAt + jumpMs;
  const end = holdAt + DAILY_BREACH_POLLY_HIT_HOLD_MS;
  const y: DailyBreachKeyframes = {
    // On the perch until the jump, then the table; it ends at 0.
    inputRange: [0, jumpAt - EDGE_MS, ...POLLY_HIT_JUMP_Y.map(([t]) => jumpAt + t)],
    outputRange: [0, 0, ...POLLY_HIT_JUMP_Y.map(([, value]) => value)],
  };
  return {
    startMs: start,
    endMs: end,
    segments: [
      { pose: 'shocked', fromMs: start, toMs: jumpAt },
      // Straight up and down: no sideways step.
      { pose: 'masterShock', fromMs: jumpAt, toMs: holdAt },
      { pose: 'embarrassed', fromMs: holdAt, toMs: end },
    ],
    x: STILL,
    y,
    rotateDeg: STILL,
  };
}

// ── One clue: blown off the screen ──

/**
 * The move's poses and their segments (DAILY_BREACH_POLLY_SMASH_MOVE_SEGMENTS_MS,
 * then the hold), from the throw. She is blown out of sight in jumpAngry,
 * stays gone, flies back in on `fly` (her arrival pose) and lands in angry.
 */
const FURY_POSES: readonly PollyScreenPoseName[] = [
  'angryYell', // 0-130, yelling
  'sulk', // 130-260, the crouch
  'flyAngry', // 260-380, launching
  'jumpAngry', // 380-1380, blown up and back, tumbling out of sight
  'jumpAngry', // 1380-1680, gone
  'fly', // 1680-2330, flying back in
  'angry', // 2330-2460, the landing bounce
];

/**
 * TEST VALUES (Pete, 2026-11-06). Offsets are points from her perch. The exit
 * is far past the top-left of any phone (the perch sits about 55% down the
 * screen, so a 932 pt phone needs about 700 up); she is out of sight well
 * before the blast ends. Rotation runs negative: she faces right, so she is
 * blown backwards, head over heels.
 */
export const POLLY_BLOWN_AWAY = {
  crouchY: 4,
  launch: { x: 18, y: -36 },
  exit: { x: -240, y: -800, rotateDeg: -540 },
  /** Where she comes back in from: above the top and a little left, like her arrival (DAILY_POLLY_ENTRY_DX). */
  returnFrom: { x: -60, y: -800 },
  landingBouncePt: 3,
} as const;

type Pose3 = { x: number; y: number; r: number };

type Eases = { x: (u: number) => number; y: (u: number) => number; r: (u: number) => number };

function pushEased(
  out: { t: number[]; x: number[]; y: number[]; r: number[] },
  fromMs: number,
  ms: number,
  from: Pose3,
  to: Pose3,
  ease: ((u: number) => number) | Eases,
  steps = 6,
) {
  const eases: Eases = typeof ease === 'function' ? { x: ease, y: ease, r: ease } : ease;
  for (let i = 1; i <= steps; i += 1) {
    const u = i / steps;
    out.t.push(fromMs + ms * u);
    out.x.push(from.x + (to.x - from.x) * eases.x(u));
    out.y.push(from.y + (to.y - from.y) * eases.y(u));
    out.r.push(from.r + (to.r - from.r) * eases.r(u));
  }
}

const linear = (u: number) => u;
const easeOutQuad = (u: number) => 1 - (1 - u) * (1 - u);
const easeOutCubic = (u: number) => 1 - (1 - u) ** 3;
const easeInQuad = (u: number) => u * u;

function smashTimeline(): PollyBreachTimeline {
  const start = dailyBreachPollyMoveStartMs('smash');
  const durations = DAILY_BREACH_POLLY_SMASH_MOVE_SEGMENTS_MS;
  const at: number[] = [start];
  for (const ms of durations) at.push(at[at.length - 1] + ms);
  const end = at[at.length - 1] + DAILY_BREACH_POLLY_SMASH_HOLD_MS;
  const F = POLLY_BLOWN_AWAY;

  const out = { t: [start] as number[], x: [0] as number[], y: [0] as number[], r: [0] as number[] };
  const rest: Pose3 = { x: 0, y: 0, r: 0 };
  // 0-130 yell, still. 130-260 crouch. 260-380 launch.
  out.t.push(at[1]); out.x.push(0); out.y.push(0); out.r.push(0);
  const crouch: Pose3 = { x: 0, y: F.crouchY, r: 0 };
  pushEased(out, at[1], durations[1], rest, crouch, easeOutQuad);
  const launch: Pose3 = { x: F.launch.x, y: F.launch.y, r: 0 };
  pushEased(out, at[2], durations[2], crouch, launch, easeOutQuad);
  // 380-1380 the blast: up first (a gentle ease-out, so she stays on screen long enough to read), then
  // sweeping back to the left, tumbling at an even rate (Pete, 6 Nov: the first, front-loaded version was a blur).
  const exit: Pose3 = { x: F.exit.x, y: F.exit.y, r: F.exit.rotateDeg };
  pushEased(out, at[3], durations[3], launch, exit, { x: easeInQuad, y: easeOutQuad, r: linear }, 16);
  // 1380-1680 gone: out of sight, she is moved to the return point (a jump nobody can see) and stands upright.
  const back: Pose3 = { x: F.returnFrom.x, y: F.returnFrom.y, r: 0 };
  out.t.push(at[4] + EDGE_MS, at[5]);
  out.x.push(back.x, back.x);
  out.y.push(back.y, back.y);
  out.r.push(back.r, back.r);
  // 1680-2330 flies back in and settles on the perch (the arrival's own ease).
  pushEased(out, at[5], durations[5], back, rest, easeOutCubic, 10);
  // 2330-2460 the landing bounce: down 3 and back.
  const half = durations[6] / 2;
  out.t.push(at[6] + half, at[7]);
  out.x.push(0, 0);
  out.y.push(F.landingBouncePt, 0);
  out.r.push(0, 0);

  const segments: PollyBreachSegment[] = FURY_POSES.map((pose, i) => ({ pose, fromMs: at[i], toMs: at[i + 1] }));
  segments.push({ pose: 'angry', fromMs: at[7], toMs: end });
  return {
    startMs: start,
    endMs: end,
    segments,
    x: { inputRange: out.t, outputRange: out.x.map((v) => v || 0) },
    y: { inputRange: out.t, outputRange: out.y.map((v) => v || 0) },
    rotateDeg: { inputRange: out.t, outputRange: out.r.map((v) => v || 0) },
  };
}

/** Polly's move for a breach tier, on that tier's clock. */
export function pollyDailyBreachTimeline(tier: 'hit' | 'smash'): PollyBreachTimeline {
  return tier === 'hit' ? hitTimeline() : smashTimeline();
}

/** Every pose a breach move shows, for the perch's mounted layers. */
export const POLLY_BREACH_POSES: readonly PollyScreenPoseName[] = [
  ...new Set<PollyScreenPoseName>([
    ...hitTimeline().segments.map((s) => s.pose),
    ...smashTimeline().segments.map((s) => s.pose),
  ]),
];

/**
 * Where a step from 0 to 1 at `fromMs` sits on the clock. The clock RESTS at
 * 0 between claims, so a move that starts at the throw (fromMs 0) steps up
 * just after 0, never at it: at rest nothing of a move shows.
 */
function stepUp(fromMs: number): [number, number] {
  return fromMs <= 0 ? [0, EDGE_MS] : [fromMs - EDGE_MS, fromMs];
}

/** 1 while the move (and its hold) owns her pose, 0 before and after, and 0 with the clock at rest. */
export function pollyBreachActiveKeyframes(timeline: PollyBreachTimeline): DailyBreachKeyframes {
  const [off, on] = stepUp(timeline.startMs);
  const inputRange = off > 0 ? [0, off, on, timeline.endMs, timeline.endMs + EDGE_MS] : [off, on, timeline.endMs, timeline.endMs + EDGE_MS];
  const outputRange = off > 0 ? [0, 0, 1, 1, 0] : [0, 1, 1, 0];
  return { inputRange, outputRange };
}

/**
 * A pose layer's opacity during the move: 1 through its segments (merged when
 * adjacent), 0 otherwise. Where one pose hands over to the next, the old one
 * steps down over the same 0.5 ms the new one steps up in, so the two always
 * sum to 1: never two Pollys at once, whatever frame the clock is sampled on.
 * The move's last pose steps down with the move's own hand-back (endMs to
 * endMs + 0.5), as her own pose steps back up.
 */
export function pollyBreachPoseKeyframes(timeline: PollyBreachTimeline, pose: PollyScreenPoseName): DailyBreachKeyframes {
  const runs: { from: number; to: number }[] = [];
  for (const s of timeline.segments) {
    if (s.pose !== pose) continue;
    const last = runs[runs.length - 1];
    if (last && last.to === s.fromMs) last.to = s.toMs;
    else runs.push({ from: s.fromMs, to: s.toMs });
  }
  if (runs.length === 0) return STILL;
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (const { from, to } of runs) {
    const [off, on] = stepUp(from);
    if (inputRange.length === 0 && off > 0) { inputRange.push(0); outputRange.push(0); }
    const [hold, gone] = to < timeline.endMs ? [to - EDGE_MS, to] : [to, to + EDGE_MS];
    inputRange.push(off); outputRange.push(0);
    inputRange.push(on); outputRange.push(1);
    inputRange.push(hold); outputRange.push(1);
    inputRange.push(gone); outputRange.push(0);
  }
  return { inputRange, outputRange };
}
