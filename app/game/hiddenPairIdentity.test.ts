import {
  createHiddenPairResolver,
  type HiddenPairData,
} from './hiddenPairIdentity';
import type { GhostMeaning, MasteredWordRecord } from './types';

function equal<T>(actual: T, expected: T, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const data: HiddenPairData = {
  HORN: {
    hiddenPairs: [
      { id: 'horn_h01', real: 'CURRENT REAL ONE', trap: 'CURRENT TRAP ONE' },
      { id: 'horn_h02', real: 'CURRENT REAL TWO', trap: 'CURRENT TRAP TWO' },
    ],
  },
};
const resolver = createHiddenPairResolver(data);

equal(resolver.findHiddenPairById('horn', 'horn_h02')?.real, 'CURRENT REAL TWO', 'id lookup ignores case');
equal(
  createHiddenPairResolver({ HORN: { hiddenPairs: [...(data.HORN.hiddenPairs ?? [])].reverse() } })
    .findHiddenPairById('HORN', 'horn_h02')?.real,
  'CURRENT REAL TWO',
  'reordering cannot redirect an ID',
);

const legacy: GhostMeaning = {
  wordId: 'HORN', word: 'HORN', hiddenMeaningReal: 'OLD REAL', hiddenMeaningTrap: 'OLD TRAP', runsMissed: 1,
};
equal(resolver.resolveGhostPair({ ...legacy, hiddenPairId: 'unknown_h99' }), {
  pair: null, real: 'OLD REAL', trap: 'OLD TRAP',
}, 'unknown IDs fall back without using array position');
equal(resolver.matchLegacyHiddenPair('HORN', 'CURRENT REAL ONE', 'CURRENT TRAP ONE')?.id, 'horn_h01', 'unique legacy text matches');
equal(resolver.matchLegacyHiddenPair('HORN', 'MISSING', 'MISSING'), null, 'unmatched legacy text remains unresolved');

const mastered: MasteredWordRecord = {
  word: 'HORN', isBoss: true, hiddenPairIds: ['horn_h02', 'horn_h01'],
  hiddenMeaningFound: 'OLD TWO', hiddenMeaningsFound: ['OLD TWO', 'OLD ONE'], dateMastered: '2026-08-13',
};
equal(resolver.resolveMasteredPairs(mastered).map(item => item.real), ['CURRENT REAL TWO', 'CURRENT REAL ONE'], 'mastered IDs resolve in saved order');

console.log('hiddenPairIdentity tests passed');
