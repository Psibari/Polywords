import { Animated, Dimensions, Easing } from 'react-native';
import { playSfx, type SfxName } from '../audio/sfx';

// A single shared animation channel for shaking the stone wall.
//
// The wall lives in GraphicGround, which sits behind Home, Daily, the
// Polybook, Settings and every Hunt round. The boss gauntlet lives inside
// MaskBoard's subtree. They are siblings with no common owner short of the
// screen itself, so threading a shake down as a prop would push a boss-round
// concern through AmbientSkyBackground — a component four other screens share
// and that has no business knowing the gauntlet exists. A module-level channel
// keeps the coupling to one import on each side.
//
// Nothing here is audio. The wall is silent this pass.

// Amplitude ceilings, in points, and deliberately small: this is a stone wall
// taking strain, not a screen shake.
export const WALL_TREMBLE_AMP = 2.5;
export const WALL_KICK_AMP = 4;

// One kick, start to still.
export const WALL_KICK_MS = 180;

// Samples per cycle in the zigzag below. Eight is enough that the straight
// lines between points read as a smooth swing rather than a triangle wave.
const SAMPLES_PER_CYCLE = 8;
// A wall rattles further across than it does up.
const VERTICAL_RATIO = 0.7;

// How a swing's amplitude changes across its animation: t in 0..1, 0..1 out.
// Every envelope MUST be exactly 0 at t = 1 — see below. Both are exported
// only so that invariant can be checked numerically.
type Envelope = (t: number) => number;

/** An impact: full at once, dying away to nothing. The kick uses this. */
export function decayingEnvelope(t: number): number {
  return 1 - t;
}

// Where the tremble's pressure peaks, as a fraction of the lead-in. Late on
// purpose: it gathers across most of the lead-in, then falls to zero in the
// last sliver — which ends on the very frame the first brick tears out, so
// that brick's kick covers the handoff and the drop is never seen.
const TREMBLE_PEAK = 0.88;

/**
 * Pressure building toward the break: rises to full at TREMBLE_PEAK, then
 * back to exactly 0 by t = 1. The tremble uses this.
 */
export function buildingEnvelope(t: number): number {
  return t < TREMBLE_PEAK ? t / TREMBLE_PEAK : (1 - t) / (1 - TREMBLE_PEAK);
}

// Both values are consumed as OSCILLATION, not as displacement: the driving
// timing is plain linear 0 -> 1 and every bit of the shape lives here, in a
// zigzag output range scaled by an envelope. That keeps the driver trivial
// and native-driver safe, and it gives one useful guarantee — the OUTPUT is
// exactly 0 at BOTH ends, so a value resting at 0 or at 1 leaves the wall
// perfectly still. Only an interrupted animation can strand a non-zero value,
// which is what resetWallShake is for.
//
// The two ends are guaranteed differently. At t = 0 the sine does it for any
// envelope (sin 0 = 0), which is why the kick's envelope can start at full
// strength. At t = 1 only the ENVELOPE can: every envelope MUST be exactly 0
// there, which is why the tremble's rising envelope turns back down instead
// of finishing at full strength. The sine happens to cross zero at t = 1 with
// today's whole-number cycle counts, so a plain ramp would get away with it —
// right up until someone retunes a cycle count to 5.25, and every run then
// strands a full-amplitude offset.
function envelopedOscillation(
  amp: number,
  cycles: number,
  invert: boolean,
  envelope: Envelope,
) {
  const samples = Math.round(cycles * SAMPLES_PER_CYCLE);
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const swing = amp * envelope(t) * Math.sin(2 * Math.PI * cycles * t);
    inputRange.push(t);
    outputRange.push(invert ? -swing : swing);
  }
  return { inputRange, outputRange };
}

/** 0..1, drives the lead-in rattle, building toward the first brick's break. */
export const wallTremble = new Animated.Value(0);
/** 0..1, drives the sharp jolt as a brick tears out. */
export const wallKick = new Animated.Value(0);

// Different cycle counts per axis, and one axis inverted, so the wall never
// travels along a clean diagonal — that reads as a slide, not a shake.
// The tremble BUILDS, the kick DECAYS: a lead-in gathers pressure and hands
// off to the break, while a kick is an impact and impacts die away.
const trembleX = wallTremble.interpolate(
  envelopedOscillation(WALL_TREMBLE_AMP, 5, false, buildingEnvelope),
);
const trembleY = wallTremble.interpolate(
  envelopedOscillation(WALL_TREMBLE_AMP * VERTICAL_RATIO, 6, true, buildingEnvelope),
);
const kickX = wallKick.interpolate(
  envelopedOscillation(WALL_KICK_AMP, 3, true, decayingEnvelope),
);
const kickY = wallKick.interpolate(
  envelopedOscillation(WALL_KICK_AMP * VERTICAL_RATIO, 2, false, decayingEnvelope),
);

// ── Momentum strain: a continuous vibration that builds with the Hunt tier ──
//
// Separate from the tremble and kick above, which are one-shots for the boss
// gauntlet. Strain is driven from the Hunt screen by setWallStrain(tier) and
// runs for as long as the tier holds. It rides in the same composed offset, so
// the wall, and any brick still seated in it, move together.
//
// Every number a phone pass is likely to retune lives in this block.
// Tier index: 0 steady (and HUNTED: still), 1 sharp, 2 razor sharp, 3 untrappable.
export type WallStrainTier = 0 | 1 | 2 | 3;
/** Peak sideways offset in points. Index 0 is a still wall. */
export const WALL_STRAIN_AMP: readonly number[] = [0, 0.6, 1.4, 2.4];
/** The largest strain offset, for sizing the edge backdrop. */
export const WALL_STRAIN_MAX_AMP = 2.4;
/** One full loop of the vibration, in ms. Shorter is quicker. */
export const WALL_STRAIN_LOOP_MS: readonly number[] = [0, 600, 420, 300];
/** How fast the vibration swells into a new tier, and dies away on a drop. */
export const WALL_STRAIN_RAMP_MS = 450;
export const WALL_STRAIN_FADE_OUT_MS = 140;
// Cycles per loop on each axis. Different counts, one axis inverted, so the
// wall never travels a clean diagonal (same reason as the tremble above).
const STRAIN_CYCLES_X = 3;
const STRAIN_CYCLES_Y = 4;
const constantEnvelope: Envelope = () => 1;

/** 0..1 looping phase of the vibration. */
export const wallStrainPhase = new Animated.Value(0);
/** Current vibration amplitude in points, 0 when still. */
export const wallStrainLevel = new Animated.Value(0);

// The oscillation is unit amplitude and integer-cycle, so it is exactly 0 at
// both ends of the loop. The amplitude comes from wallStrainLevel, which means
// a still wall (level 0) is still whatever phase the loop happens to be in.
const strainX = Animated.multiply(
  wallStrainPhase.interpolate(
    envelopedOscillation(1, STRAIN_CYCLES_X, false, constantEnvelope),
  ),
  wallStrainLevel,
);
const strainY = Animated.multiply(
  wallStrainPhase.interpolate(
    envelopedOscillation(VERTICAL_RATIO, STRAIN_CYCLES_Y, true, constantEnvelope),
  ),
  wallStrainLevel,
);

const shakeX = Animated.add(Animated.add(trembleX, kickX), strainX);
const shakeY = Animated.add(Animated.add(trembleY, kickY), strainY);

/**
 * The composed shake as a raw pair of offsets, in points. Use this when a
 * consumer has to ADD the shake to a translate of its own (a brick still
 * seated in the wall carries its own flight translate). Everyone else should
 * use wallShakeTransform, so the oscillation is derived in exactly one place.
 *
 * `seated` scales the whole thing, for a consumer that is only partly part of
 * the wall.
 */
export function wallShakeOffset(seated?: Animated.AnimatedInterpolation<number>) {
  return seated
    ? { x: Animated.multiply(shakeX, seated), y: Animated.multiply(shakeY, seated) }
    : { x: shakeX, y: shakeY };
}

/** The composed shake as a ready transform pair, so no consumer re-derives it. */
export function wallShakeTransform(seated?: Animated.AnimatedInterpolation<number>) {
  const { x, y } = wallShakeOffset(seated);
  return [{ translateX: x }, { translateY: y }];
}

let trembleAnim: Animated.CompositeAnimation | null = null;
let kickAnim: Animated.CompositeAnimation | null = null;

/** Runs the lead-in tremble 0 -> 1 over `durationMs`. */
export function rumbleWall(durationMs: number): void {
  trembleAnim?.stop();
  wallTremble.setValue(0);
  trembleAnim = Animated.timing(wallTremble, {
    toValue: 1,
    duration: durationMs,
    easing: Easing.linear,
    useNativeDriver: true,
  });
  trembleAnim.start();
}

/** Runs one brick's jolt 0 -> 1 over WALL_KICK_MS. */
export function kickWall(): void {
  kickAnim?.stop();
  wallKick.setValue(0);
  kickAnim = Animated.timing(wallKick, {
    toValue: 1,
    duration: WALL_KICK_MS,
    easing: Easing.linear,
    useNativeDriver: true,
  });
  kickAnim.start();
}

/**
 * Both values back to 0, stopping anything in flight. EVERY consumer must call
 * this on unmount: these values outlive the components that read them, and an
 * animation interrupted part-way through would otherwise leave the wall
 * sitting visibly crooked on Home.
 */
export function resetWallShake(): void {
  trembleAnim?.stop();
  kickAnim?.stop();
  trembleAnim = null;
  kickAnim = null;
  wallTremble.setValue(0);
  wallKick.setValue(0);
}

let strainLoop: Animated.CompositeAnimation | null = null;
let strainTier: WallStrainTier = 0;
let strainStopTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Sets the momentum vibration to a tier. 0 fades the wall to still. Calling
 * with the tier already set does nothing, so it is safe to call from an effect.
 */
export function setWallStrain(tier: WallStrainTier): void {
  if (tier === strainTier) return;
  strainTier = tier;
  if (strainStopTimer !== null) {
    clearTimeout(strainStopTimer);
    strainStopTimer = null;
  }
  if (tier === 0) {
    Animated.timing(wallStrainLevel, {
      toValue: 0,
      duration: WALL_STRAIN_FADE_OUT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    // Stop the loop only once the level has reached 0, so no offset is left.
    strainStopTimer = setTimeout(() => {
      strainStopTimer = null;
      strainLoop?.stop();
      strainLoop = null;
      wallStrainPhase.setValue(0);
    }, WALL_STRAIN_FADE_OUT_MS + 40);
    return;
  }
  // A new loop length restarts the phase at 0, where the oscillation is 0, so
  // a change of tier moves the wall by at most the previous tier's offset.
  strainLoop?.stop();
  wallStrainPhase.setValue(0);
  strainLoop = Animated.loop(
    Animated.timing(wallStrainPhase, {
      toValue: 1,
      duration: WALL_STRAIN_LOOP_MS[tier],
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  );
  strainLoop.start();
  Animated.timing(wallStrainLevel, {
    toValue: WALL_STRAIN_AMP[tier],
    duration: WALL_STRAIN_RAMP_MS,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start();
}

// ── Fell-off: the wall falls away from you, then zips back ──
//
// A chain that breaks from 1.5x or higher drops the wall away, as if you were
// looking down at it falling, and a beat later it snaps back to full size. The
// foreground never moves for it. Driven from the Hunt screen by fallWall(severity).
//
// How it is drawn, and why: the real wall in GraphicGround is ALWAYS a plain,
// untransformed image, so its resting layout is exactly what it was before this
// existed. While a fall plays, GraphicGround mounts an overlay on top of it
// (subscribeWallFall): a darkened, enlarged copy of the stone for the pit, with
// a second copy of the wall scaled down in front. At scale 1 that copy covers
// the real wall exactly, so the overlay appears and disappears without a seam.
// The two values below are plain Animated.Values that rest at their rest value,
// with no interpolation in the chain, so there is nothing to evaluate wrongly
// before the first animation. An earlier version hid the wall at rest behind an
// interpolated scale and the wall vanished on device (2026-10-28).
//
// The wall is scaled here, which GraphicGround's no-scaling rule otherwise
// forbids (the gauntlet's bricks are aligned to the ledge line). That is safe
// because this only ever fires from game.fellOffSeverity, and a wrong swipe on
// a gauntlet tile never sets that (resolveMysteryTile ends the gauntlet as
// haunted without touching it), so it cannot run while the bricks are out.
//
// Every number a phone pass is likely to retune lives in this block.
// ALL OF THESE ARE TEST VALUES for the 2026-11-02 device pass. The idea is a
// CAMERA: the background falls far down a hole (accelerating), hits the bottom,
// stops and shakes, waits a beat, then the camera falls after it, carrying the
// HUD, book and cards, and lands on top of it. Everything ends exactly where it
// started; it only looks like we fell. The cues: the wall growing back toward
// you, the hole's stone sides rushing past, and a quick landing squash on the
// foreground. Nothing eases back UP.
/** How far the wall falls away, by severity 1 / 2 / 3 (0.55 = down to 45%). */
export const WALL_FALL_DEPTH_BY_SEVERITY: readonly number[] = [0.25, 0.4, 0.55];
/** The fall: accelerates away into the hole (ease-in), so it reads as falling. */
export const WALL_FALL_DROP_MS = 300;
/** The crash shake at the bottom: this many kicks, this far apart. */
export const WALL_FALL_CRASH_KICKS = 3;
export const WALL_FALL_CRASH_KICK_GAP_MS = 70;
/** A beat at the bottom before everything catches up. */
export const WALL_FALL_BEAT_MS = 220;
/** The catch-up: the view dives down to the wall (ease-in, so it lands hard). */
export const WALL_FALL_CATCH_UP_MS = 260;
/** From the start of the animation, when the wall hits the bottom. */
export const WALL_FALL_CRASH_AT_MS = WALL_FALL_DROP_MS;
/** From the start of the animation, when everything lands at normal size. */
export const WALL_FALL_RECONNECT_KICK_AT_MS =
  WALL_FALL_DROP_MS + WALL_FALL_BEAT_MS + WALL_FALL_CATCH_UP_MS;
/**
 * Safety net only: the overlay is force-removed this long after a fall starts.
 * The fall normally ends when its animation finishes, so this never cuts a
 * fall short, however busy the JS thread is. It only rescues a fall whose
 * animation never reports back.
 */
export const WALL_FALL_SAFETY_MS = 1500;
/** The hole's stone sides rush outward to this size during the dive. */
export const WALL_FALL_PIT_RUSH_SCALE = 3;
/** The foreground's landing squash: how far it dips, then rebounds, then rests. */
export const FG_LAND_SQUASH_SCALE = 0.965;
export const FG_LAND_SQUASH_Y = 10;
export const FG_LAND_REBOUND_SCALE = 1.015;
export const FG_LAND_REBOUND_Y = -3;
export const FG_LAND_DOWN_MS = 70;
export const FG_LAND_REBOUND_MS = 90;
export const FG_LAND_SETTLE_MS = 90;
/** Darkness laid over the falling wall at full depth, so it recedes into the pit. */
export const WALL_FALL_SHADE_MAX = 0.45;
/** The pit behind the falling wall is the same stone, bigger and darkened. */
export const WALL_FALL_PIT_SCALE = 1.4;
/**
 * Air streaks: pale vertical lines that rush UP past the screen while we fall,
 * once for the wall's drop and once for the camera's dive. They travel one
 * screen height (the streak layer is two screen heights tall), accelerating.
 */
export const WALL_FALL_STREAK_TRAVEL = Dimensions.get('window').height;
const STREAK_FADE_MS = 50;
/**
 * Fall sounds (TEST: existing cues, nothing new). Two falls and two impacts:
 * the wall falls and crashes, then the camera falls and crashes. The whoosh
 * files are 0.84 s and 0.99 s, so they play faster to fit a ~0.3 s fall.
 */
export const WALL_FALL_SFX_BG_FALL: SfxName = 'terraceWhooshCape';
export const WALL_FALL_SFX_BG_CRASH: SfxName = 'stoneLand1';
export const WALL_FALL_SFX_CAM_FALL: SfxName = 'gauntletPick';
export const WALL_FALL_SFX_CAM_CRASH: SfxName = 'polybookThud';
export const WALL_FALL_SFX_BG_FALL_RATE = 1.5;
export const WALL_FALL_SFX_CAM_FALL_RATE = 1.4;
export const WALL_FALL_SFX_BG_FALL_AT_MS = 0;
export const WALL_FALL_SFX_BG_CRASH_AT_MS = WALL_FALL_CRASH_AT_MS;
export const WALL_FALL_SFX_CAM_FALL_AT_MS = WALL_FALL_DROP_MS + WALL_FALL_BEAT_MS;
export const WALL_FALL_SFX_CAM_CRASH_AT_MS = WALL_FALL_RECONNECT_KICK_AT_MS;

/** The falling wall's scale: 1 at rest, 1 - depth at the bottom of the fall. */
export const wallFallScale = new Animated.Value(1);
/** Darkness over the falling wall: 0 at rest. */
export const wallFallShade = new Animated.Value(0);
/** Dark lip around the falling wall's edge: 0 at rest, 1 at full depth. */
export const wallFallRim = new Animated.Value(0);
/** The hole's stone sides: rest size, and they rush outward during the dive. */
export const wallFallPitScale = new Animated.Value(WALL_FALL_PIT_SCALE);
/** The foreground's landing squash (HUD, book and cards move as one block). */
export const fgLandScale = new Animated.Value(1);
export const fgLandY = new Animated.Value(0);
/** Air streaks: layer A rides the wall's drop, layer B the camera's dive. */
export const wallFallStreakAY = new Animated.Value(0);
export const wallFallStreakAOp = new Animated.Value(0);
export const wallFallStreakBY = new Animated.Value(0);
export const wallFallStreakBOp = new Animated.Value(0);

/** Every fall value back to rest. One place, so no reset can miss one. */
function resetFallValues(): void {
  wallFallScale.setValue(1);
  wallFallShade.setValue(0);
  wallFallRim.setValue(0);
  wallFallPitScale.setValue(WALL_FALL_PIT_SCALE);
  fgLandScale.setValue(1);
  fgLandY.setValue(0);
  wallFallStreakAY.setValue(0);
  wallFallStreakAOp.setValue(0);
  wallFallStreakBY.setValue(0);
  wallFallStreakBOp.setValue(0);
}

type FallListener = (falling: boolean) => void;
const fallListeners = new Set<FallListener>();
let fallActive = false;

function setFallActive(next: boolean): void {
  if (fallActive === next) return;
  fallActive = next;
  fallListeners.forEach(listener => listener(next));
}

/** GraphicGround mounts its overlay while this reports true. Returns unsubscribe. */
export function subscribeWallFall(listener: FallListener): () => void {
  fallListeners.add(listener);
  listener(fallActive);
  return () => {
    fallListeners.delete(listener);
  };
}

let fallAnim: Animated.CompositeAnimation | null = null;
let fallKickTimer: ReturnType<typeof setTimeout> | null = null;
let fallCrashTimer: ReturnType<typeof setTimeout> | null = null;
let fallEndTimer: ReturnType<typeof setTimeout> | null = null;
let fallSfxTimers: ReturnType<typeof setTimeout>[] = [];

function clearFallTimers(): void {
  if (fallKickTimer !== null) clearTimeout(fallKickTimer);
  if (fallCrashTimer !== null) clearTimeout(fallCrashTimer);
  if (fallEndTimer !== null) clearTimeout(fallEndTimer);
  fallSfxTimers.forEach(clearTimeout);
  fallSfxTimers = [];
  fallKickTimer = null;
  fallCrashTimer = null;
  fallEndTimer = null;
}

let fallDepth = 0;

/** Ends a fall: wall back to rest, overlay removed. */
function finishFall(): void {
  if (fallEndTimer !== null) clearTimeout(fallEndTimer);
  fallEndTimer = null;
  fallAnim = null;
  resetFallValues();
  setFallActive(false);
}

/**
 * Starts a fall. `severity` is game.fellOffSeverity (1, 2 or 3). This only asks
 * GraphicGround to mount its overlay; the animation itself is started by
 * runWallFallAnimation once that overlay exists and is attached to the values,
 * because a native animation started before its view is attached is not
 * reliable in React Native.
 */
export function fallWall(severity: 1 | 2 | 3): void {
  fallAnim?.stop();
  clearFallTimers();
  fallDepth = WALL_FALL_DEPTH_BY_SEVERITY[severity - 1];
  resetFallValues();
  setFallActive(true);
  // Safety net only (see WALL_FALL_SAFETY_MS). The fall ends when its
  // animation finishes, not on a clock, so it can never be cut short.
  fallEndTimer = setTimeout(() => {
    fallAnim?.stop();
    finishFall();
  }, WALL_FALL_SAFETY_MS);
}

/**
 * Plays the fall. GraphicGround calls this from an effect that runs after its
 * overlay has mounted, so both values already have a view attached.
 */
export function runWallFallAnimation(): void {
  if (!fallActive) {
    return;
  }
  fallAnim?.stop();
  if (fallKickTimer !== null) clearTimeout(fallKickTimer);
  if (fallCrashTimer !== null) clearTimeout(fallCrashTimer);
  // Fall (accelerating) to `bottom`, stop dead, wait a beat, then catch up to
  // `rest` (accelerating again, so it lands hard instead of easing up). Every
  // value runs the same clock.
  const fallSequence = (value: Animated.Value, bottom: number, rest: number) =>
    Animated.sequence([
      Animated.timing(value, {
        toValue: bottom,
        duration: WALL_FALL_DROP_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(WALL_FALL_BEAT_MS),
      Animated.timing(value, {
        toValue: rest,
        duration: WALL_FALL_CATCH_UP_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
  const thisAnim = Animated.parallel([
    fallSequence(wallFallScale, 1 - fallDepth, 1),
    fallSequence(wallFallShade, WALL_FALL_SHADE_MAX, 0),
    fallSequence(wallFallRim, 1, 0),
    // The hole's stone sides rush outward as the camera dives: the classic
    // falling-down-a-shaft cue. They stay opaque, so the wall copy never floats
    // over the real wall.
    Animated.sequence([
      Animated.delay(WALL_FALL_DROP_MS + WALL_FALL_BEAT_MS),
      Animated.timing(wallFallPitScale, {
        toValue: WALL_FALL_PIT_RUSH_SCALE,
        duration: WALL_FALL_CATCH_UP_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]),
    // Air streaks rush up past us: layer A on the wall's drop, layer B on the
    // camera's dive. Each speeds up like the fall itself and fades out at its end.
    Animated.timing(wallFallStreakAY, {
      toValue: -WALL_FALL_STREAK_TRAVEL,
      duration: WALL_FALL_DROP_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.sequence([
      Animated.timing(wallFallStreakAOp, { toValue: 1, duration: STREAK_FADE_MS, useNativeDriver: true }),
      Animated.delay(WALL_FALL_DROP_MS - 2 * STREAK_FADE_MS),
      Animated.timing(wallFallStreakAOp, { toValue: 0, duration: STREAK_FADE_MS, useNativeDriver: true }),
    ]),
    Animated.sequence([
      Animated.delay(WALL_FALL_DROP_MS + WALL_FALL_BEAT_MS),
      Animated.timing(wallFallStreakBY, {
        toValue: -WALL_FALL_STREAK_TRAVEL,
        duration: WALL_FALL_CATCH_UP_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]),
    Animated.sequence([
      Animated.delay(WALL_FALL_DROP_MS + WALL_FALL_BEAT_MS),
      Animated.timing(wallFallStreakBOp, { toValue: 1, duration: STREAK_FADE_MS, useNativeDriver: true }),
      Animated.delay(WALL_FALL_CATCH_UP_MS - 2 * STREAK_FADE_MS),
      Animated.timing(wallFallStreakBOp, { toValue: 0, duration: STREAK_FADE_MS, useNativeDriver: true }),
    ]),
    // The foreground lands with a quick squash, as if it came down with us.
    Animated.sequence([
      Animated.delay(WALL_FALL_RECONNECT_KICK_AT_MS),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(fgLandScale, { toValue: FG_LAND_SQUASH_SCALE, duration: FG_LAND_DOWN_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(fgLandScale, { toValue: FG_LAND_REBOUND_SCALE, duration: FG_LAND_REBOUND_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(fgLandScale, { toValue: 1, duration: FG_LAND_SETTLE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(fgLandY, { toValue: FG_LAND_SQUASH_Y, duration: FG_LAND_DOWN_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(fgLandY, { toValue: FG_LAND_REBOUND_Y, duration: FG_LAND_REBOUND_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(fgLandY, { toValue: 0, duration: FG_LAND_SETTLE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]),
    ]),
  ]);
  fallAnim = thisAnim;
  // Re-arm the safety net from the START of the animation, not the call.
  if (fallEndTimer !== null) clearTimeout(fallEndTimer);
  fallEndTimer = setTimeout(() => {
    fallAnim?.stop();
    finishFall();
  }, WALL_FALL_SAFETY_MS);
  thisAnim.start(({ finished }) => {
    // An unfinished callback means a newer fall or a reset stopped this one;
    // that fall now owns the state, so do nothing.
    if (finished && fallAnim === thisAnim) finishFall();
  });
  // The crash: a short burst of kicks, so it rattles instead of ticking once.
  const crashShake = (kicksLeft: number): void => {
    fallCrashTimer = null;
    kickWall();
    if (kicksLeft > 1) {
      fallCrashTimer = setTimeout(
        () => crashShake(kicksLeft - 1),
        WALL_FALL_CRASH_KICK_GAP_MS,
      );
    }
  };
  fallCrashTimer = setTimeout(
    () => crashShake(WALL_FALL_CRASH_KICKS),
    WALL_FALL_CRASH_AT_MS,
  );
  // Two falls and two impacts (see the WALL_FALL_SFX_* block).
  fallSfxTimers.forEach(clearTimeout);
  fallSfxTimers = [];
  const cue = (atMs: number, name: SfxName, rate?: number): void => {
    if (atMs <= 0) {
      playSfx(name, { rate });
      return;
    }
    fallSfxTimers.push(setTimeout(() => playSfx(name, { rate }), atMs));
  };
  cue(WALL_FALL_SFX_BG_FALL_AT_MS, WALL_FALL_SFX_BG_FALL, WALL_FALL_SFX_BG_FALL_RATE);
  cue(WALL_FALL_SFX_BG_CRASH_AT_MS, WALL_FALL_SFX_BG_CRASH);
  cue(WALL_FALL_SFX_CAM_FALL_AT_MS, WALL_FALL_SFX_CAM_FALL, WALL_FALL_SFX_CAM_FALL_RATE);
  cue(WALL_FALL_SFX_CAM_CRASH_AT_MS, WALL_FALL_SFX_CAM_CRASH);
  fallKickTimer = setTimeout(() => {
    fallKickTimer = null;
    kickWall();
  }, WALL_FALL_RECONNECT_KICK_AT_MS);
}

/** Wall back to full size, now. Call on unmount: the values outlive the screen. */
export function resetWallFall(): void {
  fallAnim?.stop();
  fallAnim = null;
  clearFallTimers();
  resetFallValues();
  setFallActive(false);
}

/**
 * Strain back to still, now. Separate from resetWallShake on purpose: the boss
 * gauntlet calls resetWallShake when it starts and ends, and that must not
 * silence a momentum vibration the player has earned. The Hunt screen and the
 * wall itself call this on unmount.
 */
export function resetWallStrain(): void {
  if (strainStopTimer !== null) {
    clearTimeout(strainStopTimer);
    strainStopTimer = null;
  }
  strainLoop?.stop();
  strainLoop = null;
  strainTier = 0;
  wallStrainPhase.setValue(0);
  wallStrainLevel.setValue(0);
}
