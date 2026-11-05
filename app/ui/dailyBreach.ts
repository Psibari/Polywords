import {
  resolveDailyCelebrationGrade,
  type DailyCelebrationGrade,
} from '../game/dailyClaimPresentation';
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

/** How long Polly's tier move and its hold run. 'open' has none; Reduce Motion has none for any tier. */
export function dailyBreachPollyMoveMs(tier: DailyBreachTier, motion: boolean): DailyBreachPollyMove {
  if (!motion || tier === 'open') return { moveMs: 0, holdMs: 0 };
  if (tier === 'hit') {
    return { moveMs: sumMs(DAILY_BREACH_POLLY_HIT_MOVE_SEGMENTS_MS), holdMs: DAILY_BREACH_POLLY_HIT_HOLD_MS };
  }
  return { moveMs: sumMs(DAILY_BREACH_POLLY_SMASH_MOVE_SEGMENTS_MS), holdMs: DAILY_BREACH_POLLY_SMASH_HOLD_MS };
}
