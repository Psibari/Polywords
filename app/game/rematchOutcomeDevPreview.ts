export type RematchOutcomeDevPreviewKind = 'king' | 'buster';

export type RematchOutcomeDevPreview = {
  outcome: RematchOutcomeDevPreviewKind;
  persistRun: false;
  word: 'REMATCH';
  productionOutcome: 'mastered' | 'haunted';
  resultLabel: 'KING' | 'BUSTER';
  showMasteredBook: boolean;
};

export function buildRematchOutcomeDevPreview(
  outcome: RematchOutcomeDevPreviewKind,
): RematchOutcomeDevPreview {
  const king = outcome === 'king';
  return {
    outcome,
    persistRun: false,
    word: 'REMATCH',
    productionOutcome: king ? 'mastered' : 'haunted',
    resultLabel: king ? 'KING' : 'BUSTER',
    showMasteredBook: king,
  };
}
