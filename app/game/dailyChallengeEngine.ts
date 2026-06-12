import { DAILY_POOL } from './dailyPool';
import {
  DailyWord,
  DailyChallengeState,
  DailyResult,
  DailyRoundResult,
  DailyTitle,
} from './types';

// ── Challenge epoch — Day 1 ──────────────────────────────────
const EPOCH_DATE = '2026-06-12';

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

// ── Session builder ──────────────────────────────────────────

export function buildDailySession(dateStr: string): DailyWord[] {
  const seed = getDailySeed(dateStr);

  const tier1 = DAILY_POOL.filter(w => w.tier === 1);
  const tier2 = DAILY_POOL.filter(w => w.tier === 2);
  const tier3 = DAILY_POOL.filter(w => w.tier === 3);

  const word1 = tier1[seed % tier1.length];
  const word2 = tier2[((seed >> 4) >>> 0) % tier2.length];
  const word3 = tier3[((seed >> 8) >>> 0) % tier3.length];

  const shuffle = (word: DailyWord, offset: number): DailyWord => ({
    ...word,
    candidates: seededShuffle(word.candidates, seed + offset),
  });

  return [
    shuffle(word1, 0),
    shuffle(word2, 1),
    shuffle(word3, 2),
  ];
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
    for (let i = state.currentRound; i < state.rounds.length; i++) {
      completedResults.push({
        word:        state.rounds[i].word,
        tier:        state.rounds[i].tier,
        status:      'missed',
        wrongSwipes: i === state.currentRound ? 1 : 0,
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

// ── Target rejected ──────────────────────────────────────────

function appendMissedDailyResult(
  results: DailyRoundResult[],
  round: DailyWord,
  wrongSwipes: number,
): DailyRoundResult[] {
  const alreadyRecorded = results.some(r => r.word === round.word && r.tier === round.tier);
  if (alreadyRecorded) return results;

  return [
    ...results,
    {
      word: round.word,
      tier: round.tier,
      status: 'missed',
      wrongSwipes,
    },
  ];
}

export function submitDailyTargetRejected(
  state: DailyChallengeState,
): DailyChallengeState {
  if (state.status !== 'playing') return state;

  const round = state.rounds[state.currentRound];
  if (!round) return state;

  const newLives = Math.max(state.lives - 1, 0);
  let results = appendMissedDailyResult(state.results, round, 1);

  if (newLives === 0) {
    for (let i = state.currentRound + 1; i < state.rounds.length; i++) {
      results = appendMissedDailyResult(results, state.rounds[i], 0);
    }

    return {
      ...state,
      lives: newLives,
      results,
      status: 'complete',
      currentRound: Math.min(state.currentRound, state.rounds.length - 1),
    };
  }

  const nextRound = state.currentRound + 1;
  const isComplete = nextRound >= state.rounds.length;

  return {
    ...state,
    lives: newLives,
    results,
    currentRound: isComplete ? state.currentRound : nextRound,
    status: isComplete ? 'complete' : 'playing',
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
  livesLeft: number,
): DailyTitle {
  if (solvedCount < 3)  return 'HAUNTED';
  if (livesLeft === 2)  return 'WORD MASTER';
  if (livesLeft === 1)  return 'SHARP';
  return                       'SURVIVED';
}

export function buildDailyResult(
  state: DailyChallengeState,
): DailyResult {
  const solvedCount = state.results.filter(r => r.status === 'solved').length;
  const title       = computeDailyTitle(solvedCount, state.lives);
  const number      = getChallengeNumber(state.date);

  const words = state.results.map(r => r.word).join(' · ');
  const share = [
    `POLYWORDS Daily #${number}`,
    `${words}`,
    `${solvedCount}/3 words · ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left`,
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
