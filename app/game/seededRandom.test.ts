import { createSeededRng, createSeededTruthPlan, deriveSeed, shuffleSeeded } from './seededRandom';

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

const first = createSeededRng(12345);
const second = createSeededRng(12345);
ok(
  JSON.stringify([first(), first(), first()]) === JSON.stringify([second(), second(), second()]),
  'same seed produces same sequence',
);
ok(
  JSON.stringify(shuffleSeeded([1, 2, 3, 4, 5], 90)) ===
    JSON.stringify(shuffleSeeded([1, 2, 3, 4, 5], 90)),
  'same seed produces same shuffle',
);
ok(deriveSeed(7, 'words') !== deriveSeed(7, 'masks'), 'named streams stay separate');
ok(
  JSON.stringify(createSeededTruthPlan(77, 'boss:0', 3)) ===
    JSON.stringify(createSeededTruthPlan(77, 'boss:0', 3)),
  'boss face plan is reproducible',
);

console.log('seededRandom tests passed');
