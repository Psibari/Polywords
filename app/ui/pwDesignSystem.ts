import { PW } from './pwTheme';
import { FX } from './pwEffects';
import { foilMaterial, heroBookMaterial, libraryMaterial, stageMaterial } from './pwMaterials';

export const PWDesignSystem = {
  brand: {
    name: 'POLYWORDS',
    voice: 'expert, premium, literary, sharp',
    personality: [
      'tactile',
      'crafted',
      'mystical',
      'semantic combat',
      'bookish elegance',
    ] as const,
  },
  palette: {
    background: PW.color.bg,
    backgroundDeep: PW.color.bgDeep,
    surface: PW.color.surfaceBase,
    surfaceRaised: PW.color.surfaceRaised,
    heroWord: PW.color.gold,
    textPrimary: PW.color.white,
    textSecondary: PW.color.mutedWhite,
    textSoft: PW.color.softWhite,
    accentGold: PW.color.gold,
    accentAmber: PW.color.amber,
    accentPurple: PW.color.purple,
    accentLavender: PW.color.lavender,
    correct: PW.color.correct,
    wrong: PW.color.wrong,
  },
  typography: {
    heroWord: PW.font.heroWord,
    heroWordLine: PW.font.heroWordLine,
    clue: PW.font.clue,
    clueLine: PW.font.clueLine,
    clueSmall: PW.font.clueSmall,
    clueSmallLine: PW.font.clueSmallLine,
    label: PW.font.label,
    labelLine: PW.font.labelLine,
    hud: PW.font.hud,
    hudLine: PW.font.hudLine,
  },
  spacing: PW.space,
  radius: PW.radius,
  motion: PW.motion,
  z: PW.z,
  shadow: PW.shadow,
  materials: {
    heroBook: heroBookMaterial,
    foil: foilMaterial,
    library: libraryMaterial,
    stage: stageMaterial,
  },
  effects: FX,
} as const;

export type PWDesignSystem = typeof PWDesignSystem;
