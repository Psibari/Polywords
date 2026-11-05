import {
  resolveDailyCelebrationGrade,
  type DailyCelebrationGrade,
} from '../game/dailyClaimPresentation';
import { createSeededRng } from '../game/seededRandom';
import {
  DAILY_CAP_CENTRES,
  DAILY_CASTLE_FLIGHT,
  DAILY_GOLD_HIT_TIERS,
} from './dailyCastleScene';

/**
 * THE BREACH (Pete, 2026-11-03; CONTEXT.md "THE BREACH"). How the gate takes a
 * correct claim, by how many clues the player needed:
 *   'open'  three clues: today's sequence, unchanged. The gate lifts as the
 *           plaque is thrown.
 *   'hit'   two clues: the plaque HITS the shut gate, the gate holds, then lifts.
 *   'smash' one clue: the plaque breaks through the gate.
 *
 * The tier comes from the existing celebration grade, so the Daily has ONE clue
 * ladder (resolveDailyCelebrationGrade), not two. RN-free: this is the clock the
 * screen and the perch read; nothing here animates.
 */
export type DailyBreachTier = 'open' | 'hit' | 'smash';

const DAILY_BREACH_TIER_BY_GRADE: Record<DailyCelebrationGrade, DailyBreachTier> = {
  solved: 'open',
  sharp: 'hit',
  cold: 'smash',
};

export function resolveDailyBreachTier(revealedClueCount: number): DailyBreachTier {
  return DAILY_BREACH_TIER_BY_GRADE[resolveDailyCelebrationGrade(revealedClueCount)];
}

// Beat timing, in ms from the claim (t = 0 is when the plaque launches). The
// numbers are the approved 4 Nov 2026 mock's; this is the one place to tune
// them on the phone.

/** The gate's rise with motion on. Must equal dailyGateRiseMs(true) in DailyChallengeScreen. */
export const DAILY_BREACH_GATE_RISE_MS = 400;
/** The gate's rise under Reduce Motion, every tier. Must equal dailyGateRiseMs(false). */
export const DAILY_BREACH_CALM_GATE_RISE_MS = 120;
/** The plaque's rise to the gate for 'open' and 'hit': today's throw. */
export const DAILY_BREACH_PLAQUE_RISE_MS = DAILY_CASTLE_FLIGHT.riseMs;
/** The plaque's rise for 'smash': faster, so it arrives with speed. */
export const DAILY_BREACH_SMASH_PLAQUE_RISE_MS = 380;
/** The plaque being taken into the tunnel, every tier: today's absorb. */
export const DAILY_BREACH_PLAQUE_ABSORB_MS = DAILY_CASTLE_FLIGHT.absorbMs;
/** 'hit': how long the gate stays SHUT after the plaque hits it. */
export const DAILY_BREACH_HIT_HOLD_MS = 760;
/** 'smash': how long the broken gate hangs after the plaque is through, before it rises. */
export const DAILY_BREACH_SMASH_HANG_MS = 480;

export type DailyBreachBeats = {
  /** When the plaque meets the gate. null when there is no contact beat ('open', and every tier under Reduce Motion). */
  contactMs: number | null;
  plaqueRiseMs: number;
  plaqueAbsorbMs: number;
  gateRiseStartMs: number;
  gateRiseMs: number;
  /** The plaque has finished its absorb. */
  plaqueGoneMs: number;
  /** The gate has finished rising. */
  gateUpMs: number;
  /** Both of the above: the throw is over. */
  thrownGoneMs: number;
};

export function dailyBreachBeats(tier: DailyBreachTier, motion: boolean): DailyBreachBeats {
  // Reduce Motion: no plaque flight, no contact, no hold. Every tier plays
  // today's short calm sequence; only the effects differ (a later prompt).
  if (!motion) {
    return {
      contactMs: null,
      plaqueRiseMs: 0,
      plaqueAbsorbMs: 0,
      gateRiseStartMs: 0,
      gateRiseMs: DAILY_BREACH_CALM_GATE_RISE_MS,
      plaqueGoneMs: 0,
      gateUpMs: DAILY_BREACH_CALM_GATE_RISE_MS,
      thrownGoneMs: DAILY_BREACH_CALM_GATE_RISE_MS,
    };
  }

  const plaqueAbsorbMs = DAILY_BREACH_PLAQUE_ABSORB_MS;
  const gateRiseMs = DAILY_BREACH_GATE_RISE_MS;
  let plaqueRiseMs: number;
  let contactMs: number | null;
  let gateRiseStartMs: number;
  let plaqueGoneMs: number;

  if (tier === 'open') {
    // Today: the gate lifts at the throw, the plaque flies straight through.
    plaqueRiseMs = DAILY_BREACH_PLAQUE_RISE_MS;
    contactMs = null;
    gateRiseStartMs = 0;
    plaqueGoneMs = plaqueRiseMs + plaqueAbsorbMs;
  } else if (tier === 'hit') {
    // The plaque hits the shut gate and rests against it through the hold;
    // the gate rises and the plaque is absorbed together.
    plaqueRiseMs = DAILY_BREACH_PLAQUE_RISE_MS;
    contactMs = plaqueRiseMs;
    gateRiseStartMs = contactMs + DAILY_BREACH_HIT_HOLD_MS;
    plaqueGoneMs = gateRiseStartMs + plaqueAbsorbMs;
  } else {
    // The plaque breaks through and is taken at once; the broken gate hangs,
    // then rises.
    plaqueRiseMs = DAILY_BREACH_SMASH_PLAQUE_RISE_MS;
    contactMs = plaqueRiseMs;
    plaqueGoneMs = contactMs + plaqueAbsorbMs;
    gateRiseStartMs = plaqueGoneMs + DAILY_BREACH_SMASH_HANG_MS;
  }

  const gateUpMs = gateRiseStartMs + gateRiseMs;
  return {
    contactMs,
    plaqueRiseMs,
    plaqueAbsorbMs,
    gateRiseStartMs,
    gateRiseMs,
    plaqueGoneMs,
    gateUpMs,
    thrownGoneMs: Math.max(plaqueGoneMs, gateUpMs),
  };
}

// Polly's tier move on the perch, from the approved 4 Nov mock: the move's
// segments in order (summed below), then the hold that follows it.
export const DAILY_BREACH_POLLY_HIT_MOVE_SEGMENTS_MS = [140, 933] as const;
/** 'hit': the embarrassed hold after the jump. */
export const DAILY_BREACH_POLLY_HIT_HOLD_MS = 1300;
export const DAILY_BREACH_POLLY_SMASH_MOVE_SEGMENTS_MS = [130, 130, 120, 200, 480, 380, 130] as const;
export const DAILY_BREACH_POLLY_SMASH_HOLD_MS = 1300;

export type DailyBreachPollyMove = { moveMs: number; holdMs: number };

function sumMs(segments: readonly number[]): number {
  return segments.reduce((total, ms) => total + ms, 0);
}

/**
 * How many clues the gate shows. The broken gate shows the first clue only:
 * its hole is where clues two and three are painted, so they are hidden even
 * if `revealedCount` says otherwise.
 */
export function dailyGateShownClueCount(revealedCount: 1 | 2 | 3, broken: boolean): 1 | 2 | 3 {
  return broken ? 1 : revealedCount;
}

/**
 * Cracks on the shut door, radiating from the centre of the breach hole
 * (DAILY_BREACH_HOLE). Seven short dark lines, each four segments; every
 * segment's heading wobbles about its line's direction. All lengths are canvas
 * points, so the gate's screen scale scales them with it. Generated from a
 * FIXED seed, once, so the cracks are the same every time.
 */
export const DAILY_BREACH_CRACK_SEED = 20261104;
export const DAILY_BREACH_CRACKS = {
  color: '#12041F',
  strokeWidth: 1.6,
  lineCount: 7,
  segmentsPerLine: 4,
  segmentMinPt: 9,
  segmentMaxPt: 20,
  wobbleRad: 0.5,
} as const;

/** Each crack as a polyline of points, relative to the hole centre, canvas points. Starts at (0, 0). */
export function dailyBreachCrackLines(
  seed: number = DAILY_BREACH_CRACK_SEED,
): { x: number; y: number }[][] {
  const c = DAILY_BREACH_CRACKS;
  const rng = createSeededRng(seed);
  const lines: { x: number; y: number }[][] = [];
  for (let line = 0; line < c.lineCount; line += 1) {
    // Evenly spread around the hole, the first pointing straight up.
    const direction = -Math.PI / 2 + (line * 2 * Math.PI) / c.lineCount;
    let x = 0;
    let y = 0;
    const points = [{ x, y }];
    for (let segment = 0; segment < c.segmentsPerLine; segment += 1) {
      const heading = direction + (rng() * 2 - 1) * c.wobbleRad;
      const length = c.segmentMinPt + rng() * (c.segmentMaxPt - c.segmentMinPt);
      x += Math.cos(heading) * length;
      y += Math.sin(heading) * length;
      points.push({ x, y });
    }
    lines.push(points);
  }
  return lines;
}

/** The cracks as one SVG path, offset to `origin` (the hole centre in the SVG's own units). */
export function dailyBreachCrackPath(origin: { x: number; y: number }, seed?: number): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return dailyBreachCrackLines(seed)
    .map((points) =>
      points.map((p, i) => `${i === 0 ? 'M' : 'L'}${r(origin.x + p.x)} ${r(origin.y + p.y)}`).join(' '),
    )
    .join(' ');
}

/** How long Polly's tier move and its hold run. 'open' has none; Reduce Motion has none for any tier. */
export function dailyBreachPollyMoveMs(tier: DailyBreachTier, motion: boolean): DailyBreachPollyMove {
  if (!motion || tier === 'open') return { moveMs: 0, holdMs: 0 };
  if (tier === 'hit') {
    return { moveMs: sumMs(DAILY_BREACH_POLLY_HIT_MOVE_SEGMENTS_MS), holdMs: DAILY_BREACH_POLLY_HIT_HOLD_MS };
  }
  return { moveMs: sumMs(DAILY_BREACH_POLLY_SMASH_MOVE_SEGMENTS_MS), holdMs: DAILY_BREACH_POLLY_SMASH_HOLD_MS };
}

// ── The breach effects (DailyCastleStage) ──────────────────────────────────
// Numbers are the approved 4 Nov 2026 mock's. Every random-looking shape is
// generated from a FIXED seed, outside render, so it is identical every time.
// Positions and lengths are canvas points; the stage scales them.

export const DAILY_BREACH_SEEDS = {
  shakeX: 110401,
  shakeY: 110402,
  boltA: 110411,
  boltB: 110412,
  splinters: 110421,
  dustSmash: 110431,
  dustHit: 110432,
  gateJitter: 110441,
} as const;

/** Interpolation keyframes for one channel. */
export type DailyBreachKeyframes = { inputRange: number[]; outputRange: number[] };

type Point = { x: number; y: number };

function between([min, max]: readonly [number, number], unit: number): number {
  return min + (max - min) * unit;
}

// ── Castle shake ──
// A decaying shake of the whole stage ("the world", Polly included: the stage
// reports the same translate values to the screen). One 0 → 1 value, linear,
// over the profile's length; the keyframes carry the shape and are exactly 0 at
// both ends. A separate parent transform, never the wall tremble's channel.

export type DailyBreachShakeProfile = 'hit' | 'smash';
export const DAILY_BREACH_SHAKE = {
  hit: { amplitudePt: 7, ms: 720 },
  smash: { amplitudePt: 13, ms: 950 },
  /** A new seeded offset every this many ms on each axis (the mock re-rolls a random offset per frame). */
  stepMs: 30,
} as const;

function dailyBreachShakeAxis(profile: DailyBreachShakeProfile, seed: number): DailyBreachKeyframes {
  const { amplitudePt, ms } = DAILY_BREACH_SHAKE[profile];
  return seededDecayingShake(amplitudePt, ms, DAILY_BREACH_SHAKE.stepMs, seed);
}

/**
 * A seeded random offset every `stepMs`, within +/- amplitude, decaying
 * linearly to 0, as keyframes over a 0 → 1 value; exactly 0 at both ends.
 */
function seededDecayingShake(
  amplitudePt: number,
  ms: number,
  stepMs: number,
  seed: number,
): DailyBreachKeyframes {
  const steps = Math.max(2, Math.round(ms / stepMs));
  const rng = createSeededRng(seed);
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    // Linear decay to 0; the ends are pinned at exactly 0.
    const swing = i === 0 || i === steps ? 0 : amplitudePt * (1 - t) * (rng() * 2 - 1);
    inputRange.push(t);
    outputRange.push(swing || 0);
  }
  return { inputRange, outputRange };
}

/** x and y keyframes over a 0 → 1 value driven linearly for DAILY_BREACH_SHAKE[profile].ms. */
export function dailyBreachShakeKeyframes(profile: DailyBreachShakeProfile): {
  x: DailyBreachKeyframes;
  y: DailyBreachKeyframes;
} {
  return {
    x: dailyBreachShakeAxis(profile, DAILY_BREACH_SEEDS.shakeX),
    y: dailyBreachShakeAxis(profile, DAILY_BREACH_SEEDS.shakeY),
  };
}

// ── The gate's own shudder (DailyGate jitterX) ──
// Side to side only, on top of the castle shake. Same seeded, decaying style;
// one 0 → 1 value driven linearly for the profile's length, screen points.
export const DAILY_BREACH_GATE_JITTER = {
  hit: { amplitudePt: 3.5, ms: 720 },
  smash: { amplitudePt: 4, ms: 500 },
  stepMs: 30,
} as const;

export function dailyBreachGateJitterKeyframes(profile: DailyBreachShakeProfile): DailyBreachKeyframes {
  const { amplitudePt, ms } = DAILY_BREACH_GATE_JITTER[profile];
  return seededDecayingShake(amplitudePt, ms, DAILY_BREACH_GATE_JITTER.stepMs, DAILY_BREACH_SEEDS.gateJitter);
}

/**
 * 'hit': the cracks on the shut door fade in at contact and out from
 * gateRiseStartMs. The brief gives no fade lengths; these are start values for
 * the phone pass.
 */
export const DAILY_BREACH_CRACKS_FADE = { inMs: 90, outMs: 150 } as const;

/**
 * 'hit': the plaque presses into the shut gate at contact (the mock: it dips
 * 6 pt and scales down 0.04 for 90 ms), then springs back. Split evenly in and
 * out; the dip is canvas points (the stage scales it with the scene).
 */
export const DAILY_BREACH_PLAQUE_PRESS = { dipPt: 6, scaleDown: 0.04, inMs: 45, outMs: 45 } as const;

// ── The thrown plaque's two copies, and the broken art ──
// DailyCastleStage draws the plaque twice on one progress value (0 → handoff →
// 1): a FRONT copy over the whole castle and a BACK copy inside the opening,
// UNDER the gate. These keyframes say which copy shows at each progress, and
// when the broken gate art shows. They are the single source for both, so the
// smash's hole opens in exactly the frame the plaque goes behind the gate.

/** Where the plaque gives way from the front copy to the back one: just before the handoff. */
const PLAQUE_SWAP_WIDTH = 0.001;
/** How far into the absorb leg the plaque starts to fade into the tunnel. */
const PLAQUE_FADE_FROM = 0.35;

export type DailyFlightLayerOpacity = { front: DailyBreachKeyframes; back: DailyBreachKeyframes };

/**
 * Each copy's opacity over the flight's progress.
 *   default ('open', 'smash'): front until just before the handoff, then the
 *     back copy, which fades out down the tunnel. For 'open' the gate is already
 *     up; for 'smash' the back copy shows through the hole (dailyGateBreakKeyframes).
 *   stayInFront ('hit'): the gate is SHUT at the handoff and is still covering
 *     it for the first part of its rise, so a back copy there would be hidden.
 *     The front copy carries the plaque the whole way, holding over the gate and
 *     fading into the tunnel as the gate slides up behind it; the back copy never
 *     shows.
 */
export function dailyFlightLayerOpacity(handoff: number, stayInFront: boolean): DailyFlightLayerOpacity {
  const fadeFrom = handoff + (1 - handoff) * PLAQUE_FADE_FROM;
  if (stayInFront) {
    return {
      front: { inputRange: [0, fadeFrom, 1], outputRange: [1, 1, 0] },
      back: { inputRange: [0, 1], outputRange: [0, 0] },
    };
  }
  const swapFrom = handoff - PLAQUE_SWAP_WIDTH;
  return {
    front: { inputRange: [0, swapFrom, handoff], outputRange: [1, 1, 0] },
    back: { inputRange: [0, swapFrom, handoff, fadeFrom, 1], outputRange: [0, 0, 1, 1, 0] },
  };
}

/**
 * The broken gate art's opacity over the same progress (the smash): 0 until the
 * plaque starts to go behind the gate, 1 from the frame it is behind it, and it
 * stays broken through the absorb. The screen multiplies it by a 0/1 "armed"
 * value, so only a smash, and only until the broken gate is up, ever shows it.
 */
export function dailyGateBreakKeyframes(handoff: number): DailyBreachKeyframes {
  const back = dailyFlightLayerOpacity(handoff, false).back;
  return { inputRange: back.inputRange.slice(0, 3), outputRange: [0, 0, 1] };
}

// ── Lightning (smash only) ──
// Two bolts. Each is three polylines from the sky to the hole and the two tower
// caps, drawn twice: a wide violet glow under a thin white core.

export const DAILY_BREACH_LIGHTNING = {
  /** Bolt 1 fires 110 ms after the breach starts, bolt 2 80 ms after it. */
  boltAtMs: [110, 190],
  boltMs: 70,
  glow: { color: '#A98CFF', width: 9, opacity: 0.55 },
  core: { color: '#FFFFFF', width: 3.2 },
  startX: { hole: [190, 240], left: [10, 70], right: [360, 420] },
  /** The sky: the top of the scene. */
  startY: 0,
  /** Each segment drops this far, and moves `pull` of the way to its target sideways plus up to +/- wobblePt. */
  stepPt: [30, 56],
  pull: 0.25,
  wobblePt: 18,
  /** Each bolt's screen-wide white flash. */
  flashPeak: 0.5,
  flashDecayMs: 200,
} as const;

export type DailyBreachBolt = { hole: Point[]; left: Point[]; right: Point[] };

function dailyBreachBoltBranch(
  rng: () => number,
  startX: readonly [number, number],
  target: Point,
): Point[] {
  const L = DAILY_BREACH_LIGHTNING;
  let x = between(startX, rng());
  let y: number = L.startY;
  const points: Point[] = [{ x, y }];
  while (target.y - y > L.stepPt[1]) {
    y += between(L.stepPt, rng());
    x += (target.x - x) * L.pull + (rng() * 2 - 1) * L.wobblePt;
    points.push({ x, y });
  }
  points.push({ x: target.x, y: target.y });
  return points;
}

/** The two bolts' shapes, aimed at the hole (canvas points; it moves with clueTop) and the two cap centres. */
export function dailyBreachBolts(hole: Point): [DailyBreachBolt, DailyBreachBolt] {
  const L = DAILY_BREACH_LIGHTNING;
  const bolt = (seed: number): DailyBreachBolt => {
    const rng = createSeededRng(seed);
    return {
      hole: dailyBreachBoltBranch(rng, L.startX.hole, hole),
      left: dailyBreachBoltBranch(rng, L.startX.left, DAILY_CAP_CENTRES[0]),
      right: dailyBreachBoltBranch(rng, L.startX.right, DAILY_CAP_CENTRES[1]),
    };
  };
  return [bolt(DAILY_BREACH_SEEDS.boltA), bolt(DAILY_BREACH_SEEDS.boltB)];
}

/** A bolt's opacity over the breach clock (ms): on for boltMs from its start, 0 otherwise. */
export function dailyBreachBoltKeyframes(index: 0 | 1): DailyBreachKeyframes {
  const at = DAILY_BREACH_LIGHTNING.boltAtMs[index];
  const end = at + DAILY_BREACH_LIGHTNING.boltMs;
  return { inputRange: [at - 0.5, at, end, end + 0.5], outputRange: [0, 1, 1, 0] };
}

// ── Screen flashes ──
// ONE shared full-stage white layer serves the hit's flash and the lightning's.

export type DailyBreachFlash = { atMs: number; peak: number; decayMs: number };

/** The full-screen white flashes a tier plays, on the breach clock. 'open' has none. */
export function dailyBreachFlashes(tier: DailyBreachTier): DailyBreachFlash[] {
  if (tier === 'hit') return [{ atMs: 0, peak: 0.18, decayMs: 200 }];
  if (tier === 'smash') {
    return DAILY_BREACH_LIGHTNING.boltAtMs.map((atMs) => ({
      atMs,
      peak: DAILY_BREACH_LIGHTNING.flashPeak,
      decayMs: DAILY_BREACH_LIGHTNING.flashDecayMs,
    }));
  }
  return [];
}

/** The flash layer's opacity at clock `t`: the strongest flash still decaying (each falls linearly). */
export function dailyBreachFlashOpacity(flashes: readonly DailyBreachFlash[], t: number): number {
  let opacity = 0;
  for (const f of flashes) {
    if (t < f.atMs || t > f.atMs + f.decayMs) continue;
    opacity = Math.max(opacity, f.peak * (1 - (t - f.atMs) / f.decayMs));
  }
  return opacity;
}

/** dailyBreachFlashOpacity as keyframes over the breach clock (ms). Exact for flashes that share one peak and decay. */
export function dailyBreachFlashKeyframes(flashes: readonly DailyBreachFlash[]): DailyBreachKeyframes {
  const times = new Set<number>([0]);
  for (const f of flashes) {
    if (f.atMs > 0.5) times.add(f.atMs - 0.5);
    times.add(f.atMs);
    times.add(f.atMs + f.decayMs);
  }
  const inputRange = [...times].sort((a, b) => a - b);
  return { inputRange, outputRange: inputRange.map((t) => dailyBreachFlashOpacity(flashes, t)) };
}

/**
 * PHOTOSENSITIVITY (Pete, 2026-11-04). The smash is the most the breach may
 * flash: its two bolt flashes (0.5 each) plus the gold hit's white wash peak,
 * all inside about 700 ms. That is the maximum Pete accepted: no more than
 * THREE flashes in any one second. Do not add any further full-screen flash to
 * any tier.
 */
export const DAILY_BREACH_FLASH_LIMIT = { maxFlashes: 3, windowMs: 1000 } as const;

/** Flashes a tier plays in its window: its screen flashes plus the gold hit's white wash (if it has one). */
export function dailyBreachFlashCount(tier: DailyBreachTier): number {
  const whitePeak = Math.max(...DAILY_GOLD_HIT_TIERS[tier].keyframes.white);
  return dailyBreachFlashes(tier).length + (whitePeak > 0 ? 1 : 0);
}

// ── Splinters (smash) and dust (hit and smash) ──
// Precomputed per-particle parameters from fixed seeds; the stage drives them
// from one clock with native-driver transforms, and mounts them only while a
// breach plays.

export const DAILY_BREACH_SPLINTERS = {
  count: 26,
  widthPt: [4, 10],
  heightPt: [16, 46],
  colors: ['#3F2787', '#3A2380', '#1C0A2E', '#2B1A5E'],
  /** A few are gold. */
  gold: '#E0B030',
  goldChance: 0.12,
  /** Thrown from around the hole: within +/- this of its centre. */
  spawnPt: { x: 30, y: 24 },
  speedPtPerS: [180, 520],
  gravityPtPerS2: 1300,
  kickUpPtPerS: 120,
  spinDegPerS: 700,
  fadeMs: 1000,
  sampleMs: 50,
} as const;

export type DailyBreachSplinter = {
  /** Spawn offset from the hole centre. */
  dx: number;
  dy: number;
  width: number;
  height: number;
  color: string;
  vx: number;
  vy: number;
  spinDegPerS: number;
  startDeg: number;
};

export function dailyBreachSplinters(
  seed: number = DAILY_BREACH_SEEDS.splinters,
  count: number = DAILY_BREACH_SPLINTERS.count,
): DailyBreachSplinter[] {
  const S = DAILY_BREACH_SPLINTERS;
  const rng = createSeededRng(seed);
  return Array.from({ length: count }, () => {
    const angle = rng() * 2 * Math.PI;
    const speed = between(S.speedPtPerS, rng());
    const color = rng() < S.goldChance ? S.gold : S.colors[Math.floor(rng() * S.colors.length) % S.colors.length];
    return {
      dx: (rng() * 2 - 1) * S.spawnPt.x,
      dy: (rng() * 2 - 1) * S.spawnPt.y,
      width: between(S.widthPt, rng()),
      height: between(S.heightPt, rng()),
      color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - S.kickUpPtPerS,
      spinDegPerS: (rng() * 2 - 1) * S.spinDegPerS,
      startDeg: rng() * 360,
    };
  });
}

/** A splinter's flight over the breach clock (ms), sampled: offset from the hole centre, spin, fade. */
export function dailyBreachSplinterKeyframes(p: DailyBreachSplinter): {
  inputRange: number[];
  x: number[];
  y: number[];
  rotateDeg: number[];
  opacity: number[];
} {
  const S = DAILY_BREACH_SPLINTERS;
  const inputRange: number[] = [];
  const x: number[] = [];
  const y: number[] = [];
  const rotateDeg: number[] = [];
  const opacity: number[] = [];
  for (let ms = 0; ms <= S.fadeMs; ms += S.sampleMs) {
    const t = ms / 1000;
    inputRange.push(ms);
    x.push(p.dx + p.vx * t);
    y.push(p.dy + p.vy * t + 0.5 * S.gravityPtPerS2 * t * t);
    rotateDeg.push(p.startDeg + p.spinDegPerS * t);
    opacity.push(1 - ms / S.fadeMs);
  }
  return { inputRange, x, y, rotateDeg, opacity };
}

export const DAILY_BREACH_DUST = {
  smash: { count: 9, spreadPt: { x: 40, y: 26 } },
  /** At the plaque's handoff, where it hits the shut gate (215, 342). */
  hit: { count: 7, spreadPt: { x: 30, y: 12 }, at: DAILY_CASTLE_FLIGHT.handoff },
  sizePt: [26, 60],
  risePt: 34,
  scale: [0.6, 1.7],
  fadeMs: 700,
  /** Each puff: a radial gradient of this colour, peakOpacity at the centre, 0 at fadeOffset. */
  color: 'rgb(210,195,235)',
  peakOpacity: 0.55,
  fadeOffset: 0.7,
} as const;

export type DailyBreachDustPuff = { dx: number; dy: number; size: number };

/** The dust puffs for a tier, as offsets from their centre (the hole for 'smash', the handoff for 'hit'). */
export function dailyBreachDust(tier: 'hit' | 'smash'): DailyBreachDustPuff[] {
  const D = DAILY_BREACH_DUST;
  const { count, spreadPt } = D[tier];
  const rng = createSeededRng(tier === 'hit' ? DAILY_BREACH_SEEDS.dustHit : DAILY_BREACH_SEEDS.dustSmash);
  return Array.from({ length: count }, () => ({
    dx: (rng() * 2 - 1) * spreadPt.x,
    dy: (rng() * 2 - 1) * spreadPt.y,
    size: between(D.sizePt, rng()),
  }));
}

/** Every puff's rise, growth and fade over the breach clock (ms): eased out, so it billows then drifts. */
export function dailyBreachDustKeyframes(): {
  inputRange: number[];
  rise: number[];
  scale: number[];
  opacity: number[];
} {
  const D = DAILY_BREACH_DUST;
  const steps = 8;
  const inputRange: number[] = [];
  const rise: number[] = [];
  const scale: number[] = [];
  const opacity: number[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const eased = 1 - (1 - u) * (1 - u);
    inputRange.push(D.fadeMs * u);
    rise.push(-D.risePt * eased);
    scale.push(D.scale[0] + (D.scale[1] - D.scale[0]) * eased);
    opacity.push(1 - u);
  }
  return { inputRange, rise, scale, opacity };
}

/** How long a tier's effects run on the breach clock (ms); the particles unmount after it. */
export function dailyBreachEffectsMs(tier: DailyBreachTier): number {
  if (tier === 'open') return 0;
  const flashEnd = Math.max(0, ...dailyBreachFlashes(tier).map((f) => f.atMs + f.decayMs));
  if (tier === 'hit') return Math.max(DAILY_BREACH_DUST.fadeMs, flashEnd);
  const boltEnd = DAILY_BREACH_LIGHTNING.boltAtMs[1] + DAILY_BREACH_LIGHTNING.boltMs + 1;
  return Math.max(DAILY_BREACH_SPLINTERS.fadeMs, DAILY_BREACH_DUST.fadeMs, flashEnd, boltEnd);
}
