import type { DailyBreachKeyframes } from './dailyBreach';
import type { PollyBreachSegment, PollyBreachTimeline } from './pollyDailyBreach';
// Type only: pollyScreenPoses pulls in the pose art.
import type { PollyScreenPoseName } from './pollyScreenPoses';

/**
 * Polly's reaction to the Daily's FIRST lost life (Pete, 2026-11-04): a dance
 * in place of the old pointing lean. She laughs, hops, hovers pointing while
 * "Sharp as a butter knife." shows, drops and lands laughing. About 2.5 s, the
 * reaction's old length, all in her strip left of the castle.
 *
 * RN-free. The perch plays it on its own 0 → POLLY_DANCE_MS clock (ms from the
 * reaction's start). Offsets are points, the same unscaled kind as the perch's
 * reactX/reactY. The second lost life (game over) is untouched.
 */
export const POLLY_DANCE_MS = 2500;

/** Start values from the mock. */
export const POLLY_DANCE = {
  /** laugh03's small bob, over its 250 ms. */
  laughBobPt: 3,
  /** The hop up into the hover. */
  hop: { x: 6, y: -44 },
  /** The hover: drifts back left (clear of the clue planks) while bobbing. */
  hover: { driftToX: -8, bobPt: 4 },
  landingBouncePt: 3,
} as const;

/** The butter-knife line's bubble: in at 850 ms (180 ms), out from 1650 ms (160 ms), while she hovers and points. */
export const POLLY_DANCE_BUBBLE = { inAtMs: 850, inMs: 180, outAtMs: 1650, outMs: 160 } as const;

const STILL: DailyBreachKeyframes = { inputRange: [0, 1], outputRange: [0, 0] };

const easeOutCubic = (u: number) => 1 - (1 - u) ** 3;
const easeInQuad = (u: number) => u * u;

type Track = { t: number[]; x: number[]; y: number[] };

/** Samples one stretch into the tracks, from `fromMs` for `ms`; `at(u)` gives (x, y) for u in (0, 1]. */
function sampleStretch(track: Track, fromMs: number, ms: number, steps: number, at: (u: number) => [number, number]) {
  for (let i = 1; i <= steps; i += 1) {
    const u = i / steps;
    const [x, y] = at(u);
    track.t.push(fromMs + ms * u);
    track.x.push(x || 0);
    track.y.push(y || 0);
  }
}

/** The dance on its own clock: poses, x and y (no rotation). */
export function pollyDailyDanceTimeline(): PollyBreachTimeline {
  const D = POLLY_DANCE;
  const segments: PollyBreachSegment[] = [
    { pose: 'laugh01', fromMs: 0, toMs: 250 }, // laughing on the perch
    { pose: 'laugh03', fromMs: 250, toMs: 500 }, // a small bob
    { pose: 'flyGrin', fromMs: 500, toMs: 850 }, // hops up
    { pose: 'hauntTaunt', fromMs: 850, toMs: 1650 }, // hovers and points; the bubble shows
    { pose: 'hauntTaunt', fromMs: 1650, toMs: 2000 }, // falls back to the perch
    { pose: 'laugh', fromMs: 2000, toMs: 2110 }, // lands laughing (bigLaugh), a bounce
    { pose: 'laugh', fromMs: 2110, toMs: POLLY_DANCE_MS }, // holds, then idle
  ];

  const track: Track = { t: [0, 250], x: [0, 0], y: [0, 0] };
  // 250-500: the bob, y = -3 sin(2πp).
  sampleStretch(track, 250, 250, 8, (u) => [0, -D.laughBobPt * Math.sin(2 * Math.PI * u)]);
  // 500-850: the hop, ease out cubic.
  sampleStretch(track, 500, 350, 6, (u) => [D.hop.x * easeOutCubic(u), D.hop.y * easeOutCubic(u)]);
  // 850-1650: hovering. x drifts back over the first half (ease out), then
  // holds; y bobs, -44 + 4 sin(3πp).
  sampleStretch(track, 850, 800, 16, (u) => {
    const drift = Math.min(1, u * 2);
    const x = D.hop.x + (D.hover.driftToX - D.hop.x) * easeOutCubic(drift);
    return [x, D.hop.y + D.hover.bobPt * Math.sin(3 * Math.PI * u)];
  });
  // 1650-2000: falls to the perch, ease in quad.
  sampleStretch(track, 1650, 350, 6, (u) => {
    const e = easeInQuad(u);
    return [D.hover.driftToX * (1 - e), D.hop.y * (1 - e)];
  });
  // 2000-2110: the landing bounce, down 3 and back; then she holds.
  track.t.push(2055, 2110, POLLY_DANCE_MS);
  track.x.push(0, 0, 0);
  track.y.push(D.landingBouncePt, 0, 0);

  return {
    startMs: 0,
    endMs: POLLY_DANCE_MS,
    segments,
    x: { inputRange: track.t, outputRange: track.x },
    y: { inputRange: track.t, outputRange: track.y },
    rotateDeg: STILL,
  };
}

/** The butter-knife bubble's opacity on the dance clock; 0 at rest (clock 0) and after. */
export function pollyDanceBubbleKeyframes(): DailyBreachKeyframes {
  const B = POLLY_DANCE_BUBBLE;
  return {
    inputRange: [0, B.inAtMs, B.inAtMs + B.inMs, B.outAtMs, B.outAtMs + B.outMs],
    outputRange: [0, 0, 1, 1, 0],
  };
}

/** Every pose the dance shows, for the perch's mounted layers. */
export const POLLY_DANCE_POSES: readonly PollyScreenPoseName[] = [
  ...new Set(pollyDailyDanceTimeline().segments.map((s) => s.pose)),
];
