import { AmbientSkyBackgroundProps } from '../components/AmbientSkyBackground';
import { PW } from './pwTheme';

// First-pass color values — a follow-up styling pass can retune these against
// pwMaterials.ts without touching any component logic.

// Home is the reference tone Pete confirmed reads best — the other three
// screens' base tint was a brighter, more saturated purple family that read
// as a different, mismatched "world." Hunt and Daily now share Home's exact
// deep tone; Boss keeps its rose tint, which is the one deliberate departure
// (it's supposed to feel different — that's the escalation).
const HOME_TINT_TOP = '#351845';

export const HOME_SKY_TUNING: AmbientSkyBackgroundProps = {
  tint: [HOME_TINT_TOP, PW.color.bg],
  starDensity: 'low',
  driftSpeedMs: 32000,
  meteorsEnabled: false,
  moonPhase: 'full',
  starTint: PW.color.gold,
  // Default 8%/10% sits behind the wordmark — move into the open plaza
  // space to the right of the parrot instead.
  moonTop: '34%',
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
  tint: [PW.color.rose, PW.color.bg],
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
