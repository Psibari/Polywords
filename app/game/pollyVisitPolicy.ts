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
  | 'hauntFailed'
  | 'oneWrongMove'
  | 'huntIntro';

export type PollyVisitSfx = 'pollySqwawkShort' | 'pollySqwawkLaugh';

export type VisitSpec = {
  kind: 'guaranteed' | 'heckle';
  flyPose: 'fly' | 'flyAngry';
  perchPose: 'smug' | 'laugh' | 'point' | 'shocked' | 'sulk';
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
};

export type VisitDecision =
  | { action: 'none' }
  | { action: 'wordEntry' } // caller resets per-word budget flags
  | { action: 'visit'; spec: VisitSpec };

const NONE: VisitDecision = { action: 'none' };

const HUNT_INTRO: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'point',
  lineId: 'huntIntro', line: POLLY_LINES.huntIntro, sfx: 'pollySqwawkShort',
  holdPerch: false, perchMs: 2500,
};

const BOSS_ENTRY: VisitSpec = {
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'point',
  lineId: 'huntBossMine', line: POLLY_LINES.huntBossMine, sfx: 'pollySqwawkShort',
  // Pops in for the entrance line, then flies back out — she does not stay
  // perched through the visible tiles or the hidden gauntlet. Her enlarged
  // (perchScale 1.3) bottom-left perch overlapped and hid gauntlet card
  // text when this held indefinitely (device test 2026-07-31); she instead
  // returns for a separate BOSS_GAUNTLET_THROW beat when the gauntlet
  // actually begins.
  holdPerch: false, perchMs: 3400, perchScale: 1.3,
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

const BOSS_MASTERED_SULK: VisitSpec = {
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'sulk',
  lineId: null, line: null, sfx: null, // silent — defeat needs no line
  holdPerch: true, perchMs: 2500,
};

// Sound-free by design: ResultsScreen reliably plays pollySqwawkLaugh once on
// mount, before this visit's board can ever unmount. Giving this spec its own
// sfx raced that reliable copy — MaskBoard sometimes stays mounted long enough
// for the visit's own delayed playSfx to also fire, doubling the laugh.
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

export function resolveVisit(event: PollyEvent, state: PollyBudgetState): VisitDecision {
  if (event === 'wordEntry') return { action: 'wordEntry' };

  // ── Guaranteed big beats: ignore all budgets ──────────────────
  if (event === 'huntIntro') return { action: 'visit', spec: HUNT_INTRO };
  if (event === 'bossEntry') return { action: 'visit', spec: BOSS_ENTRY };
  // Only fired by useBoardMechanics on the final-gate step with hidden
  // content — i.e. exclusively the boss-gauntlet-begin beat, never an
  // ordinary word's completion (those fire 'cleanSweep' instead).
  if (event === 'allMasksFound') return { action: 'visit', spec: BOSS_GAUNTLET_THROW };
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
