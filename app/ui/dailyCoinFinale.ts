// The win's gold-coin finale. RN-free so the timing and geometry run under
// node (dailyCoinFinale.test.ts).
//
// LOCKED (Pete, device-approved 2026-09-29): timing, keyframes, geometry and
// colours. Don't change them without Pete reopening it.
//
// The gold coin rises out of the floor with the last gate drop (unchanged,
// DailyFloorCoins), rests a beat, then leaves the floor and flies at the
// player: it grows, turns its face to the camera, overshoots once at hero
// size and settles, catches one glint, holds, and goes. Results waits for it.
//
// The floor art (coin_gold.png) is the coin seen from above at the floor's
// angle: its face squashed to FACE_RATIO, the feather painted upright on it.
// Stretching that art face-on would stretch the feather ~1.9x, so the hero is
// the same coin drawn face-on (DailyCoinFinale.tsx) from the build script's
// own recipe. Turned back to the floor's angle — the disc squashed to
// FACE_RATIO, the feather scaled by the same factor, the edge showing below —
// it matches the floor art, which is where the flight takes over from it.
//
// One progress value runs through fixed steps; every layer reads it through
// the keyframes below:
//   0 landed on the floor  → 1 lift-off (end of the floor hold)
//   → 2 arrival at hero size (the overshoot's peak) → 3 settled
//   → 4 end of the hero hold → 5 gone (Results comes up).

import {
  DAILY_CASTLE_OPENING,
  resolveDailyGoldCoin,
  type DailyCastleFrame,
} from './dailyCastleScene';

export const DAILY_COIN_FINALE_STEPS = { landed: 0, liftOff: 1, arrived: 2, settled: 3, held: 4, gone: 5 } as const;

/**
 * `full`: the flight. `calm` (Reduce Motion): no flight, no turn, no
 * overshoot — the floor coin fades out as the hero fades in, in place.
 */
export const DAILY_COIN_FINALE = {
  full: {
    /** Resting on the floor after the rise, before lift-off. */
    floorHoldMs: 300,
    /** Floor to hero size, turning face-on. */
    flightMs: 520,
    /** The overshoot back to hero size. */
    settleMs: 200,
    /** Hero hold after the settle; the glint runs at its start. */
    holdMs: 800,
    exitMs: 220,
  },
  calm: {
    floorHoldMs: 300,
    /** The crossfade from the floor coin to the hero. */
    flightMs: 360,
    settleMs: 0,
    holdMs: 900,
    exitMs: 220,
  },
} as const;

export type DailyCoinFinaleMode = keyof typeof DAILY_COIN_FINALE;

/** The one glint across the settled hero, from the start of the hold. */
export const DAILY_COIN_GLINT_MS = 440;
/** Peak scale at arrival, over hero size: one restrained overshoot. */
export const DAILY_COIN_OVERSHOOT = 1.06;
/** The scene behind the hero dims to this, so the coin reads as foreground. */
export const DAILY_COIN_VEIL = 0.42;

/**
 * The coin as tools/art/build_daily_coins.py draws it, as fractions of its
 * width. FACE_RATIO is the floor's viewing angle (face height / width);
 * EDGE_FRAC the edge showing below the face at that angle.
 */
export const DAILY_COIN_FACE = {
  ratio: 0.53,
  edge: 0.09,
  ring: 0.055,
  /** Feather height / face height (the script's feather_frac). */
  feather: 0.74,
  /** The feather sits this fraction of its height above centre. */
  featherLift: 0.04,
  /** Its drop shadow, offset right and down: 2 and 3 px on the 300 px coin. */
  featherShadow: { x: 2 / 300, y: 3 / 300, opacity: 0.5 },
  /** feather-gold-reward.png is 128 px square; its alpha box is x 18–104, y 0–126. */
  featherArt: { size: 128, boxLeft: 18, boxRight: 104, boxHeight: 127 },
} as const;

/**
 * The gold coin's colours, from the same script: brand gold (#F5C842) ring lit
 * 1.15 → 0.86 top to bottom, amber edge shaded to its sides, midnight enamel
 * from FACE_CENTRE to FACE_RIM, and the feather's shadow.
 */
export const DAILY_COIN_COLORS = {
  ringTop: '#FFE64C',
  ringBottom: '#D3AC39',
  edgeCentre: '#C8920E',
  edgeSide: '#9D740E',
  faceCentre: '#2E2458',
  faceRim: '#0E0B20',
  shadow: '#05040C',
  glint: 'rgba(255,247,214,0.72)',
  glintClear: 'rgba(255,247,214,0)',
} as const;

/** The disc's tilt away from face-on at the floor's angle (cos = FACE_RATIO). */
const FLOOR_TILT = Math.acos(DAILY_COIN_FACE.ratio);
/**
 * The coin's thickness as a fraction of its width, so that at the floor's
 * tilt it shows exactly EDGE_FRAC of edge below the face.
 */
export const DAILY_COIN_THICKNESS = DAILY_COIN_FACE.edge / Math.sin(FLOOR_TILT);

/** Hero diameter: large, but never more than a third of a short screen. */
export const DAILY_COIN_HERO = {
  widthFrac: 0.62,
  heightFrac: 0.32,
  maxSize: 280,
  /** Clear of the top inset by at least this much. */
  topMargin: 12,
} as const;

export function dailyCoinFinaleTimings(mode: DailyCoinFinaleMode) {
  return DAILY_COIN_FINALE[mode];
}

/**
 * The floor hold, from the gold coin landing. Never shorter than the mode's
 * hold, and long enough that lift-off waits for the castle's gold hit to end:
 * the hero never competes with it. Under Reduce Motion the coin lands while
 * the calm gold hit is still fading, so the wait matters there.
 */
export function dailyCoinFinaleFloorHoldMs(
  mode: DailyCoinFinaleMode,
  landedAfterClaimMs: number,
  goldHitMs: number,
): number {
  return Math.max(DAILY_COIN_FINALE[mode].floorHoldMs, goldHitMs - landedAfterClaimMs);
}

/** From landing to the hero arriving: the reward chime and Success haptic. */
export function dailyCoinFinaleArrivalMs(mode: DailyCoinFinaleMode, floorHoldMs: number): number {
  return floorHoldMs + DAILY_COIN_FINALE[mode].flightMs;
}

/** From landing to the finale being gone: Results may come up. */
export function dailyCoinFinaleTotalMs(mode: DailyCoinFinaleMode, floorHoldMs: number): number {
  const t = DAILY_COIN_FINALE[mode];
  return floorHoldMs + t.flightMs + t.settleMs + t.holdMs + t.exitMs;
}

/**
 * Where the finale's progress rests once a correct claim's presentation is
 * over. After a win it stays at gone, so the floor coin the hero took over
 * never reappears behind Results; any other claim leaves it at rest.
 */
export function dailyCoinFinaleRestingStep(sessionStatus: string | null | undefined): number {
  return sessionStatus === 'won' ? DAILY_COIN_FINALE_STEPS.gone : DAILY_COIN_FINALE_STEPS.landed;
}

/**
 * Whether a session change returns the finale to rest (0, floor coin shown):
 * only a session in play, whose gold coin is still sunk out of sight.
 */
export function dailyCoinFinaleResetsFor(sessionStatus: string | null | undefined): boolean {
  return sessionStatus === 'active';
}

export type DailyCoinFinaleGeometry = {
  /** Screen centre of the floor coin's face. */
  start: { x: number; y: number };
  /** Screen centre of the hero. */
  hero: { x: number; y: number };
  /** Hero diameter in screen points. */
  size: number;
  /** Scale at which the hero is exactly the floor coin's width. */
  startScale: number;
};

/**
 * Where the flight starts and ends on this phone. The hero is centred in the
 * castle door, framed by the arch, and kept whole below the top inset.
 */
export function resolveDailyCoinFinaleGeometry(
  frame: DailyCastleFrame,
  windowWidth: number,
  windowHeight: number,
  topInset = 0,
): DailyCoinFinaleGeometry {
  const coin = resolveDailyGoldCoin();
  const faceHeight = coin.width * DAILY_COIN_FACE.ratio;
  const start = {
    x: (coin.x + coin.width / 2) * frame.scale,
    y: frame.top + (coin.y + faceHeight / 2) * frame.scale,
  };
  const h = DAILY_COIN_HERO;
  const size = Math.min(windowWidth * h.widthFrac, windowHeight * h.heightFrac, h.maxSize);
  const doorCentreY = frame.top + (DAILY_CASTLE_OPENING.y + DAILY_CASTLE_OPENING.height / 2) * frame.scale;
  const hero = {
    x: windowWidth / 2,
    y: Math.max(doorCentreY, topInset + h.topMargin + size / 2),
  };
  return { start, hero, size, startScale: (coin.width * frame.scale) / size };
}

export type DailyCoinFinaleChannel = { input: number[]; output: number[] };

export type DailyCoinFinaleKeyframes = {
  /**
   * The floor coin (DailyFloorCoins). Once the hero has taken over it never
   * comes back: gone (5) leaves the floor empty behind Results (Pete,
   * 2026-09-29). The screen holds the value at gone after a win and returns
   * it to 0 only when a new session starts, with the gold coin sunk.
   */
  floor: DailyCoinFinaleChannel;
  /** The hero coin. */
  hero: DailyCoinFinaleChannel;
  /** 0 at the floor coin, 1 at the hero's place. */
  travel: DailyCoinFinaleChannel;
  /** The hero's scale; 1 is hero size. */
  scale: DailyCoinFinaleChannel;
  /** Face foreshortening: FACE_RATIO at the floor's angle, 1 face-on. */
  tilt: DailyCoinFinaleChannel;
  /** Edge showing below the face, as a fraction of the hero's width. */
  edge: DailyCoinFinaleChannel;
  /** The soft gold glow behind the hero. */
  glow: DailyCoinFinaleChannel;
  /** The dim over the scene. */
  veil: DailyCoinFinaleChannel;
  /** The glint's position across the face: -1 off the left, 1 off the right. */
  glintX: DailyCoinFinaleChannel;
  glintOpacity: DailyCoinFinaleChannel;
};

const S = DAILY_COIN_FINALE_STEPS;

/**
 * Keyframes for the finale's progress value. `startScale` comes from
 * resolveDailyCoinFinaleGeometry; `glint` is false under Reduce Motion or
 * Reduce Flashes, and the hero keeps its gold and glow without it.
 */
export function dailyCoinFinaleKeyframes(
  mode: DailyCoinFinaleMode,
  startScale: number,
  glint: boolean,
): DailyCoinFinaleKeyframes {
  const off: DailyCoinFinaleChannel = { input: [S.landed, S.gone], output: [0, 0] };
  const veil: DailyCoinFinaleChannel = {
    input: [S.landed, S.liftOff, S.arrived, S.held, S.gone],
    output: [0, 0, DAILY_COIN_VEIL, DAILY_COIN_VEIL, 0],
  };

  if (mode === 'calm') {
    // In place, face-on, no overshoot: a crossfade, then the same hold.
    return {
      floor: { input: [S.landed, S.liftOff, S.arrived, S.gone], output: [1, 1, 0, 0] },
      hero: { input: [S.landed, S.liftOff, S.arrived, S.held, S.gone], output: [0, 0, 1, 1, 0] },
      travel: { input: [S.landed, S.gone], output: [1, 1] },
      scale: { input: [S.landed, S.gone], output: [1, 1] },
      tilt: { input: [S.landed, S.gone], output: [1, 1] },
      edge: off,
      glow: { input: [S.landed, S.liftOff, S.arrived, S.held, S.gone], output: [0, 0, 0.75, 0.75, 0] },
      veil,
      glintX: { input: [S.landed, S.gone], output: [-1, -1] },
      glintOpacity: off,
    };
  }

  // The turn: the tilt eases from the floor's angle to face-on over the
  // flight. Sampled so linear interpolation between samples stays smooth.
  const turnSteps = [0, 0.25, 0.5, 0.75, 1];
  const turnInput = turnSteps.map((u) => S.liftOff + u * (S.arrived - S.liftOff));
  const tiltAt = (u: number) => FLOOR_TILT * (1 - u);
  // The hand-off: the hero takes over from the floor art in the first frames
  // of the flight, at the same place, size and angle.
  const handoff = S.liftOff + 0.04;
  const glintEnd = S.settled + DAILY_COIN_GLINT_MS / DAILY_COIN_FINALE.full.holdMs;
  const glintIn = S.settled + (glintEnd - S.settled) * 0.15;
  const glintOut = S.settled + (glintEnd - S.settled) * 0.85;

  return {
    floor: { input: [S.landed, S.liftOff, handoff, S.gone], output: [1, 1, 0, 0] },
    hero: { input: [S.landed, S.liftOff, handoff, S.held, S.gone], output: [0, 0, 1, 1, 0] },
    travel: { input: [S.landed, S.liftOff, S.arrived, S.gone], output: [0, 0, 1, 1] },
    // Coming at the camera it grows late: a third of the way at mid-flight.
    scale: {
      input: [S.landed, S.liftOff, (S.liftOff + S.arrived) / 2, S.arrived, S.settled, S.held, S.gone],
      output: [
        startScale,
        startScale,
        startScale + (1 - startScale) * 0.3,
        DAILY_COIN_OVERSHOOT,
        1,
        1,
        0.97,
      ],
    },
    tilt: {
      input: [S.landed, ...turnInput, S.gone],
      output: [DAILY_COIN_FACE.ratio, ...turnSteps.map((u) => Math.cos(tiltAt(u))), 1],
    },
    edge: {
      input: [S.landed, ...turnInput, S.gone],
      output: [DAILY_COIN_FACE.edge, ...turnSteps.map((u) => DAILY_COIN_THICKNESS * Math.sin(tiltAt(u))), 0],
    },
    glow: {
      input: [S.landed, S.liftOff, (S.liftOff + S.arrived) / 2, S.arrived, S.settled, S.held, S.gone],
      output: [0, 0, 0.15, 0.9, 0.75, 0.75, 0],
    },
    veil,
    glintX: glint ? { input: [S.settled, glintEnd], output: [-1, 1] } : { input: [S.landed, S.gone], output: [-1, -1] },
    glintOpacity: glint
      ? { input: [S.landed, S.settled, glintIn, glintOut, glintEnd, S.gone], output: [0, 0, 1, 1, 0, 0] }
      : off,
  };
}
