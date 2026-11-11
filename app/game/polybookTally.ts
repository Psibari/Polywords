// Polybook MASTERY page counts (Pete, 2026-11-10): one crown per outcome with a
// big number under it. RN-free and pure so it can be tested on its own.
//
// - MASTERED: words in progress.masteredWords. upsertMasteredRecord keeps one
//   record per word, so this is the record count; it is counted by distinct
//   word anyway so a stray duplicate in an old save cannot inflate it.
// - BANISHED: Polly's word rivalries marked banished. Banishing is permanent in
//   pollyMemory.ts (rememberHauntResolution ignores a banished word).
// - HAUNTED: ACTIVE haunts only, i.e. distinct words in the ghost list. Winning
//   a Returning Haunt prunes the ghost, so HAUNTED falls as BANISHED rises.
// - KING: no saved counter exists yet (a MASTER'S REMATCH win records nothing),
//   so the caller passes it in. A separate change adds the counter.
import type { GhostMeaning, MasteredWordRecord } from './types';
import type { PollyWordRivalry } from './pollyMemory';

export type PolybookTallyKind = 'mastered' | 'king' | 'banished' | 'haunted';

export type PolybookTally = Record<PolybookTallyKind, number>;

export type PolybookTallyInput = {
  masteredWords: readonly Pick<MasteredWordRecord, 'word'>[];
  wordRivalries: Readonly<Record<string, Pick<PollyWordRivalry, 'banished'>>>;
  ghosts: readonly Pick<GhostMeaning, 'wordId'>[];
  kingCount: number;
};

const normalizeWord = (word: string) => word.trim().toUpperCase();

function safeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function countPolybookTally(input: PolybookTallyInput): PolybookTally {
  const mastered = new Set(input.masteredWords.map((record) => normalizeWord(record.word))).size;
  const banished = Object.values(input.wordRivalries).filter((rivalry) => rivalry?.banished === true).length;
  const haunted = new Set(input.ghosts.map((ghost) => normalizeWord(ghost.wordId))).size;
  return { mastered, king: safeCount(input.kingCount), banished, haunted };
}
