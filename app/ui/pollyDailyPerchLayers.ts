import type { DailyBreachKeyframes } from './dailyBreach';
import {
  POLLY_BREACH_POSES,
  pollyBreachActiveKeyframes,
  pollyBreachPoseKeyframes,
  pollyDailyBreachTimeline,
  type PollyBreachTimeline,
} from './pollyDailyBreach';
import { POLLY_DANCE_POSES, pollyDailyDanceTimeline, pollyDanceBubbleKeyframes } from './pollyDailyDance';
// Type only: pollyScreenPoses pulls in the pose art.
import type { PollyScreenPoseName } from './pollyScreenPoses';

/**
 * Which of the Daily perch's Polly layers is visible (PollyDailyPerch.tsx).
 * RN-free: the perch builds its Animated graph from composeDailyPerch with
 * Animated nodes, and the tests sample the very same composition with numbers.
 *
 * Every pose has one mounted layer; exactly one may be visible at a time.
 * A layer shows her own pose (the reaction's) unless a MOVE owns her pose:
 * the two breach tier moves (on the screen's breach clocks) and the first-miss
 * dance (on the perch's dance clock).
 *
 * THE LIVE GATES (2026-11-05). Each move is read as keyframes(clock) x live.
 * The clock alone can NOT decide whether a move is over. A move is ended
 * early by stopping its native animation and setting the clock to 0, but
 * React Native then delivers the stopped animation's last value back to JS
 * (Animation.__startAnimationIfNative's end handler) AFTER that reset, and
 * re-renders every layer from it. JS believes the clock is mid-move while
 * native has it at rest, and the two write different layers onto the views:
 * Pete's doubled Polly on the second lost life (the loss started mid-dance,
 * so the dance pose and the loss pose were both lit). `live` is only ever
 * set, never animated, so JS and native always agree on it; set to 0 before a
 * clock is stopped, the move contributes nothing whatever value the clock
 * reports.
 */

export type DailyPerchReactionPose = 'idle' | 'happy' | 'laughing' | 'shocked';

/** Her own pose for each reaction. */
export const DAILY_PERCH_POSE: Readonly<Record<DailyPerchReactionPose, PollyScreenPoseName>> = {
  idle: 'idle', // smug perched — watchful (face rig)
  // First lost life (wrong): the dance (ui/pollyDailyDance.ts) plays over this
  // and lands on it; under Reduce Motion it is the whole reaction.
  happy: 'laugh',
  laughing: 'laugh', // laughing wide (out of lives)
  shocked: 'shocked', // shocked (win)
};

/** The fly-in entrance. */
export const DAILY_PERCH_FLY_POSE: PollyScreenPoseName = 'fly';

/** The win and the loss end the Daily: she flies out (win: angry, loss: grinning). */
export const DAILY_PERCH_EXIT_POSE: Readonly<{ shocked: PollyScreenPoseName; laughing: PollyScreenPoseName }> = {
  shocked: 'flyAngry',
  laughing: 'flyGrin',
};

/** Every pose the perch can show, one mounted layer each. */
export const DAILY_PERCH_LAYER_POSES: readonly PollyScreenPoseName[] = [
  ...new Set<PollyScreenPoseName>([
    DAILY_PERCH_FLY_POSE,
    ...Object.values(DAILY_PERCH_POSE),
    ...Object.values(DAILY_PERCH_EXIT_POSE),
    // The breach's tier moves and the first-miss dance.
    ...POLLY_BREACH_POSES,
    ...POLLY_DANCE_POSES,
  ]),
];

export type DailyPerchMove = 'hit' | 'smash' | 'dance';
export const DAILY_PERCH_MOVES: readonly DailyPerchMove[] = ['hit', 'smash', 'dance'];

/** Every move that can own her pose, each on its own clock. */
export const DAILY_PERCH_MOVE_TIMELINES: Readonly<Record<DailyPerchMove, PollyBreachTimeline>> = {
  hit: pollyDailyBreachTimeline('hit'),
  smash: pollyDailyBreachTimeline('smash'),
  dance: pollyDailyDanceTimeline(),
};

/** Poses a move can show (their layers add the move's opacity). */
export const DAILY_PERCH_MOVE_POSES: readonly PollyScreenPoseName[] = [
  ...new Set([...POLLY_BREACH_POSES, ...POLLY_DANCE_POSES]),
];

/** The operations the composition needs; numbers for the tests, Animated nodes for the perch. */
export type DailyPerchAlgebra<N> = {
  /** A move's keyframes read off its clock (clamped), times the move's live gate. */
  read: (move: DailyPerchMove, keys: DailyBreachKeyframes) => N;
  add: (a: N, b: N) => N;
  multiply: (a: N, b: N) => N;
  /** 1 - owned, clamped to [0, 1]. */
  release: (owned: N) => N;
};

export type DailyPerchComposition<N> = {
  /** Opacity per image layer. */
  images: Record<PollyScreenPoseName, N>;
  /** Opacity of the face-rig layer. */
  rig: N;
  x: N;
  y: N;
  rotateDeg: N;
  /** The dance's butter-knife bubble, added to the reactions' own bubble opacity. */
  danceBubble: N;
};

/**
 * The perch's layers. `own` is her own pose, 0 or 1 per layer (see
 * dailyPerchOwnOpacity); `imagePoses` are the layers drawn as images (the rig
 * draws the rest).
 */
export function composeDailyPerch<N>(
  alg: DailyPerchAlgebra<N>,
  imagePoses: readonly PollyScreenPoseName[],
  own: { rig: N; image: (pose: PollyScreenPoseName) => N },
): DailyPerchComposition<N> {
  const T = DAILY_PERCH_MOVE_TIMELINES;
  // Each move on its own clock, summed: only one is live at a time, and each
  // rests at 0.
  const sum = (make: (move: DailyPerchMove) => DailyBreachKeyframes) =>
    alg.add(alg.read('hit', make('hit')), alg.add(alg.read('smash', make('smash')), alg.read('dance', make('dance'))));
  // 1 while a move owns her pose; her own pose shows only when it is 0.
  const notOwned = alg.release(sum((m) => pollyBreachActiveKeyframes(T[m])));
  const movePoses = new Set(DAILY_PERCH_MOVE_POSES);
  const images = {} as Record<PollyScreenPoseName, N>;
  for (const pose of imagePoses) {
    const mine = alg.multiply(own.image(pose), notOwned);
    images[pose] = movePoses.has(pose) ? alg.add(mine, sum((m) => pollyBreachPoseKeyframes(T[m], pose))) : mine;
  }
  return {
    images,
    rig: alg.multiply(own.rig, notOwned),
    x: sum((m) => T[m].x),
    y: sum((m) => T[m].y),
    rotateDeg: sum((m) => T[m].rotateDeg),
    danceBubble: alg.read('dance', pollyDanceBubbleKeyframes()),
  };
}

/** Her own pose as 0/1 per layer: the rig when it draws her pose, else that pose's image. */
export function dailyPerchOwnOpacity(
  pose: PollyScreenPoseName,
  rigVisible: boolean,
  imagePoses: readonly PollyScreenPoseName[],
): { rig: number; images: Record<PollyScreenPoseName, number> } {
  const images = {} as Record<PollyScreenPoseName, number>;
  for (const p of imagePoses) images[p] = !rigVisible && p === pose ? 1 : 0;
  return { rig: rigVisible ? 1 : 0, images };
}

/** Keyframes at `t`, linear between keys and clamped at both ends (Animated's interpolate, extrapolate 'clamp'). */
export function sampleDailyPerchKeyframes(keys: DailyBreachKeyframes, t: number): number {
  const { inputRange: xs, outputRange: ys } = keys;
  if (t <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i += 1) {
    if (t <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (t - xs[i - 1])) / (xs[i] - xs[i - 1]);
  }
  return ys[ys.length - 1];
}

export type DailyPerchClockReading = { clock: number; live: number };

/** The perch's layer opacities as numbers, for one reading of the three clocks and their gates. */
export function dailyPerchLayerOpacities(
  pose: PollyScreenPoseName,
  rigVisible: boolean,
  imagePoses: readonly PollyScreenPoseName[],
  clocks: Readonly<Record<DailyPerchMove, DailyPerchClockReading>>,
): DailyPerchComposition<number> {
  const own = dailyPerchOwnOpacity(pose, rigVisible, imagePoses);
  return composeDailyPerch<number>(
    {
      read: (move, keys) => sampleDailyPerchKeyframes(keys, clocks[move].clock) * clocks[move].live,
      add: (a, b) => a + b,
      multiply: (a, b) => a * b,
      release: (owned) => Math.min(1, Math.max(0, 1 - owned)),
    },
    imagePoses,
    { rig: own.rig, image: (p) => own.images[p] },
  );
}

/** The layers with any opacity ('rig' for the face rig). */
export function dailyPerchVisibleLayers(layers: DailyPerchComposition<number>): string[] {
  const out: string[] = [];
  if (layers.rig > 0) out.push('rig');
  for (const [pose, opacity] of Object.entries(layers.images)) if (opacity > 0) out.push(pose);
  return out;
}
