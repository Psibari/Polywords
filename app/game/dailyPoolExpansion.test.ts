import { DAILY_POOL } from './dailyPool';
import { DAILY_POOL_EXPANSION } from './dailyPoolExpansion';
import { buildDailySession } from './dailyChallengeEngine';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(`${label}: expected true`);
}

function containsCardWord(clue: string, card: string): boolean {
  const escaped = card.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Z])${escaped}([^A-Z]|$)`, 'i').test(clue);
}

eq(DAILY_POOL_EXPANSION.length, 50, 'expansion.count');
eq(new Set(DAILY_POOL_EXPANSION.map(entry => entry.word)).size, 50, 'expansion.uniqueWords');

eq(
  new Set([...DAILY_POOL, ...DAILY_POOL_EXPANSION].map(entry => entry.word)).size,
  110,
  'combined.uniqueWords',
);
eq(DAILY_POOL_EXPANSION.filter(entry => entry.tier === 1).length, 20, 'expansion.tier1Count');
eq(DAILY_POOL_EXPANSION.filter(entry => entry.tier === 2).length, 20, 'expansion.tier2Count');
eq(DAILY_POOL_EXPANSION.filter(entry => entry.tier === 3).length, 10, 'expansion.tier3Count');

for (const entry of DAILY_POOL_EXPANSION) {
  eq(entry.meanings.length, 3, `expansion.threeClues.${entry.word}`);
  eq(entry.candidates.length, 6, `expansion.sixCards.${entry.word}`);
  eq(new Set(entry.candidates).size, 6, `expansion.uniqueCards.${entry.word}`);
  eq(
    entry.candidates.filter(candidate => candidate === entry.word).length,
    1,
    `expansion.targetOnce.${entry.word}`,
  );
  ok([1, 2, 3].includes(entry.tier), `expansion.validTier.${entry.word}`);

  for (const clue of entry.meanings) {
    for (const card of entry.candidates) {
      ok(!containsCardWord(clue, card), `expansion.noCardLeak.${entry.word}.${card}`);
    }
  }
}

const expansionWords = new Set(DAILY_POOL_EXPANSION.map(entry => entry.word));
const seenExpansionWords = new Set<string>();
for (let day = 0; day < 365; day += 1) {
  const date = new Date(2026, 0, 1 + day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const session = buildDailySession(`${y}-${m}-${d}`);
  for (const round of session.rounds) {
    eq(round.candidates.length, 6, `runtime.sixCards.${y}-${m}-${d}.${round.word.answer}`);
    if (expansionWords.has(round.word.answer)) seenExpansionWords.add(round.word.answer);
  }
}

eq(seenExpansionWords.size, 50, 'runtime.allExpansionWordsReachable');

console.log('OK');
