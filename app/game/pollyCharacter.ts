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
} as const;

export type PollyLineId = keyof typeof POLLY_LINES;

export type PollyMoment = {
  lineId: PollyLineId;
  line: string;
};

export function pollyMoment(lineId: PollyLineId): PollyMoment {
  return { lineId, line: POLLY_LINES[lineId] };
}
