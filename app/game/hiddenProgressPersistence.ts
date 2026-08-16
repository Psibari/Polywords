import type { GhostMeaning, HiddenPair, MasteredWordRecord, PlayerProgress, WordStep } from './types';

export function upsertGhostRecord(
  ghosts: GhostMeaning[],
  step: Pick<WordStep, 'word' | 'hiddenMeaning' | 'hiddenTrap'>,
  failedPair?: HiddenPair,
): GhostMeaning[] {
  const wordId = step.word.trim().toUpperCase();
  const existing = ghosts.find(ghost => ghost.wordId === wordId);
  const real = failedPair?.real ?? step.hiddenMeaning ?? existing?.hiddenMeaningReal ?? '';
  const trap = failedPair?.trap ?? step.hiddenTrap ?? existing?.hiddenMeaningTrap ?? '';
  if (existing) {
    return ghosts.map(ghost => ghost.wordId === wordId ? {
      ...ghost,
      word: wordId,
      ...(failedPair?.id ? { hiddenPairId: failedPair.id } : {}),
      hiddenMeaningReal: real,
      hiddenMeaningTrap: trap,
      runsMissed: ghost.runsMissed + 1,
    } : ghost);
  }
  return [...ghosts, {
    wordId,
    word: wordId,
    ...(failedPair?.id ? { hiddenPairId: failedPair.id } : {}),
    hiddenMeaningReal: real,
    hiddenMeaningTrap: trap,
    isGhostedMaster: true,
    runsMissed: 1,
  }];
}

export function upsertMasteredRecord(
  progress: PlayerProgress,
  word: string,
  isBoss: boolean,
  hiddenPairsFound: HiddenPair[],
  flawless: boolean,
  priorHauntAttempts: number,
  dateMastered = new Date().toISOString(),
): PlayerProgress {
  const hiddenPairIds = hiddenPairsFound.map(pair => pair.id);
  const hiddenMeaningsFound = hiddenPairsFound.map(pair => pair.real);
  const hiddenMeaningFound = hiddenMeaningsFound[0] ?? '';
  const record: MasteredWordRecord = {
    word,
    isBoss,
    hiddenPairIds,
    hiddenMeaningFound,
    hiddenMeaningsFound,
    priorHauntAttempts,
    dateMastered,
    flawless,
  };
  const existing = progress.masteredWords.some(item => item.word === word);
  return {
    ...progress,
    masteredWords: existing
      ? progress.masteredWords.map(item => item.word === word ? { ...item, ...record } : item)
      : [...progress.masteredWords, record],
  };
}

export function addHiddenPairIdFound(progress: PlayerProgress, pairId: string): PlayerProgress {
  if ((progress.hiddenPairIdsFound ?? []).includes(pairId)) return progress;
  return {
    ...progress,
    hiddenPairIdsFound: [...(progress.hiddenPairIdsFound ?? []), pairId].sort(),
  };
}

// Recovers ids for words mastered before hiddenPairIdsFound existed on
// PlayerProgress. Only hiddenPairIds is a source of real stable ids —
// MasteredWordRecord.hiddenMeaningsFound holds display REAL text, not ids,
// so it is not folded in here. Idempotent: safe to run on every load.
export function backfillHiddenPairIdsFound(progress: PlayerProgress): PlayerProgress {
  const ids = new Set(progress.hiddenPairIdsFound ?? []);
  for (const record of progress.masteredWords) {
    for (const id of record.hiddenPairIds ?? []) ids.add(id);
  }
  return { ...progress, hiddenPairIdsFound: Array.from(ids).sort() };
}
