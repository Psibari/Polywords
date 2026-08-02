import { AmbientSkyBackgroundProps } from '../components/AmbientSkyBackground';
import { PW } from './pwTheme';

// First-pass color values — a follow-up styling pass can retune these against
// pwMaterials.ts without touching any component logic.

export const HOME_SKY_TUNING: AmbientSkyBackgroundProps = {
  tint: ['#351845', PW.color.bg],
  starDensity: 'low',
  driftSpeedMs: 32000,
  meteorsEnabled: false,
  moonPhase: 'full',
  starTint: PW.color.gold,
};

export const HUNT_SKY_TUNING: AmbientSkyBackgroundProps = {
  tint: [PW.color.purple, PW.color.bg],
  starDensity: 'medium',
  driftSpeedMs: 26000,
  meteorsEnabled: false,
  moonPhase: 'gibbous',
  starTint: PW.color.white,
};

export const BOSS_SKY_TUNING: AmbientSkyBackgroundProps = {
  tint: [PW.color.rose, PW.color.bg],
  starDensity: 'high',
  driftSpeedMs: 18000,
  meteorsEnabled: true,
  moonPhase: 'crescent',
  starTint: PW.color.gold,
};

export const DAILY_SKY_TUNING: AmbientSkyBackgroundProps = {
  tint: ['#8B2D7B', PW.color.bg],
  starDensity: 'medium',
  driftSpeedMs: 28000,
  meteorsEnabled: false,
  moonPhase: 'half',
  starTint: PW.color.white,
};
