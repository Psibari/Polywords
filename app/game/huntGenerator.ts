import { EmotionalRole, HiddenPair, HuntPerformance, SessionStep, WordStep } from './types';
import rawHuntData from '../../assets/data/huntData.json';
import { createSeededRng } from './seededRandom';

type HuntWordData = {
  difficulty: string;
  hiddenMeaning: string | null;
  hiddenTrap: string | null;
  hiddenPairs?: HiddenPair[] | null;
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

// Only 8 (fledgling) and 10 (standard) are ever actually requested by
// generateHunt's callers — no live call site passes any other length.
const GPS_ARCS: Record<number, GpsDistribution> = {
  // Fledgling runs need two safe repetitions of the swipe/recognition loop
  // before tension rises. The shorter arc removes one Panic word rather than
  // compressing onboarding into a single Confidence round.
  8:  { confidence: 2, flow: 2, tension: 2, panic: 1, boss: 1 },
  10: { confidence: 2, flow: 2, tension: 3, panic: 2, boss: 1 },
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
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

// Reorder only — never removes a word from the pool. Words shown recently
// sink to the back so a fresher word is picked first when one is available,
// but the existing cross-pool fallback chain must still see every word.
function recencyPartition(pool: string[], recentSet: Set<string>): string[] {
  const fresh: string[] = [];
  const recent: string[] = [];
  for (const w of pool) (recentSet.has(w) ? recent : fresh).push(w);
  return [...fresh, ...recent];
}

// Compatibility bridge — words with the old singular fields yield exactly one
// pair, so nothing in huntData.json changes.
function hiddenPairsFor(word: string): HiddenPair[] {
  const data = db[word];
  if (data.hiddenPairs && data.hiddenPairs.length > 0) {
    return data.hiddenPairs
      .filter(p => p.real != null && p.trap != null)
      .map(p => ({ id: p.id, real: p.real, trap: p.trap }));
  }
  if (data.hiddenMeaning != null && data.hiddenTrap != null) {
    return [{ id: `${word.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_h00`, real: data.hiddenMeaning, trap: data.hiddenTrap }];
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

function hardFirst(pool: string[]): string[] {
  return [...pool].sort(
    (a, b) =>
      (DIFFICULTY_ORDER[db[b].difficulty] ?? 1) -
      (DIFFICULTY_ORDER[db[a].difficulty] ?? 1),
  );
}

// Hunt economy lock (docs/GAME_REFERENCE.md): every word shows up to five
// visible tiles. Difficulty ramps through content, not tile count; hidden
// gauntlet tiles are separate and unaffected by this cap.
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
  isMasteryRematch: boolean,
  isMasteredReturn: boolean,
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
  if (isMasteryRematch) step.isMasteryRematch = true;
  if (isMasteredReturn) step.isMasteredReturn = true;
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
  recentWordIds?: string[];
  length?: number;
  gentle?: boolean;
  recentHuntPerformance?: HuntPerformance[];
  seed?: number;
}): SessionStep[] {
  const {
    masteredWords = [],
    ghostWordIds = [],
    recentWordIds = [],
    length = SESSION_LENGTH,
    gentle = false,
    recentHuntPerformance = [],
    seed = Date.now(),
  } = opts;
  const mastered = new Set(masteredWords.map(w => w.toUpperCase()));
  const recentSet = new Set(recentWordIds.map(w => w.toUpperCase()));
  const selected = new Set<string>();
  const rng = createSeededRng(seed);

  const plan = buildPhasePlan(length);
  const hasRepeatedStruggle = recentHuntPerformance.slice(0, 2).length === 2 &&
    recentHuntPerformance.slice(0, 2).every(result => result === 'struggle');
  const hasCleanStreak = recentHuntPerformance.slice(0, 3).length === 3 &&
    recentHuntPerformance.slice(0, 3).every(result => result === 'clean');
  const prep = (pool: string[], adaptive = true) => {
    const shuffled = shuffle(pool, rng);
    const useEase = gentle || (adaptive && hasRepeatedStruggle);
    const useSharp = adaptive && !useEase && hasCleanStreak;
    const ordered = useSharp
      ? hardFirst(shuffled)
      : useEase
      ? easyFirst(shuffled)
      : shuffled;
    return recencyPartition(ordered, recentSet);
  };

  const allWords = Object.keys(db);
  const available = allWords.filter(w => !mastered.has(w));
  // Mastered words remain in ordinary play as marked revisits. They are kept
  // out of confidence/flow so the opening stays fresh, and mixed into the
  // later tension/panic pools where a reclaimed word can add recognition
  // confidence without becoming a Boss or Haunt candidate.
  const masteredReturns = allWords.filter(w => mastered.has(w));
  const confidencePool = prep(available.filter(w => db[w].gpsTag === 'confidence'));
  const flowPool       = prep(available.filter(w => db[w].gpsTag === 'flow'));
  const tensionPool    = prep([
    ...available.filter(w => db[w].gpsTag === 'tension'),
    ...masteredReturns,
  ]);
  const panicPool      = prep([
    ...available.filter(w => db[w].gpsTag === 'panic'),
    ...masteredReturns,
  ]);
  // Bosses and Returning Haunts must always be unmastered. A mastered word's
  // hidden content is for ordinary revisits only; it is no longer an active
  // Boss gate and cannot be re-queued as a new Haunt.
  const bossPool       = prep(available.filter(w => db[w].gpsTag === 'boss'), false);

  // Pick next available word from ordered fallback pools
  function next(pools: string[][]): string {
    for (const pool of pools) {
      for (const w of pool) {
        if (!selected.has(w)) { selected.add(w); return w; }
      }
    }
    throw new Error('[huntGenerator] Word pool exhausted — add more words to huntData.json');
  }

  // Fallback chain per phase — own pool first, then adjacent tiers, then
  // every remaining pool as a last resort. Every phase must eventually be
  // able to reach every pool: the four pools are not evenly sized (by
  // editorial design, confidence and panic are the smallest — few words are
  // genuinely quick/fair recognition, or hard-but-defensible), so a
  // heavily-mastered late-game player can exhaust two adjacent pools at once
  // while a third pool sits unreachable and full. A phase degrading into a
  // less-fitting pool beats the run crashing outright.
  function pickForPhase(phase: Phase): string {
    switch (phase) {
      case 'confidence': return next([confidencePool, flowPool, tensionPool, panicPool]);
      case 'flow':       return next([flowPool, confidencePool, tensionPool, panicPool]);
      case 'tension':    return next([tensionPool, flowPool, panicPool, confidencePool]);
      case 'panic':      return next([panicPool, tensionPool, flowPool, confidencePool]);
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

  // Ghost slot moved earlier 2026-08-18 (was length-3: round 8/10 standard,
  // round 6/8 fledgling) — too deep for players who don't reliably reach
  // that far to ever see their revenge match. Only two lengths are ever
  // requested (see GPS_ARCS above), so this is explicit per-length rather
  // than a formula. Round 5 of 10 standard / round 4 of 8 fledgling.
  const hauntIdx = length === 8 ? 3 : 4;
  const bossIdx = length - 1;

  const bossSelectionPanicPool = prep(available.filter(w => db[w].gpsTag === 'panic'), false);
  const bossSelectionTensionPool = prep(available.filter(w => db[w].gpsTag === 'tension'), false);
  const eligibleBossPools = [bossPool, bossSelectionPanicPool, bossSelectionTensionPool]
    .map(pool => pool.filter(word => !mastered.has(word) && hasBossContent(word)));
  let bossWord: string | null = null;
  for (const pool of eligibleBossPools) {
    bossWord = pool.find(word => !selected.has(word)) ?? null;
    if (bossWord) break;
  }

  if (!bossWord) {
    // Mastered Boss words remain ordinary revisits, never Boss fallbacks.
    // Once the unmastered Boss-capable content is exhausted, authoring needs
    // to add more hidden-pair words rather than silently undoing mastery.
    throw new Error('[huntGenerator] No unmastered boss-capable word is available');
  }
  selected.add(bossWord);

  const slotPlan = [...plan];
  if (ghostWord && hauntIdx + 1 < bossIdx) {
    // A returning Haunt is already a peak. Follow it with a recognition-first
    // Flow beat before Polly's Word instead of stacking three peaks in a row.
    slotPlan[hauntIdx + 1] = 'flow';
  }
  const roles = rolesFromPlan(slotPlan);
  const haptics = hapticsFromPlan(slotPlan);

  // The ghost's weight must not depend on which phase slot it happens to
  // land on — previously it inherited whatever role/haptic the original
  // phase label at hauntIdx carried, an accident of array position, not a
  // decision (proof: fledgling runs got a weaker 'tension' treatment than
  // standard runs' 'adrenaline' purely because hauntIdx landed on a
  // different phase in each arc length). Always heavy/adrenaline: this is
  // Polly's exact rematch for the word that already beat the player once.
  if (ghostWord) {
    roles[hauntIdx] = 'adrenaline';
    haptics[hauntIdx] = 'heavy';
  }

  const slots: {
    word: string;
    isHauntReturn?: true;
    isMasteredReturn?: true;
  }[] = [];
  for (let i = 0; i < length; i++) {
    if (i === bossIdx) {
      slots.push({ word: bossWord });
    } else if (i === hauntIdx && ghostWord) {
      slots.push({ word: ghostWord, isHauntReturn: true });
    } else {
      const word = pickForPhase(slotPlan[i]);
      slots.push({
        word,
        ...(mastered.has(word) ? { isMasteredReturn: true as const } : {}),
      });
    }
  }

  return slots.map(({ word, isHauntReturn, isMasteredReturn }, idx) =>
    buildWordStep(
      word,
      roles[idx],
      haptics[idx],
      !!isHauntReturn,
      idx === bossIdx,
      false,
      !!isMasteredReturn,
      rng,
    ),
  );
}
