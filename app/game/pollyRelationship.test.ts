import {
  derivePollyRelationshipContext,
  resolvePollyRelationshipBeat,
  resolvePollyRelationshipPresentation,
} from './pollyRelationship';
import {
  DEFAULT_POLLY_MEMORY,
  rememberHauntCreated,
  rememberHunt,
  rememberVisit,
} from './pollyMemory';
import { HuntPerformance } from './types';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function context(input: {
  recent?: HuntPerformance[];
  runs?: number;
  mastered?: number;
  now?: number;
  word?: string;
  memory?: typeof DEFAULT_POLLY_MEMORY;
}) {
  return derivePollyRelationshipContext({
    memory: input.memory ?? DEFAULT_POLLY_MEMORY,
    recent: input.recent ?? [],
    runsCompleted: input.runs ?? 0,
    masteredCount: input.mastered ?? 0,
    now: input.now ?? 1_800_000_000_000,
    word: input.word,
  });
}

{
  const memory = rememberVisit(
    { ...DEFAULT_POLLY_MEMORY, huntsRemembered: 6 },
    1_800_000_000_000,
  );
  const beat = resolvePollyRelationshipBeat({
    context: context({
      memory,
      runs: 6,
      now: 1_800_000_000_000 + 3 * 24 * 60 * 60 * 1000,
    }),
    surface: 'home',
  });
  eq(beat?.beat, 'returningAfterAbsence', 'return.afterThreeDays');
}

{
  const memory = rememberVisit(
    { ...DEFAULT_POLLY_MEMORY, huntsRemembered: 6 },
    1_800_000_000_000,
  );
  const beat = resolvePollyRelationshipBeat({
    context: context({
      memory,
      runs: 6,
      now: 1_800_000_000_000 + 2 * 24 * 60 * 60 * 1000,
    }),
    surface: 'home',
  });
  eq(beat, null, 'return.notTooSoon');
}

{
  let memory = rememberHunt(DEFAULT_POLLY_MEMORY, { outcome: 'pollyWon', score: 1 });
  memory = rememberHunt(memory, { outcome: 'pollyWon', score: 1 });
  memory = rememberHunt(memory, { outcome: 'playerBeatPolly', score: 1 });
  const beat = resolvePollyRelationshipBeat({
    context: context({
      memory,
      runs: 9,
      recent: ['clean', 'struggle', 'struggle', 'steady'],
    }),
    surface: 'results',
    currentOutcome: 'playerBeatPolly',
  });
  eq(beat?.beat, 'comeback', 'results.comeback');
}

{
  const memory = { ...DEFAULT_POLLY_MEMORY, playerHuntsWon: 4, huntsRemembered: 12 };
  const beat = resolvePollyRelationshipBeat({
    context: context({
      memory,
      runs: 12,
      mastered: 3,
      recent: ['struggle', 'struggle', 'struggle', 'clean', 'clean'],
    }),
    surface: 'results',
    currentOutcome: 'pollyWon',
  });
  eq(beat?.beat, 'veteranSlump', 'results.veteranSlump');
}

{
  const beat = resolvePollyRelationshipBeat({
    context: context({
      runs: 3,
      recent: ['struggle', 'struggle', 'struggle'],
    }),
    surface: 'results',
    currentOutcome: 'pollyWon',
  });
  eq(beat, null, 'results.newPlayerNotCalledVeteran');
}

{
  const memory = rememberHauntCreated(DEFAULT_POLLY_MEMORY, 'BANK', '2026-10-04');
  const beat = resolvePollyRelationshipBeat({
    context: context({ memory, runs: 6, word: 'bank' }),
    surface: 'wordEntry',
  });
  eq(beat?.beat, 'hauntRematch', 'word.hauntRematch');
  eq(beat?.wordRivalry?.word, 'BANK', 'word.hauntIdentity');
}

console.log('OK — pollyRelationship: all assertions passed');


{
  const presentation = resolvePollyRelationshipPresentation({
    decision: { beat: 'returningAfterAbsence', wordRivalry: null },
    recentLineIds: ['homeWordsAsked'],
    lineRoll: 0,
  });
  eq(presentation?.moment?.lineId, 'homeBackAgain', 'presentation.returnFreshLine');
  eq(presentation?.poseIntent, 'default', 'presentation.returnKeepsHomeBody');
}

{
  const presentation = resolvePollyRelationshipPresentation({
    decision: { beat: 'comeback', wordRivalry: null },
    recentLineIds: [],
    lineRoll: 0,
  });
  eq(presentation?.moment?.lineId, 'resultsIveNoticed', 'presentation.comebackLine');
  eq(presentation?.poseIntent, 'rattled', 'presentation.comebackBody');
}

{
  const presentation = resolvePollyRelationshipPresentation({
    decision: { beat: 'veteranSlump', wordRivalry: null },
    recentLineIds: [],
    lineRoll: 0,
  });
  eq(presentation?.moment?.lineId, 'resultsTrapsRemember', 'presentation.veteranSlumpLine');
  eq(presentation?.poseIntent, 'smug', 'presentation.veteranSlumpBody');
}

{
  const rivalry = {
    word: 'BANK',
    hauntHolds: 2,
    banished: false,
    firstHauntedAt: '2026-10-01',
    lastHauntAt: '2026-10-03',
    banishedAt: null,
  };
  const presentation = resolvePollyRelationshipPresentation({
    decision: { beat: 'hauntRematch', wordRivalry: rivalry },
    recentLineIds: [],
    lineRoll: 0,
  });
  eq(presentation?.moment?.lineId, 'huntRemember', 'presentation.hauntLine');
  eq(presentation?.poseIntent, 'point', 'presentation.repeatHauntBody');
}

{
  const presentation = resolvePollyRelationshipPresentation({
    decision: null,
    recentLineIds: [],
    lineRoll: 0,
  });
  eq(presentation, null, 'presentation.noBeatNoNoise');
}
