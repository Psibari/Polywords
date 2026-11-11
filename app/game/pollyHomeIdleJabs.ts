// Polly's idle jabs on Home (Pete, 2026-11-11): the alternative to the Home doze,
// which is switched off (HOME_DOZE_ENABLED in PollyHomePerch.tsx). When the
// player just sits on Home she needles them a few times, then goes quiet.
// Pure and RN-free so it runs under plain Node (npx tsx); the line text lives
// in pollyCharacter.ts and the perch (PollyHomePerch.tsx) owns the timers.
//
// Copy is Pete's: he approved every line here and wrote several himself.
// Change the pools only on his word (voice law: docs/POLLY_DIALOGUE_BANK.md).

import type { PollyLineId } from './pollyCharacter';
import type { PollyHomeRestingPose } from './pollyHomeRestingPose';

// All four numbers are TEST VALUES (Claude's first guesses, for Pete to tune on
// his phone). The first jab waits this long after Home is focused (after the
// greeting bubble has gone, on an entrance visit).
export const HOME_IDLE_JAB_FIRST_MS = 10000;
// Start of one jab to the start of the next.
export const HOME_IDLE_JAB_GAP_MS = 20000;
// How long a jab stays up before it fades.
export const HOME_IDLE_JAB_SHOW_MS = 4000;
// After this many she goes quiet until Home is focused again.
export const HOME_IDLE_JAB_MAX_PER_VISIT = 3;
// After the last jab has faded she waits this long, then flies off (TEST VALUE).
export const HOME_IDLE_LEAVE_AFTER_MS = 3000;
// The jab bubble's fade-out, counted before the wait above.
export const HOME_IDLE_JAB_FADE_OUT_MS = 260;
// How many recent jabs are kept out of the next pick.
export const HOME_IDLE_JAB_RECENT_LIMIT = 5;

// Her normal mood: the idle and smug resting poses (the face rig).
export const HOME_IDLE_JABS_NORMAL: readonly PollyLineId[] = [
  'homeIdleScared',
  'homeIdleTickTock',
  'homeIdleTakeYourTime',
  'homeIdleStaring',
  'homeIdleStillDeciding',
  'homeIdleThinking',
  'homeIdlePosing',
  'homeIdleNervous',
  'homeIdleBlink',
  'homeIdleButton',
  'homeIdleAllDay',
  'homeIdleSooo',
  'homeIdleStandHere',
];

// Sore loser: the angry resting pose, shown after the player beat her.
export const HOME_IDLE_JABS_ANGRY: readonly PollyLineId[] = [
  'homeSoreLetYou',
  'homeSoreComfortable',
  'homeSoreEnjoying',
  'homeSoreWipeLook',
  'homeSoreNotMad',
  'homeSoreGloating',
  'homeSoreRematch',
  'homeSoreLookingAt',
  'homeSoreCheater',
  'homeSorePaid',
  'homeSoreAi',
];

// Flustered: the embarrassed resting pose (the rattled profile, a comeback win
// after a rough patch). She is covering for it, not raging.
export const HOME_IDLE_JABS_EMBARRASSED: readonly PollyLineId[] = [
  'homeFlusterNotTrying',
  'homeFlusterMeantTo',
  'homeFlusterCrown',
  'homeFlusterHot',
  'homeFlusterFineFace',
  'homeFlusterMiracles',
  'homeFlusterWhatever',
  'homeFlusterBelieve',
];

export type HomeIdleJabMood = 'normal' | 'angry' | 'embarrassed';

/** Which pool fits her resting pose. Every resting pose has one. */
export function resolveHomeIdleJabMood(pose: PollyHomeRestingPose): HomeIdleJabMood {
  if (pose === 'angry') return 'angry';
  if (pose === 'embarrassed') return 'embarrassed';
  return 'normal';
}

export function homeIdleJabPool(mood: HomeIdleJabMood): readonly PollyLineId[] {
  if (mood === 'angry') return HOME_IDLE_JABS_ANGRY;
  if (mood === 'embarrassed') return HOME_IDLE_JABS_EMBARRASSED;
  return HOME_IDLE_JABS_NORMAL;
}

/**
 * Picks a jab for the mood, skipping the ones in `recent` (falls back to the
 * whole pool if every line is recent). `roll` is 0 to 1, e.g. Math.random().
 */
export function pickHomeIdleJab(
  mood: HomeIdleJabMood,
  recent: readonly PollyLineId[],
  roll: number,
): PollyLineId {
  const pool = homeIdleJabPool(mood);
  const fresh = pool.filter(id => !recent.includes(id));
  const from = fresh.length > 0 ? fresh : pool;
  const index = Math.min(from.length - 1, Math.max(0, Math.floor(roll * from.length)));
  return from[index];
}

/** The recent list after `lineId` is said: newest last, capped. */
export function rememberHomeIdleJab(
  recent: readonly PollyLineId[],
  lineId: PollyLineId,
): PollyLineId[] {
  return [...recent.filter(id => id !== lineId), lineId].slice(-HOME_IDLE_JAB_RECENT_LIMIT);
}

/**
 * The flight pose she leaves on (Pete, 2026-11-11: it follows her mood). Angry
 * leaves angry; smug (she is winning) leaves grinning; idle and embarrassed take
 * the plain flight. The smug and embarrassed choices are Claude's first guess.
 */
export type HomeLeavePose = 'fly' | 'flyAngry' | 'flyGrin';
export function resolveHomeLeavePose(pose: PollyHomeRestingPose): HomeLeavePose {
  if (pose === 'angry') return 'flyAngry';
  if (pose === 'smug') return 'flyGrin';
  return 'fly';
}

/** When she flies off, in ms after the idle clock starts: after the last jab is gone, plus the wait. */
export function homeIdleLeaveMs(): number {
  return (
    homeIdleJabStartMs(HOME_IDLE_JAB_MAX_PER_VISIT - 1) +
    HOME_IDLE_JAB_SHOW_MS +
    HOME_IDLE_JAB_FADE_OUT_MS +
    HOME_IDLE_LEAVE_AFTER_MS
  );
}

/** When jab number `index` (0-based) starts, in ms after the idle clock starts. */
export function homeIdleJabStartMs(index: number): number {
  return HOME_IDLE_JAB_FIRST_MS + index * HOME_IDLE_JAB_GAP_MS;
}
