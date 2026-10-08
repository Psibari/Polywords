import assert from 'node:assert/strict';
import { resolveResultsConsequences } from './resultsAftermath';

function kinds(input: Parameters<typeof resolveResultsConsequences>[0]) {
  return resolveResultsConsequences(input).map(({ kind, word, copy }) => ({ kind, word, copy }));
}

assert.deepEqual(
  kinds({ bossOutcome: 'mastered', hauntOutcome: null, bossWord: 'stock', hauntWord: null }),
  [{ kind: 'mastered', word: 'STOCK', copy: 'ADDED TO YOUR MASTERY' }],
  'mastery becomes a durable gold-crown aftermath record',
);

assert.deepEqual(
  kinds({ bossOutcome: 'haunted', hauntOutcome: null, bossWord: 'fold', hauntWord: null }),
  [{ kind: 'haunted', word: 'FOLD', copy: 'NOW HAUNTING YOU' }],
  'new Boss loss becomes a Haunted aftermath record',
);

assert.deepEqual(
  kinds({ bossOutcome: null, hauntOutcome: 'banished', bossWord: null, hauntWord: 'fold' }),
  [{ kind: 'banished', word: 'FOLD', copy: 'BANISHED' }],
  'a successful returning Haunt becomes a Banished aftermath record',
);

assert.deepEqual(
  kinds({ bossOutcome: 'mastered', hauntOutcome: 'banished', bossWord: 'case', hauntWord: 'fold' }),
  [
    { kind: 'mastered', word: 'CASE', copy: 'ADDED TO YOUR MASTERY' },
    { kind: 'banished', word: 'FOLD', copy: 'BANISHED' },
  ],
  'one Hunt can preserve both Boss mastery and an earlier Haunt banishment',
);

assert.deepEqual(
  kinds({ bossOutcome: null, hauntOutcome: null, bossWord: null, hauntWord: null }),
  [],
  'ordinary completion does not manufacture a crown status',
);

console.log('resultsAftermath tests passed');

assert.deepEqual(
  kinds({ bossOutcome: 'mastered', hauntOutcome: null, bossWord: 'case', hauntWord: null, bossIsRematch: true }),
  [],
  'a rematch win adds no crown, so it must not claim ADDED TO YOUR MASTERY',
);
assert.deepEqual(
  kinds({ bossOutcome: 'haunted', hauntOutcome: null, bossWord: 'case', hauntWord: null, bossIsRematch: true }),
  [],
  'a rematch loss creates no Haunt, so it must not claim NOW HAUNTING YOU',
);
assert.deepEqual(
  kinds({ bossOutcome: 'mastered', hauntOutcome: 'banished', bossWord: 'case', hauntWord: 'fold', bossIsRematch: true }),
  [{ kind: 'banished', word: 'FOLD', copy: 'BANISHED' }],
  'a rematch does not hide an earlier Haunt banishment from the same Hunt',
);
