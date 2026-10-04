import { PollyMemory, PollyWordRivalry } from './pollyMemory';
import { HuntPerformance } from './types';
import { resolveRivalryState } from './pollyMood';
import { BookRivalryState } from './pollyBookLines';
import { PollyLineId, PollyMoment, pollyMoment } from './pollyCharacter';
import { pickFreshLine } from './pollyVisitPolicy';

export type PollyRelationshipContext = {
  todayMood: BookRivalryState;
  runsCompleted: number;
  masteredCount: number;
  playerHuntsWon: number;
  pollyHuntsWon: number;
  playerWinStreak: number;
  pollyWinStreak: number;
  longestPlayerWinStreak: number;
  longestPollyWinStreak: number;
  recent: HuntPerformance[];
  /** Milliseconds since the last recorded meaningful visit. Null means the
   *  relationship brain has no trustworthy prior-visit timestamp yet. */
  awayMs: number | null;
  relevantWordRivalry: PollyWordRivalry | null;
};

/**
 * Pure relationship read. It stores no labels such as "veteran" or
 * "comeback": those are authored-behavior policy decisions and can evolve
 * without migrating save data. This object exposes the proven facts needed to
 * distinguish a new player from an established rival, a current slump from a
 * historically strong player, and a word with shared history from a fresh one.
 */
export function derivePollyRelationshipContext(input: {
  memory: PollyMemory;
  recent: HuntPerformance[];
  runsCompleted: number;
  masteredCount: number;
  now: number;
  word?: string | null;
}): PollyRelationshipContext {
  const { memory, recent, runsCompleted, masteredCount, now } = input;
  const word = typeof input.word === 'string' ? input.word.trim().toUpperCase() : '';
  const awayMs = memory.lastVisitAt !== null && Number.isFinite(now)
    ? Math.max(0, Math.floor(now - memory.lastVisitAt))
    : null;

  return {
    todayMood: resolveRivalryState({ recent, masteredCount, runsCompleted }),
    runsCompleted: Math.max(0, Math.floor(runsCompleted)),
    masteredCount: Math.max(0, Math.floor(masteredCount)),
    playerHuntsWon: memory.playerHuntsWon,
    pollyHuntsWon: memory.pollyHuntsWon,
    playerWinStreak: memory.playerWinStreak,
    pollyWinStreak: memory.pollyWinStreak,
    longestPlayerWinStreak: memory.longestPlayerWinStreak,
    longestPollyWinStreak: memory.longestPollyWinStreak,
    recent: [...recent],
    awayMs,
    relevantWordRivalry: word ? memory.wordRivalries[word] ?? null : null,
  };
}


export type PollyRelationshipBeat =
  | 'returningAfterAbsence'
  | 'comeback'
  | 'veteranSlump'
  | 'hauntRematch';

export type PollyRelationshipBeatDecision = {
  beat: PollyRelationshipBeat;
  /** Facts only. Presentation decides whether Polly speaks, moves, or stays
   * silent. Keeping copy out of this layer prevents the brain from becoming
   * an untestable dialogue tree. */
  wordRivalry: PollyWordRivalry | null;
} | null;

const DAY_MS = 24 * 60 * 60 * 1000;
const RETURN_AFTER_MS = 3 * DAY_MS;
const ESTABLISHED_RUNS = 8;
const ESTABLISHED_WINS = 2;
const SLUMP_LENGTH = 3;

/**
 * Priority policy for the first observable relationship beats.
 *
 * Specific shared history beats generic form. Results-specific reversals beat
 * Home return recognition. Ordinary wins/losses deliberately produce no beat:
 * scarcity is part of Polly's character and prevents "memory" from turning
 * into constant commentary.
 */
export function resolvePollyRelationshipBeat(input: {
  context: PollyRelationshipContext;
  surface: 'home' | 'results' | 'wordEntry';
  currentOutcome?: 'pollyWon' | 'playerCompleted' | 'playerBeatPolly';
}): PollyRelationshipBeatDecision {
  const { context, surface, currentOutcome } = input;

  if (
    surface === 'wordEntry' &&
    context.relevantWordRivalry !== null &&
    !context.relevantWordRivalry.banished
  ) {
    return { beat: 'hauntRematch', wordRivalry: context.relevantWordRivalry };
  }

  if (surface === 'results') {
    const prior = context.recent.slice(1);
    const priorStruggles = prior.slice(0, SLUMP_LENGTH).filter(x => x === 'struggle').length;
    if (currentOutcome === 'playerBeatPolly' && priorStruggles >= 2) {
      return { beat: 'comeback', wordRivalry: null };
    }

    const established =
      context.runsCompleted >= ESTABLISHED_RUNS ||
      context.masteredCount >= 2 ||
      context.playerHuntsWon >= ESTABLISHED_WINS;
    const currentStruggles = context.recent.slice(0, SLUMP_LENGTH)
      .filter(x => x === 'struggle').length;
    if (established && currentStruggles >= SLUMP_LENGTH) {
      return { beat: 'veteranSlump', wordRivalry: null };
    }
  }

  if (
    surface === 'home' &&
    context.runsCompleted > 0 &&
    context.awayMs !== null &&
    context.awayMs >= RETURN_AFTER_MS
  ) {
    return { beat: 'returningAfterAbsence', wordRivalry: null };
  }

  return null;
}


export type PollyRelationshipPresentation = {
  moment: PollyMoment | null;
  poseIntent: 'default' | 'rattled' | 'smug' | 'point';
};

const RETURN_LINES: PollyLineId[] = [
  'homeMissMe',
  'homeBackAgain',
  'relReturn03',
  'relReturn04',
  'relReturn05',
  'relReturn06',
  'relReturn07',
  'relReturn08',
  'relReturn09',
  'relReturn10',
  'relReturn11',
  'relReturn12',
  'relReturn13',
  'relReturn14',
  'relReturn15',
  'relReturn16',
  'relReturn17',
  'relReturn18',
  'relReturn19',
  'relReturn20',
  'relReturn21',
  'relReturn22',
  'relReturn23',
  'relReturn24',
  'relReturn25',
  'relReturn26',
  'relReturn27',
  'relReturn28',
  'relReturn29',
  'relReturn30',
  'relReturn31',
  'relReturn32',
  'relReturn33',
  'relReturn34',
  'relReturn35',
  'relReturn36',
  'relReturn37',
  'relReturn38',
  'relReturn39',
  'relReturn40',
  'relReturn41',
  'relReturn42',
  'relReturn43',
  'relReturn44',
  'relReturn45',
  'relReturn46',
  'relReturn47',
  'relReturn48',
  'relReturn49',
  'relReturn50',
  'relReturn51',
  'relReturn52',
  'relReturn53',
  'relReturn54',
  'relReturn55',
  'relReturn56',
  'relReturn57',
  'relReturn58',
  'relReturn59',
  'relReturn60',
  'relReturn61',
];

const COMEBACK_LINES: PollyLineId[] = [
  'relComeback01',
  'relComeback02',
  'relComeback03',
  'relComeback04',
  'relComeback05',
  'relComeback06',
  'relComeback07',
  'relComeback08',
  'relComeback09',
  'relComeback10',
  'relComeback11',
  'relComeback12',
  'relComeback13',
  'relComeback14',
  'relComeback15',
  'relComeback16',
  'relComeback17',
  'relComeback18',
];

const VETERAN_SLUMP_LINES: PollyLineId[] = [
  'relVeteranSlump01',
  'relVeteranSlump02',
  'relVeteranSlump03',
  'relVeteranSlump04',
  'relVeteranSlump05',
  'relVeteranSlump06',
  'relVeteranSlump07',
  'relVeteranSlump08',
  'relVeteranSlump09',
  'relVeteranSlump10',
  'relVeteranSlump11',
  'relVeteranSlump12',
  'relVeteranSlump13',
  'relVeteranSlump14',
  'relVeteranSlump15',
  'relVeteranSlump16',
  'relVeteranSlump17',
  'relVeteranSlump18',
  'relVeteranSlump19',
  'relVeteranSlump20',
  'relVeteranSlump21',
  'relVeteranSlump22',
  'relVeteranSlump23',
  'relVeteranSlump24',
  'relVeteranSlump25',
  'relVeteranSlump26',
  'relVeteranSlump27',
  'relVeteranSlump28',
  'relVeteranSlump29',
  'relVeteranSlump30',
];

const HAUNT_REMATCH_LINES: PollyLineId[] = [
  'relHauntRematch01',
  'relHauntRematch02',
  'relHauntRematch03',
  'relHauntRematch04',
  'relHauntRematch05',
  'relHauntRematch06',
  'relHauntRematch07',
  'relHauntRematch08',
  'relHauntRematch09',
  'relHauntRematch10',
  'relHauntRematch11',
  'relHauntRematch12',
  'relHauntRematch13',
  'relHauntRematch14',
  'relHauntRematch15',
  'relHauntRematch16',
  'relHauntRematch17',
  'relHauntRematch18',
  'relHauntRematch19',
  'relHauntRematch20',
  'relHauntRematch21',
  'relHauntRematch22',
  'relHauntRematch23',
  'relHauntRematch24',
  'relHauntRematch25',
  'relHauntRematch26',
  'relHauntRematch27',
  'relHauntRematch28',
  'relHauntRematch29',
  'relHauntRematch30',
  'relHauntRematch31',
  'relHauntRematch32',
  'relHauntRematch33',
  'relHauntRematch34',
  'relHauntRematch35',
  'relHauntRematch36',
  'relHauntRematch37',
  'relHauntRematch38',
  'relHauntRematch39',
  'relHauntRematch40',
  'relHauntRematch41',
  'relHauntRematch42',
  'relHauntRematch43',
  'relHauntRematch44',
  'relHauntRematch45',
  'relHauntRematch46',
  'relHauntRematch47',
  'relHauntRematch48',
  'relHauntRematch49',
  'relHauntRematch50',
  'relHauntRematch51',
  'relHauntRematch52',
  'relHauntRematch53',
  'relHauntRematch54',
  'relHauntRematch55',
  'relHauntRematch56',
  'relHauntRematch57',
  'relHauntRematch58',
  'relHauntRematch59',
  'relHauntRematch60',
  'relHauntRematch61',
  'relHauntRematch62',
  'relHauntRematch63',
  'relHauntRematch64',
  'relHauntRematch65',
  'relHauntRematch66',
  'relHauntRematch67',
  'relHauntRematch68',
  'relHauntRematch69',
  'relHauntRematch70',
  'relHauntRematch71',
];

/**
 * Turns a proven relationship beat into a restrained presentation recipe.
 * Every line comes from the existing authored Polly bank. This layer does not
 * invent runtime dialogue and deliberately leaves ordinary moments alone.
 */
export function resolvePollyRelationshipPresentation(input: {
  decision: PollyRelationshipBeatDecision;
  recentLineIds: readonly string[];
  lineRoll: number;
}): PollyRelationshipPresentation | null {
  const { decision, recentLineIds, lineRoll } = input;
  if (!decision) return null;

  if (decision.beat === 'returningAfterAbsence') {
    const lineId = pickFreshLine(RETURN_LINES, recentLineIds, lineRoll);
    return { moment: pollyMoment(lineId), poseIntent: 'default' };
  }

  if (decision.beat === 'comeback') {
    const lineId = pickFreshLine(COMEBACK_LINES, recentLineIds, lineRoll);
    return { moment: pollyMoment(lineId), poseIntent: 'rattled' };
  }

  if (decision.beat === 'veteranSlump') {
    const lineId = pickFreshLine(VETERAN_SLUMP_LINES, recentLineIds, lineRoll);
    return { moment: pollyMoment(lineId), poseIntent: 'smug' };
  }

  // The Hunt visit policy already owns the actual flight/perch arc. The
  // relationship layer only sharpens that existing ghost-entry beat according
  // to durable shared history, avoiding a second competing Polly presenter.
  const hauntHolds = decision.wordRivalry?.hauntHolds ?? 0;
  const eligible = HAUNT_REMATCH_LINES.filter(lineId => {
    // "Don't let it beat you twice" is strongest on the first rematch.
    if (lineId === 'relHauntRematch51') return hauntHolds === 0;
    // These explicitly imply the word has already held the player more than once.
    if (lineId === 'relHauntRematch55' || lineId === 'relHauntRematch56') return hauntHolds >= 1;
    // This line requires a cross-rivalry record comparison we do not currently
    // persist at word granularity. Keep it authored, but never lie with it.
    if (lineId === 'relHauntRematch58') return false;
    return true;
  });
  const lineId = pickFreshLine(eligible, recentLineIds, lineRoll);
  return {
    moment: pollyMoment(lineId),
    poseIntent: hauntHolds >= 2 ? 'point' : 'smug',
  };
}
