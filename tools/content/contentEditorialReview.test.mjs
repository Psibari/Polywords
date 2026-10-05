import assert from 'node:assert/strict';
import { validateRuntimeHuntData } from './runtimeHuntValidation.mjs';

function entry(word, reals, traps) {
  const slug = word.toLowerCase();
  return {
    difficulty: 'medium',
    hiddenMeaning: null,
    hiddenTrap: null,
    gpsTag: 'flow',
    wordType: reals.length === 2 ? 'Double' : `${reals.length}-MEANING`,
    masks: [
      ...reals.map((phrase, index) => ({ id: `${slug}_r${index}`, phrase, isReal: true })),
      ...traps.map((phrase, index) => ({ id: `${slug}_t${index}`, phrase, isReal: false })),
    ],
  };
}

function includesFinding(report, fragment) {
  return report.editorialReview.some((finding) => finding.includes(fragment));
}

{
  const report = validateRuntimeHuntData({
    BENCH: entry('BENCH', [
      'THE SEAT RESERVED FOR THE COURTROOM HIGHEST HONOR',
      'PLAYERS WAIT HERE DURING THE GAME',
    ], [
      'SEAT RESERVED FOR THE HEAD OF THE TABLE',
      'A STOOL BESIDE THE KITCHEN ISLAND',
      'THE COUCH EVERYONE FIGHTS OVER',
    ]),
  });
  assert.ok(includesFinding(report, 'same-headword REAL/trap overlap'));
  assert.ok(includesFinding(report, 'bench_r0'));
  assert.ok(includesFinding(report, 'bench_t0'));
}

{
  const report = validateRuntimeHuntData({
    BILL: entry('BILL', [
      'THE TOTAL YOU OWE AFTER DINNER',
      'A LAWMAKER PUTS ONE BEFORE CONGRESS',
    ], [
      'WEBBED FEET PADDLING ACROSS A QUIET POND',
      'THE RECEIPT YOU KEEP AFTER PAYING',
      'A COIN DROPPED INTO A FOUNTAIN',
    ]),
    DUCK: entry('DUCK', [
      'BIRD THAT QUACKS NEAR THE WATER',
      'LOWER YOUR HEAD BEFORE IT HITS YOU',
    ], [
      'WEBBED FEET PADDLING ACROSS THE QUIET POND',
      'A GOOSE HONKING BY THE LAKE',
      'A SWAN GLIDING PAST THE DOCK',
    ]),
  });
  assert.ok(includesFinding(report, 'cross-headword near-duplicate'));
  assert.ok(includesFinding(report, 'BILL/bill_t0'));
  assert.ok(includesFinding(report, 'DUCK/duck_t0'));
}

{
  const report = validateRuntimeHuntData({
    SAMPLE: entry('SAMPLE', [
      'WHAT YOU KEEP IN A SMALL GLASS JAR',
      'A LITTLE PIECE USED FOR TESTING',
    ], [
      'WHAT YOU LEAVE ON THE KITCHEN TABLE',
      'THE THING YOU PUT IN A PAPER BAG',
      'SOMETHING STORED UNDER THE BED',
    ]),
  });
  assert.equal(includesFinding(report, 'same-headword REAL/trap overlap'), false);
}

console.log('contentEditorialReview tests passed');
