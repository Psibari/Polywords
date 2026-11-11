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

// Wordless reaction pools (Pete, 31 Oct 2026). A visit names a GROUP; the
// thin caller (app/audio/pollyReactionSfx.ts) picks one sound from the pool
// and never plays the same one twice in a row within its group.
export type PollyReactionGroup = 'angry' | 'startled';

export const POLLY_ANGRY_SFX = [
  'pollyAngry1', 'pollyAngry2', 'pollyAngry3',
  'pollyAngry4', 'pollyAngry5', 'pollyAngry6',
] as const;
export const POLLY_STARTLED_SFX = [
  'pollyStartled1', 'pollyStartled2', 'pollyStartled3', 'pollyStartled4',
] as const;
export type PollyReactionSfx =
  | (typeof POLLY_ANGRY_SFX)[number]
  | (typeof POLLY_STARTLED_SFX)[number];

export const POLLY_REACTION_POOLS: Record<PollyReactionGroup, readonly PollyReactionSfx[]> = {
  angry: POLLY_ANGRY_SFX,
  startled: POLLY_STARTLED_SFX,
};

// Pure pick: never returns `last` when the pool has more than one entry, and
// spreads evenly over the remaining entries. roll is in [0, 1).
export function pickReactionSfx<T extends string>(
  pool: readonly T[],
  last: T | null,
  roll: number,
): T {
  if (pool.length === 0) throw new Error('pickReactionSfx: empty pool');
  const candidates = pool.length > 1 ? pool.filter(n => n !== last) : pool;
  const i = Math.min(candidates.length - 1, Math.max(0, Math.floor(roll * candidates.length)));
  return candidates[i];
}

export type VisitSpec = {
  kind: 'guaranteed' | 'heckle';
  flyPose: 'fly' | 'flyAngry' | 'jumpAngry' | 'masterShock' | 'hauntTaunt';
  perchPose: 'smug' | 'laugh' | 'point' | 'shocked' | 'sulk' | 'rattled' | 'embarrassed' | 'masterAngry' | 'hauntTaunt' | 'asleep' | 'laugh03' | 'angryYell';
  exitPose?: 'fly' | 'sulk' | 'flyAngry' | 'flyGrin';
  lineId: PollyLineId | null;
  line: string | null;
  sfx: PollyVisitSfx | null;
  // Played when she lands (a random pick from the group).
  sfxGroup?: 'startled';
  // Played when the exit starts, in every exit path (a random pick).
  exitSfxGroup?: 'angry';
  // One fixed sound played when the exit starts (streak x10 "I'm out of here").
  exitSfx?: 'pollyEmbarrassedExit';
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

// ── Reading time ────────────────────────────────────────────────────────────
// Testers could not finish her bubbles (Pete, 2026-11-11): every visit held a
// fixed time on the perch whatever the line's length, so long lines got about
// half the time they need. A bubble now stays at least as long as its line takes
// to read: POLLY_READ_NOTICE_MS to notice it, then POLLY_READ_CHARS_PER_SEC (a
// common subtitle pace). Both are TEST VALUES. A spec's own perchMs is the
// MINIMUM, so short lines keep their snap and nothing gets shorter.
export const POLLY_READ_NOTICE_MS = 500;
export const POLLY_READ_CHARS_PER_SEC = 15;
// No line may hold her longer than this, however long it is.
export const POLLY_READ_MAX_MS = 5000;

/** How long a line needs on screen to be read, in ms. 0 for no line. */
export function pollyLineReadMs(line: string | null | undefined): number {
  if (!line) return 0;
  const ms = POLLY_READ_NOTICE_MS + Math.round((line.length * 1000) / POLLY_READ_CHARS_PER_SEC);
  return Math.min(POLLY_READ_MAX_MS, ms);
}

/** How long she stays perched for a visit: its perchMs, or longer if the line needs it. */
export function resolveVisitPerchMs(spec: { line: string | null; perchMs: number }): number {
  return Math.max(spec.perchMs, pollyLineReadMs(spec.line));
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
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'angryYell',
  exitPose: 'flyAngry',
  lineId: 'huntMasteredTrapsDiffer',
  line: POLLY_LINES.huntMasteredTrapsDiffer,
  sfx: null,
  exitSfxGroup: 'angry',
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
  lineId: 'huntHauntChant', line: POLLY_LINES.huntHauntChant, sfx: 'pollySqwawkLaugh',
  holdPerch: false, perchMs: 2200,
};

const CLEAN_SWEEP_FIRST: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'shocked',
  lineId: 'huntCleanSweep', line: POLLY_LINES.huntCleanSweep,
  sfx: null,
  sfxGroup: 'startled',
  holdPerch: false, perchMs: 2000,
};

// Repeat sweeps stay silent: only the first of the run startles her.
const CLEAN_SWEEP_REPEAT: VisitSpec = {
  ...CLEAN_SWEEP_FIRST, kind: 'heckle', sfxGroup: undefined,
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
  exitSfx: 'pollyEmbarrassedExit',
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

const ONE_FEATHER_POSE: Record<string, 'smug' | 'laugh03'> = {
  featherOneLookAtMine: 'smug',
  featherOnePlucked: 'laugh03',
  featherOneAroundHere: 'smug',
  featherOneWait: 'laugh03',
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
