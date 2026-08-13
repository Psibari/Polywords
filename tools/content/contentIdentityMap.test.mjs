import assert from 'node:assert/strict';
import { buildIdentityMap } from './build-content-identity-map.mjs';

const runtime = {
  BANK: {
    masks: [
      { id: 'bank_r0', phrase: 'CURRENT REAL', isReal: true },
      { id: 'bank_t0', phrase: 'CURRENT TRAP', isReal: false },
    ],
    hiddenPairs: [
      { id: 'bank_h01', real: 'SECRET REAL', trap: 'SECRET TRAP' },
    ],
  },
};

{
  const result = buildIdentityMap({
    workbookRows: [
      { word: 'BANK', kind: 'r', text: 'CURRENT REAL', workbookLocation: 'Tiles!2' },
      { word: 'BANK', kind: 'h', text: 'SECRET REAL', pairedText: 'SECRET TRAP', workbookLocation: 'Boss!2:3' },
      { word: 'DECK', kind: 'r', text: 'WORKBOOK ONLY', workbookLocation: 'Tiles!9' },
    ],
    runtime,
  });
  assert.equal(result.entries.find(x => x.text === 'CURRENT REAL').id, 'bank_r0');
  assert.equal(result.entries.find(x => x.pairedText === 'SECRET TRAP').id, 'bank_h01');
  assert.equal(result.entries.find(x => x.text === 'WORKBOOK ONLY').id, 'deck_r00');
  assert.deepEqual(result.exceptions, []);
  assert.equal(result.entries.length, 3, 'workbook-only content is retained');
}

{
  const rows = [
    { word: 'BANK', kind: 'h', text: 'SECRET REAL', pairedText: 'SECRET TRAP', workbookLocation: 'Boss!2:3' },
    { word: 'BANK', kind: 'h', text: 'SECRET REAL', pairedText: 'SECRET TRAP', workbookLocation: 'Boss!20:21' },
  ];
  const runtimeWithoutPairIds = structuredClone(runtime);
  delete runtimeWithoutPairIds.BANK.hiddenPairs[0].id;
  const result = buildIdentityMap({ workbookRows: rows, runtime: runtimeWithoutPairIds });
  assert.equal(result.entries[0].id, result.entries[1].id, 'historical and production rows share one runtime identity');
}

{
  const expandedRuntime = structuredClone(runtime);
  expandedRuntime.BANK.hiddenPairs.push({ real: 'RUNTIME ONLY REAL', trap: 'RUNTIME ONLY TRAP' });
  const result = buildIdentityMap({ workbookRows: [], runtime: expandedRuntime });
  const runtimeOnly = result.entries.find(x => x.text === 'RUNTIME ONLY REAL');
  assert.equal(runtimeOnly.id, 'bank_h02');
  assert.equal(runtimeOnly.workbookLocation, 'Hidden Pair Registry!NEW');
  assert.equal(runtimeOnly.runtimeLocation, 'BANK.hiddenPairs[1]');
}

{
  const duplicateRuntime = structuredClone(runtime);
  duplicateRuntime.BANK.hiddenPairs.push({ id: 'bank_h02', real: 'SECRET REAL', trap: 'SECRET TRAP' });
  const result = buildIdentityMap({
    workbookRows: [{ word: 'BANK', kind: 'h', text: 'SECRET REAL', pairedText: 'SECRET TRAP' }],
    runtime: duplicateRuntime,
  });
  assert.equal(result.entries.length, 0);
  assert.equal(result.exceptions[0].type, 'ambiguous');
}

{
  const result = buildIdentityMap({
    workbookRows: [{ word: 'BANK', kind: 'h', text: 'NEW SECRET', pairedText: 'NEW TRAP' }],
    runtime,
    retiredIds: ['bank_h00', 'bank_h02'],
  });
  assert.equal(result.entries[0].id, 'bank_h03', 'retired suffixes are never compacted or reused');
}

console.log('contentIdentityMap tests passed');
