import { AmbientSkyBackgroundProps } from '../components/AmbientSkyBackground';
import { PW } from './pwTheme';

// First-pass color values — a follow-up styling pass can retune these against
// pwMaterials.ts without touching any component logic.

// Home is the reference tone Pete confirmed reads best. All four screens
// share this exact deep tone now — Boss previously kept a rose/pink tint as
// a deliberate "escalation" departure, but Pete called that out as still
// off-palette, so it's gone; the strict rule is one background family, no
// per-screen exceptions.
const HOME_TINT_TOP = '#351845';

export const HOME_SKY_TUNING: AmbientSkyBackgroundProps = {
  tint: [HOME_TINT_TOP, PW.color.bg],
  starDensity: 'low',
  driftSpeedMs: 32000,
  meteorsEnabled: false,
  moonPhase: 'full',
  starTint: PW.color.gold,
  // Default 8%/10% sits behind the wordmark (too high); 34% cleared it but
  // read too low. Splitting the difference between those two known points.
  moonTop: '21%',
  moonRight: '12%',
};

export const HUNT_SKY_TUNING: AmbientSkyBackgroundProps = {
  tint: [HOME_TINT_TOP, PW.color.bg],
  starDensity: 'medium',
  driftSpeedMs: 26000,
  meteorsEnabled: false,
  moonPhase: 'gibbous',
  starTint: PW.color.white,
  // Default 8%/10% sits directly behind GameScreen's TopBar — push below it.
  moonTop: '20%',
  moonRight: '8%',
};

export const BOSS_SKY_TUNING: AmbientSkyBackgroundProps = {
  tint: [HOME_TINT_TOP, PW.color.bg],
  starDensity: 'high',
  driftSpeedMs: 18000,
  meteorsEnabled: true,
  moonPhase: 'crescent',
  starTint: PW.color.gold,
  moonTop: '20%',
  moonRight: '8%',
};

export const DAILY_SKY_TUNING: AmbientSkyBackgroundProps = {
  tint: [HOME_TINT_TOP, PW.color.bg],
  starDensity: 'medium',
  driftSpeedMs: 28000,
  meteorsEnabled: false,
  moonPhase: 'half',
  starTint: PW.color.white,
};
