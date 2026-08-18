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
const rematchHunt = generateHunt({ masteredWords: bossCapable, seed: 90210 });
const rematchBoss = rematchHunt.find(step => step.kind === 'word' && step.eventType === 'bossWord');
ok(
  rematchBoss?.kind === 'word' && rematchBoss.isMasteryRematch === true,
  'mastered boss pool becomes an explicit rematch instead of exhausting',
);
if (rematchBoss?.kind === 'word') {
  const sourcePairs = data[rematchBoss.word].hiddenPairs ?? [];
  ok(
    rematchBoss.hiddenPairs?.every((pair, index) => pair.id === sourcePairs[index]?.id) === true,
    'generated boss pairs retain source stable IDs',
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
