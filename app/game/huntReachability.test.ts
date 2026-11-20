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

// Prevent spreadsheet fill-down/row-shift errors from putting a COMPANY card under JAM.
// Every saved visible card ID must identify the same headword as its runtime owner.
for (const [word, entry] of Object.entries(db as Record<string, { masks: { id: string }[] }>)) {
  const prefix = word.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_';
  for (const mask of entry.masks) {
    assert.ok(mask.id.toLowerCase().startsWith(prefix),
      `${word}: card ${mask.id} belongs to a different headword`);
  }
}
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

// 3. Mastered words still return only in rounds 5-7, flagged isMasteredReturn.
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

// 4. Every generated Hunt has unique headwords, including the pinned Boss and a returning Haunt.
for (let seed = 1; seed <= 300; seed += 1) {
  const opts = { seed: seed * 65537, recentWordIds: ordinary.slice(seed % 30, seed % 30 + 30) };
  for (const steps of [generateHunt(opts), generateHunt({ ...opts, length: 8, gentle: true })]) {
    const words = steps.map(wordOf);
    assert.equal(new Set(words).size, words.length, `Hunt must not repeat a word within a run (seed ${seed})`);
  }
}

// 5. Consecutive completed Hunts rotate ordinary words rather than repeating the previous roster.
// The Boss may intentionally remain pinned when the player never reaches it.
{
  let recent: string[] = [];
  let pin: string | undefined;
  let previousOrdinary = new Set<string>();
  for (let hunt = 0; hunt < 60; hunt += 1) {
    const steps = generateHunt({ seed: hunt * 104729 + 71, recentWordIds: recent, pinnedBossWord: pin });
    const ordinaryWords = steps.slice(0, -1).map(wordOf);
    assert.equal(new Set(ordinaryWords).size, ordinaryWords.length);
    if (hunt > 0) {
      assert.ok(ordinaryWords.every(word => !previousOrdinary.has(word)),
        `consecutive Hunt ${hunt} repeated a prior ordinary word despite available fresh words`);
    }
    previousOrdinary = new Set(ordinaryWords);
    pin = pinnedBossForHunt(steps);
    recent = [...new Set([...ordinaryWords].reverse().concat(recent))].slice(0, RECENT_WORDS_CAP);
  }
}

console.log('hunt rotation regression tests passed');


// 6. Simulated player campaigns: early losses, full clears, onboarding, pinning,
//    recency, and reproducibility. These are generator-level simulations, not UI playtests.
{
  const campaigns = 200;
  const huntsPerCampaign = 40;
  let hunts = 0;
  let earlyLosses = 0;
  let completed = 0;
  let ordinaryImmediateRepeats = 0;
  let pinnedBossFailures = 0;
  let maskMixFailures = 0;
  const distinctReached = new Set<string>();

  for (let player = 0; player < campaigns; player += 1) {
    let recent: string[] = [];
    let pin: string | undefined;
    let priorReached = new Set<string>();
    for (let hunt = 0; hunt < huntsPerCampaign; hunt += 1) {
      const seed = player * 100003 + hunt * 7919 + 13;
      const opts = {
        seed,
        recentWordIds: recent,
        pinnedBossWord: pin,
        firstRunOnboarding: hunt === 0,
        ...(hunt < 3 ? { length: 8, gentle: true } : {}),
      };
      const steps = generateHunt(opts);
      assert.deepEqual(generateHunt(opts), steps, 'identical state and seed must reproduce the same Hunt');
      const words = steps.map(wordOf);
      assert.equal(new Set(words).size, words.length, 'a Hunt cannot contain duplicate headwords');
      assert.equal(steps.length, 8);
      if (hunt === 0) assert.equal(words[0], 'FINE', 'first-run onboarding begins with FINE');

      const currentBoss = pinnedBossForHunt(steps);
      if (pin && currentBoss !== pin) pinnedBossFailures += 1;
      pin = currentBoss ?? undefined;

      for (const step of steps) {
        if (step.kind !== 'word') continue;
        if (step.masks.length > 5 ||
            !step.masks.some(mask => mask.isReal) ||
            !step.masks.some(mask => !mask.isReal)) maskMixFailures += 1;
      }

      // Model a mix of early deaths and full runs. A full run reaches the Boss,
      // which resolves the pending pin. A loss records only reached words.
      const dieEarly = (player + hunt) % 4 !== 0;
      const reachedCount = dieEarly ? 2 + ((player * 7 + hunt) % 4) : steps.length;
      const reached = words.slice(0, reachedCount);
      for (const word of reached) distinctReached.add(word);
      ordinaryImmediateRepeats += reached.slice(0, -1).filter(word => priorReached.has(word)).length;
      priorReached = new Set(reached.slice(0, -1));
      recent = [...new Set([...reached].reverse().concat(recent))].slice(0, RECENT_WORDS_CAP);
      if (dieEarly) earlyLosses += 1;
      else {
        completed += 1;
        pin = undefined; // Boss was reached; a subsequent run may draw another.
      }
      hunts += 1;
    }
  }

  assert.equal(hunts, 8000);
  assert.equal(pinnedBossFailures, 0, 'unreached eligible Boss must stay pinned');
  assert.equal(maskMixFailures, 0, 'every simulated word must show <=5 cards with both REAL and trap');
  assert.ok(distinctReached.size >= ordinary.length - 1,
    'campaigns must expose nearly all ordinary headwords over time');
  console.log(JSON.stringify({
    simulation: 'Hunt player campaigns',
    campaigns, hunts, earlyLosses, completed,
    distinctReached: distinctReached.size,
    ordinaryImmediateRepeats, pinnedBossFailures, maskMixFailures,
    note: 'Immediate repeats are measured, not forbidden by the soft-recency contract',
  }));
}


// 7. Returning Haunt placement and Boss isolation across many generated Hunts.
{
  const bossCapable = Object.keys(db).filter(word => {
    const entry = (db as Record<string, { hiddenPairs?: { real: string | null; trap: string | null }[] }>)[word];
    return entry.hiddenPairs?.some(pair => pair.real != null && pair.trap != null);
  });
  assert.ok(bossCapable.length >= 2);
  const ghost = bossCapable[0];
  const boss = bossCapable[1];
  let checks = 0;
  for (let seed = 1; seed <= 200; seed++) {
    for (const length of [8, 10]) {
      const steps = generateHunt({
        seed: seed * 12347, length, gentle: length === 8,
        ghostWordIds: [ghost], pinnedBossWord: boss,
      });
      const hauntIndex = 3;
      const haunt = steps[hauntIndex];
      assert.equal(wordOf(haunt), ghost, 'queued Haunt appears in reserved slot');
      assert.equal(haunt.kind, 'word');
      if (haunt.kind !== 'word') throw new Error('Haunt slot not a word');
      assert.equal(haunt.isHauntReturn, true);
      assert.equal(wordOf(steps[steps.length - 1]), boss, 'Haunt does not replace eligible pinned Boss');
      assert.equal(new Set(steps.map(wordOf)).size, length);
      checks++;
    }
  }
  console.log('returning Haunt placement simulation:', JSON.stringify({ checks, ghost, pinnedBoss: boss }));
}


// Product lock (2026-11-19): every production/default Hunt is eight rounds.
// A ten-round override remains only for historical controlled comparisons.
{
  for (let seed = 1; seed <= 250; seed++) {
    const standard = generateHunt({ seed: seed * 733 });
    const fledgling = generateHunt({ seed: seed * 733, gentle: true, firstRunOnboarding: seed === 1 });
    for (const [name, steps] of [['standard', standard], ['fledgling', fledgling]] as const) {
      assert.equal(steps.length, 8, name + ' must contain exactly eight rounds');
      assert.equal(steps[7].kind, 'word');
      assert.equal(steps[7].eventType, 'bossWord', name + ' Boss must be round eight');
      assert.ok(steps.slice(0, 7).every(step => step.eventType !== 'bossWord'));
    }
  }
  console.log('eight-round production Hunt lock: passed');
}
