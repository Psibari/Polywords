import assert from 'node:assert/strict';

import { generateHunt } from './huntGenerator';
import { pinnedBossForHunt } from './pinnedBoss';
import db from '../../assets/data/huntData.json';

// Ordinary rounds pick by DIFFICULTY, not gpsTag (Pete, 2026-11-13). gpsTag used to lock
// words to late rounds, so a player who keeps dying early never met them. These checks
// keep every ordinary word reachable and the opening gentle.

type Entry = { gpsTag: string; difficulty: string };
const bank = db as unknown as Record<string, Entry>;
const ordinary = Object.keys(bank).filter(w => bank[w].gpsTag !== 'boss');
type Step = ReturnType<typeof generateHunt>[number];
const wordOf = (s: Step): string => (s as { word: string }).word;
const RECENT_WORDS_CAP = 30; // mirrors useGameStore recordRunComplete

// 1. Rounds 1-2 are always easy words; rounds 3-4 are never hard (no mastery, no first run).
for (let seed = 1; seed <= 300; seed += 1) {
  for (const opts of [{}, { length: 8, gentle: true }]) {
    const steps = generateHunt({ seed: seed * 104729, ...opts });
    steps.slice(0, 2).forEach((s, i) =>
      assert.equal(bank[wordOf(s)].difficulty, 'easy', `round ${i + 1} must be easy (seed ${seed})`));
    steps.slice(2, 4).forEach((s, i) =>
      assert.notEqual(bank[wordOf(s)].difficulty, 'hard', `round ${i + 3} must not be hard (seed ${seed})`));
  }
}

// 2. Players who die at a fixed round, 20 Hunts each, real recent-word rotation and pin.
function seenByPlayers(dieAt: number, players: number): Set<string> {
  const seen = new Set<string>();
  for (let p = 0; p < players; p += 1) {
    let recent: string[] = [];
    let pin: string | undefined;
    for (let h = 0; h < 20; h += 1) {
      const steps = generateHunt({
        seed: p * 1000 + h + 7, recentWordIds: recent, pinnedBossWord: pin,
        firstRunOnboarding: h === 0, ...(h < 3 ? { length: 8, gentle: true } : {}),
      });
      pin = pinnedBossForHunt(steps) ?? undefined;
      const reached = steps.slice(0, Math.min(dieAt, steps.length - 1)).map(wordOf);
      reached.forEach(w => seen.add(w));
      const next: string[] = [];
      for (const w of [...reached.slice().reverse(), ...recent]) {
        if (next.includes(w)) continue;
        next.push(w);
        if (next.length >= RECENT_WORDS_CAP) break;
      }
      recent = next;
    }
  }
  return seen;
}
{
  const seen = seenByPlayers(5, 200);
  const missing = ordinary.filter(w => !seen.has(w));
  assert.deepEqual(missing, [], `players who reach round 5 must be able to meet every ordinary word; never seen: ${missing.join(', ')}`);
}
{
  const seen = seenByPlayers(3, 200);
  const missing = ordinary.filter(w => bank[w].difficulty !== 'hard' && !seen.has(w));
  assert.deepEqual(missing, [], `players who die in round 3 must be able to meet every easy and medium word; never seen: ${missing.join(', ')}`);
}

// 3. Mastered words still return only in rounds 5-9, flagged isMasteredReturn.
{
  const mastered = ordinary.slice(0, 40);
  const masteredSet = new Set(mastered);
  for (let seed = 1; seed <= 100; seed += 1) {
    const steps = generateHunt({ seed: seed * 7919, masteredWords: mastered });
    steps.forEach((s, i) => {
      if (!masteredSet.has(wordOf(s))) return;
      assert.ok(i >= 4 && i <= steps.length - 2, `mastered ${wordOf(s)} returned in round ${i + 1}`);
      assert.equal((s as { isMasteredReturn?: boolean }).isMasteredReturn, true);
    });
  }
}

console.log('huntReachability.test.ts: ok');
