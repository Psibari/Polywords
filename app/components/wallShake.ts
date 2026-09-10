import { Animated, Easing } from 'react-native';

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

// Both values are consumed as OSCILLATION, not as displacement: the driving
// timing is plain linear 0 -> 1 and every bit of the shape lives here, in a
// zigzag output range whose amplitude decays. That keeps the driver trivial
// and native-driver safe, and it gives one useful guarantee — the envelope is
// exactly 0 at BOTH ends, so a value resting at 0 or at 1 leaves the wall
// perfectly still. Only an interrupted animation can strand a non-zero value,
// which is what resetWallShake is for.
function dampedOscillation(amp: number, cycles: number, invert: boolean) {
  const samples = Math.round(cycles * SAMPLES_PER_CYCLE);
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const swing = amp * (1 - t) * Math.sin(2 * Math.PI * cycles * t);
    inputRange.push(t);
    outputRange.push(invert ? -swing : swing);
  }
  return { inputRange, outputRange };
}

/** 0..1, drives the low lead-in rattle before the first brick moves. */
export const wallTremble = new Animated.Value(0);
/** 0..1, drives the sharp jolt as a brick tears out. */
export const wallKick = new Animated.Value(0);

// Different cycle counts per axis, and one axis inverted, so the wall never
// travels along a clean diagonal — that reads as a slide, not a shake.
const trembleX = wallTremble.interpolate(dampedOscillation(WALL_TREMBLE_AMP, 5, false));
const trembleY = wallTremble.interpolate(
  dampedOscillation(WALL_TREMBLE_AMP * VERTICAL_RATIO, 6, true),
);
const kickX = wallKick.interpolate(dampedOscillation(WALL_KICK_AMP, 3, true));
const kickY = wallKick.interpolate(
  dampedOscillation(WALL_KICK_AMP * VERTICAL_RATIO, 2, false),
);

const shakeX = Animated.add(trembleX, kickX);
const shakeY = Animated.add(trembleY, kickY);

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
