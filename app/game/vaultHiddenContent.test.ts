import { createHiddenPairResolver } from './hiddenPairIdentity';
import type { GhostMeaning, MasteredWordRecord } from './types';

function equal<T>(actual: T, expected: T, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const resolver = createHiddenPairResolver({
  HORN: { hiddenPairs: [{ id: 'horn_h01', real: 'TODAY REAL', trap: 'TODAY TRAP' }] },
});

const ghost: GhostMeaning = {
  wordId: 'HORN', word: 'HORN', hiddenPairId: 'horn_h01',
  hiddenMeaningReal: 'SAVED REAL', hiddenMeaningTrap: 'SAVED TRAP', runsMissed: 1,
};
equal(resolver.resolveGhostPair(ghost), {
  pair: { id: 'horn_h01', real: 'TODAY REAL', trap: 'TODAY TRAP' },
  real: 'TODAY REAL', trap: 'TODAY TRAP',
}, 'Vault ghost detail uses current content for a stable ID');

const mastered: MasteredWordRecord = {
  word: 'HORN', isBoss: true, hiddenPairIds: ['horn_h01'],
  hiddenMeaningFound: 'SAVED REAL', hiddenMeaningsFound: ['SAVED REAL'], dateMastered: '2026-08-13',
};
equal(resolver.resolveMasteredPairs(mastered).map(pair => pair.real), ['TODAY REAL'],
  'Vault mastered detail uses current content for a stable ID');

equal(resolver.resolveGhostPair({ ...ghost, hiddenPairId: undefined }), {
  pair: null, real: 'SAVED REAL', trap: 'SAVED TRAP',
}, 'Vault keeps legacy saved wording when no ID exists');

console.log('vaultHiddenContent tests passed');
