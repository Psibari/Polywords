// Polly's Polybook ledger copy — the work log (left page) and today's entry
// (right page). Every line is transcribed verbatim from
// docs/POLLY_POLYBOOK_LOG_LINES.md. Her lines are AUTHORED, never generated:
// do not write, edit, extend or improve one here. If a line looks wrong,
// report it and change the source doc first.
//
// Shape follows pollyCharacter.ts: one `as const` object of id -> string,
// plus exported id arrays per pool.
//
// Ids exist so a picked line can be suppressed from repeating. They are NOT
// storage keys — a BookDayRecord stores facts (counts and word names), never
// a line id, a sentence, or a bucket name, so rewriting this file strands no
// records. See BookDayRecord in types.ts.
//
// Pure by contract: no React, no AsyncStorage, no Date, no Math.random. The
// roll comes from the caller, same as pollyVisitPolicy.ts.

import { pickFreshLine } from './pollyVisitPolicy';

export const POLLY_BOOK_LINES = {
  // ── 1.1 Quiet day — a gap, nobody played ──────────────────────
  quietScaredOff: 'Scared them off, then.',
  quietNobodyDared: 'Nobody dared. Naturally.',
  quietFrightenedAway: 'Frightened them away.',
  quietKnowBetter: 'No one. They know better.',
  quietWordSpread: 'Word must have spread.',
  quietAfraid: 'Afraid, I expect.',
  quietChampRests: 'The champ rests.',
  quietUnchallenged: 'Champion. Unchallenged.',
  quietNoChallengers: 'No challengers today.',
  quietStayedAway: 'They stayed away. Wise.',
  quietHiding: 'Hiding, I assume.',
  quietNotBrave: 'Not brave enough today.',
  quietUndefeatedAgain: 'Undefeated. Again.',
  quietTooFrightened: 'Too frightened, I expect.',
  quietStillTheChamp: 'I am still the champ.',
  quietChampObviously: 'Champ. Still. Obviously.',
  quietLostNerve: 'They lost their nerve.',
  quietNerveFailed: 'Nerve failed them.',
  quietStillUndefeatedNote: 'Still undefeated. Note it.',
  quietNoTakers: 'No takers. Imagine that.',

  // ── 1.2 Light day — little got past her ───────────────────────
  lightTrapsHeld: 'Traps held. As designed.',
  lightBarelyScratch: 'Barely a scratch.',
  lightHeldTheLine: 'Held the line. Easily.',
  lightGoodDay: 'A good day for me.',
  lightMoreLikeIt: 'That is more like it.',
  lightAsExpected: 'As expected. As always.',
  lightGotNowhere: 'They got nowhere.',
  lightTurnedBack: 'Turned back. Naturally.',
  lightComfortable: 'Comfortable. Very.',
  lightNeverInDoubt: 'Never in doubt.',
  lightRoutine: 'Routine. For me.',
  lightTextbook: 'Textbook. My text.',
  lightHardlyWorthWriting: 'Hardly worth writing.',
  lightAlmostDull: 'Easy. Almost dull.',
  lightCrownStaysPut: 'The crown stays put.',
  lightNotAChance: 'Not a chance today.',
  lightNeverWorried: 'I was never worried.',
  lightInMySleep: 'Did that in my sleep.',
  lightGoodWorkMine: 'Good work. Mine.',
  lightEffortless: 'Effortless, frankly.',
  lightNothingThrough: 'Nothing got through.',
  lightHeldEverything: 'Held everything. Note it.',
  // Same sentence as bossLostBigDeal, deliberately in both pools in the
  // source doc. Two ids, because a pool draw suppresses by id.
  lightBigDeal: 'Big deal.',

  // ── 1.3 Heavy day — a lot got past her ────────────────────────
  heavyBadRoom: 'Bad room. Bad light.',
  heavyTrapsAreFine: 'The traps are fine.',
  heavyOneOfThoseDays: 'One of those days.',
  heavyBlameTheHour: 'I blame the hour.',
  heavyReadStraightThrough: 'Read straight through.',
  heavyNothingHeld: 'Nothing held. Nothing.',
  heavyMyOwnFault: 'My own fault. Probably.',
  heavyPoorBatch: 'A poor batch.',
  heavyHadBetter: 'I have had better.',
  heavyLightWasWrong: 'The light was wrong.',
  heavySloppyWork: 'Sloppy work. Mine.',
  heavyNotFinestHour: 'Not my finest hour.',
  heavyWroteInAHurry: 'Wrote those in a hurry.',
  heavyBatchWasWeak: 'That batch was weak.',
  heavyOffDay: 'An off day. Rare.',
  heavyHingesLoose: 'The hinges were loose.',
  heavyTooGenerous: 'Too generous, clearly.',
  heavyBuiltTired: 'I built those tired.',
  heavyWeakSet: 'Weak set. My weak set.',
  heavyEverythingGaveWay: 'Everything gave way.',
  heavyBadAfternoon: 'A bad afternoon.',
  heavyRewriteThemAll: 'I will rewrite them all.',
  heavyCameToPlay: 'They came to play.',
  heavyMustBeCheating: 'They must be cheating.',
  heavyFoundAWeakness: 'Found a weakness.',
  heavyGettingReal: 'Things are getting real.',

  // ── 1.4 Boss held — she won the boss round ────────────────────
  bossHeldFinally: 'Held the boss. Finally.',
  bossHeldGauntlet: 'The gauntlet held.',
  bossHeldNotThatOne: 'Not that one. Not today.',
  bossHeldStayedShut: 'That one stayed shut.',
  bossHeldKeptLast: 'Kept the last one.',
  bossHeldLastDoor: 'The last door held.',
  bossHeldTurnedBack: 'Turned back at the end.',
  bossHeldNeverLast: 'Not the last one. Never.',
  bossHeldGoodOne: 'The good one held.',
  bossHeldStoppedAtDoor: 'Stopped at the door.',
  bossHeldBestWork: 'My best work, that.',
  bossHeldSoClose: 'So close. Not close.',
  bossHeldBarely: 'Held it. Barely. Held it.',
  bossHeldLastIsMine: 'The last one is mine.',
  bossHeldNowhereNear: 'Nowhere near the end.',

  // ── 1.5 First day ─────────────────────────────────────────────
  firstNewName: 'New name in the book.',
  firstVisitor: "A visitor. We'll see.",
  firstSomeoneNew: 'Someone new. Hm.',
  firstNewOneNoted: 'A new one. Noted.',
  firstAnotherOne: 'Another one. Fine.',
  firstWeShallSee: 'We shall see about this.',

  // ── 1.6 Mercy — the run was revived ───────────────────────────
  // New bucket. Thin — the source doc flags it as needing more lines.
  mercyLetThemLive: 'Let them live. Again.',
  mercyShowedMercy: 'Showed mercy. Again.',
  mercyGenerous: 'I was generous.',
  mercySparedThem: 'Spared them. My choice.',
  mercyLetItGoOn: 'Let it go on. Why not.',
  mercyGaveAnother: 'Gave them another.',
  mercyTooSoft: 'Too soft, as usual.',

  // ── 2.1 Boss lost — the word was mastered ─────────────────────
  bossLostWorstWork: 'My worst work.',
  bossLostWeakSet: 'A weak set, that.',
  bossLostBadlyBuilt: 'Badly built. Mine.',
  bossLostSloppy: 'Sloppy of me.',
  bossLostRushed: 'I rushed that one.',
  bossLostAllThree: 'All three. Fine.',
  bossLostOfAllOnes: 'Of all the ones to lose.',
  bossLostNeverLiked: 'I never liked that set.',
  bossLostPoorHinges: 'Poor hinges on that one.',
  bossLostKeptItBack: 'Should have kept it back.',
  bossLostOldWork: 'Fine. It was old work.',
  bossLostSetWasTired: 'That set was tired.',
  // See lightBigDeal — same sentence, different pool.
  bossLostBigDeal: 'Big deal.',

  // ── 2.2 Haunt left — walked away from ─────────────────────────
  hauntLeftWalkedPast: 'Walked right past it.',
  hauntLeftStanding: 'Left standing.',
  hauntLeftStillShut: 'Still shut. Good.',
  hauntLeftUntouched: 'Untouched. Good.',
  hauntLeftNotToday: 'Not today, then.',
  hauntLeftThatOneHolds: 'That one holds.',
  hauntLeftMissedEntirely: 'Missed entirely.',
  hauntLeftNeverClose: 'Never even close.',

  // ── 2.3 Haunt broken — came back and took it ──────────────────
  hauntBrokenPersistent: 'Back for it. Persistent.',
  hauntBrokenSecondTime: 'Second time, then.',
  hauntBrokenTwiceAsked: 'Twice asked. Fine.',
  hauntBrokenMovedTooLate: 'I moved it too late.',
  hauntBrokenShouldChange: 'Should have changed it.',
  hauntBrokenTheyRemembered: 'They remembered. Hm.',
  hauntBrokenCameBack: 'Came back. Of course.',
  hauntBrokenSettled: 'That one is settled.',
} as const;

export type PollyBookLineId = keyof typeof POLLY_BOOK_LINES;

// ── Work-log pools ──────────────────────────────────────────────
// Left page, 12pt, her hand. One row per day. Every line in a pool must be
// true for ANY day in that bucket — the renderer picks at draw time.

/** 1.1 — a gap, nobody played. */
export const QUIET_DAY: PollyBookLineId[] = [
  'quietScaredOff',
  'quietNobodyDared',
  'quietFrightenedAway',
  'quietKnowBetter',
  'quietWordSpread',
  'quietAfraid',
  'quietChampRests',
  'quietUnchallenged',
  'quietNoChallengers',
  'quietStayedAway',
  'quietHiding',
  'quietNotBrave',
  'quietUndefeatedAgain',
  'quietTooFrightened',
  'quietStillTheChamp',
  'quietChampObviously',
  'quietLostNerve',
  'quietNerveFailed',
  'quietStillUndefeatedNote',
  'quietNoTakers',
];

/** 1.2 — little got past her. */
export const LIGHT_DAY: PollyBookLineId[] = [
  'lightTrapsHeld',
  'lightBarelyScratch',
  'lightHeldTheLine',
  'lightGoodDay',
  'lightMoreLikeIt',
  'lightAsExpected',
  'lightGotNowhere',
  'lightTurnedBack',
  'lightComfortable',
  'lightNeverInDoubt',
  'lightRoutine',
  'lightTextbook',
  'lightHardlyWorthWriting',
  'lightAlmostDull',
  'lightCrownStaysPut',
  'lightNotAChance',
  'lightNeverWorried',
  'lightInMySleep',
  'lightGoodWorkMine',
  'lightEffortless',
  'lightNothingThrough',
  'lightHeldEverything',
  'lightBigDeal',
];

/** 1.3 — a lot got past her. */
export const HEAVY_DAY: PollyBookLineId[] = [
  'heavyBadRoom',
  'heavyTrapsAreFine',
  'heavyOneOfThoseDays',
  'heavyBlameTheHour',
  'heavyReadStraightThrough',
  'heavyNothingHeld',
  'heavyMyOwnFault',
  'heavyPoorBatch',
  'heavyHadBetter',
  'heavyLightWasWrong',
  'heavySloppyWork',
  'heavyNotFinestHour',
  'heavyWroteInAHurry',
  'heavyBatchWasWeak',
  'heavyOffDay',
  'heavyHingesLoose',
  'heavyTooGenerous',
  'heavyBuiltTired',
  'heavyWeakSet',
  'heavyEverythingGaveWay',
  'heavyBadAfternoon',
  'heavyRewriteThemAll',
  'heavyCameToPlay',
  'heavyMustBeCheating',
  'heavyFoundAWeakness',
  'heavyGettingReal',
];

/** 1.4 — she won the boss round. */
export const BOSS_HELD: PollyBookLineId[] = [
  'bossHeldFinally',
  'bossHeldGauntlet',
  'bossHeldNotThatOne',
  'bossHeldStayedShut',
  'bossHeldKeptLast',
  'bossHeldLastDoor',
  'bossHeldTurnedBack',
  'bossHeldNeverLast',
  'bossHeldGoodOne',
  'bossHeldStoppedAtDoor',
  'bossHeldBestWork',
  'bossHeldSoClose',
  'bossHeldBarely',
  'bossHeldLastIsMine',
  'bossHeldNowhereNear',
];

/** 1.5 — the player's first day. */
export const FIRST_DAY: PollyBookLineId[] = [
  'firstNewName',
  'firstVisitor',
  'firstSomeoneNew',
  'firstNewOneNoted',
  'firstAnotherOne',
  'firstWeShallSee',
];

/** 1.6 — the run was revived. Mercy only; the Gold Feather revive is
 *  deliberately not a log bucket (source doc, Part 5). */
export const MERCY: PollyBookLineId[] = [
  'mercyLetThemLive',
  'mercyShowedMercy',
  'mercyGenerous',
  'mercySparedThem',
  'mercyLetItGoOn',
  'mercyGaveAnother',
  'mercyTooSoft',
];

// ── Word-row pools ──────────────────────────────────────────────
// Part 2: the word sits on its own line with her note underneath. Note
// lines never contain the word.

/** 2.1 — the word was mastered, so she lost the boss round. */
export const BOSS_LOST: PollyBookLineId[] = [
  'bossLostWorstWork',
  'bossLostWeakSet',
  'bossLostBadlyBuilt',
  'bossLostSloppy',
  'bossLostRushed',
  'bossLostAllThree',
  'bossLostOfAllOnes',
  'bossLostNeverLiked',
  'bossLostPoorHinges',
  'bossLostKeptItBack',
  'bossLostOldWork',
  'bossLostSetWasTired',
  'bossLostBigDeal',
];

/** 2.2 — a Haunt was walked away from. */
export const HAUNT_LEFT: PollyBookLineId[] = [
  'hauntLeftWalkedPast',
  'hauntLeftStanding',
  'hauntLeftStillShut',
  'hauntLeftUntouched',
  'hauntLeftNotToday',
  'hauntLeftThatOneHolds',
  'hauntLeftMissedEntirely',
  'hauntLeftNeverClose',
];

/** 2.3 — the player came back and took a Haunt. */
export const HAUNT_BROKEN: PollyBookLineId[] = [
  'hauntBrokenPersistent',
  'hauntBrokenSecondTime',
  'hauntBrokenTwiceAsked',
  'hauntBrokenMovedTooLate',
  'hauntBrokenShouldChange',
  'hauntBrokenTheyRemembered',
  'hauntBrokenCameBack',
  'hauntBrokenSettled',
];

export const BOOK_LINE_POOLS = {
  QUIET_DAY,
  LIGHT_DAY,
  HEAVY_DAY,
  BOSS_HELD,
  FIRST_DAY,
  MERCY,
  BOSS_LOST,
  HAUNT_LEFT,
  HAUNT_BROKEN,
} as const;

export type BookLinePoolName = keyof typeof BOOK_LINE_POOLS;

// ── Today's entry, right page ───────────────────────────────────
// Part 3: 15pt, exactly three short lines, roughly nineteen characters a
// line. Keyed by rivalry state. The states have no thresholds yet — nothing
// selects between them in code, and that decision is not made here.

export type BookRivalryState =
  | 'DISMISSIVE'
  | 'AMUSED'
  | 'WATCHFUL'
  | 'RATTLED'
  | 'CONCEDING';

export type BookTodayEntry = readonly [string, string, string];

export const TODAY_ENTRIES: Record<BookRivalryState, readonly BookTodayEntry[]> = {
  DISMISSIVE: [
    ['A visitor.', 'Nothing to note.', 'We shall see.'],
    ['Someone new.', 'They will tire.', 'They always do.'],
    ['A name. No more.', 'Not worth the ink.', 'Next.'],
  ],
  AMUSED: [
    ['Back again.', 'Persistent, at least.', 'Still losing.'],
    ['They keep coming.', 'I keep winning.', 'A fine arrangement.'],
    ['Regular, now.', 'Regularly beaten.', 'Charming.'],
    ['Let us see, then.', 'See what they have.', 'Same as always.'],
  ],
  WATCHFUL: [
    ['This is getting real.', 'The traps are fine.', 'It is the room.'],
    ['Quicker than before.', 'That is all it is.', 'Nothing more.'],
    ['Slower to fall for it.', 'Coincidence.', 'Obviously.'],
  ],
  RATTLED: [
    [
      // TOO WIDE at 15pt — Pete to shorten (measured 164px against 160pt usable)
      'I let them have that.',
      'I was not trying.',
      'Ask anyone.',
    ],
    ['Bad week. Bad light.', 'Bad batch.', 'Not about them.'],
    ['Luck. Repeated luck.', 'Which is still luck.', 'I checked.'],
  ],
  CONCEDING: [
    ['Who am I?', 'I doubt myself now.', 'Truly.'],
    ['I have run out of', 'reasons. So.', 'New traps, then.'],
    [
      // TOO WIDE at 15pt — Pete to shorten (measured 168px against 160pt usable)
      'Nothing I build holds.',
      'Not one of them.',
      'I need better work.',
    ],
  ],
};

// ── Struck-out pairs ────────────────────────────────────────────
// Part 4: an older line she has crossed out, and what she wrote instead.
// Rendered as a strike-through above its replacement.

export type BookStruckPair = { old: string; next: string };

export const STRUCK_PAIRS: readonly BookStruckPair[] = [
  { old: 'The visitor is no trouble.', next: 'Trouble, then.' },
  { old: 'They will tire of it.', next: 'They have not tired.' },
  { old: "Beginner's luck.", next: 'Not luck. Still luck.' },
  { old: 'I am not concerned.', next: 'Still not concerned.' },
  { old: 'A quiet season ahead.', next: 'It has not been quiet.' },
  { old: 'They cannot read.', next: 'They can read.' },
  { old: 'No one lasts a month.', next: 'A month, then.' },
  { old: 'This will not continue.', next: 'It continued.' },
];

/**
 * Draw a work-log line, avoiding anything in `recent`. Thin wrapper over the
 * one picker in pollyVisitPolicy.ts — there is deliberately no second
 * implementation. `roll` is 0–1 and is supplied by the caller so this module
 * stays pure.
 */
export function pickBookLine(
  pool: PollyBookLineId[],
  recent: readonly string[],
  roll: number,
): { lineId: PollyBookLineId; line: string } {
  const lineId = pickFreshLine(pool, recent, roll);
  return { lineId, line: POLLY_BOOK_LINES[lineId] };
}
