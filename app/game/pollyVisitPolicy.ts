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

// Generic over the id union so the Polybook's own line ids
// (pollyBookLines.ts) reuse this rather than growing a second picker. Callers
// passing PollyLineId[] are unaffected — T infers to PollyLineId.
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
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'point',
  // Placeholder — overwritten at the call site with a pickFreshLine draw
  // over BOSS_ENTRY_LINES, same pattern as WRONG_SMUG.
  lineId: 'bossCage', line: POLLY_LINES.bossCage, sfx: 'pollySqwawkShort',
  // Pops in for the entrance line, then flies back out — she does not stay
  // perched through the visible tiles or the hidden gauntlet. Keep this
  // boss-specific visit near normal Hunt scale: the old 1.45 multiplier
  // made Polly cover the gauntlet card and collide with her own bubble on
  // device. The shared Hunt stage geometry is otherwise correct, so this is
  // deliberately a visit-level correction rather than a global Polly shrink.
  holdPerch: false, perchMs: 4200, perchScale: 1.05,
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
  // This is the boss-loss payoff, not ordinary gameplay staging. Give the
  // taunt enough visual weight to land after HAUNTED without changing every
  // Hunt visit or the boss-entry safe scale above.
  holdPerch: true, perchMs: 2500, perchScale: 1.24,
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
  'streakFluke',
];

const HESITATION_LINES: PollyLineId[] = [
  'huntHesitationYes',
  'huntHesitationNo',
  'huntHesitationMaybe',
];

function lineSpec(base: VisitSpec, id: PollyLineId): VisitSpec {
  return { ...base, lineId: id, line: POLLY_LINES[id] };
}

function resolveLine(base: VisitSpec, ids: PollyLineId[], state: PollyBudgetState): VisitSpec {
  return lineSpec(base, pickFreshLine(ids, state.recentLineIds, state.lineRoll));
}

export function resolveVisit(event: PollyEvent, state: PollyBudgetState): VisitDecision {
  switch (event) {
    case 'wordEntry':
      return { action: 'wordEntry' };
    case 'huntIntro':
      return { action: 'visit', spec: HUNT_INTRO };
    case 'hauntIntro':
      return { action: 'visit', spec: HAUNT_INTRO };
    case 'bossEntry':
      return { action: 'visit', spec: resolveLine(BOSS_ENTRY, BOSS_ENTRY_LINES, state) };
    case 'ghostEntry':
      return { action: 'visit', spec: resolveLine({
        kind: 'guaranteed', flyPose: 'fly',
        perchPose: state.ghostRunsMissed >= 2 ? 'point' : 'smug',
        lineId: 'huntHauntRemember', line: POLLY_LINES.huntHauntRemember,
        sfx: 'pollySqwawkShort', holdPerch: false, perchMs: 2300,
      }, ['huntHauntRemember'], state) };
    case 'ghostFoundLate':
      return { action: 'visit', spec: {
        kind: 'guaranteed', flyPose: 'fly', perchPose: 'laugh',
        lineId: 'huntHauntLucky', line: POLLY_LINES.huntHauntLucky,
        sfx: 'pollySqwawkShort', holdPerch: false, perchMs: 1800,
      } };
    case 'ghostDissolved':
      return NONE;
    case 'correct':
      return NONE;
    case 'allMasksFound':
      // The old gauntlet "throw" return was cut. Polly does NOT fly back in
      // when the hidden gauntlet begins. Boss entry already gave her the
      // one pre-gauntlet appearance; this beat belongs to the cards.
      return NONE;
    case 'hiddenFound':
      return NONE;
    case 'cleanSweep':
      return { action: 'visit', spec: state.cleanSweepSeenThisRun ? CLEAN_SWEEP_REPEAT : CLEAN_SWEEP_FIRST };
    case 'wrong':
      if (state.isSpeedRound || state.heckleUsedThisWord || state.wrongSeenThisWord || state.busy) return NONE;
      return { action: 'visit', spec: resolveLine(WRONG_SMUG, WRONG_HECKLE_LINES, state) };
    case 'oneHeartLeft':
      if (state.isSpeedRound || state.heckleUsedThisWord || state.wrongSeenThisWord || state.busy) return NONE;
      return { action: 'visit', spec: resolveLine(WRONG_SMUG, WRONG_HECKLE_LINES, state) };
    case 'oneWrongMove':
      return NONE;
    case 'hesitation3s':
      if (state.isSpeedRound || state.heckleUsedThisWord || state.busy) return NONE;
      return { action: 'visit', spec: resolveLine({ ...WRONG_SMUG, perchPose: 'point' }, HESITATION_LINES, state) };
    case 'hesitation6s':
    case 'hesitation9s':
    case 'hesitationCleared':
      return NONE;
    case 'streakX10':
      if (state.isSpeedRound || state.busy) return NONE;
      return { action: 'visit', spec: resolveLine(STREAK_RATTLED, STREAK_LINES, state) };
    case 'gameOver':
      return { action: 'visit', spec: GAME_OVER_LAUGH };
    case 'gateMastered':
    case 'gateMasteredBoss':
      return { action: 'visit', spec: MASTERED_REACTION };
    case 'hiddenMasterFailed':
      return { action: 'visit', spec: HAUNTED_GLOAT };
    case 'hauntMasterFailed':
      return { action: 'visit', spec: RETURNING_HAUNT_GLOAT };
    case 'hauntFailed':
      return { action: 'visit', spec: HAUNT_FAILED_LAUGH };
  }
}
