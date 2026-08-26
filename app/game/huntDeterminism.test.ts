import { generateHunt } from './huntGenerator';
import { createGame } from './polyRunEngine';
import rawHuntData from '../../assets/data/huntData.json';

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

const seed = 0x51a7c0de;
const firstSteps = generateHunt({ seed });
const secondSteps = generateHunt({ seed });
ok(
  JSON.stringify(firstSteps) === JSON.stringify(secondSteps),
  'same run seed reproduces Hunt word and visible-mask selection',
);

const firstGame = createGame(firstSteps, 0, seed);
const secondGame = createGame(secondSteps, 0, seed);
ok(
  JSON.stringify(firstGame.shuffledMasks) === JSON.stringify(secondGame.shuffledMasks),
  'same run seed reproduces active mask order',
);
ok(firstGame.runSeed === seed && secondGame.runSeed === seed, 'run seed is persisted in game state');

// Adaptive pacing is deliberately deterministic and never changes the Boss/Haunt grammar.
const defaultAdaptiveHunt = generateHunt({ seed: 2468 });
const struggleAdaptiveHunt = generateHunt({
  recentHuntPerformance: ['struggle', 'struggle'],
  seed: 2468,
});
const cleanAdaptiveHunt = generateHunt({
  recentHuntPerformance: ['clean', 'clean', 'clean'],
  seed: 2468,
});
const adaptiveBoss = (steps: typeof defaultAdaptiveHunt) =>
  steps[steps.length - 1];
ok(
  JSON.stringify(struggleAdaptiveHunt) === JSON.stringify(generateHunt({
    recentHuntPerformance: ['struggle', 'struggle'],
    seed: 2468,
  })),
  'struggle adaptive draws remain deterministic',
);
ok(
  JSON.stringify(cleanAdaptiveHunt) === JSON.stringify(generateHunt({
    recentHuntPerformance: ['clean', 'clean', 'clean'],
    seed: 2468,
  })),
  'clean adaptive draws remain deterministic',
);
const struggleBoss = struggleAdaptiveHunt[struggleAdaptiveHunt.length - 1];
ok(
  struggleBoss.kind === 'word' &&
    struggleBoss.eventType === 'bossWord' &&
    struggleBoss.isMasteredReturn !== true,
  'struggle adaptation keeps the final Boss slot intact',
);
ok(
  struggleAdaptiveHunt.some(
    (step) => step.kind === 'word' && step.isMasteredReturn === true,
  ) === false,
  'adaptive draw does not invent mastered returns',
);

console.log('huntDeterminism tests passed');

const data = rawHuntData as Record<string, {
  hiddenMeaning: string | null;
  hiddenTrap: string | null;
  hiddenPairs?: { id?: string; real: string; trap: string }[] | null;
}>;
for (const [word, entry] of Object.entries(data)) {
  for (const sourcePair of entry.hiddenPairs ?? []) {
    ok(typeof sourcePair.id === 'string' && sourcePair.id.length > 0, `${word} source hidden pair has a stable ID`);
  }
}
const bossCapable = Object.keys(data).filter(word =>
  (data[word].hiddenPairs?.length ?? 0) > 0 ||
  (data[word].hiddenMeaning != null && data[word].hiddenTrap != null),
);
// Mastered words return to ordinary play, but never back into the Boss slot.
// Leave one Boss-capable word unmastered so the run still has a valid Boss.
const unmasteredBoss = bossCapable[0];
const masteredExceptBoss = Object.keys(data).filter(word => word !== unmasteredBoss);
const masteredReturnHunt = generateHunt({ masteredWords: masteredExceptBoss, seed: 90210 });
const masteredReturnSteps = masteredReturnHunt.filter(step => step.kind === 'word');
const masteredReturnBoss = masteredReturnSteps[masteredReturnSteps.length - 1];
ok(
  masteredReturnBoss?.kind === 'word' &&
    masteredReturnBoss.eventType === 'bossWord' &&
    masteredReturnBoss.word === unmasteredBoss &&
    masteredReturnBoss.isMasteredReturn !== true,
  'an unmastered Boss-capable word remains the Boss',
);
const masteredReturns = masteredReturnSteps.filter(
  step => step.kind === 'word' && step.isMasteredReturn === true,
);
ok(masteredReturns.length > 0, 'mastered words remain reachable as ordinary returns');
ok(
  masteredReturns.every(step => step.kind === 'word' && step.eventType !== 'bossWord' && !step.isHauntReturn),
  'mastered returns are never Bosses or Returning Haunts',
);
const repeatedMasteredReturnHunt = generateHunt({ masteredWords: masteredExceptBoss, seed: 90210 });
ok(
  JSON.stringify(masteredReturnHunt) === JSON.stringify(repeatedMasteredReturnHunt),
  'mastered-return draws remain deterministic for the same seed',
);
if (masteredReturnBoss?.kind === 'word') {
  const sourcePairs = data[masteredReturnBoss.word].hiddenPairs ?? [];
  ok(
    masteredReturnBoss.hiddenPairs?.every((pair, index) => pair.id === sourcePairs[index]?.id) === true,
    'generated Boss pairs retain source stable IDs',
  );
}

const hauntHunt = generateHunt({ ghostWordIds: [bossCapable[0]], seed: 8181 });
const hauntIndex = hauntHunt.findIndex(step => step.kind === 'word' && step.isHauntReturn);
ok(hauntIndex >= 0, 'eligible returning Haunt is placed');
ok(
  hauntHunt[hauntIndex + 1]?.kind === 'word' &&
    hauntHunt[hauntIndex + 1].emotionalRole === 'flow',
  'returning Haunt is followed by a decompression beat',
);

// The ghost round's weight must not depend on where it lands — regression
// guard for the position-inherited-role bug fixed 2026-08-18. At the new
// hauntIdx, both arc lengths inherit a weaker role without the fix:
// standard lands 'firstTension'/medium (hauntIdx coincides with
// firstTensionIdx), fledgling lands 'tension'/medium. Both assertions
// below are real regression guards, not redundant ones.
ok(
  hauntHunt[hauntIndex]?.kind === 'word' &&
    hauntHunt[hauntIndex].emotionalRole === 'adrenaline' &&
    hauntHunt[hauntIndex].hapticTier === 'heavy',
  'returning Haunt always gets adrenaline/heavy weight (standard arc)',
);
const fledglingHauntHunt = generateHunt({
  ghostWordIds: [bossCapable[0]],
  length: 8,
  gentle: true,
  seed: 8181,
});
const fledglingHauntIndex = fledglingHauntHunt.findIndex(
  step => step.kind === 'word' && step.isHauntReturn,
);
ok(fledglingHauntIndex >= 0, 'eligible returning Haunt is placed in fledgling arc');
ok(
  fledglingHauntHunt[fledglingHauntIndex]?.kind === 'word' &&
    fledglingHauntHunt[fledglingHauntIndex].emotionalRole === 'adrenaline' &&
    fledglingHauntHunt[fledglingHauntIndex].hapticTier === 'heavy',
  'returning Haunt always gets adrenaline/heavy weight (fledgling arc, the case that actually proves the fix)',
);

// Recency: a word in recentWordIds should never be picked while a
// non-recent alternative exists in the same pool.
const confidenceWords = Object.keys(data).filter(
  w => (data[w] as any).gpsTag === 'confidence',
);
const recentHunt = generateHunt({ recentWordIds: confidenceWords.slice(0, 10), seed: 4242 });
const pickedConfidenceWords = recentHunt
  .filter(s => s.kind === 'word')
  .map(s => (s as any).word)
  .filter(w => confidenceWords.includes(w));
ok(
  pickedConfidenceWords.every(w => !confidenceWords.slice(0, 10).includes(w)),
  'recent confidence words are deprioritized when fresher ones exist',
);

// Never crashes when the entire pool is "recent" — degrades gracefully.
const allWordsRecent = Object.keys(data);
ok(
  (() => { generateHunt({ recentWordIds: allWordsRecent, seed: 1357 }); return true; })(),
  'generateHunt does not throw when every word is marked recent',
);
