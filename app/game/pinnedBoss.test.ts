import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { generateHunt } from './huntGenerator';
import { pinnedBossForHunt, sanitizePinnedBossWord } from './pinnedBoss';
import db from '../../assets/data/huntData.json';

// Pinned Boss (Pete, 2026-11-12): the Boss stays until the player reaches it.

type Entry = { gpsTag: string; hiddenPairs?: { real: string | null; trap: string | null }[] };
const bank = db as unknown as Record<string, Entry>;
const bossCapable = Object.keys(bank).filter(word =>
  (bank[word].hiddenPairs ?? []).some(p => p.real != null && p.trap != null));
assert.ok(bossCapable.length >= 3, 'the bank must carry boss words for this test');

function bossOf(steps: ReturnType<typeof generateHunt>): string {
  const step = steps[steps.length - 1];
  assert.equal(step.kind, 'word');
  if (step.kind !== 'word') throw new Error('unreachable');
  assert.equal(step.eventType, 'bossWord');
  return step.word;
}

const seed = 424242;
const unpinnedBoss = bossOf(generateHunt({ seed }));
const pin = bossCapable.find(word => word !== unpinnedBoss)!;

// 1. An eligible pin becomes the Boss, and appears only once in the Hunt.
{
  const steps = generateHunt({ seed, pinnedBossWord: pin });
  assert.equal(bossOf(steps), pin, 'an eligible pinned word is the Boss');
  const words = steps.filter(s => s.kind === 'word').map(s => (s as { word: string }).word);
  assert.equal(words.filter(w => w === pin).length, 1, 'the pinned Boss appears once');
  assert.equal(pinnedBossForHunt(steps), pin, 'the same word is saved as the pin');
}
// The pin holds across many different Hunts (the player keeps dying early).
for (let s = 1; s <= 25; s += 1) {
  assert.equal(bossOf(generateHunt({ seed: s * 7919, pinnedBossWord: pin })), pin);
  assert.equal(bossOf(generateHunt({ seed: s * 7919, pinnedBossWord: pin, length: 8, gentle: true })), pin,
    'fledgling 8-round Hunts keep the pin too');
}
// Lowercase or padded saved values still match.
assert.equal(bossOf(generateHunt({ seed, pinnedBossWord: ` ${pin.toLowerCase()} ` })), pin);

// 2. A mastered pin (the player beat it) is ignored: a new Boss is picked.
{
  const steps = generateHunt({ seed, pinnedBossWord: pin, masteredWords: [pin] });
  assert.notEqual(bossOf(steps), pin, 'a mastered pin is never the Boss');
}
// 3. A pin that became a Haunt (the player lost at it) is ignored as the Boss.
{
  const steps = generateHunt({ seed, pinnedBossWord: pin, ghostWordIds: [pin] });
  assert.notEqual(bossOf(steps), pin, 'a haunted pin is never the Boss');
}
// 4. Unknown words and words without Boss content are ignored.
{
  assert.equal(bossOf(generateHunt({ seed, pinnedBossWord: 'NOT_A_WORD' })), unpinnedBoss);
  const noBossContent = Object.keys(bank).find(word => !bossCapable.includes(word))!;
  assert.equal(bossOf(generateHunt({ seed, pinnedBossWord: noBossContent })), unpinnedBoss);
}
// 5. No pin: the Hunt is exactly what it was before this feature.
assert.deepEqual(generateHunt({ seed }), generateHunt({ seed, pinnedBossWord: undefined }));

// 6. A Master's Rematch pins nothing.
{
  const steps = generateHunt({ seed, masteredWords: bossCapable });
  const boss = steps[steps.length - 1];
  assert.ok(boss.kind === 'word' && boss.isMasteryRematch, 'all Boss words mastered gives a rematch');
  assert.equal(pinnedBossForHunt(steps), undefined, 'a rematch is not pinned');
}

// 7. Saved values are cleaned.
assert.equal(sanitizePinnedBossWord(' wake '), 'WAKE');
assert.equal(sanitizePinnedBossWord(''), undefined);
assert.equal(sanitizePinnedBossWord('   '), undefined);
assert.equal(sanitizePinnedBossWord(42), undefined);
assert.equal(sanitizePinnedBossWord(null), undefined);

// 8. The store passes the pin in, saves the new pin at Hunt start, and cleans it on load.
{
  const store = readFileSync(new URL('../store/useGameStore.ts', import.meta.url), 'utf8');
  assert.match(store, /pinnedBossWord: get\(\)\.progress\.pinnedBossWord,/);
  assert.match(store, /const nextPinnedBoss = pinnedBossForHunt\(steps\);/);
  assert.match(store, /sanitizePinnedBossWord\(kingHydrated\.pinnedBossWord\)/);
}

console.log('pinnedBoss tests passed');
