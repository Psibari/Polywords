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
export const DAILY_ENTRY_RULE = 'FIVE WORDS · TWO LIVES';

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
// Measured 2026-11-03: every line below renders on ONE line at 19 pt in the
// card's 326 pt text column on a 390 pt screen. Three of them wrap on a 320 pt
// screen, which the card's scroll absorbs. Keep new lines inside that budget;
// a wrapped line breaks the one-idea-per-line rhythm the list exists for.
export const DAILY_ENTRY_RULES: readonly string[] = [
  'THREE CLUES COME DOWN, ONE AT A TIME.',
  'SIX WORDS WAIT IN THE WALL.',
  'EVERY TRAP FITS A CLUE.',
  'ONLY ONE WORD FITS ALL THREE.',
  'SWIPE UP TO CLAIM IT.',
  'WAIT AND THE NEXT CLUE COMES FREE.',
  'A WRONG CLAIM COSTS A LIFE.',
];

/**
 * The reward. A win grants one Gold Feather (grantGoldFeather in
 * useGameStore.ts), which expires at the next local midnight and is spent at
 * Hunt game over for an in-place one-feather revive.
 */
export const DAILY_ENTRY_REWARD =
  'Beat all five and you take her GOLD FEATHER — a free life in the Hunt, good until midnight.';

/** The cost of entering. Opening the screen is free; BEGIN DAILY spends the attempt. */
export const DAILY_ENTRY_ATTEMPT = 'One attempt. It starts when you enter.';

/** The commit button, and the same button while the session is being built. */
export const DAILY_ENTRY_BEGIN = 'BEGIN DAILY';
export const DAILY_ENTRY_BEGIN_BUSY = 'OPENING…';

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
