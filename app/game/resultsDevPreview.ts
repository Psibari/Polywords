import type { WordResult } from './polyRunEngine';

export type ResultsDevPreviewOutcome = 'king' | 'buster';

export type ResultsDevPreview = {
  outcome: ResultsDevPreviewOutcome;
  persistRun: false;
  bossMastered: boolean;
  haunted: boolean;
  bossRematchLost: boolean;
  bossRematchWon: boolean;
  bossOutcome: 'mastered' | 'haunted';
  isComplete: true;
  bestCombo: number;
  wordResults: WordResult[];
};

export function buildResultsDevPreview(
  outcome: ResultsDevPreviewOutcome,
): ResultsDevPreview {
  const king = outcome === 'king';

  return {
    outcome,
    persistRun: false,
    bossMastered: king,
    haunted: !king,
    bossRematchLost: !king,
    bossRematchWon: king,
    bossOutcome: king ? 'mastered' : 'haunted',
    isComplete: true,
    bestCombo: 4,
    wordResults: [
      {
        wordId: 'dev-rematch',
        roundKind: 'word',
        word: 'REMATCH',
        correctUp: king ? 3 : 2,
        correctDown: king ? 2 : 1,
        wrongSwipes: king ? 0 : 1,
        missedMaskIds: king ? [] : ['dev-missed-real'],
        wrongMaskIds: king ? [] : ['dev-wrong-trap'],
        isBossWord: true,
        totalRealMasks: 3,
      },
    ],
  };
}
