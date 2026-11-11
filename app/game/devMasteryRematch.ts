// DEV only (Pete, 2026-11-10): the Hunt's REMATCH button. A real MASTER'S REMATCH
// only appears once no unbeaten Boss word is left, so it cannot be reached for
// testing the KING counter. This swaps the live Hunt's Boss step for a real
// rematch step (built by the generator's own buildWordStep) and reshuffles that
// step's cards exactly as createGame does. GameScreen then jumps to it like the
// BOSS button. Judging is the normal store path: a win adds 1 to kingWins and no
// crown or mastery; a loss adds no Haunt. This file changes no saved data.
import { buildMasteryRematchStepForDev } from './huntGenerator';
import type { GameState } from './polyRunEngine';
import { createSeededRng, deriveSeed, shuffleSeeded } from './seededRandom';
import type { WordStep } from './types';

const norm = (word: string) => word.trim().toUpperCase();

/**
 * Returns the Hunt with its Boss step replaced by a MASTER'S REMATCH step, or null
 * when there is no Boss step ahead. Word choice: the first mastered word with hidden
 * Boss content that is not already in this Hunt; otherwise the Hunt's own Boss word.
 * Words with an active Haunt are skipped: a rematch win prunes the word's ghost, and a
 * real rematch word (always mastered) never has one, so that would drop a Haunt.
 */
export function applyDevMasteryRematch(
  game: GameState,
  masteredWords: readonly string[],
  ghostWordIds: readonly string[] = [],
): GameState | null {
  const bossIndex = game.session.findIndex((step) => step.kind === 'word' && step.eventType === 'bossWord');
  if (bossIndex === -1 || game.stepIndex >= bossIndex) return null;
  const boss = game.session[bossIndex] as WordStep;

  const elsewhere = new Set(
    game.session
      .filter((step, index): step is WordStep => index !== bossIndex && step.kind === 'word')
      .map((step) => norm(step.word)),
  );
  for (const ghost of ghostWordIds) elsewhere.add(norm(ghost));
  const candidates = [...masteredWords.map(norm), norm(boss.word)].filter((word) => !elsewhere.has(word));

  for (const word of candidates) {
    const step = buildMasteryRematchStepForDev(
      word,
      boss,
      createSeededRng(deriveSeed(game.runSeed, `dev-rematch:${word}`)),
    );
    if (!step) continue;
    const session = game.session.slice();
    session[bossIndex] = step;
    return {
      ...game,
      session,
      shuffledMasks: {
        ...game.shuffledMasks,
        [bossIndex]: shuffleSeeded(
          step.masks.filter((mask) => !mask.isHidden),
          deriveSeed(game.runSeed, `masks:${bossIndex}:${step.word}`),
        ),
      },
    };
  }
  return null;
}
