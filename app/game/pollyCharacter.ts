export const POLLY_LINES = {
  homeBackAgain: 'Back again?',
  homeMissMe: 'Miss me?',
  homeMissingMeanings: 'Still missing a few meanings, aren’t you.',
  homeLoseFeathers: 'Come to lose some feathers?',
  homeWordsAsked: 'The words asked about you. I lied.',
  homeTakeTime: 'Take your time. They’re mine either way.',
  homeFirstMeeting: 'Who are you? What do you want?',
  huntBossMine: 'This word stays mine.',
  huntLaugh: 'BBBLAAAAHHAHAHA!',
  huntCleanSweep: "Bet you can't do that again.",
  huntThoughtSo: 'Thought so.',
  huntGotcha: 'Gotcha.',
  huntThereItIs: 'There it is.',
  huntEveryTime: 'Every time.',
  huntStillWorks: 'Still works.',
  huntPointToMe: 'Point to me.',
  huntAllMe: 'That’s all me.',
  huntGoodIsntIt: 'Good, isn’t it.',
  huntLoveThisGame: 'I love this game.',
  huntMyHouse: 'This is MY house.',
  huntWalkedRightIn: 'Walked right into that one.',
  huntGotMeCrowned: 'That one got me crowned.',
  huntStreakSoWhat: 'So what.',
  huntStreakEasy: 'Those were easy.',
  huntStreakWhosCounting: 'But who’s counting?',
  huntStreakLetYouHave: 'I let you have those.',
  huntStreakWarmUp: 'That was the warm-up.',
  huntStreakPacing: 'I’m pacing myself.',
  huntHesitation: 'YES... NO... MAYBE SO...',
  huntRemember: 'Remember me.',
  resultsTrapsRemember: 'My traps remember you.',
  resultsEmptyVault: 'You emptied my little vault.',
  resultsKeepWord: 'Fine. Keep the word.',
  resultsMeaningsPast: 'Some meanings got past you.',
  resultsMeaningsHaunt: 'Some meanings still haunt you.',
  resultsWantBack: 'I want those meanings back.',
  dailyButterKnife: 'Sharp as a butter knife.',
  dailyLossBat: 'CAN’T BEAT THAT WITH A BAT.',
  dailyWinTomorrow: 'WON’T HAPPEN TOMORROW.',
  huntIntro: 'Enter the Hunt. We’ll see who hunts who.',
  huntHauntIntro: 'I hunt you. I haunt you.',
  huntAbandonTaunt: 'See you later, loser.',
  huntMasteredTrapsDiffer: 'Next time, the traps will be different.',
} as const;

export type PollyLineId = keyof typeof POLLY_LINES;

export type PollyMoment = {
  lineId: PollyLineId;
  line: string;
};

export function pollyMoment(lineId: PollyLineId): PollyMoment {
  return { lineId, line: POLLY_LINES[lineId] };
}
