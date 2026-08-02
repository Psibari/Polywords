import assert from 'node:assert/strict';
import { validateRuntimeHuntData } from './runtimeHuntValidation.mjs';

const phases = [
  ...Array(24).fill('confidence'),
  ...Array(24).fill('flow'),
  ...Array(24).fill('tension'),
  ...Array(24).fill('panic'),
  ...Array(14).fill('boss'),
];

function makeEntry(word, phase, index) {
  const slug = word.toLowerCase().replace(/\s+/g, '-');
  const entry = {
    difficulty: phase === 'confidence' ? 'easy' : phase === 'boss' ? 'hard' : 'medium',
    hiddenMeaning: null,
    hiddenTrap: null,
    gpsTag: phase,
    wordType: 'Double',
    masks: [
      { id: `${slug}_r0`, phrase: `FAMILIAR MEMORY ${index} ALPHA`, isReal: true },
      { id: `${slug}_r1`, phrase: `EVERYDAY MOMENT ${index} BRAVO`, isReal: true },
      { id: `${slug}_t0`, phrase: `NEARBY IDEA ${index} CHARLIE`, isReal: false },
      { id: `${slug}_t1`, phrase: `TEMPTING SCENE ${index} DELTA`, isReal: false },
      { id: `${slug}_t2`, phrase: `WRONG MEMORY ${index} ECHO`, isReal: false },
    ],
  };
  if (phase === 'boss') {
    entry.hiddenPairs = [0, 1, 2].map(pair => ({
      real: `SECRET HANDLE ${index} ${pair} ALPHA`,
      trap: `SECRET DECOY ${index} ${pair} BRAVO`,
    }));
  }
  return entry;
}

function makeValidBank() {
  return Object.fromEntries(phases.map((phase, index) => {
    const word = `WORD${index}`;
    return [word, makeEntry(word, phase, index)];
  }));
}

function hasMessage(messages, fragment) {
  return messages.some(message => message.includes(fragment));
}

{
  const report = validateRuntimeHuntData(makeValidBank());
  assert.deepEqual(report.blockers, []);
  assert.deepEqual(report.launchBlockers, []);
  assert.equal(report.summary.words, 110);
  assert.equal(report.summary.hiddenPairs, 42);
}

{
  const bank = makeValidBank();
  bank.WORD1.masks[0].id = bank.WORD0.masks[0].id;
  assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'duplicate mask ID'));
}

{
  const bank = makeValidBank();
  bank.WORD0.masks[0].phrase = 'WORD0 MEMORY';
  assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'leaks the headword'));
}

{
  const bank = makeValidBank();
  bank.WORD0.masks[0].phrase = 'Mixed Case Memory';
  assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'must be uppercase'));
}

{
  const bank = makeValidBank();
  bank.WORD0.masks[0].phrase = 'TODO PLACEHOLDER';
  assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'placeholder text'));
}

{
  const bank = makeValidBank();
  bank.WORD0.masks.pop();
  const report = validateRuntimeHuntData(bank);
  assert.ok(hasMessage(report.blockers, 'at least 5 masks'));
  assert.ok(hasMessage(report.blockers, 'at least 3 trap masks'));
}

{
  const bank = makeValidBank();
  bank.WORD96.hiddenPairs.pop();
  assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'exactly 3 hiddenPairs'));
}

{
  const bank = makeValidBank();
  bank.WORD0.hiddenPairs = [{ real: 'HIDDEN HANDLE', trap: 'HIDDEN DECOY' }];
  assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'non-boss words cannot contain'));
}

{
  const bank = makeValidBank();
  bank.WORD0.hiddenPairs = 'NOT AN ARRAY';
  assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'hiddenPairs must be an array'));
}

{
  const bank = makeValidBank();
  bank.WORD96.hiddenPairs[0] = {
    real: 'A VERY LONG SECRET HUMAN MEMORY HANDLE',
    trap: 'DECOY',
  };
  assert.ok(hasMessage(validateRuntimeHuntData(bank).warnings, 'Hidden Truth parity'));
}

{
  const report = validateRuntimeHuntData({ SAMPLE: makeEntry('SAMPLE', 'confidence', 0) });
  assert.ok(hasMessage(report.launchBlockers, '1/110 runtime words'));
  assert.ok(hasMessage(report.launchBlockers, 'boss has 0/10'));
}

{
  assert.ok(hasMessage(validateRuntimeHuntData([]).blockers, 'word-keyed object'));
}

{
  const bank = makeValidBank();
  bank.WORD96.hiddenMeaning = 'LEGACY SECRET';
  bank.WORD96.hiddenTrap = 'LEGACY DECOY';
  assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'legacy hiddenMeaning/hiddenTrap'));
}

console.log('runtimeHuntValidation tests passed');
