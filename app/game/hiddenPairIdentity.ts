import rawHuntData from '../../assets/data/huntData.json';
import type { GhostMeaning, HiddenPair, MasteredWordRecord } from './types';

export type HiddenPairData = Record<string, { hiddenPairs?: HiddenPair[] | null }>;

export function createHiddenPairResolver(source: HiddenPairData) {
  function pairsFor(word: string): HiddenPair[] {
    return source[word.trim().toUpperCase()]?.hiddenPairs ?? [];
  }

  function findHiddenPairById(word: string, pairId: string): HiddenPair | null {
    return pairsFor(word).find(pair => pair.id === pairId) ?? null;
  }

  function matchLegacyHiddenPair(word: string, real: string, trap: string): HiddenPair | null {
    const matches = pairsFor(word).filter(pair => pair.real === real && pair.trap === trap);
    return matches.length === 1 ? matches[0] : null;
  }

  function resolveGhostPair(ghost: GhostMeaning): { pair: HiddenPair | null; real: string; trap: string } {
    const pair = ghost.hiddenPairId ? findHiddenPairById(ghost.wordId || ghost.word, ghost.hiddenPairId) : null;
    return {
      pair,
      real: pair?.real ?? ghost.hiddenMeaningReal,
      trap: pair?.trap ?? ghost.hiddenMeaningTrap,
    };
  }

  function resolveMasteredPairs(record: MasteredWordRecord): Array<{ id?: string; real: string }> {
    const fallback = record.hiddenMeaningsFound?.filter(Boolean)
      ?? (record.hiddenMeaningFound ? [record.hiddenMeaningFound] : []);
    if (!record.hiddenPairIds?.length) return fallback.map(real => ({ real }));
    return record.hiddenPairIds.map((id, index) => {
      const pair = findHiddenPairById(record.word, id);
      return pair ? { id: pair.id, real: pair.real } : { id, real: fallback[index] ?? '' };
    }).filter(item => item.real);
  }

  return { findHiddenPairById, matchLegacyHiddenPair, resolveGhostPair, resolveMasteredPairs };
}

const runtimeResolver = createHiddenPairResolver(rawHuntData as unknown as HiddenPairData);
export const findHiddenPairById = runtimeResolver.findHiddenPairById;
export const matchLegacyHiddenPair = runtimeResolver.matchLegacyHiddenPair;
export const resolveGhostPair = runtimeResolver.resolveGhostPair;
export const resolveMasteredPairs = runtimeResolver.resolveMasteredPairs;
