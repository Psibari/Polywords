// Pure visit policy for Hunt Polly. RN-free on purpose so it runs under
// plain Node (npx tsx) — do not import react-native or app/hooks here.
//
// Visit behavior is documented in docs/GAME_REFERENCE.md.
// Scarcity is the menace: guaranteed big beats always fire; heckles are
// capped at one visit per word and dropped (never queued) when blocked.

// Same event vocabulary used by MaskBoard call sites; these literals must not change.
import { POLLY_LINES, PollyLineId } from './pollyCharacter';

export type PollyEvent =
  | 'wordEntry'
  | 'correct'
  | 'allMasksFound'
  | 'hiddenFound'
  | 'cleanSweep'
  | 'wrong'
  | 'bossEntry'
  | 'ghostEntry'
  | 'ghostFoundLate'
  | 'ghostDissolved'
  | 'oneHeartLeft'
  | 'hesitation3s'
  | 'hesitation6s'
  | 'hesitation9s'
  | 'hesitationCleared'
  | 'streakX10'
  | 'gameOver'
  | 'gateMastered'
  | 'gateMasteredBoss'
  | 'hiddenMasterFailed'
  | 'hauntMasterFailed'
  | 'hauntFailed'
  | 'oneWrongMove'
  | 'huntIntro'
  | 'hauntIntro';

export type PollyVisitSfx = 'pollySqwawkShort' | 'pollySqwawkLaugh';

export type VisitSpec = {
  kind: 'guaranteed' | 'heckle';
  flyPose: 'fly' | 'flyAngry' | 'jumpAngry' | 'masterShock' | 'hauntTaunt';
  perchPose: 'smug' | 'laugh' | 'point' | 'shocked' | 'sulk' | 'rattled' | 'embarrassed' | 'masterAngry' | 'hauntTaunt' | 'asleep';
  exitPose?: 'fly' | 'sulk' | 'flyAngry' | 'flyGrin';
  lineId: PollyLineId | null;
  line: string | null;
  sfx: PollyVisitSfx | null;
  holdPerch: boolean;
  perchMs: number;
  perchScale?: number;
};

export type PollyBudgetState = {
  busy: boolean;
  heckleUsedThisWord: boolean;
  wrongSeenThisWord: boolean;
  cleanSweepSeenThisRun: boolean;
  isSpeedRound: boolean;
  ghostRunsMissed: number;
  recentLineIds: PollyLineId[];
  lineRoll: number;
};

export type VisitDecision =
  | { action: 'none' }
  | { action: 'wordEntry' }
  | { action: 'visit'; spec: VisitSpec };

export function pickFreshLine<T extends string>(
  candidates: T[],
  recent: readonly string[],
  roll: number,
): T {
  const fresh = candidates.filter(id => !recent.includes(id));
  const pool = fresh.length > 0 ? fresh : candidates;
  const i = Math.min(pool.length - 1, Math.max(0, Math.floor(roll * pool.length)));
  return pool[i];
}

const NONE: VisitDecision = { action: 'none' };

const HUNT_INTRO: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'point',
  lineId: 'huntIntro', line: POLLY_LINES.huntIntro, sfx: 'pollySqwawkShort',
  holdPerch: false, perchMs: 2500,
};

const HAUNT_INTRO: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'point',
  lineId: 'huntHauntIntro', line: POLLY_LINES.huntHauntIntro, sfx: 'pollySqwawkShort',
  holdPerch: false, perchMs: 2500,
};

const BOSS_ENTRY_LINES: PollyLineId[] = [
  'bossCage', 'bossForYou',
  'bossWaiting', 'bossFavorite', 'bossPutWork',
];

const BOSS_ENTRY: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'point',
  lineId: 'bossCage', line: POLLY_LINES.bossCage, sfx: 'pollySqwawkShort',
  // Device-locked 2026-10-05: keep boss-entry Polly near normal Hunt scale
  // so she clears the gauntlet card and her speech bubble.
  holdPerch: false, perchMs: 4200, perchScale: 1.05,
};

const MASTERED_REACTION: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'sulk',
  exitPose: 'flyAngry',
  lineId: 'huntMasteredTrapsDiffer',
  line: POLLY_LINES.huntMasteredTrapsDiffer,
  sfx: null,
  holdPerch: false, perchMs: 1600,
};

// She arrives in the plain fly pose (she cannot know the gauntlet result
// yet); the result shows on the way out.
const HAUNTED_GLOAT: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'hauntTaunt',
  exitPose: 'flyGrin',
  lineId: null, line: null, sfx: 'pollySqwawkLaugh',
  // Device-locked 2026-10-05: Haunted loss gets a larger payoff than
  // ordinary Hunt staging without returning to the old oversized boss entry.
  holdPerch: true, perchMs: 2500, perchScale: 1.24,
};

// Pinned to its own poses so the boss-gloat pose rule does not leak in
// through the spread. Unchanged pending Pete's ruling.
const RETURNING_HAUNT_GLOAT: VisitSpec = {
  ...HAUNTED_GLOAT,
  flyPose: 'hauntTaunt',
  exitPose: 'fly',
  sfx: null,
};

const GAME_OVER_LAUGH: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'laugh',
  lineId: 'huntLaugh', line: POLLY_LINES.huntLaugh, sfx: null,
  holdPerch: true, perchMs: 2500,
};

const HAUNT_FAILED_LAUGH: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'laugh',
  lineId: 'huntLaugh', line: POLLY_LINES.huntLaugh, sfx: 'pollySqwawkLaugh',
  holdPerch: false, perchMs: 2200,
};

const CLEAN_SWEEP_FIRST: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'shocked',
  lineId: 'huntCleanSweep', line: POLLY_LINES.huntCleanSweep,
  sfx: null,
  holdPerch: false, perchMs: 2000,
};

const CLEAN_SWEEP_REPEAT: VisitSpec = {
  ...CLEAN_SWEEP_FIRST, kind: 'heckle',
};

const WRONG_SMUG: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'smug',
  lineId: 'huntThoughtSo', line: POLLY_LINES.huntThoughtSo,
  sfx: null,
  holdPerch: false, perchMs: 1800,
};

const WRONG_HECKLE_LINES: PollyLineId[] = [
  'huntThoughtSo',
  'huntGotcha',
  'huntThereItIs',
  'huntEveryTime',
  'huntStillWorks',
  'huntAllMe',
  'huntGoodIsntIt',
  'huntLoveThisGame',
  'huntMyHouse',
  'huntWalkedRightIn',
  'huntGotMeCrowned',
  'huntZing',
];

const STREAK_RATTLED: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'embarrassed',
  lineId: 'huntStreakSoWhat', line: POLLY_LINES.huntStreakSoWhat,
  sfx: null,
  holdPerch: false, perchMs: 1800,
};

const STREAK_LINES: PollyLineId[] = [
  'huntStreakSoWhat',
  'huntStreakEasy',
  'huntStreakWhosCounting',
  'huntStreakLetYouHave',
  'huntStreakWarmUp',
  'huntStreakPacing',
  'streakLucky',
  'streakYikes',
  'streakNotOver',
  'streakStillGetYa',
  'streakBirdBrain',
  'streakRuffling',
];

const HESITATION_LINES: PollyLineId[] = ['huntHesitation', 'huntAreYouSure'];

const HESITATION_POINT: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'point',
  lineId: 'huntHesitation', line: POLLY_LINES.huntHesitation, sfx: null,
  holdPerch: false, perchMs: 2000,
};

const GHOST_SMUG: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'smug',
  lineId: 'huntRemember', line: POLLY_LINES.huntRemember, sfx: null,
  holdPerch: false, perchMs: 1800,
};

const ONE_FEATHER_LINES: PollyLineId[] = [
  'featherOneLookAtMine',
  'featherOnePlucked',
  'featherOneAroundHere',
  'featherOneWait',
  'featherOneCheck',
];

const ONE_FEATHER_POSE: Record<string, 'smug' | 'asleep'> = {
  featherOneLookAtMine: 'smug',
  featherOnePlucked: 'asleep',
  featherOneAroundHere: 'smug',
  featherOneWait: 'asleep',
  featherOneCheck: 'smug',
};

const ONE_FEATHER: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'smug',
  lineId: 'featherOneLookAtMine',
  line: POLLY_LINES.featherOneLookAtMine,
  sfx: null,
  holdPerch: false, perchMs: 2000,
};

export function resolveVisit(event: PollyEvent, state: PollyBudgetState): VisitDecision {
  if (event === 'wordEntry') return { action: 'wordEntry' };

  // Guaranteed beats ignore heckle budgets.
  if (event === 'huntIntro') return { action: 'visit', spec: HUNT_INTRO };
  if (event === 'hauntIntro') return { action: 'visit', spec: HAUNT_INTRO };
  if (event === 'bossEntry') {
    const lineId = pickFreshLine(BOSS_ENTRY_LINES, state.recentLineIds, state.lineRoll);
    return { action: 'visit', spec: { ...BOSS_ENTRY, lineId, line: POLLY_LINES[lineId] } };
  }
  if (event === 'allMasksFound') return NONE;
  if (event === 'gateMasteredBoss') return { action: 'visit', spec: MASTERED_REACTION };
  if (event === 'gateMastered') return { action: 'visit', spec: MASTERED_REACTION };
  if (event === 'hiddenMasterFailed') return { action: 'visit', spec: HAUNTED_GLOAT };
  if (event === 'hauntMasterFailed') return { action: 'visit', spec: RETURNING_HAUNT_GLOAT };
  if (event === 'gameOver') return { action: 'visit', spec: GAME_OVER_LAUGH };
  if (event === 'hauntFailed') return { action: 'visit', spec: HAUNT_FAILED_LAUGH };
  if (event === 'oneHeartLeft') {
    const lineId = pickFreshLine(ONE_FEATHER_LINES, state.recentLineIds, state.lineRoll);
    return { action: 'visit', spec: {
      ...ONE_FEATHER, lineId, line: POLLY_LINES[lineId],
      perchPose: ONE_FEATHER_POSE[lineId],
    }};
  }
  if (event === 'cleanSweep' && !state.cleanSweepSeenThisRun) {
    return { action: 'visit', spec: CLEAN_SWEEP_FIRST };
  }

  // Heckles: max one per word, dropped rather than queued.
  const heckleBlocked = state.busy || state.heckleUsedThisWord || state.isSpeedRound;
  if (heckleBlocked) return NONE;

  if (event === 'wrong' && !state.wrongSeenThisWord) {
    const lineId = pickFreshLine(WRONG_HECKLE_LINES, state.recentLineIds, state.lineRoll);
    return { action: 'visit', spec: { ...WRONG_SMUG, lineId, line: POLLY_LINES[lineId] } };
  }
  if (event === 'streakX10') {
    const lineId = pickFreshLine(STREAK_LINES, state.recentLineIds, state.lineRoll);
    return { action: 'visit', spec: { ...STREAK_RATTLED, lineId, line: POLLY_LINES[lineId] } };
  }
  if (event === 'hesitation6s') {
    const lineId = pickFreshLine(HESITATION_LINES, state.recentLineIds, state.lineRoll);
    return { action: 'visit', spec: { ...HESITATION_POINT, lineId, line: POLLY_LINES[lineId] } };
  }
  if (event === 'ghostEntry') {
    return {
      action: 'visit',
      spec: state.ghostRunsMissed >= 2
        ? { ...GHOST_SMUG, perchPose: 'point' }
        : GHOST_SMUG,
    };
  }
  if (event === 'cleanSweep') return { action: 'visit', spec: CLEAN_SWEEP_REPEAT };

  return NONE;
}
