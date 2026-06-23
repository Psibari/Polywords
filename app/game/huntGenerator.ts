import { EmotionalRole, SessionStep, WordStep } from './types';
import rawHuntData from '../../assets/data/huntData.json';

type HuntWordData = {
  difficulty: string;
  hiddenMeaning: string | null;
  hiddenTrap: string | null;
  gpsTag: 'confidence' | 'flow' | 'tension' | 'panic' | 'boss';
  wordType?: string;
  masks: { id: string; phrase: string; isReal: boolean }[];
};

type HuntDB = Record<string, HuntWordData>;

const db = rawHuntData as unknown as HuntDB;

export const SESSION_LENGTH = 10;

type GpsDistribution = {
  confidence: number;
  flow: number;
  tension: number;
  panic: number;
  boss: number;
};

const GPS_ARCS: Record<number, GpsDistribution> = {
  8:  { confidence: 1, flow: 2, tension: 2, panic: 2, boss: 1 },
  10: { confidence: 2, flow: 2, tension: 3, panic: 2, boss: 1 },
  12: { confidence: 2, flow: 3, tension: 3, panic: 3, boss: 1 },
  15: { confidence: 2, flow: 4, tension: 4, panic: 4, boss: 1 },
};

type Phase = 'confidence' | 'flow' | 'tension' | 'panic' | 'boss';

function buildPhasePlan(length: number): Phase[] {
  const dist = GPS_ARCS[length];
  if (!dist) {
    throw new Error(`[huntGenerator] No GPS arc defined for length ${length}. Supported: ${Object.keys(GPS_ARCS).join(', ')}`);
  }
  const plan: Phase[] = [];
  for (let i = 0; i < dist.confidence; i++) plan.push('confidence');
  for (let i = 0; i < dist.flow; i++)       plan.push('flow');
  for (let i = 0; i < dist.tension; i++)    plan.push('tension');
  for (let i = 0; i < dist.panic; i++)      plan.push('panic');
  plan.push('boss'); // always last
  return plan;
}

function rolesFromPlan(plan: Phase[]): EmotionalRole[] {
  const firstTensionIdx = plan.indexOf('tension');
  const lastPanicIdx = plan.lastIndexOf('panic');
  return plan.map((phase, idx) => {
    switch (phase) {
      case 'confidence': return 'confidence';
      case 'flow':       return 'flow';
      case 'tension':    return idx === firstTensionIdx ? 'firstTension' : 'tension';
      case 'panic':      return idx === lastPanicIdx ? 'adrenaline' : 'panic';
      case 'boss':       return 'finalBoss';
    }
  });
}

function hapticsFromPlan(plan: Phase[]): ('light' | 'medium' | 'heavy')[] {
  return plan.map((phase) => {
    switch (phase) {
      case 'confidence':
      case 'flow':    return 'light';
      case 'tension': return 'medium';
      case 'panic':
      case 'boss':    return 'heavy';
    }
  });
}

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
  emotionalRole: EmotionalRole,
  hapticTier: 'light' | 'medium' | 'heavy',
  isHauntReturn: boolean,
  isBoss: boolean,
): WordStep {
  const data = db[word];
  const step: WordStep = {
    kind: 'word',
    word,
    emotionalRole,
    eventType: isBoss ? 'bossWord' : 'standard',
    difficulty: data.difficulty as WordStep['difficulty'],
    hapticTier,
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
  length?: number;
}): SessionStep[] {
  const { masteredWords = [], ghostWordIds = [], length = SESSION_LENGTH } = opts;
  const mastered = new Set(masteredWords.map(w => w.toUpperCase()));
  const selected = new Set<string>();
  const rng = seededRng(Date.now());

  const plan = buildPhasePlan(length);
  const roles = rolesFromPlan(plan);
  const haptics = hapticsFromPlan(plan);

  const available = Object.keys(db).filter(w => !mastered.has(w));
  const confidencePool = shuffle(available.filter(w => db[w].gpsTag === 'confidence'), rng);
  const flowPool       = shuffle(available.filter(w => db[w].gpsTag === 'flow'),       rng);
  const tensionPool    = shuffle(available.filter(w => db[w].gpsTag === 'tension'),    rng);
  const panicPool      = shuffle(available.filter(w => db[w].gpsTag === 'panic'),      rng);
  const bossPool       = shuffle(available.filter(w => db[w].gpsTag === 'boss'),       rng);

  // Pick next available word from ordered fallback pools
  function next(pools: string[][]): string {
    for (const pool of pools) {
      for (const w of pool) {
        if (!selected.has(w)) { selected.add(w); return w; }
      }
    }
    throw new Error('[huntGenerator] Word pool exhausted — add more words to huntData.json');
  }

  // Fallback chain per phase — own pool first, then adjacent tiers
  function pickForPhase(phase: Phase): string {
    switch (phase) {
      case 'confidence': return next([confidencePool, flowPool]);
      case 'flow':       return next([flowPool, confidencePool, tensionPool]);
      case 'tension':    return next([tensionPool, flowPool, panicPool]);
      case 'panic':      return next([panicPool, tensionPool]);
      case 'boss':       return next([bossPool, panicPool, tensionPool]);
    }
  }

  // Boss chosen FIRST so it is excluded from other picks
  const bossWord = pickForPhase('boss');

  // Ghost priority: first ghost word that fits the hard/panic tier
  let ghostWord: string | null = null;
  for (const gid of ghostWordIds) {
    const w = gid.toUpperCase();
    if (db[w] && (db[w].gpsTag === 'panic' || db[w].gpsTag === 'boss') && !selected.has(w) && !mastered.has(w)) {
      ghostWord = w;
      selected.add(w);
      break;
    }
  }

  const hauntIdx = length - 3; // ghost slot, then one panic word, then boss last
  const bossIdx = length - 1;

  const slots: { word: string; isHauntReturn?: true }[] = [];
  for (let i = 0; i < length; i++) {
    if (i === bossIdx) {
      slots.push({ word: bossWord });
    } else if (i === hauntIdx && ghostWord) {
      slots.push({ word: ghostWord, isHauntReturn: true });
    } else {
      slots.push({ word: pickForPhase(plan[i]) });
    }
  }

  return slots.map(({ word, isHauntReturn }, idx) =>
    buildWordStep(word, roles[idx], haptics[idx], !!isHauntReturn, idx === bossIdx),
  );
}
