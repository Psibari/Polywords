import assert from 'node:assert/strict';
import { countPolybookTally } from './polybookTally';

const rivalry = (banished: boolean) => ({ banished });

// Empty save: every count is zero.
assert.deepEqual(
  countPolybookTally({ masteredWords: [], wordRivalries: {}, ghosts: [], kingCount: 0 }),
  { mastered: 0, king: 0, banished: 0, haunted: 0 },
);

// One of each.
assert.deepEqual(
  countPolybookTally({
    masteredWords: [{ word: 'BANK' }],
    wordRivalries: { DRAW: rivalry(true) },
    ghosts: [{ wordId: 'LEAD' }],
    kingCount: 1,
  }),
  { mastered: 1, king: 1, banished: 1, haunted: 1 },
);

// MASTERED is one per word: equals the record count, and a stray duplicate cannot inflate it.
assert.equal(
  countPolybookTally({ masteredWords: [{ word: 'BANK' }, { word: 'BAT' }, { word: 'FINE' }], wordRivalries: {}, ghosts: [], kingCount: 0 }).mastered,
  3,
);
assert.equal(
  countPolybookTally({ masteredWords: [{ word: 'BANK' }, { word: 'bank ' }], wordRivalries: {}, ghosts: [], kingCount: 0 }).mastered,
  1,
);

// BANISHED counts only rivalries marked banished; a still-haunted rivalry is not banished.
// HAUNTED counts distinct active ghost words, not rivalries.
{
  const tally = countPolybookTally({
    masteredWords: [],
    wordRivalries: { DRAW: rivalry(true), LEAD: rivalry(false), LAP: rivalry(true) },
    ghosts: [{ wordId: 'LEAD' }, { wordId: 'LEAD' }, { wordId: 'lime' }, { wordId: 'LIME' }],
    kingCount: 0,
  });
  assert.equal(tally.banished, 2, 'two banished rivalries');
  assert.equal(tally.haunted, 2, 'LEAD and LIME, each once');
}

// A won Returning Haunt: the ghost is pruned and the rivalry turns banished.
{
  const before = countPolybookTally({ masteredWords: [], wordRivalries: { LEAD: rivalry(false) }, ghosts: [{ wordId: 'LEAD' }], kingCount: 0 });
  const after = countPolybookTally({ masteredWords: [], wordRivalries: { LEAD: rivalry(true) }, ghosts: [], kingCount: 0 });
  assert.deepEqual([before.haunted, before.banished], [1, 0]);
  assert.deepEqual([after.haunted, after.banished], [0, 1]);
}

// KING is whatever the caller passes, never negative or fractional.
assert.equal(countPolybookTally({ masteredWords: [], wordRivalries: {}, ghosts: [], kingCount: 4 }).king, 4);
assert.equal(countPolybookTally({ masteredWords: [], wordRivalries: {}, ghosts: [], kingCount: -2 }).king, 0);
assert.equal(countPolybookTally({ masteredWords: [], wordRivalries: {}, ghosts: [], kingCount: Number.NaN }).king, 0);

console.log('polybookTally (counts) tests passed');
