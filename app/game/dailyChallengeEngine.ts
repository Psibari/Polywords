import { DAILY_POOL } from './dailyPool';
import {
  DailyWord,
  DailyChallengeState,
  DailyResult,
  DailyRoundResult,
  DailyTier,
  DailyTitle,
} from './types';

// ── Challenge epoch — Day 1 ──────────────────────────────────
const EPOCH_DATE = '2026-06-12';
export const DAILY_ROUND_COUNT = 5;
const DAILY_TIER_CURVE: DailyTier[] = [1, 1, 2, 2, 3];

// ── Date helpers ─────────────────────────────────────────────

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getChallengeNumber(dateStr: string): number {
  const epoch  = new Date(EPOCH_DATE).getTime();
  const target = new Date(dateStr).getTime();
  const diff   = Math.floor((target - epoch) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

// ── Seeded random ────────────────────────────────────────────

function getDailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const c = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = Math.abs((s * 1664525 + 1013904223) & 0x7fffffff);
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCandidateBoard(
  target: DailyWord,
  allWords: DailyWord[],
  seed: number,
  offset: number,
): string[] {
  const board: string[] = [target.word];
  const addUnique = (word: string) => {
    if (!board.includes(word)) board.push(word);
  };

  seededShuffle(
    allWords
      .map(w => w.word)
      .filter(word => word !== target.word),
    seed + offset,
  ).forEach(addUnique);

  if (board.length < 9) {
    seededShuffle(
      target.candidates.filter(word => word !== target.word),
      seed + offset + 37,
    ).forEach(addUnique);
  }

  while (board.length < 9 && allWords.length > 0) {
    board.push(allWords[(seed + offset + board.length) % allWords.length].word);
  }

  return seededShuffle(board.slice(0, 9), seed + offset + 101);
}

// ── Session builder ──────────────────────────────────────────

export function buildDailySession(dateStr: string): DailyWord[] {
  const seed = getDailySeed(dateStr);

  const withBoard = (word: DailyWord, offset: number): DailyWord => ({
    ...word,
    candidates: buildCandidateBoard(word, DAILY_POOL, seed, offset),
  });

  const selected = new Set<string>();
  return DAILY_TIER_CURVE.map((tier, roundIndex) => {
    const tierPool = DAILY_POOL.filter(w => w.tier === tier);
    const available = tierPool.filter(w => !selected.has(w.word));
    const source = available.length > 0 ? available : tierPool;
    const word = seededShuffle(source, seed + roundIndex * 101)[0];
    selected.add(word.word);
    return withBoard(word, roundIndex);
  });
}

export function createDailyState(dateStr: string): DailyChallengeState {
  const rounds = buildDailySession(dateStr);
  return {
    date:                dateStr,
    rounds,
    currentRound:        0,
    lives:               2,
    remainingCandidates: rounds.map(r => [...r.candidates]),
    results:             [],
    status:              'playing',
  };
}

// ── Wrong swipe ──────────────────────────────────────────────

export function submitDailyWrongSwipe(
  state: DailyChallengeState,
  candidate: string,
): DailyChallengeState {
  const newLives  = Math.max(state.lives - 1, 0);
  const remaining = state.remainingCandidates.map((arr, i) =>
    i === state.currentRound ? arr.filter(c => c !== candidate) : arr
  );

  if (newLives === 0) {
    const completedResults: DailyRoundResult[] = [...state.results];
    const currentWrongSwipes =
      state.rounds[state.currentRound].candidates.length
      - state.remainingCandidates[state.currentRound].length
      + 1;

    for (let i = state.currentRound; i < state.rounds.length; i++) {
      completedResults.push({
        word:        state.rounds[i].word,
        tier:        state.rounds[i].tier,
        status:      'missed',
        wrongSwipes: i === state.currentRound ? currentWrongSwipes : 0,
      });
    }
    return {
      ...state,
      lives:               0,
      remainingCandidates: remaining,
      results:             completedResults,
      status:              'complete',
    };
  }

  return {
    ...state,
    lives:               newLives,
    remainingCandidates: remaining,
  };
}

// ── Correct swipe ────────────────────────────────────────────

export function submitDailyCorrectSwipe(
  state: DailyChallengeState,
): DailyChallengeState {
  const round       = state.rounds[state.currentRound];
  const wrongSwipes = round.candidates.length
    - state.remainingCandidates[state.currentRound].length;

  const roundResult: DailyRoundResult = {
    word:        round.word,
    tier:        round.tier,
    status:      'solved',
    wrongSwipes,
  };

  const newResults = [...state.results, roundResult];
  const nextRound  = state.currentRound + 1;
  const isComplete = nextRound >= state.rounds.length;

  return {
    ...state,
    currentRound: isComplete ? state.currentRound : nextRound,
    results:      newResults,
    status:       isComplete ? 'complete' : 'playing',
  };
}

// ── Result builder ───────────────────────────────────────────

export function computeDailyTitle(
  solvedCount: number,
): DailyTitle {
  if (solvedCount === 5) return 'WORD MASTER';
  if (solvedCount === 4) return 'SHARP';
  if (solvedCount >= 2) return 'SURVIVED';
  return                     'HAUNTED';
}

export function buildDailyResult(
  state: DailyChallengeState,
): DailyResult {
  const solvedCount = state.results.filter(r => r.status === 'solved').length;
  const title       = computeDailyTitle(solvedCount);
  const number      = getChallengeNumber(state.date);
  const totalRounds = state.rounds.length;

  const words = state.results.map(r => r.word).join(' · ');
  const share = [
    `POLYWORDS Daily #${number}`,
    `${words}`,
    `${solvedCount}/${totalRounds} words · ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left`,
    title,
    'polywords.app',
  ].join('\n');

  return {
    date:            state.date,
    challengeNumber: number,
    title,
    solvedCount,
    livesLeft:       state.lives,
    wordResults:     state.results,
    shareText:       share,
  };
}
