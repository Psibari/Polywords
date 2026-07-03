// Pure visit policy for Hunt Polly. RN-free on purpose so it runs under
// plain Node (npx tsx) — do not import react-native or app/hooks here.
//
// Spec: docs/superpowers/specs/2026-07-02-polly-hunt-visits-design.md
// Scarcity is the menace: guaranteed big beats always fire; heckles are
// capped at one visit per word and dropped (never queued) when blocked.

// Same event vocabulary as usePollyAnimator — MaskBoard call sites pass
// these literals and must not change.
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
  | 'hauntFailed'
  | 'oneWrongMove';

export type PollyVisitSfx = 'pollySqwawkShort' | 'pollySqwawkLaugh';

export type VisitSpec = {
  kind: 'guaranteed' | 'heckle';
  flyPose: 'fly' | 'flyAngry';
  perchPose: 'smug' | 'laugh' | 'point' | 'shocked' | 'sulk';
  line: string | null;
  sfx: PollyVisitSfx | null;
  holdPerch: boolean; // terminal beats stay perched until the board unmounts
  perchMs: number;
};

export type PollyBudgetState = {
  busy: boolean;                 // a visit is currently on screen
  heckleUsedThisWord: boolean;   // one heckle visit per word
  wrongSeenThisWord: boolean;    // only the FIRST wrong swipe of a word heckles
  cleanSweepSeenThisRun: boolean;// first cleanSweep of the run is guaranteed
  isSpeedRound: boolean;         // speed rounds suppress heckles entirely
};

export type VisitDecision =
  | { action: 'none' }
  | { action: 'wordEntry' } // caller resets per-word budget flags
  | { action: 'visit'; spec: VisitSpec };

const NONE: VisitDecision = { action: 'none' };

const BOSS_ENTRY: VisitSpec = {
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'point',
  line: 'This word stays mine.', sfx: 'pollySqwawkShort',
  holdPerch: false, perchMs: 2500,
};

const BOSS_MASTERED_SULK: VisitSpec = {
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'sulk',
  line: null, sfx: null, // silent — defeat needs no line
  holdPerch: true, perchMs: 2500,
};

const GAME_OVER_LAUGH: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'laugh',
  line: 'BBBLAAAAHHAHAHA!', sfx: 'pollySqwawkLaugh',
  holdPerch: true, perchMs: 2500,
};

// A failed haunt does NOT end the run — she laughs and flies out, unlike
// gameOver which holds the perch (terminal beat).
const HAUNT_FAILED_LAUGH: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'laugh',
  line: 'BBBLAAAAHHAHAHA!', sfx: 'pollySqwawkLaugh',
  holdPerch: false, perchMs: 2200,
};

const CLEAN_SWEEP_LINE = "Bet you can't do that again.";

const CLEAN_SWEEP_FIRST: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'shocked',
  line: CLEAN_SWEEP_LINE, sfx: null, // silent recoil — the squawk was overused
  holdPerch: false, perchMs: 2000,
};

const CLEAN_SWEEP_REPEAT: VisitSpec = {
  ...CLEAN_SWEEP_FIRST, kind: 'heckle',
};

const WRONG_SMUG: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'smug',
  line: 'Thought so.', sfx: null, // the wrong swipe itself already squawks in MaskBoard
  holdPerch: false, perchMs: 1800,
};

const HESITATION_POINT: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'point',
  line: 'YES... NO... MAYBE SO...', sfx: null,
  holdPerch: false, perchMs: 2000,
};

const GHOST_SMUG: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'smug',
  line: 'Remember me.', sfx: null,
  holdPerch: false, perchMs: 1800,
};

export function resolveVisit(event: PollyEvent, state: PollyBudgetState): VisitDecision {
  if (event === 'wordEntry') return { action: 'wordEntry' };

  // ── Guaranteed big beats: ignore all budgets ──────────────────
  if (event === 'bossEntry') return { action: 'visit', spec: BOSS_ENTRY };
  if (event === 'gateMasteredBoss') return { action: 'visit', spec: BOSS_MASTERED_SULK };
  if (event === 'gameOver') return { action: 'visit', spec: GAME_OVER_LAUGH };
  if (event === 'hauntFailed') return { action: 'visit', spec: HAUNT_FAILED_LAUGH };
  if (event === 'cleanSweep' && !state.cleanSweepSeenThisRun) {
    return { action: 'visit', spec: CLEAN_SWEEP_FIRST };
  }

  // ── Heckles: max one per word, dropped (not queued) when blocked ──
  const heckleBlocked = state.busy || state.heckleUsedThisWord || state.isSpeedRound;
  if (heckleBlocked) return NONE;

  if (event === 'wrong' && !state.wrongSeenThisWord) return { action: 'visit', spec: WRONG_SMUG };
  if (event === 'hesitation6s') return { action: 'visit', spec: HESITATION_POINT };
  if (event === 'ghostEntry') return { action: 'visit', spec: GHOST_SMUG };
  if (event === 'cleanSweep') return { action: 'visit', spec: CLEAN_SWEEP_REPEAT };

  return NONE; // everything else: silence is menace
}
