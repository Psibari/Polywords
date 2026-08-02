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
  hiddenPairs?: { real: string; trap: string }[] | null;
}>;
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

const hauntHunt = generateHunt({ ghostWordIds: [bossCapable[0]], seed: 8181 });
const hauntIndex = hauntHunt.findIndex(step => step.kind === 'word' && step.isHauntReturn);
ok(hauntIndex >= 0, 'eligible returning Haunt is placed');
ok(
  hauntHunt[hauntIndex + 1]?.kind === 'word' &&
    hauntHunt[hauntIndex + 1].emotionalRole === 'flow',
  'returning Haunt is followed by a decompression beat',
);
