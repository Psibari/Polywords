export type RematchOutcomeDevPreviewKind = 'king' | 'buster';

export type RematchOutcomeDevPreview = {
  outcome: RematchOutcomeDevPreviewKind;
  persistRun: false;
  word: 'FOAM';
  productionOutcome: 'mastered' | 'buster';
  resultLabel: 'KING' | 'BUSTER';
  startBookVariant: 'mastered';
  finalBookVariant: 'mastered' | 'neutral';
};

export function buildRematchOutcomeDevPreview(
  outcome: RematchOutcomeDevPreviewKind,
): RematchOutcomeDevPreview {
  const king = outcome === 'king';
  return {
    outcome,
    persistRun: false,
    word: 'FOAM',
    productionOutcome: king ? 'mastered' : 'buster',
    resultLabel: king ? 'KING' : 'BUSTER',
    startBookVariant: 'mastered',
    finalBookVariant: king ? 'mastered' : 'neutral',
  };
}
