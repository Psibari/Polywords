import { useSyncExternalStore } from 'react';
import { Animated, Easing } from 'react-native';
import { momentumGlowColor, type MomentumAccent, type MomentumStrength } from '../ui/momentumAccent';

// A single shared animation channel for the stone wall's gold veins, the same
// shape as wallShake.ts and for the same reason: the wall lives in
// GraphicGround, behind every Hunt round, while the moments that light it
// live in the Hunt's own subtree. A module-level channel keeps the coupling to
// one import on each side instead of threading a pulse through
// AmbientSkyBackground.
//
// A pulse is one fast rise to the tier's peak and a slower fall back to 0.
// Opacity only, native driver. Nothing here is audio.

type PulseRecipe = { peak: number; riseMs: number; decayMs: number };

// Peak opacity and fall-off per strength. The higher the momentum, the
// brighter and longer the wall answers. Peaks raised after the first device
// pass read as barely visible (Pete, 2026-10-11); fades unchanged.
export const WALL_VEIN_PULSE: Record<MomentumStrength, { peak: number; decayMs: number }> = {
  steady: { peak: 0.6, decayMs: 350 },
  sharp: { peak: 0.8, decayMs: 420 },
  razorSharp: { peak: 0.95, decayMs: 480 },
  untrappable: { peak: 1, decayMs: 600 },
  hunted: { peak: 0.85, decayMs: 400 },
};

/** The fast rise every ordinary pulse opens with. */
export const WALL_VEIN_RISE_MS = 80;

// Reduce Flashes (which Reduce Motion also turns on): the same pulse at about
// half the brightness, swelling in gently instead of snapping on.
export const WALL_VEIN_CALM_PEAK_RATIO = 0.5;
export const WALL_VEIN_CALM_RISE_MS = 280;

/** The halo layers glow at this fraction of the crisp veins' opacity. */
export const WALL_VEIN_HALO_RATIO = 0.9;

export function resolveWallVeinPulse(strength: MomentumStrength, reduceFlashes: boolean): PulseRecipe {
  const { peak, decayMs } = WALL_VEIN_PULSE[strength];
  return reduceFlashes
    ? { peak: peak * WALL_VEIN_CALM_PEAK_RATIO, riseMs: WALL_VEIN_CALM_RISE_MS, decayMs }
    : { peak, riseMs: WALL_VEIN_RISE_MS, decayMs };
}

/** 0..1, the crisp veins' opacity. 0 at rest: the veins are invisible. */
export const wallVeinPulse = new Animated.Value(0);
/** The halo layers' opacity, derived here so no consumer re-derives it. */
export const wallVeinHaloOpacity = wallVeinPulse.interpolate({
  inputRange: [0, 1],
  outputRange: [0, WALL_VEIN_HALO_RATIO],
});

// The tint is a plain prop, not an animated value, so it is published to the
// renderer as a tiny external store.
let veinColor = '#FFFFFF';
const colorListeners = new Set<() => void>();

function setVeinColor(color: string): void {
  if (color === veinColor) return;
  veinColor = color;
  colorListeners.forEach((listener) => listener());
}

function subscribeVeinColor(listener: () => void): () => void {
  colorListeners.add(listener);
  return () => {
    colorListeners.delete(listener);
  };
}

/** The colour the veins are tinted for the current (or last) pulse. */
export function useWallVeinColor(): string {
  return useSyncExternalStore(subscribeVeinColor, () => veinColor);
}

let pulseAnim: Animated.CompositeAnimation | null = null;

/**
 * One pulse in the accent's glow colour, at the accent's strength. A pulse that
 * lands while the last is still fading rises from wherever that one is, so
 * quick answers never flicker the veins dark between them.
 */
export function pulseWallVeins(accent: MomentumAccent, reduceFlashes: boolean): void {
  const { peak, riseMs, decayMs } = resolveWallVeinPulse(accent.strength, reduceFlashes);
  setVeinColor(momentumGlowColor(accent.strength));
  pulseAnim?.stop();
  pulseAnim = Animated.sequence([
    Animated.timing(wallVeinPulse, {
      toValue: peak,
      duration: riseMs,
      easing: reduceFlashes ? Easing.inOut(Easing.quad) : Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(wallVeinPulse, {
      toValue: 0,
      duration: decayMs,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
  ]);
  pulseAnim.start();
}

/**
 * Back to 0, stopping anything in flight. GraphicGround calls this on unmount:
 * the value outlives the components that read it, and a pulse interrupted
 * part-way would otherwise leave the veins lit on the next screen.
 */
export function resetWallVeinPulse(): void {
  pulseAnim?.stop();
  pulseAnim = null;
  wallVeinPulse.setValue(0);
}
