// Every word on the Daily's entry card (the BEGIN DAILY gate in
// DailyChallengeScreen). Pete's wording (2026-11-03): change it only on his
// word.
//
// This card is the Daily's ONLY teaching surface. There is no Daily onboarding
// state anywhere in the app, and the card shows before every attempt, so it is
// written to be read on day one and skimmed on day two hundred.
//
// Two rulings behind the wording:
//  - It is POLLY'S challenge. She authored the traps; the card says so, and the
//    win card already answers it with YOU BEAT POLLY'S CHALLENGE.
//  - The Daily's two chances are LIVES, not feathers, even though the HUD draws
//    them as two feathers. The reward is a GOLD FEATHER, so on this card the
//    word "feather" means the reward and nothing else.
//
// Nothing here may promise what the content cannot keep. In particular the
// clues are NOT reliably ordered easiest-last: docs/DAILY_CONTENT_WRITING_STANDARD.md
// orders them hardest to easiest only "when that improves the progression".

/** Small label above the title. `number` is today's challenge number. */
export function dailyEntryKicker(number: number): string {
  return `DAILY #${number}`;
}

/** The card's title. Deliberately not DAILY_CLUE_TITLE: the kicker already says DAILY. */
export const DAILY_ENTRY_TITLE = "POLLY'S CHALLENGE";

/** The one-line rule under the title. */
export const DAILY_ENTRY_RULE = 'FIVE ROUNDS • TWO LIVES';

/** Polly's framing, above the mechanics. */
export const DAILY_ENTRY_INTRO = 'Polly sets the traps. One challenge a day.';

/**
 * How it works, one idea per line so three clues read as three.
 * Every line is verified against app/game/dailyChallengeEngine.ts:
 *  - three clues, clue 1 immediate, 2 at 4s, 3 at 8s (free, no cost)
 *  - six candidate cards per round
 *  - a wrong claim costs one life and reveals the next clue immediately
 *  - UP only; there is no reject swipe and no tap-submit
 */
// Pete's wording, 2026-11-04. A capitalised opener carries each line's verb
// and the rest stays sentence case, so the eye lands on the action.
// Measured: every line renders on ONE line at 19 pt in the card's 326 pt text
// column on a 390 pt screen. Keep new lines inside that budget; a wrapped line
// breaks the one-idea-per-line rhythm the list exists for.
//
// Verified against app/game/dailyChallengeEngine.ts:
//  - three clues, clue 1 immediate, 2 at 4s, 3 at 8s, all free
//  - six candidate cards per round, the target exactly once
//  - a wrong claim costs one of the two lives and reveals the next clue
//  - UP only; there is no reject swipe and no tap-submit
export const DAILY_ENTRY_RULES: readonly string[] = [
  'THREE CLUES. SIX WORDS. ONE ANSWER.',
  'Clues appear one at a time.',
  'Only one word fits all three.',
  'SWIPE UP to claim your answer.',
  'WAIT for another clue, free.',
  'WRONG ANSWER costs one life.',
];

/**
 * The reward, in two parts: the shout, then what it actually is. A win grants
 * one Gold Feather (grantGoldFeather in useGameStore.ts), which expires at the
 * next local midnight and is spent at Hunt game over for an in-place
 * one-feather revive.
 */
export const DAILY_ENTRY_REWARD = 'BEAT ALL FIVE TO WIN A GOLD FEATHER!';
export const DAILY_ENTRY_REWARD_SUB = 'One free Hunt life, good until midnight.';

/** The cost of entering. Opening the screen is free; BEGIN DAILY spends the attempt. */
export const DAILY_ENTRY_ATTEMPT = 'One attempt. Starts when you enter.';

/** The commit button, and the same button while the session is being built. */
export const DAILY_ENTRY_BEGIN = 'ACCEPT CHALLENGE';
export const DAILY_ENTRY_BEGIN_BUSY = 'OPENING…';

/**
 * The jab, the last line on the card. It shows on BOTH cards: the short one is
 * the card a player actually sees every day (Pete, 2026-11-04).
 *
 * VOICE: these are the GAME needling the player ABOUT Polly, not Polly
 * speaking. Third person on purpose — "a cartoon bird", "Polly's respect",
 * "five of them are Polly's". Do not "fix" them into first person; an earlier
 * draft did and Pete rejected it, because in her own mouth a line like
 * "five of them are mine" reads as the rules explaining themselves instead of
 * the game having a dig. Polly's own dialogue, which IS first person, lives in
 * docs/POLLY_DIALOGUE_BANK.md and is governed separately.
 *
 * A pool rather than one line, because a fixed jab read every morning stops
 * being a jab and becomes furniture. Add more whenever; no code changes.
 *
 * Measured 2026-11-04: each fits ONE line at 18 pt in the card's 326 pt text
 * column on a 390 pt screen. All but the shortest wrap to two on a 320 pt
 * screen, which is accepted — the jab is the last element and the card scrolls.
 *
 * Every line is Pete's, approved verbatim 2026-11-04. Nothing here may claim
 * anything the game does not do: no difficulty tells, no hint at an answer, and
 * nothing about how many players have solved today (the app cannot know).
 */
export const DAILY_ENTRY_TAUNTS: readonly string[] = [
  'TRY NOT TO LOSE TO A CARTOON BIRD.',
  'EENY, MEENY, MINY, MO IS NOT A STRATEGY.',
  "WIN THE FEATHER. NOT POLLY'S RESPECT.",
  'ARE YOU ALLERGIC TO FEATHERS?',
  "SIX WORDS. FIVE OF THEM ARE POLLY'S.",
  'THREE CLUES IS FAIR. AND EMBARRASSING.',
];

/**
 * The first-run card's jab never rotates (Pete, 2026-11-04): the long card is
 * seen once, so it gets the signature line. The pool above belongs to the short
 * card, the one a player sees every morning.
 */
export const DAILY_ENTRY_TAUNT_FIRST = 'TRY NOT TO LOSE TO A CARTOON BIRD.';

/**
 * Today's jab. Keyed to the challenge number, not a random pick, so it is the
 * same line all day no matter how many times the player opens, backs out with
 * NOT NOW, or reopens the rules — and a different one tomorrow.
 */
export function dailyEntryTaunt(challengeNumber: number): string {
  const pool = DAILY_ENTRY_TAUNTS;
  if (pool.length === 0) return '';
  const index = Math.abs(Math.trunc(challengeNumber)) % pool.length;
  return pool[index] ?? '';
}

/**
 * Opens the rules again on the short returning card (Pete, 2026-11-03: "a
 * button that explains the rules if they want to know... so they'll never have
 * to guess if they don't remember it"). It reveals exactly the lines above, so
 * the explanation has one source and can never drift from the first-run card.
 * Not shown on the first-run card, where the rules are already open.
 */
export const DAILY_ENTRY_RULES_SHOW = 'HOW TO PLAY';
export const DAILY_ENTRY_RULES_HIDE = 'HIDE RULES';
export const DAILY_ENTRY_RULES_A11Y_SHOW = 'Show how the Daily Challenge works';
export const DAILY_ENTRY_RULES_A11Y_HIDE = 'Hide how the Daily Challenge works';

/** The way out without spending the attempt. */
export const DAILY_ENTRY_LEAVE = 'NOT NOW';
