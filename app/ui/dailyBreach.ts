import {
  resolveDailyCelebrationGrade,
  type DailyCelebrationGrade,
} from '../game/dailyClaimPresentation';
import { createSeededRng } from '../game/seededRandom';
import { DAILY_CASTLE_FLIGHT } from './dailyCastleScene';

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
