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
  flyPose: 'fly' | 'flyAngry' | 'masterShock' | 'hauntTaunt';
  perchPose: 'smug' | 'laugh' | 'point' | 'shocked' | 'sulk' | 'rattled' | 'masterAngry' | 'hauntTaunt' | 'asleep';
  exitPose?: 'fly' | 'sulk'; // pose held while flying out; defaults to 'fly'
  lineId: PollyLineId | null;
  line: string | null;
  sfx: PollyVisitSfx | null;
  holdPerch: boolean; // terminal beats stay perched until the board unmounts
  perchMs: number;
  perchScale?: number; // multiplies her rendered scale on the perch; defaults to 1 if absent
};

export type PollyBudgetState = {
  busy: boolean;                 // a visit is currently on screen
  heckleUsedThisWord: boolean;   // one heckle visit per word
  wrongSeenThisWord: boolean;    // only the FIRST wrong swipe of a word heckles
  cleanSweepSeenThisRun: boolean;// first cleanSweep of the run is guaranteed
  isSpeedRound: boolean;         // speed rounds suppress heckles entirely
  ghostRunsMissed: number;       // repeated haunt history sharpens body language
  recentLineIds: PollyLineId[];  // last few lines she used, any surface
  lineRoll: number;              // 0–1, supplied by the caller; keeps this file pure
};

export type VisitDecision =
  | { action: 'none' }
  | { action: 'wordEntry' } // caller resets per-word budget flags
  | { action: 'visit'; spec: VisitSpec };

export function pickFreshLine(
  candidates: PollyLineId[],
  recent: PollyLineId[],
  roll: number,
): PollyLineId {
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
  'bossCage', 'bossForYou', 'bossWroteMyself',
  'bossWaiting', 'bossFavorite', 'bossPutWork',
];

const BOSS_ENTRY: VisitSpec = {
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'point',
  // Placeholder — overwritten at the call site with a pickFreshLine draw
  // over BOSS_ENTRY_LINES, same pattern as WRONG_SMUG.
  lineId: 'bossCage', line: POLLY_LINES.bossCage, sfx: 'pollySqwawkShort',
  // Pops in for the entrance line, then flies back out — she does not stay
  // perched through the visible tiles or the hidden gauntlet. Her enlarged
  // (perchScale 1.3) bottom-left perch overlapped and hid gauntlet card
  // text when this held indefinitely (device test 2026-07-31); she instead
  // returns for a separate BOSS_GAUNTLET_THROW beat when the gauntlet
  // actually begins.
  holdPerch: false, perchMs: 4200, perchScale: 1.45,
};

// Fires when the visible boss tiles are cleared and the hidden gauntlet is
// about to begin (see 'allMasksFound' handling below) — she flies back in
// to throw the gauntlet cards, then flies back out so the board is clear
// for the player to read them. No line: this is a physical beat, not a
// dialogue beat. perchMs is a device-unverified starting point sized to
// roughly cover BossGauntletStack's own throw-in animation (~900ms after
// her landing) plus a short beat — re-tune once seen live.
const BOSS_GAUNTLET_THROW: VisitSpec = {
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'point',
  lineId: null, line: null, sfx: 'pollySqwawkShort',
  holdPerch: false, perchMs: 1400, perchScale: 1.3,
};

// She arrives still swinging and collapses in front of the player:
// angry fly-in, hunched landing (runPunch's 'sulk' deflating droop),
// one line, then she sinks off still hunched. Silent on purpose —
// perform.onMasteredSequence already owns this moment's audio and a
// squawk would fight the deflation. perchMs 1600 puts her off screen
// ~400ms before the MASTERED card auto-resolves at 2800ms, on all
// three mastery paths (boss 400/700, haunt 180/550, plain 2600/3450),
// so the card is alone on screen when the run resolves. This
// supersedes the previous silent-defeat treatment, per Pete
// 2026-08-29.
const MASTERED_REACTION: VisitSpec = {
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'sulk',
  exitPose: 'sulk',
  lineId: 'huntMasteredTrapsDiffer',
  line: POLLY_LINES.huntMasteredTrapsDiffer,
  sfx: null,
  holdPerch: false, perchMs: 1600,
};

const HAUNTED_GLOAT: VisitSpec = {
  kind: 'guaranteed', flyPose: 'hauntTaunt', perchPose: 'hauntTaunt',
  lineId: null, line: null, sfx: 'pollySqwawkLaugh',
  holdPerch: true, perchMs: 2500,
};

const RETURNING_HAUNT_GLOAT: VisitSpec = {
  ...HAUNTED_GLOAT,
  sfx: null,
};

// ResultsScreen owns the one terminal Hunt-loss chuckle. Keeping the board
// visit silent prevents the death hold and Results transition from requesting
// the same favorite sound twice.
const GAME_OVER_LAUGH: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'laugh',
  lineId: 'huntLaugh', line: POLLY_LINES.huntLaugh, sfx: null,
  holdPerch: true, perchMs: 2500,
};

// A failed haunt does NOT end the run — she laughs and flies out, unlike
// gameOver which holds the perch (terminal beat).
const HAUNT_FAILED_LAUGH: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'laugh',
  lineId: 'huntLaugh', line: POLLY_LINES.huntLaugh, sfx: 'pollySqwawkLaugh',
  holdPerch: false, perchMs: 2200,
};

const CLEAN_SWEEP_FIRST: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'shocked',
  lineId: 'huntCleanSweep', line: POLLY_LINES.huntCleanSweep,
  sfx: null, // silent recoil — the squawk was overused
  holdPerch: false, perchMs: 2000,
};

const CLEAN_SWEEP_REPEAT: VisitSpec = {
  ...CLEAN_SWEEP_FIRST, kind: 'heckle',
};

const WRONG_SMUG: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'smug',
  lineId: 'huntThoughtSo', line: POLLY_LINES.huntThoughtSo,
  sfx: null, // the wrong swipe itself already squawks in MaskBoard
  holdPerch: false, perchMs: 1800,
};

// Fires on the first wrong swipe of a word — up to ~7 times in a full run,
// which makes it the most-repeated line in the game. Weighted toward quiet
// lines on purpose; the loud ones wear out fastest.
const WRONG_HECKLE_LINES: PollyLineId[] = [
  'huntThoughtSo',
  'huntGotcha',
  'huntThereItIs',
  'huntEveryTime',
  'huntStillWorks',
  'huntPointToMe',
  'huntAllMe',
  'huntGoodIsntIt',
  'huntLoveThisGame',
  'huntMyHouse',
  'huntWalkedRightIn',
  'huntGotMeCrowned',
  'huntZing',
];

// Ten correct in a row. She is losing and covering — the pose is a flinch
// with a forced grin, and every line is her explaining why it doesn't count.
// Heckle, not guaranteed: it is a flourish, and it fires again at twenty.
const STREAK_RATTLED: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'rattled',
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
  // Placeholder — overwritten at the call site, same pattern as WRONG_SMUG.
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

// Two lines only work with her eyes shut, so the pose travels with the line
// rather than being fixed on the spec.
const ONE_FEATHER_POSE: Record<string, 'smug' | 'asleep'> = {
  featherOneLookAtMine: 'smug',
  featherOnePlucked: 'asleep',
  featherOneAroundHere: 'smug',
  featherOneWait: 'asleep',
  featherOneCheck: 'smug',
};

// Guaranteed, not heckle: lives reach 1 exactly once per run (unless a Gold
// Feather revive), and if an earlier heckle on the same word had already
// been spent, a heckle here would be silently dropped — leaving the
// last-feather moment with no reaction at all. sfx is null because this
// fires on a wrong swipe and MaskBoard already squawks there, same reason
// WRONG_SMUG is silent.
const ONE_FEATHER: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'smug',
  lineId: 'featherOneLookAtMine',
  line: POLLY_LINES.featherOneLookAtMine,
  sfx: null,
  holdPerch: false, perchMs: 2000,
};

export function resolveVisit(event: PollyEvent, state: PollyBudgetState): VisitDecision {
  if (event === 'wordEntry') return { action: 'wordEntry' };

  // ── Guaranteed big beats: ignore all budgets ──────────────────
  if (event === 'huntIntro') return { action: 'visit', spec: HUNT_INTRO };
  if (event === 'hauntIntro') return { action: 'visit', spec: HAUNT_INTRO };
  if (event === 'bossEntry') {
    const lineId = pickFreshLine(BOSS_ENTRY_LINES, state.recentLineIds, state.lineRoll);
    return { action: 'visit', spec: { ...BOSS_ENTRY, lineId, line: POLLY_LINES[lineId] } };
  }
  // Only fired by useBoardMechanics on the final-gate step with hidden
  // content — i.e. exclusively the boss-gauntlet-begin beat, never an
  // ordinary word's completion (those fire 'cleanSweep' instead).
  if (event === 'allMasksFound') return { action: 'visit', spec: BOSS_GAUNTLET_THROW };
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

  // ── Heckles: max one per word, dropped (not queued) when blocked ──
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

  return NONE; // everything else: silence is menace
}
