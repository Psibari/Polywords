import { DAILY_POOL } from './dailyPool';
import {
  DailyCandidates,
  DailyChallengeState,
  DailyClaimResult,
  DailyResult,
  DailyRound,
  DailyRoundResult,
  DailySession,
  DailyTier,
  DailyWord,
} from './types';

const EPOCH_DATE = '2026-06-12';
const DAY_MS = 24 * 60 * 60 * 1000;

export const DAILY_ROUND_COUNT = 5;
export const DAILY_CHANCES = 2;
export const DAILY_CANDIDATE_COUNT = 6;
export const DAILY_TIER_CURVE: readonly DailyTier[] = [1, 1, 2, 2, 3];
export const DAILY_CLUE_2_DELAY_MS = 4000;
export const DAILY_CLUE_3_DELAY_MS = 8000;

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getChallengeNumber(dateString: string): number {
  const epoch = Date.parse(`${EPOCH_DATE}T00:00:00Z`);
  const target = Date.parse(`${dateString}T00:00:00Z`);
  if (!Number.isFinite(target)) {
    throw new Error(`Invalid Daily Challenge date: ${dateString}`);
  }
  return Math.max(1, Math.floor((target - epoch) / DAY_MS) + 1);
}

function getDailySeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T>(values: readonly T[], initialSeed: number): T[] {
  const shuffled = [...values];
  let seed = initialSeed >>> 0;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex]!,
      shuffled[index]!,
    ];
  }

  return shuffled;
}

function assertDailyWord(word: DailyWord): DailyWord {
  if (word.clues.length !== 3) {
    throw new Error(`Daily word ${word.id} must have exactly 3 clues.`);
  }
  if (word.candidates.length !== DAILY_CANDIDATE_COUNT) {
    throw new Error(`Daily word ${word.id} must have exactly 6 candidates.`);
  }
  if (new Set(word.candidates).size !== DAILY_CANDIDATE_COUNT) {
    throw new Error(`Daily word ${word.id} candidates must be unique.`);
  }
  if (word.candidates.filter(candidate => candidate === word.answer).length !== 1) {
    throw new Error(`Daily word ${word.id} must include its answer exactly once.`);
  }
  return word;
}

function pickDailyWord(
  tier: DailyTier,
  selectedIds: Set<string>,
  seed: number,
): DailyWord {
  const available = DAILY_POOL.filter(
    word => word.tier === tier && !selectedIds.has(word.id),
  );
  if (available.length === 0) {
    throw new Error(`Daily Challenge needs more unused tier ${tier} words.`);
  }
  return assertDailyWord(seededShuffle(available, seed)[0]!);
}

function shuffleCandidates(word: DailyWord, seed: number): DailyCandidates {
  return seededShuffle(word.candidates, seed) as DailyCandidates;
}

export function buildDailySession(dateString = getTodayDateString()): DailySession {
  const seed = getDailySeed(dateString);
  const selectedIds = new Set<string>();

  const rounds: DailyRound[] = DAILY_TIER_CURVE.map((tier, roundIndex) => {
    const word = pickDailyWord(tier, selectedIds, seed + roundIndex * 101);
    selectedIds.add(word.id);

    return {
      roundIndex,
      word,
      candidates: shuffleCandidates(word, seed + roundIndex * 313),
      revealedClueCount: 1,
      solved: false,
      wrongClaims: [],
    };
  });

  if (rounds.length !== DAILY_ROUND_COUNT) {
    throw new Error(`Daily Challenge expected ${DAILY_ROUND_COUNT} rounds.`);
  }

  return {
    date: dateString,
    challengeNumber: getChallengeNumber(dateString),
    rounds,
    currentRoundIndex: 0,
    chancesRemaining: DAILY_CHANCES,
    status: 'active',
    solvedCount: 0,
    startedAt: Date.now(),
  };
}

export function claimDailyWord(
  session: DailySession,
  claimedWord: string,
  now = Date.now(),
): { session: DailySession; result: DailyClaimResult } {
  const currentRound = session.rounds[session.currentRoundIndex];
  if (session.status !== 'active' || !currentRound) {
    return {
      session,
      result: {
        isCorrect: false,
        status: session.status,
        chancesRemaining: session.chancesRemaining,
        revealedClueCount: currentRound?.revealedClueCount ?? 3,
        solvedCount: session.solvedCount,
        roundAdvanced: false,
      },
    };
  }

  const normalizedClaim = claimedWord.trim().toUpperCase();
  const isCorrect = normalizedClaim === currentRound.word.answer.toUpperCase();
  const rounds = [...session.rounds];

  if (isCorrect) {
    rounds[session.currentRoundIndex] = { ...currentRound, solved: true };
    const solvedCount = session.solvedCount + 1;
    const won = solvedCount === DAILY_ROUND_COUNT;
    const nextSession: DailySession = {
      ...session,
      rounds,
      currentRoundIndex: won
        ? session.currentRoundIndex
        : session.currentRoundIndex + 1,
      solvedCount,
      status: won ? 'won' : 'active',
      ...(won ? { completedAt: now } : {}),
    };

    return {
      session: nextSession,
      result: {
        isCorrect: true,
        status: nextSession.status,
        chancesRemaining: nextSession.chancesRemaining,
        revealedClueCount: currentRound.revealedClueCount,
        solvedCount,
        roundAdvanced: !won,
        ...(won ? { pollyReaction: 'win' as const } : {}),
      },
    };
  }

  const chancesRemaining = session.chancesRemaining === 2 ? 1 : 0;
  const lost = chancesRemaining === 0;
  const revealedClueCount = lost
    ? 3
    : Math.min(3, currentRound.revealedClueCount + 1) as 1 | 2 | 3;

  rounds[session.currentRoundIndex] = {
    ...currentRound,
    wrongClaims: [...currentRound.wrongClaims, normalizedClaim],
    revealedClueCount,
  };

  const nextSession: DailySession = {
    ...session,
    rounds,
    chancesRemaining,
    status: lost ? 'lost' : 'active',
    ...(lost ? { completedAt: now } : {}),
  };

  return {
    session: nextSession,
    result: {
      isCorrect: false,
      status: nextSession.status,
      chancesRemaining,
      revealedClueCount,
      solvedCount: nextSession.solvedCount,
      roundAdvanced: false,
      pollyReaction: lost ? 'loss' : 'firstMiss',
    },
  };
}

export function revealDailyCluesByElapsed(
  session: DailySession,
  elapsedMs: number,
): DailySession {
  if (session.status !== 'active') return session;

  const currentRound = session.rounds[session.currentRoundIndex];
  if (!currentRound) return session;

  const timedClueCount = elapsedMs >= DAILY_CLUE_3_DELAY_MS
    ? 3
    : elapsedMs >= DAILY_CLUE_2_DELAY_MS
      ? 2
      : 1;

  if (timedClueCount <= currentRound.revealedClueCount) return session;

  const rounds = [...session.rounds];
  rounds[session.currentRoundIndex] = {
    ...currentRound,
    revealedClueCount: timedClueCount,
  };
  return { ...session, rounds };
}

export function createDailyResult(session: DailySession): DailyResult {
  if (session.status === 'active') {
    throw new Error('Cannot create a Daily result while the session is active.');
  }

  const completedAt = session.completedAt ?? Date.now();
  const won = session.status === 'won';
  const title = won ? "YOU BEAT POLLY'S CHALLENGE" : 'YOU LOSE';
  const wordResults: DailyRoundResult[] = session.rounds.map(round => ({
    word: round.word.answer,
    tier: round.word.tier,
    status: round.solved ? 'solved' : 'missed',
    wrongClaims: round.wrongClaims.length,
  }));

  return {
    date: session.date,
    challengeNumber: session.challengeNumber,
    status: session.status,
    solvedCount: session.solvedCount,
    chancesRemaining: session.chancesRemaining,
    goldFeatherEarned: won,
    completedAt,
    title,
    livesLeft: session.chancesRemaining,
    wordResults,
    shareText: [
      `POLYWORDS Daily #${session.challengeNumber}`,
      `${session.solvedCount}/${DAILY_ROUND_COUNT}`,
      title,
      'polywords.app',
    ].join('\n'),
  };
}

function toLegacyState(session: DailySession): DailyChallengeState {
  return {
    session,
    date: session.date,
    rounds: session.rounds.map(round => ({
      ...round.word,
      word: round.word.answer,
      meanings: round.word.clues,
      candidates: round.candidates,
    })),
    currentRound: session.currentRoundIndex,
    lives: session.chancesRemaining,
    remainingCandidates: session.rounds.map(round => [...round.candidates]),
    results: session.rounds
      .filter(round => round.solved)
      .map(round => ({
        word: round.word.answer,
        tier: round.word.tier,
        status: 'solved' as const,
        wrongClaims: round.wrongClaims.length,
      })),
    status: session.status === 'active' ? 'playing' : 'complete',
  };
}

/** @deprecated Quarantined store adapter. Use buildDailySession. */
export function createDailyState(dateString: string): DailyChallengeState {
  return toLegacyState(buildDailySession(dateString));
}

/** @deprecated Quarantined store adapter. Claims are UP-only. */
export function submitDailyWrongSwipe(
  state: DailyChallengeState,
  candidate: string,
): DailyChallengeState {
  return toLegacyState(claimDailyWord(state.session, candidate).session);
}

/** @deprecated Quarantined store adapter. Claims are UP-only. */
export function submitDailyCorrectSwipe(
  state: DailyChallengeState,
): DailyChallengeState {
  const round = state.session.rounds[state.session.currentRoundIndex];
  if (!round) return state;
  return toLegacyState(claimDailyWord(state.session, round.word.answer).session);
}

/** @deprecated Quarantined store adapter. Use createDailyResult. */
export function buildDailyResult(state: DailyChallengeState): DailyResult {
  return createDailyResult(state.session);
}
