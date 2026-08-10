import assert from 'node:assert/strict';
import {
  REVIEW_CHECKS,
  canApproveWord,
  createEmptyWord,
  synchronizeDerivedFields,
  validateBank,
  validateWord,
} from '../src/contentWorkflow.js';
import { mergeApprovedBanks } from '../src/mergeV2.js';

function tile(id, text, overrides = {}) {
  return {
    id,
    text,
    difficulty: 3,
    snapStrength: 3,
    trapSharpness: 3,
    familiarity: 3,
    hiddenFairness: 3,
    phaseFit: ['flow'],
    reviewStatus: 'accepted',
    ...overrides,
  };
}

function meaning(wordId, number) {
  const id = `${wordId}.meaning.${number}`;
  return {
    id,
    label: `Meaning ${number}`,
    definition: `Distinct definition ${number}`,
    source: { name: 'Example Dictionary', url: `https://example.com/${id}` },
    familiarity: 3,
    snapStrength: 3,
    visibility: 'ordinary',
    approved: true,
    realMasks: [
      tile(`${id}.real.1`, `CULTURAL HANDLE NUMBER ${number}`),
      tile(`${id}.real.2`, `FAMILIAR MOMENT VERSION ${number}`),
    ],
    traps: [1, 2, 3].map(trapNumber => tile(
      `${id}.trap.${trapNumber}`,
      `NEARBY DISTRACTION ${number} ${trapNumber}`,
      {
        trapStyle: ['neighbor', 'scene', 'result'][trapNumber - 1],
        whyTempting: 'It sits near the approved meaning.',
        baitMeaningId: id,
      },
    )),
  };
}

function validWord() {
  let word = createEmptyWord('SAMPLE', 'flow');
  word = {
    ...word,
    meanings: [meaning(word.id, 1), meaning(word.id, 2), meaning(word.id, 3)],
    reviewChecklist: Object.fromEntries(REVIEW_CHECKS.map(key => [key, true])),
  };
  word = synchronizeDerivedFields(word);
  return { ...word, editorialStatus: 'approved' };
}

const good = validWord();
assert.deepEqual(validateWord(good).blockers, []);
assert.equal(canApproveWord(good).canApprove, true);

const missingSource = structuredClone(good);
missingSource.meanings[0].source.url = '';
assert.match(validateWord(missingSource).blockers.join('\n'), /source URL/);

const headwordLeak = structuredClone(good);
headwordLeak.meanings[0].realMasks[0].text = 'SAMPLE APPEARS IN THIS TILE';
assert.match(validateWord(headwordLeak).blockers.join('\n'), /leaks the headword/);

const duplicateId = structuredClone(good);
duplicateId.meanings[0].traps[0].id = duplicateId.meanings[0].realMasks[0].id;
assert.match(validateWord(duplicateId).blockers.join('\n'), /duplicate tile ID/);

const wrongDepth = structuredClone(good);
wrongDepth.meanings[0].traps.pop();
wrongDepth.profile.trapCount--;
assert.match(validateWord(wrongDepth).blockers.join('\n'), /exactly 3 traps/);

const wrongWordType = structuredClone(good);
wrongWordType.wordType = 'Double';
assert.match(validateWord(wrongWordType).blockers.join('\n'), /wordType must be Triple/);

let insufficientPhaseBank = structuredClone(good);
insufficientPhaseBank.meanings = insufficientPhaseBank.meanings.slice(0, 1);
insufficientPhaseBank = synchronizeDerivedFields(insufficientPhaseBank);
assert.match(validateWord(insufficientPhaseBank).blockers.join('\n'), /cannot supply 3 distinct visible REAL masks/);

const bank = { schemaVersion: 2, words: { [good.id]: good } };
assert.deepEqual(validateBank(bank).blockers, []);

const unreviewedBank = structuredClone(bank);
unreviewedBank.words[good.id].meanings[0].realMasks[0].reviewStatus = 'pending';
assert.match(validateBank(unreviewedBank).blockers.join('\n'), /tile acceptance must be complete/);

const firstMerge = mergeApprovedBanks({ schemaVersion: 2, words: {} }, bank);
assert.deepEqual(firstMerge.summary.added, [good.id]);
const secondMerge = mergeApprovedBanks(firstMerge.bank, bank);
assert.deepEqual(secondMerge.summary.unchanged, [good.id]);

const changedBank = structuredClone(bank);
changedBank.words[good.id].profile.snapStrength = 4;
assert.throws(() => mergeApprovedBanks(firstMerge.bank, changedBank), /Refusing to overwrite/);
const replaced = mergeApprovedBanks(firstMerge.bank, changedBank, ['SAMPLE']);
assert.deepEqual(replaced.summary.replaced, [good.id]);

console.log('contentWorkflow tests passed');
