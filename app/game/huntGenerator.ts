import { EmotionalRole, HiddenPair, SessionStep, WordStep } from './types';
import rawHuntData from '../../assets/data/huntData.json';

type HuntWordData = {
  difficulty: string;
  hiddenMeaning: string | null;
  hiddenTrap: string | null;
  hiddenPairs?: { real: string; trap: string }[] | null;
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
  // Fledgling runs need two safe repetitions of the swipe/recognition loop
  // before tension rises. The shorter arc removes one Panic word rather than
  // compressing onboarding into a single Confidence round.
  8:  { confidence: 2, flow: 2, tension: 2, panic: 1, boss: 1 },
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

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

// Compatibility bridge — words with the old singular fields yield exactly one
// pair, so nothing in huntData.json changes.
function hiddenPairsFor(word: string): HiddenPair[] {
  const data = db[word];
  if (data.hiddenPairs && data.hiddenPairs.length > 0) {
    return data.hiddenPairs
      .filter(p => p.real != null && p.trap != null)
      .map(p => ({ real: p.real, trap: p.trap }));
  }
  if (data.hiddenMeaning != null && data.hiddenTrap != null) {
    return [{ real: data.hiddenMeaning, trap: data.hiddenTrap }];
  }
  return [];
}

function hasBossContent(word: string): boolean {
  return hiddenPairsFor(word).length > 0;
}

// Fledgling draw: keep the shuffle for variety, but float easier words to the
// front of each pool so a player's first hunts draw gentler decks.
function easyFirst(pool: string[]): string[] {
  return [...pool].sort(
    (a, b) =>
      (DIFFICULTY_ORDER[db[a].difficulty] ?? 1) -
      (DIFFICULTY_ORDER[db[b].difficulty] ?? 1),
  );
}

// Hunt economy lock (docs/POLYWORDS_ECONOMY_LOCK.md): every word shows a flat
// 5 visible tiles. The difficulty ramp comes from trap sharpness per phase, not
// from tile count. Boss mystery tiles are built from hiddenMeaning/hiddenTrap
// (separate fields) and are NOT affected by this cap.
const VISIBLE_MASK_CAP = 5;

function selectVisibleMasks(
  masks: HuntWordData['masks'],
  rng: () => number,
): HuntWordData['masks'] {
  if (masks.length <= VISIBLE_MASK_CAP) return masks;

  const reals = shuffle(masks.filter(m => m.isReal), rng);
  const traps = shuffle(masks.filter(m => !m.isReal), rng);

  // Guarantee both swipe directions stay live on every word.
  const picked: HuntWordData['masks'] = [];
  if (reals.length) picked.push(reals[0]);
  if (traps.length) picked.push(traps[0]);

  const rest = shuffle([...reals.slice(1), ...traps.slice(1)], rng);
  while (picked.length < VISIBLE_MASK_CAP && rest.length) {
    picked.push(rest.shift()!);
  }
  return picked;
}

function buildWordStep(
  word: string,
  emotionalRole: EmotionalRole,
  hapticTier: 'light' | 'medium' | 'heavy',
  isHauntReturn: boolean,
  isBoss: boolean,
  rng: () => number,
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
    masks: selectVisibleMasks(data.masks, rng),
  };
  if (isBoss) step.bossModifier = true;
  if (isHauntReturn) step.isHauntReturn = true;
  if (data.hiddenMeaning != null) step.hiddenMeaning = data.hiddenMeaning;
  if (data.hiddenTrap != null) step.hiddenTrap = data.hiddenTrap;
  const pairs = hiddenPairsFor(word);
  if (pairs.length > 0) step.hiddenPairs = pairs;
  return step;
}

export function generateHunt(opts: {
  masteredWords?: string[];
  ghostWordIds?: string[];
  length?: number;
  gentle?: boolean;
}): SessionStep[] {
  const { masteredWords = [], ghostWordIds = [], length = SESSION_LENGTH, gentle = false } = opts;
  const mastered = new Set(masteredWords.map(w => w.toUpperCase()));
  const selected = new Set<string>();
  const rng = seededRng(Date.now());

  const plan = buildPhasePlan(length);
  const roles = rolesFromPlan(plan);
  const haptics = hapticsFromPlan(plan);

  const prep = (pool: string[]) =>
    gentle ? easyFirst(shuffle(pool, rng)) : shuffle(pool, rng);

  const available = Object.keys(db).filter(w => !mastered.has(w));
  const confidencePool = prep(available.filter(w => db[w].gpsTag === 'confidence'));
  const flowPool       = prep(available.filter(w => db[w].gpsTag === 'flow'));
  const tensionPool    = prep(available.filter(w => db[w].gpsTag === 'tension'));
  const panicPool      = prep(available.filter(w => db[w].gpsTag === 'panic'));
  const bossPool       = prep(available.filter(w => db[w].gpsTag === 'boss'));

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
      case 'boss': {
        const eligible = (pool: string[]) => pool.filter(hasBossContent);
        return next([eligible(bossPool), eligible(panicPool), eligible(tensionPool)]);
      }
    }
  }

  // Reserve the returning haunt before choosing a separate Round 10 boss.
  let ghostWord: string | null = null;
  for (const gid of ghostWordIds) {
    const w = gid.toUpperCase();
    if (db[w] && db[w].gpsTag === 'boss' && hasBossContent(w) && !selected.has(w) && !mastered.has(w)) {
      ghostWord = w;
      selected.add(w);
      break;
    }
  }

  const bossWord = pickForPhase('boss');

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
    buildWordStep(word, roles[idx], haptics[idx], !!isHauntReturn, idx === bossIdx, rng),
  );
}
