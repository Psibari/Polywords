import { heroBookMaterial, libraryMaterial } from './pwMaterials';

export const DAILY_TITLE = "POLLY'S DAILY CHALLENGE";
export const DAILY_PROMISE = 'ONE word · FIVE rounds · TWO chances · ONE gold feather';
export const DAILY_CLUE_TITLE = 'DAILY CHALLENGE';
export const DAILY_CLUE_RULE = 'ONE REPRESENTS ALL';
export const DAILY_ACTION_RULE = 'SWIPE UP TO CLAIM';

export const DAILY_FIRST_MISS_LINE = 'Sharp as a butter knife.';
export const DAILY_LOSS_TITLE = 'YOU LOSE';
export const DAILY_LOSS_LINE = 'CAN’T BEAT THAT WITH A BAT.';
export const DAILY_WIN_TITLE = 'YOU BEAT POLLY’S CHALLENGE';
export const DAILY_WIN_REWARD = 'GOLD FEATHER EARNED';
export const DAILY_WIN_LINE = 'WON’T HAPPEN TOMORROW.';
export const DAILY_NO_FEATHER = 'NO FEATHER TODAY';

export function getStreakMilestoneRewardLabel(days: number): string {
  return `${days}-DAY STREAK · GOLD FEATHER EARNED`;
}

export const dailyBackdrop = {
  base: '#1A1830',
  centerGlow: '#590D93',
  veil: 'rgba(10, 8, 24, 0.42)',
  scanline: 'rgba(49, 14, 112, 0.18)',
  scanlineStrong: 'rgba(49, 14, 112, 0.28)',
  edgeShadow: 'rgba(0, 0, 0, 0.42)',
} as const;

export const dailyCardMaterial = {
  outerGradient: ['#F5C842', '#9B2D6B'] as const,
  innerFace: '#1A1830',
  text: '#FFF7D6',
  textSoft: '#E9FFF5',
  shadowColor: '#000000',
  correctGlow: 'rgba(245, 200, 66, 0.62)',
  wrongGlow: 'rgba(204, 34, 0, 0.62)',
  pressGlow: 'rgba(123, 45, 139, 0.54)',
  disabledOverlay: 'rgba(10, 8, 24, 0.56)',
  disabledOpacity: 0.42,
  outerRadius: 20,
  innerRadius: 12,
  minHeight: 72,
  maxHeight: 84,
  pressScale: 0.98,
  liftScale: 1.02,
  frameWidth: 3,
  shadowOpacity: 0.34,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
  motion: {
    pressInMs: 90,
    pressOutMs: 130,
    releaseMs: 180,
    releaseSpring: 'confident',
  },
} as const;

export const dailyClueVaultMaterial = {
  panelBackground: 'rgba(15, 13, 42, 0.92)',
  panelHighlight: 'rgba(255, 247, 214, 0.08)',
  borderColor: 'rgba(123, 45, 139, 0.72)',
  goldTrimColor: '#F5C842',
  goldHairlineColor: 'rgba(245, 200, 66, 0.34)',
  parchmentInset: 'rgba(13, 10, 38, 0.86)',
  parchmentInsetDark: 'rgba(245, 200, 66, 0.22)',
  parchmentLine: 'rgba(255, 247, 214, 0.10)',
  clueInk: '#FFF7D6',
  clueTextColor: '#FFF7D6',
  clueMemoryColor: 'rgba(255, 247, 214, 0.84)',
  sealBackground: 'rgba(245, 200, 66, 0.24)',
  sealBorder: 'rgba(245, 200, 66, 0.68)',
  timerTagColor: '#B98ADE',
  titleColor: '#FFFFFF',
  radius: 22,
  insetRadius: 15,
  borderWidth: 1.5,
} as const;

// Quill & scroll clue panel (spec: 2026-07-11-daily-challenge-quill-scroll-design).
// Every color traces to an existing pwMaterials token — no new hexes invented.
export const dailyScrollMaterial = {
  parchmentTop: libraryMaterial.parchment,      // #9A8E7A
  parchmentBot: libraryMaterial.parchmentDeep,  // #887868
  goldTrim: heroBookMaterial.goldTrim,          // #F5C842
  goldDeep: heroBookMaterial.goldPinInner,      // #C8920E
  inkwellFill: heroBookMaterial.hingeRail,      // #0F0D2A
  clueInk: libraryMaterial.woodShadow,          // #332A20
  clueInkMemory: 'rgba(51,42,32,0.62)',         // woodShadow, de-emphasized for already-revealed clues
  radius: 18,
  rollCapWidth: 24,
} as const;

// Polly stays perched throughout Daily and is mostly silent. She reacts only
// to the first lost Chance, the final loss, and the challenge win.
export const dailyPollyBehavior = {
  persistent: true,
  mostlySilent: true,
  reactions: {
    default: 'perched',
    firstMiss: 'happy',
    loss: 'laughing',
    win: 'shocked',
  },
} as const;

export type DailyPollyReaction =
  typeof dailyPollyBehavior.reactions[keyof typeof dailyPollyBehavior.reactions];
