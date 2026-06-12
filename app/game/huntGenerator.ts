import { EmotionalRole, SessionStep, WordStep } from './types';
import rawHuntData from '../../assets/data/huntData.json';

type HuntWordData = {
  difficulty: 'easy' | 'medium' | 'hard';
  hiddenMeaning: string | null;
  hiddenTrap: string | null;
  masks: { id: string; phrase: string; isReal: boolean }[];
};

type HuntDB = Record<string, HuntWordData>;

const db = rawHuntData as unknown as HuntDB;

const EMOTIONAL_ROLES: EmotionalRole[] = [
  'confidence', 'confidence',               // 0–1
  'flow',       'flow',       'flow',        // 2–4
  'firstTension', 'tension',  'tension',    // 5–7
  'panic',      'panic',                    // 8–9
  'adrenaline',                             // 10
  'finalBoss',                              // 11
];

const HAPTIC_TIERS: ('light' | 'medium' | 'heavy')[] = [
  'light',  'light',  'light',  'light',  'light',  // 0–4
  'medium', 'medium', 'medium', 'medium',            // 5–8
  'heavy',  'heavy',  'heavy',                       // 9–11
];

// Mulberry32 seeded PRNG — deterministic shuffle per seed
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildWordStep(
  word: string,
  posIndex: number,
  isHauntReturn: boolean,
  isBoss: boolean,
): WordStep {
  const data = db[word];
  const step: WordStep = {
    kind: 'word',
    word,
    emotionalRole: EMOTIONAL_ROLES[posIndex],
    eventType: isBoss ? 'bossWord' : 'standard',
    difficulty: data.difficulty,
    hapticTier: HAPTIC_TIERS[posIndex],
    tileStagger: isBoss ? 120 : 80,
    meanings: [],
    masks: data.masks,
  };
  if (isBoss) step.bossModifier = true;
  if (isHauntReturn) step.isHauntReturn = true;
  if (data.hiddenMeaning != null) step.hiddenMeaning = data.hiddenMeaning;
  if (data.hiddenTrap != null) step.hiddenTrap = data.hiddenTrap;
  return step;
}

export function generateHunt(opts: {
  masteredWords?: string[];
  ghostWordIds?: string[];
}): SessionStep[] {
  const { masteredWords = [], ghostWordIds = [] } = opts;
  const mastered = new Set(masteredWords.map(w => w.toUpperCase()));
  const selected = new Set<string>();
  const rng = seededRng(Date.now());

  const available = Object.keys(db).filter(w => !mastered.has(w));
  const easyPool = shuffle(available.filter(w => db[w].difficulty === 'easy'),   rng);
  const medPool  = shuffle(available.filter(w => db[w].difficulty === 'medium'), rng);
  const hardPool = shuffle(available.filter(w => db[w].difficulty === 'hard'),   rng);
  const bossPool = shuffle(hardPool.filter(w => db[w].hiddenMeaning !== null),   rng);

  // Pick next available word from ordered fallback pools
  function next(pools: string[][]): string {
    for (const pool of pools) {
      for (const w of pool) {
        if (!selected.has(w)) {
          selected.add(w);
          return w;
        }
      }
    }
    throw new Error('[huntGenerator] Word pool exhausted — add more words to huntData.json');
  }

  // Boss chosen first so it is excluded from panic/tension picks
  const bossWord = next([bossPool, hardPool]);

  // Ghost priority: first ghost word that fits the hard/panic tier
  let ghostWord: string | null = null;
  for (const gid of ghostWordIds) {
    const w = gid.toUpperCase();
    if (db[w] && db[w].difficulty === 'hard' && !selected.has(w) && !mastered.has(w)) {
      ghostWord = w;
      selected.add(w);
      break;
    }
  }

  const slots: { word: string; isHauntReturn?: true }[] = [
    // 0–1: Confidence — easy, fall back to medium
    { word: next([easyPool, medPool]) },
    { word: next([easyPool, medPool]) },
    // 2–4: Flow — medium, fall back to hard
    { word: next([medPool, hardPool]) },
    { word: next([medPool, hardPool]) },
    { word: next([medPool, hardPool]) },
    // 5–6: Tension medium bias
    { word: next([medPool, hardPool]) },
    { word: next([medPool, hardPool]) },
    // 7: Tension hard bias
    { word: next([hardPool, medPool]) },
    // 8: Panic
    { word: next([hardPool, medPool]) },
  ];

  // 9: Ghost at index 9 (position 10) if available, otherwise next panic word
  if (ghostWord) {
    slots.push({ word: ghostWord, isHauntReturn: true });
  } else {
    slots.push({ word: next([hardPool, medPool]) });
  }

  // 10: Panic
  slots.push({ word: next([hardPool, medPool]) });

  // 11: Boss — always last
  slots.push({ word: bossWord });

  return slots.map(({ word, isHauntReturn }, idx) =>
    buildWordStep(word, idx, !!isHauntReturn, idx === 11),
  );
}
