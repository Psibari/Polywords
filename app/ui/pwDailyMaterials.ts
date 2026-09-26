import { heroBookMaterial } from './pwMaterials';
import { POLLY_LINES, PollyLineId } from '../game/pollyCharacter';
import { BookRivalryState } from '../game/pollyBookLines';
import { PW } from './pwTheme';

export const DAILY_TITLE = "POLLY'S DAILY CHALLENGE";
export const DAILY_PROMISE = 'ONE word · FIVE rounds · TWO chances · ONE gold feather';
export const DAILY_CLUE_TITLE = 'DAILY CHALLENGE';
export const DAILY_CLUE_RULE = 'ONE REPRESENTS ALL';
export const DAILY_ACTION_RULE = 'SWIPE UP TO CLAIM';

export const DAILY_FIRST_MISS_LINE = POLLY_LINES.dailyButterKnife;
export const DAILY_LOSS_TITLE = 'YOU LOSE';
export const DAILY_LOSS_LINE_IDS: PollyLineId[] = ['dailyLossBat'];
export const DAILY_WIN_TITLE = 'YOU BEAT POLLY’S CHALLENGE';
export const DAILY_WIN_REWARD = 'GOLD FEATHER EARNED';
export const DAILY_WIN_LINE = POLLY_LINES.dailyWinTomorrow;
export const DAILY_NO_FEATHER = 'NO FEATHER TODAY';

export function getStreakMilestoneRewardLabel(days: number): string {
  return `${days}-DAY STREAK · GOLD FEATHER EARNED`;
}

// Per-round reaction lines for an ordinary correct claim, colored by Polly's
// current rivalry state (resolveRivalryState, Hunt-derived, read-only here).
// Ids match the dailyDismissive*/dailyAmused*/dailyWatchful*/dailyRattled*/
// dailyConceding* entries in pollyCharacter.ts.
export const DAILY_MOOD_LINES: Record<BookRivalryState, PollyLineId[]> = {
  DISMISSIVE: [
    'dailyDismissiveInk',
    'dailyDismissiveMovingOn',
    'dailyDismissiveWhoAreYou',
    'dailyDismissiveWhateverThatWas',
  ],
  AMUSED: [
    'dailyAmusedDoItAgain',
    'dailyAmusedArrangement',
    'dailyAmusedPredictable',
    'dailyAmusedKnewIt',
    'dailyAmusedComeBack',
  ],
  WATCHFUL: [
    'dailyWatchfulFaster',
    'dailyWatchfulThatsNew',
    'dailyWatchfulCoincidence',
    'dailyWatchfulWatchingThis',
    'dailyWatchfulGoldFeather',
  ],
  RATTLED: [
    'dailyRattledLetYouHave',
    'dailyRattledBadLight',
    'dailyRattledLuck',
    'dailyRattledShouldntCount',
    'dailyRattledReallyHappening',
  ],
  CONCEDING: [
    'dailyConcedingNewTraps',
    'dailyConcedingOutOfExcuses',
    'dailyConcedingNothingHolding',
    'dailyConcedingDrawingBoard',
    'dailyConcedingNooo',
  ],
};

export const dailyBackdrop = {
  base: '#1A1830',
  centerGlow: '#590D93',
  veil: 'rgba(10, 8, 24, 0.42)',
  scanline: 'rgba(49, 14, 112, 0.18)',
  scanlineStrong: 'rgba(49, 14, 112, 0.28)',
  edgeShadow: 'rgba(0, 0, 0, 0.42)',
} as const;

export const dailyCardMaterial = {
  // Gold-to-amber rim + purple-leather face — the same material identity as
  // the painted Hunt tile (mask-card-v1/card-face.png) and the hero book's
  // cover, instead of the gold-to-rose gradient this card used to have on
  // its own (rose belongs to Polly's ghost/haunt accent elsewhere, not to
  // an idle card face).
  outerGradient: [PW.color.gold, PW.color.amber] as const,
  innerFace: heroBookMaterial.coverPurple,
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

// Parchment scroll panel — quill-and-rod clue surface drawn by
// QuillScrollPanel/ParchmentSurface from real art, not a flat card. Only ink
// and trim colors layered over that art live here: the old boxed-panel
// tokens (panelBg, panelBorder, radius) went with the flat background,
// border and rounded-rect clip they described, all of which were removed
// because they framed the torn-edge art in a rectangle.
// The stone answer block while it is held. A cream foil halo rather than
// gold: gold means "correct" everywhere else in the game, and a grab must
// never hint at the answer. `ready` is the extra glow once the drag has
// crossed the claim line (the moment the threshold haptic and sound fire).
export const dailyCastlePlaqueMaterial = {
  haloOuter: 'rgba(255, 247, 214, 0.16)',
  haloInner: 'rgba(255, 247, 214, 0.30)',
  heldBrighten: 'rgba(255, 247, 214, 0.10)',
  readyBrighten: 'rgba(255, 247, 214, 0.08)',
  haloOuterInset: -8,
  haloInnerInset: -3,
  heldScale: 1.06,
  heldHaloOpacity: 0.75,
  readyHaloScale: 1.04,
  readyInMs: 110,
  readyOutMs: 140,
} as const;

export const dailyScrollMaterial = {
  goldTrim: heroBookMaterial.goldTrim,          // #F5C842
  clueInk: '#FFF7D6',
  // Earlier clues are still LIVE constraints — the mode's rule is that one
  // word connects all three — so they must not read as disabled. At 0.75 on
  // this parchment the cream desaturated toward grey and looked switched
  // off (Pete, on device). 0.92 keeps them clearly written in the same ink;
  // the 23/17 size step is what carries the hierarchy, not fading.
  clueInkMemory: 'rgba(255,247,214,0.92)',
} as const;

export const dailyCardFaceMaterial = {
  rimCorrect: PW.color.gold,
  rimWrong: PW.color.wrong,
  rimDisabledStart: '#3C315E',
  rimDisabledEnd: PW.color.purple,
  insetTrim: 'rgba(255,255,255,0.10)',
  sheenTop: 'rgba(255,255,255,0.07)',
  pin: 'rgba(245,200,66,0.65)',
} as const;

export const dailyPanelFrameMaterial = {
  sheenTop: 'rgba(255,255,255,0.06)',
} as const;

export const dailyRevealMaterial = {
  fillTop: '#2A1C5C',
  fillMid: '#191541',
  fillBot: '#120F32',
  border: 'rgba(245,200,66,0.62)',
  glow: 'rgba(245,200,66,0.20)',
  glowFade: 'rgba(245,200,66,0.06)',
  grain: 'rgba(0,0,0,0.07)',
  foldShadow: 'rgba(0,0,0,0.16)',
  foldHighlight: 'rgba(255,255,255,0.08)',
  rollTop: '#4A3480',
  rollMid: '#2A1C5C',
  rollLowerMid: '#191541',
  rollBottom: '#0B0824',
  rollSpecular: 'rgba(255,255,255,0.7)',
  rollEndCapNear: '#241A54',
  rollEndCapFar: '#0D0A26',
  rollShadow: 'rgba(0,0,0,0.45)',
  sealBg: '#1F1548',
  sealRing: 'rgba(245,200,66,0.5)',
  sealRingInner: 'rgba(245,200,66,0.35)',
  sealGoldFill: 'rgba(245,200,66,0.34)',
  sealGoldStroke: 'rgba(245,200,66,0.55)',
  sealGoldFinial: 'rgba(245,200,66,0.5)',
  sealBand: 'rgba(58,37,112,0.55)',
  sealBandStroke: 'rgba(245,200,66,0.45)',
  sealJewel: 'rgba(185,138,222,0.6)',
} as const;

export const dailyResultsMaterial = {
  cardBg: PW.color.cardFace,
  cardBorderWin: PW.color.purple,
  cardBorderLoss: PW.color.wrong,
  titleWin: PW.color.gold,
  titleLoss: PW.color.white,
  challengeLabel: 'rgba(255,255,255,0.55)',
  statText: 'rgba(255,255,255,0.72)',
  rewardText: PW.color.gold,
  speedTitle: 'rgba(255,255,255,0.82)',
  speedClue1Border: PW.color.gold,
  speedClue1Bg: 'rgba(245,200,66,0.85)',
  speedClue2Border: PW.color.purple,
  speedClue2Bg: 'rgba(123,45,139,0.85)',
  speedClue3Border: PW.color.amber,
  speedClue3Bg: 'rgba(200,146,14,0.85)',
  speedMissedBorder: PW.color.wrong,
  speedMissedBg: 'rgba(204,34,0,0.85)',
  speedUnreachedBorder: 'rgba(255,255,255,0.18)',
  speedUnknownBg: 'rgba(15,13,42,0.9)',
  speedUnknownBorder: 'rgba(255,255,255,0.35)',
  speedUnknownMark: 'rgba(255,255,255,0.65)',
  speedLegendText: 'rgba(255,255,255,0.78)',
  shareBtnBg: PW.color.gold,
  shareBtnText: PW.color.cardFace,
  homeText: 'rgba(255,255,255,0.58)',
  overlayScrim: 'rgba(13,10,34,0.55)',
} as const;

export const dailyHudMaterial = {
  rowBg: 'rgba(11,9,32,0.80)',
  rowBorder: 'rgba(123,45,139,0.28)',
  rowBorderBottom: 'rgba(245,200,66,0.22)',
  label: PW.color.gold,
  labelGlow: 'rgba(245,200,66,0.5)',
  dotDone: PW.color.gold,
  dotCurrent: PW.color.white,
  dotPending: 'rgba(255,255,255,0.2)',
} as const;

export const dailyChromeMaterial = {
  actionLabel: 'rgba(255,255,255,0.78)',
  cardBoardBg: 'rgba(10,7,26,0.45)',
  cardBoardBorder: 'rgba(245,200,66,0.14)',
  featherLabel: PW.color.gold,
  devResetText: 'rgba(255,255,255,0.35)',
  clueHeaderRule: 'rgba(255,247,214,0.55)',
} as const;

// Polly stays perched throughout Daily. She now reacts every round — an
// ordinary correct claim, a first lost Chance, the final loss, and the
// challenge win — with the ordinary-correct line colored by her rivalry
// state (resolveRivalryState, Hunt-derived, read-only from Daily) — see
// DAILY_MOOD_LINES above.
export const dailyPollyBehavior = {
  persistent: true,
  reactions: {
    default: 'perched',
    firstMiss: 'happy',
    loss: 'laughing',
    win: 'shocked',
  },
} as const;

export type DailyPollyReaction =
  typeof dailyPollyBehavior.reactions[keyof typeof dailyPollyBehavior.reactions];
