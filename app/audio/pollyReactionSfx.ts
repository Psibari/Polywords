// Thin caller for Polly's wordless reaction sounds. The picking rule lives in
// app/game/pollyVisitPolicy.ts (pure, tested); this file only remembers the
// last sound played per group so Hunt and Daily share one "never the same
// twice in a row" memory.
import { playSfx } from './sfx';
import {
  POLLY_REACTION_POOLS,
  PollyReactionGroup,
  PollyReactionSfx,
  pickReactionSfx,
} from '../game/pollyVisitPolicy';

const lastPlayed: Partial<Record<PollyReactionGroup, PollyReactionSfx>> = {};

export function playPollyReaction(group: PollyReactionGroup): void {
  const name = pickReactionSfx(POLLY_REACTION_POOLS[group], lastPlayed[group] ?? null, Math.random());
  lastPlayed[group] = name;
  playSfx(name);
}
