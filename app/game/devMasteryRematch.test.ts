import assert from 'node:assert/strict';

import db from '../../assets/data/huntData.json';
import { applyDevMasteryRematch } from './devMasteryRematch';
import { generateHunt } from './huntGenerator';
import { createGame, isMysteryTerminal, resolveMysteryTile } from './polyRunEngine';
import type { WordStep } from './types';

const bank = db as Record<string, { gpsTag: string; hiddenMeaning: string | null; hiddenPairs?: unknown[] | null }>;
const hasHidden = (word: string) =>
  (Array.isArray(bank[word].hiddenPairs) && bank[word].hiddenPairs!.length > 0) || bank[word].hiddenMeaning != null;

const seed = 4242;
const steps = generateHunt({ seed });
const game = createGame(steps, 0, seed);
const bossIndex = steps.length - 1;
const originalBoss = steps[bossIndex] as WordStep;
assert.equal(originalBoss.eventType, 'bossWord');
assert.notEqual(originalBoss.isMasteryRematch, true, 'a fresh save gets a normal Boss');

const inHunt = new Set(steps.filter((s): s is WordStep => s.kind === 'word').map((s) => s.word));
const masteredCandidate = Object.keys(bank).find((w) => hasHidden(w) && !inHunt.has(w));
assert.ok(masteredCandidate, 'the bank has a Boss-capable word outside this Hunt');

function check(next: ReturnType<typeof applyDevMasteryRematch>, expectedWord: string) {
  assert.ok(next, 'rematch applied');
  const step = next.session[bossIndex] as WordStep;
  assert.equal(step.kind, 'word');
  assert.equal(step.word, expectedWord);
  assert.equal(step.eventType, 'bossWord');
  assert.equal(step.bossModifier, true);
  assert.equal(step.isMasteryRematch, true);
  assert.notEqual(step.isHauntReturn, true);
  assert.ok((step.hiddenPairs?.length ?? 0) > 0 || step.hiddenMeaning, 'has hidden Boss content');
  assert.equal(step.emotionalRole, originalBoss.emotionalRole);
  assert.equal(step.hapticTier, originalBoss.hapticTier);
  // The visible cards the player sees are this word's, shuffled for this slot.
  const ids = new Set(step.masks.filter((m) => !m.isHidden).map((m) => m.id));
  assert.equal(next.shuffledMasks[bossIndex].length, ids.size);
  for (const mask of next.shuffledMasks[bossIndex]) assert.ok(ids.has(mask.id));
  // Every other round and all run state are untouched; the jump itself is GameScreen's.
  for (let i = 0; i < bossIndex; i++) {
    assert.equal(next.session[i], game.session[i]);
    assert.equal(next.shuffledMasks[i], game.shuffledMasks[i]);
  }
  assert.equal(next.stepIndex, game.stepIndex);
  assert.equal(next.lives, game.lives);
  assert.equal(next.bossOutcome, 'pending');
  assert.equal(next.runSeed, game.runSeed);
}

// A mastered word with hidden content is used first.
check(applyDevMasteryRematch(game, [masteredCandidate.toLowerCase()]), masteredCandidate);

// No mastered words: the Hunt's own Boss word becomes the rematch.
check(applyDevMasteryRematch(game, []), originalBoss.word);

// A mastered word already in this Hunt, or one with no hidden content, is skipped.
{
  const earlier = (steps[0] as WordStep).word;
  const noHidden = Object.keys(bank).find((w) => !hasHidden(w) && !inHunt.has(w));
  const skipped = [earlier, ...(noHidden ? [noHidden] : [])];
  check(applyDevMasteryRematch(game, [...skipped, masteredCandidate]), masteredCandidate);
  check(applyDevMasteryRematch(game, skipped), originalBoss.word);
}

// A word with an active Haunt is never used (a win would prune its ghost); no candidate left => null.
check(applyDevMasteryRematch(game, [masteredCandidate, originalBoss.word], [masteredCandidate.toLowerCase()]), originalBoss.word);
assert.equal(applyDevMasteryRematch(game, [], [originalBoss.word]), null);

// Not available once the Hunt is on (or past) the Boss.
assert.equal(applyDevMasteryRematch({ ...game, stepIndex: bossIndex }, [masteredCandidate]), null);

// Deterministic for the same Hunt.
assert.deepEqual(
  applyDevMasteryRematch(game, [masteredCandidate])!.session[bossIndex],
  applyDevMasteryRematch(game, [masteredCandidate])!.session[bossIndex],
);

// The real engine judges it as a Boss: a correct last hidden card is terminal and sets mastered.
{
  const next = applyDevMasteryRematch(game, [masteredCandidate])!;
  const atBoss = { ...next, stepIndex: bossIndex, mysteryTotal: 1, mysteryResolved: 0 };
  assert.equal(isMysteryTerminal(atBoss, true), true);
  assert.equal(resolveMysteryTile(atBoss, { correct: true, visiblePerfect: true }).bossOutcome, 'mastered');
}

console.log('devMasteryRematch tests passed');
