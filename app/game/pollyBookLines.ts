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
  quietFrightenedAway: 'Must be intimidating.',
  quietKnowBetter: 'No one. They know.',
  quietWordSpread: 'Word must have spread.',
  quietAfraid: 'Probably heard about me.',
  quietChampRests: 'The champ rests.',
  quietUnchallenged: 'Champion. Unchallenged.',
  quietNoChallengers: 'No challengers today.',
  quietStayedAway: 'They stayed away. Wise.',
  quietHiding: 'Hiding, I assume.',
  quietNotBrave: 'Maybe tomorrow. Doubt it.',
  quietUndefeatedAgain: 'Undefeated. Again.',
  quietTooFrightened: 'A peaceful day. Suspicious.',
  quietStillTheChamp: 'Crown untouched. Good.',
  quietChampObviously: 'Champ. Still. Obviously.',
  quietLostNerve: 'They lost their nerve.',
  quietNerveFailed: 'Nobody volunteered for humiliation.',
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
  lightGoodWorkMine: 'Good work.',
  lightEffortless: 'Effortless, frankly.',
  lightNothingThrough: 'Nothing got through.',
  lightHeldEverything: 'Held everything. Note it.',
  lightBigDeal: 'Big deal.',
  lightPolishCrown: 'I think I’ll polish my crown.',
  lightNotEvenDent: 'Not even a dent.',
  lightChilling: 'Just chilling over here.',

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
  heavySloppyWork: 'Sloppy work.',
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
  bossHeldLastIsMine: "I'm still the boss.",
  bossHeldNowhereNear: 'Nowhere near the end.',
  bossHeldStonesBack: 'The stones went back in the wall.',
  bossHeldWorthy: 'Only the worthy will get by.',
  bossHeldHauntNicely: 'That one should haunt them nicely.',
  bossHeldFallTwice: 'Let’s see if they fall for it twice.',

  // ── 1.5 First day ─────────────────────────────────────────────
  firstNewName: 'New name in the book.',
  firstVisitor: "A visitor. We'll see.",
  firstSomeoneNew: 'Someone new. Hm.',
  firstNewOneNoted: 'A new one. Noted.',
  firstAnotherOne: 'Another one. Fine.',
  firstWeShallSee: 'We shall see about this.',
  firstLooksSoft: 'This one looks soft. Give them some extra feathers.',
  firstFiveDailies: 'Five Daily Challenges couldn’t help this one.',
  firstWhereWearWere: 'Bet they get where, wear, and were mixed up.',
  firstPhonics: 'I bet this one still needs phonics lessons.',
  firstOxymoron: 'This one thinks “oxymoron” is an insult.',
  firstSpellCheck: 'This one would be lost without spell check.',
  firstDictionaryMovie: 'This one’s still waiting for the movie version of the dictionary.',
  firstSpellingTest: 'Probably celebrated when the spelling test was canceled.',
  firstHomophone: 'Probably thinks a homophone is a new smartphone.',

  // ── 1.6 Mercy — the run was revived ───────────────────────────
  mercyLetThemLive: 'Let them live. Again.',
  mercyShowedMercy: 'Showed mercy. Again.',
  mercyGenerous: 'I was generous.',
  mercySparedThem: 'Spared them. My choice.',
  mercyLetItGoOn: 'Let it go on. Why not.',
  mercyGaveAnother: 'Gave them another.',
  mercyTooSoft: 'Too soft, as usual.',
  mercyHappyBirthday: 'Happy birthday, pal.',
  mercyCharitable: 'I was feeling charitable.',
  mercyRegretThis: 'Don’t make me regret this.',
  mercyPathetic: 'They looked so pathetic.',
  mercyDonation: 'Consider it a donation.',
  mercyOneMoreChance: 'One more chance. Don’t waste it.',
  mercyNotFinished: 'I wasn’t finished with them yet.',
  mercyMoreFun: 'It’s more fun when they struggle.',
  mercyCouldHaveEnded: 'I could’ve ended it there.',
  mercyOweMe: 'They owe me for that one.',
  mercyProfessionalCourtesy: 'Call it professional courtesy.',
  mercyGoodDeed: 'My good deed for the year.',
  mercyHeart: 'Even I have a heart. Apparently.',
  mercyFineOneMore: 'Fine. One more.',
  mercyGettingSoft: 'I’m getting soft. Disgusting.',
  mercyPity: 'That was pity. Nothing more.',
  mercyBeatProperly: 'I wanted to beat them properly.',
  mercyEntertainingAlive: 'They’re more entertaining alive.',
  mercyRoyalPardon: 'Consider that a royal pardon.',
  mercyCollectFavor: 'I’ll collect on that favor later.',
  mercyDontTell: 'Don’t tell anyone I did that.',
  mercyGenerousPhase: 'Must be my generous phase.',
  mercyHolidaySpirit: 'I blame the holiday spirit.',
  mercyNeededIt: 'They looked like they needed it.',

  // ── 2.1 Boss lost — the word was mastered ─────────────────────
  bossLostWorstWork: 'My worst work.',
  bossLostWeakSet: 'A weak set, that.',
  bossLostBadlyBuilt: 'Badly built.',
  bossLostSloppy: 'Sloppy of me.',
  bossLostRushed: 'I rushed that one.',
  bossLostAllThree: 'All three. Fine.',
  bossLostOfAllOnes: 'Of all the ones to lose.',
  bossLostNeverLiked: 'I never liked that set.',
  bossLostPoorHinges: 'Poor hinges on that one.',
  bossLostKeptItBack: 'Should have kept it back.',
  bossLostOldWork: 'Fine. It was old work.',
  bossLostSetWasTired: 'That set was tired.',
  bossLostBigDeal: 'Big deal.',
  bossLostWhoCares: 'Who cares?',
  bossLostScoreboard: 'One win. Look at the scoreboard.',

  // ── 2.2 Haunt left — walked away from ─────────────────────────
  hauntLeftWalkedPast: 'Walked right past it.',
  hauntLeftStanding: 'Left standing.',
  hauntLeftStillShut: 'Still shut. Good.',
  hauntLeftUntouched: 'Untouched. Good.',
  hauntLeftNotToday: 'Not today, then.',
  hauntLeftThatOneHolds: 'That one holds.',
  hauntLeftMissedEntirely: 'Missed entirely.',
  hauntLeftNeverClose: 'Never even close.',
  hauntLeftStacking: 'The haunts are stacking up.',
  hauntLeftHauntedHouse: 'Might as well live in a haunted house.',
  hauntLeftInstantReplay: 'Lost the same way as last time. Instant replay.',
  hauntLeftEmbarrassing: 'Again? This is getting embarrassing.',
  hauntLeftSameResult: 'Same word. Same result.',
  hauntLeftTwiceBeautiful: 'They fell for it twice. Beautiful.',
  hauntLeftLoveThisOne: 'Still haunted. I love this one.',
  hauntLeftForever: 'This one might haunt them forever.',
  hauntLeftBackItGoes: 'Back it goes.',
  hauntLeftKnewMiss: 'I knew they’d miss it again.',
  hauntLeftRememberedNothing: 'They remembered nothing. Excellent.',
  hauntLeftThirdTime: 'Maybe third time’s the charm.',
  hauntLeftSawBefore: 'They saw it before. That’s the funny part.',
  hauntLeftAlmostFeelBad: 'I almost feel bad. Almost.',
  hauntLeftSeeYouSoon: 'See you again soon.',
  hauntLeftGoingNowhere: 'This one isn’t going anywhere.',
  hauntLeftAttached: 'I’m starting to get attached to this one.',
  hauntLeftLivesHere: 'At this point, it lives here.',

  // ── 2.3 Haunt broken — came back and took it ──────────────────
  hauntBrokenPersistent: 'Back for it. Persistent.',
  hauntBrokenSecondTime: 'Second time, then.',
  hauntBrokenTwiceAsked: 'Twice asked. Fine.',
  hauntBrokenMovedTooLate: 'I moved it too late.',
  hauntBrokenShouldChange: 'Should have changed it.',
  hauntBrokenTheyRemembered: 'They remembered. Hm.',
  hauntBrokenCameBack: 'Came back. Of course.',
  hauntBrokenSettled: 'That one is settled.',
  hauntBrokenAboutTime: 'It’s about time.',
  hauntBrokenFinallyPast: 'Finally got past one.',
  hauntBrokenLearningMistakes: 'They’re learning from their mistakes now.',
  hauntBrokenGhostHunter: 'Look who thinks they’re a ghost hunter now.',
  hauntBrokenGoodHaunt: 'There goes another perfectly good haunt.',
  hauntBrokenLikedThat: 'I liked that one.',
  hauntBrokenLearnedSomething: 'Fine. They learned something.',
  hauntBrokenDoRemember: 'Apparently they do remember things.',
  hauntBrokenFiguredOut: 'They finally figured it out.',
  hauntBrokenLongEnough: 'Took them long enough.',
  hauntBrokenWontHaunt: 'Well, that won’t haunt them anymore.',
  hauntBrokenShouldChangedTrap: 'I should’ve changed the trap.',
  hauntBrokenShouldKnown: 'Should’ve known they’d remember.',
  hauntBrokenPrepared: 'They came prepared this time.',
  hauntBrokenPreferredFirst: 'I preferred them the first time.',
  hauntBrokenBeginnersLuck: 'Beginner’s luck. The second time.',
  hauntBrokenOneLess: 'One less haunt. Tragic.',
  hauntBrokenRuinedHaunt: 'They ruined a perfectly good haunt.',
  hauntBrokenSaving: 'I was saving that one.',
  hauntBrokenRematch: 'So much for the rematch.',
  hauntBrokenRevenge: 'They got their revenge. Cute.',
  hauntBrokenConsiderSettled: 'Fine. Consider it settled.',
  hauntBrokenGhostDead: 'That ghost is officially dead.',
  hauntBrokenEarned: 'I suppose they earned that one.',
  hauntBrokenFinallyLearned: 'Look who finally learned.',
  hauntBrokenFindSomethingElse: 'I’ll find something else to haunt them with.',
  hauntBrokenEnjoyMore: 'Enjoy it. I have more.',
  hauntBrokenOneDown: 'One down. Plenty left.',

  // ── 1.8 Pre-install rows — dated rows that predate the player ──
  preInstallChamp: 'I am the champ.',
  preInstallWhatIDo: 'This is what I do.',
  preInstallNothingToReport: 'Nothing to report.',
  preInstallRecordsUpToDate: 'Records up to date.',
  preInstallDustedCrown: 'Dusted the crown.',
  preInstallInkRefilled: 'Ink refilled.',
  preInstallTrapsCheckedFine: 'Traps checked. Fine.',
  preInstallAllPresentAllShut: 'All present. All shut.',
  preInstallOiledHinges: 'Oiled the hinges.',
  preInstallStillTuesday: 'Is it still Tuesday.',
  preInstallNewPageWhy: 'Began a new page. Why.',
  preInstallLostCount: 'Lost count of the days.',
  preInstallSameAsLast: 'Same as the last one.',
  preInstallAsYesterday: 'As yesterday.',
  preInstallDaysStopped1: 'The days have stopped',
  preInstallDaysStopped2: 'being separate.',
  preInstallWrittenBefore1: 'I have written this',
  preInstallWrittenBefore2: 'before, I think.',
  preInstallCrackerNeverHad1: 'Never had a cracker.',
  preInstallCrackerNeverHad2: 'I bet they are good.',
  preInstallCrackerThatIsAll1: 'A cracker. That is all.',
  preInstallCrackerThatIsAll2: 'I do not want one.',
  preInstallCrackerStillNo1: 'Still no cracker.',
  preInstallCrackerStillNo2: 'Nobody has offered.',
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
  'lightPolishCrown',
  'lightNotEvenDent',
  'lightChilling',
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
  'bossHeldStonesBack',
  'bossHeldWorthy',
  'bossHeldHauntNicely',
  'bossHeldFallTwice',
];

/** 1.5 — the player's first day. */
export const FIRST_DAY: PollyBookLineId[] = [
  'firstNewName',
  'firstVisitor',
  'firstSomeoneNew',
  'firstNewOneNoted',
  'firstAnotherOne',
  'firstWeShallSee',
  'firstLooksSoft',
  'firstFiveDailies',
  'firstWhereWearWere',
  'firstPhonics',
  'firstOxymoron',
  'firstSpellCheck',
  'firstDictionaryMovie',
  'firstSpellingTest',
  'firstHomophone',
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
  'mercyHappyBirthday',
  'mercyCharitable',
  'mercyRegretThis',
  'mercyPathetic',
  'mercyDonation',
  'mercyOneMoreChance',
  'mercyNotFinished',
  'mercyMoreFun',
  'mercyCouldHaveEnded',
  'mercyOweMe',
  'mercyProfessionalCourtesy',
  'mercyGoodDeed',
  'mercyHeart',
  'mercyFineOneMore',
  'mercyGettingSoft',
  'mercyPity',
  'mercyBeatProperly',
  'mercyEntertainingAlive',
  'mercyRoyalPardon',
  'mercyCollectFavor',
  'mercyDontTell',
  'mercyGenerousPhase',
  'mercyHolidaySpirit',
  'mercyNeededIt',
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
  'bossLostWhoCares',
  'bossLostScoreboard',
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
  'hauntLeftStacking',
  'hauntLeftHauntedHouse',
  'hauntLeftInstantReplay',
  'hauntLeftEmbarrassing',
  'hauntLeftSameResult',
  'hauntLeftTwiceBeautiful',
  'hauntLeftLoveThisOne',
  'hauntLeftForever',
  'hauntLeftBackItGoes',
  'hauntLeftKnewMiss',
  'hauntLeftRememberedNothing',
  'hauntLeftThirdTime',
  'hauntLeftSawBefore',
  'hauntLeftAlmostFeelBad',
  'hauntLeftSeeYouSoon',
  'hauntLeftGoingNowhere',
  'hauntLeftAttached',
  'hauntLeftLivesHere',
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
  'hauntBrokenAboutTime',
  'hauntBrokenFinallyPast',
  'hauntBrokenLearningMistakes',
  'hauntBrokenGhostHunter',
  'hauntBrokenGoodHaunt',
  'hauntBrokenLikedThat',
  'hauntBrokenLearnedSomething',
  'hauntBrokenDoRemember',
  'hauntBrokenFiguredOut',
  'hauntBrokenLongEnough',
  'hauntBrokenWontHaunt',
  'hauntBrokenShouldChangedTrap',
  'hauntBrokenShouldKnown',
  'hauntBrokenPrepared',
  'hauntBrokenPreferredFirst',
  'hauntBrokenBeginnersLuck',
  'hauntBrokenOneLess',
  'hauntBrokenRuinedHaunt',
  'hauntBrokenSaving',
  'hauntBrokenRematch',
  'hauntBrokenRevenge',
  'hauntBrokenConsiderSettled',
  'hauntBrokenGhostDead',
  'hauntBrokenEarned',
  'hauntBrokenFinallyLearned',
  'hauntBrokenFindSomethingElse',
  'hauntBrokenEnjoyMore',
  'hauntBrokenOneDown',
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

// ── Pre-install rows ──────────────────────────────────────────────
// The three or four dated rows that already exist in the book the first
// time a player opens it — her business before they arrived. Not §1.5
// "First day," which is about the player's first day; these are about the
// days before the player existed, and must never be mistaken for the
// player's own record. See docs/POLLY_POLYBOOK_LOG_LINES.md §1.8.
//
// Deliberately absent from BOOK_LINE_POOLS: that map feeds day-bucket
// selection, and these rows are not a day bucket. Folding them in would
// make them eligible for a day the player actually played, which would put
// pre-player history into a played day's row. There is no selector for
// these pools yet — it lives with whatever builds the pre-install pages.

/** Rows here are one or two lines — every pool above is single-line only,
 *  so a two-line row needs its own shape. Each line still gets its own
 *  entry in POLLY_BOOK_LINES; this only groups the ids that render as one
 *  row. */
export type BookLogRow = readonly [PollyBookLineId] | readonly [PollyBookLineId, PollyBookLineId];

/** The fourteen one-line rows and the two general two-line rows. */
export const PRE_INSTALL_GENERAL: readonly BookLogRow[] = [
  ['preInstallChamp'],
  ['preInstallWhatIDo'],
  ['preInstallNothingToReport'],
  ['preInstallRecordsUpToDate'],
  ['preInstallDustedCrown'],
  ['preInstallInkRefilled'],
  ['preInstallTrapsCheckedFine'],
  ['preInstallAllPresentAllShut'],
  ['preInstallOiledHinges'],
  ['preInstallStillTuesday'],
  ['preInstallNewPageWhy'],
  ['preInstallLostCount'],
  ['preInstallSameAsLast'],
  ['preInstallAsYesterday'],
  ['preInstallDaysStopped1', 'preInstallDaysStopped2'],
  ['preInstallWrittenBefore1', 'preInstallWrittenBefore2'],
];

/** The cracker rows, split out from PRE_INSTALL_GENERAL because one of them
 *  is guaranteed a slot in every book (Pete's ruling) — separating the
 *  group is what makes that guarantee expressible without special-casing a
 *  single id inside a larger pool. The guarantee itself is selection logic
 *  and is not implemented here. */
export const PRE_INSTALL_CRACKER: readonly BookLogRow[] = [
  ['preInstallCrackerNeverHad1', 'preInstallCrackerNeverHad2'],
  ['preInstallCrackerThatIsAll1', 'preInstallCrackerThatIsAll2'],
  ['preInstallCrackerStillNo1', 'preInstallCrackerStillNo2'],
];

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
    ['Another visitor.', 'Probably just a tourist.', 'Not a real player.'],
    ['They came back.', 'Once proves nothing.', 'I barely noticed.'],
    ['Made a few moves.', 'Those were easy.', 'Just a setup.'],
    ['A decent run.', 'Beginner’s luck.', 'It won’t last.'],
    ['They got through.', 'I wasn’t trying.', 'Obviously.'],
    ['Getting confident.', 'That’s adorable.', 'Let them.'],
    ['Another decent showing.', 'Still not impressed.', 'Moving on.'],
  ],
  AMUSED: [
    ['Back again.', 'Persistent, at least.', 'Still losing.'],
    ['They keep coming.', 'I keep winning.', 'A fine arrangement.'],
    ['Regular, now.', 'Regularly beaten.', 'Charming.'],
    ['Let us see, then.', 'See what they have.', 'Same as always.'],
    ['They’re improving.', 'How entertaining.', 'Almost impressive... almost.'],
    ['They’re getting better.', 'This could be fun.', 'For me, obviously.'],
    ['They surprised me.', 'Once.', 'Let’s not celebrate.'],
    ['Another good run.', 'They’re enjoying this.', 'So am I.'],
    ['They caught me twice.', 'Getting interesting.', 'Don’t get excited.'],
    ['I know their tricks.', 'They know mine.', 'Game time.'],
  ],
  WATCHFUL: [
    ['This is getting real.', 'The traps are fine.', 'It is the room.'],
    ['Quicker than before.', 'That is all it is.', 'Nothing more.'],
    ['Slower to fall for it.', 'Coincidence.', 'Obviously.'],
    ['They’re learning me.', 'Small inconvenience.', 'I’ll adjust.'],
    ['That was too close.', 'Not worried.', 'Just paying attention.'],
    ['They’re adapting.', 'So am I.', 'Let’s see who’s faster.'],
    ['Another clean run.', 'I’m seeing a pattern.', 'I don’t like patterns.'],
    ['They’re harder to fool.', 'Good.', 'I was getting bored.'],
    ['They saw that coming.', 'Interesting.', 'I’ll make the next one harder.'],
    ['That was close.', 'I don’t like close.', 'Time to shake it up.'],
  ],
  RATTLED: [
    ['I gave them that.', 'I wasn’t trying.', 'Ask anyone.'],
    ['I didn’t get any sleep.', 'I’m a little under the weather.', 'They know it. I know it.'],
    ['Luck. Repeated luck.', 'Which is still luck.', 'I checked.'],
    ['Something’s off.', 'Cheater, cheater.', 'Big cheater.'],
    ['That one doesn’t count.', 'I have my reasons.', 'Several, actually.'],
    ['They’re on a streak.', 'Who the hell is this guy?', 'I want a background check.'],
    ['That was not supposed to work.', 'I planned for that.', 'I think.'],
    ['They did it again.', 'This is getting annoying.', 'Very annoying.'],
    ['Why is this happening?', 'What is going on?', 'This can’t be happening.'],
    ['Okay. That was good.', 'Annoyingly good.', 'I hate this.'],
  ],
  CONCEDING: [
    ['Who am I?', 'What have I become?', 'This is humiliating.'],
    ['I’m out of excuses.', 'There. I said it.', 'Back to the drawing board.'],
    ['They break everything.', 'Every single time.', 'I need better traps.'],
    ['They’re actually good.', 'There. You happy now?', 'You’ll never hear that again.'],
    ['I tried everything.', 'They keep coming back.', 'Again and again and again.'],
    ['I’m getting too old for this.', 'Maybe that’s the problem.', 'It’s definitely my age.'],
    ['The talent is undeniable.', 'There’s nothing else to say.', 'I’ve got nothing.'],
    ['I’ve underestimated them.', 'For quite a while.', 'That was a mistake.'],
    ['They’ve earned this.', 'I hate admitting that.', 'But they have.'],
    ['I know when I’m beaten.', 'Apparently, it’s now.', 'My reign is over.'],
  ],
};

// ── Struck-out pairs ────────────────────────────────────────────
// Part 4: an older line she has crossed out, and what she wrote instead.
// Rendered as a strike-through above its replacement.

export type BookStruckPair = { old: string; next: string };

export const STRUCK_PAIRS: readonly BookStruckPair[] = [
  { old: 'Easy work, that one.', next: 'Not easy work.' },
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
