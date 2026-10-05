export type ResultsConsequenceKind = 'mastered' | 'haunted' | 'banished';

export type ResultsConsequence = {
  kind: ResultsConsequenceKind;
  word: string;
  copy: string;
};

type ResolveResultsAftermathInput = {
  bossOutcome: 'pending' | 'mastered' | 'haunted' | null | undefined;
  hauntOutcome: 'pending' | 'banished' | 'haunted' | null | undefined;
  bossWord: string | null | undefined;
  hauntWord: string | null | undefined;
};

/**
 * Results is aftermath, not a second ceremony. This pure resolver describes
 * only durable state changes the just-finished Hunt caused. A single Hunt can
 * legitimately banish an earlier Haunt and later master/lose the Boss, so the
 * result is a list rather than one mutually-exclusive badge.
 */
export function resolveResultsConsequences(
  input: ResolveResultsAftermathInput,
): ResultsConsequence[] {
  const consequences: ResultsConsequence[] = [];
  const bossWord = input.bossWord?.trim().toUpperCase() || null;
  const hauntWord = input.hauntWord?.trim().toUpperCase() || null;

  if (input.bossOutcome === 'mastered' && bossWord) {
    consequences.push({ kind: 'mastered', word: bossWord, copy: 'ADDED TO YOUR MASTERY' });
  } else if (input.bossOutcome === 'haunted' && bossWord) {
    consequences.push({ kind: 'haunted', word: bossWord, copy: 'NOW HAUNTING YOU' });
  }

  if (input.hauntOutcome === 'banished' && hauntWord) {
    consequences.push({ kind: 'banished', word: hauntWord, copy: 'BANISHED' });
  } else if (input.hauntOutcome === 'haunted' && hauntWord) {
    const duplicate = consequences.some(
      consequence => consequence.kind === 'haunted' && consequence.word === hauntWord,
    );
    if (!duplicate) {
      consequences.push({ kind: 'haunted', word: hauntWord, copy: 'STILL HAUNTING YOU' });
    }
  }

  return consequences;
}
