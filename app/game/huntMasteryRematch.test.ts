import assert from 'node:assert/strict';

import { generateHunt } from './huntGenerator';
import db from '../../assets/data/huntData.json';

const bank = db as Record<string, { gpsTag: string }>;
const bossWords = Object.keys(bank).filter(word => bank[word].gpsTag === 'boss');
assert.ok(bossWords.length >= 2, 'the bank must carry boss words for this test');

function bossStep(steps: ReturnType<typeof generateHunt>) {
  const step = steps[steps.length - 1];
  assert.equal(step.kind, 'word');
  return step as Extract<typeof step, { kind: 'word' }>;
}

// One boss word still unbeaten: a normal Polly's Word, never a rematch.
const oneLeft = bossWords.slice(0, -1);
for (let seed = 1; seed <= 25; seed++) {
  const step = bossStep(generateHunt({ masteredWords: oneLeft, seed }));
  assert.equal(step.word, bossWords[bossWords.length - 1], 'the last unbeaten boss word is drawn');
  assert.notEqual(step.isMasteryRematch, true, 'an unbeaten boss word is never flagged as a rematch');
}

// Every boss word mastered: the final round is a MASTER'S REMATCH, not a throw.
for (let seed = 1; seed <= 50; seed++) {
  const steps = generateHunt({ masteredWords: bossWords, seed });
  const step = bossStep(steps);
  assert.equal(step.eventType, 'bossWord');
  assert.equal(step.isMasteryRematch, true, 'caught up => MASTER\'S REMATCH');
  assert.ok(bossWords.includes(step.word), 'the rematch word is a boss-capable word');
  assert.ok((step.hiddenPairs?.length ?? 0) > 0, 'the rematch carries its hidden gauntlet');
  const words = steps.map(s => (s.kind === 'word' ? s.word : ''));
  assert.equal(new Set(words).size, words.length, 'no word is placed twice in one Hunt');
}

// Determinism: same inputs, same Hunt.
assert.deepEqual(
  generateHunt({ masteredWords: bossWords, seed: 11 }),
  generateHunt({ masteredWords: bossWords, seed: 11 }),
  'the rematch draw is deterministic for a seed',
);

console.log('huntMasteryRematch tests passed');
