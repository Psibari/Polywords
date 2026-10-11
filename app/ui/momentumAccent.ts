import type { HuntHudState, HuntReadTier } from '../game/huntControl';
import { PW } from './pwTheme';

// The one source for momentum colour. The Hunt HUD (label, pulse, rungs) and
// the stone wall's vein pulse both read it, so the wall can never glow a
// different colour from the tier the HUD is showing.

/** A momentum tier's colour, by the streak read alone. */
export const MOMENTUM_ACCENT_BY_TIER: Record<HuntReadTier, string> = {
  steady: PW.color.softWhite,
  sharp: '#6EC3FF', // ice blue (Pete, 2026-10-11)
  razorSharp: '#B388FF',
  untrappable: PW.color.gold,
};

/** How hard a momentum effect hits: the streak tier, or HUNTED at one feather. */
export type MomentumStrength = HuntReadTier | 'hunted';

export type MomentumAccent = { color: string; strength: MomentumStrength };

/** A strength's colour: rose at HUNTED, otherwise its streak tier's colour. */
export function momentumAccentColor(strength: MomentumStrength): string {
  return strength === 'hunted' ? PW.color.rose : MOMENTUM_ACCENT_BY_TIER[strength];
}

// HUNTED's rose (#9B2D6B) is too dark to read as LIGHT on the purple wall or
// card, so glows use a lighter rose (Pete, 2026-10-11). Glows only: the HUD
// word, rungs and everything else keep PW.color.rose.
export const MOMENTUM_GLOW_HUNTED = '#D9488F';

/** A strength's colour for light effects: the card glow and the vein pulse. */
export function momentumGlowColor(strength: MomentumStrength): string {
  return strength === 'hunted' ? MOMENTUM_GLOW_HUNTED : MOMENTUM_ACCENT_BY_TIER[strength];
}

/**
 * The live accent. HUNTED (one feather left) overrides the streak colour with
 * rose; otherwise the streak tier decides.
 */
export function resolveMomentumAccent(
  hud: Pick<HuntHudState, 'tier' | 'readTier'>,
): MomentumAccent {
  const strength: MomentumStrength = hud.tier === 'rattled' ? 'hunted' : hud.readTier;
  return { color: momentumAccentColor(strength), strength };
}
