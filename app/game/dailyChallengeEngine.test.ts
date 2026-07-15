// Run with: npx.cmd -y tsx app/game/dailyChallengeEngine.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import {
  DAILY_CHANCES,
  DAILY_ROUND_COUNT,
  DAILY_TIER_CURVE,
  buildDailySession,
  claimDailyWord,
  createDailyResult,
  getChallengeNumber,
  revealDailyCluesByElapsed,
} from './dailyChallengeEngine';
import { DAILY_POOL } from './dailyPool';
import { DailySession } from './types';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(`${label}: expected true`);
}

// ── Pool integrity ────────────────────────────────────────────────

{
  const ids = new Set<string>();
  for (const word of DAILY_POOL) {
    ok(!ids.has(word.id), `pool.uniqueId.${word.id}`);
    ids.add(word.id);
    eq(word.clues.length, 3, `pool.threeClues.${word.id}`);
    eq(word.candidates.length, 6, `pool.sixCandidates.${word.id}`);
    eq(new Set(word.candidates).size, 6, `pool.uniqueCandidates.${word.id}`);
    eq(
      word.candidates.filter(c => c === word.answer).length,
      1,
      `pool.answerOnce.${word.id}`,
    );
    ok([1, 2, 3].includes(word.tier), `pool.validTier.${word.id}`);
    for (const clue of word.clues) {
      ok(clue.split(/\s+/).length <= 8, `pool.clueLength.${word.id}: "${clue}"`);
      ok(
        !clue.toUpperCase().includes(word.answer.toUpperCase()),
        `pool.clueLeaksAnswer.${word.id}: "${clue}"`,
      );
    }
    for (const candidate of word.candidates) {
      if (candidate === word.answer) continue;
      ok(
        !candidate.includes(word.answer),
        `pool.candidateContainsAnswer.${word.id}: "${candidate}"`,
      );
    }
  }
  // Every tier needs real depth for the rotation.
  for (const tier of [1, 2, 3] as const) {
    const size = DAILY_POOL.filter(w => w.tier === tier).length;
    ok(size >= 12, `pool.tierDepth.${tier} (${size})`);
  }
}

// ── Determinism: same date, same puzzle ──────────────────────────

{
  const a = buildDailySession('2026-07-13');
  const b = buildDailySession('2026-07-13');
  eq(a.rounds.length, DAILY_ROUND_COUNT, 'session.roundCount');
  for (let i = 0; i < DAILY_ROUND_COUNT; i++) {
    eq(a.rounds[i].word.id, b.rounds[i].word.id, `determinism.word.${i}`);
    eq(
      a.rounds[i].candidates.join(','),
      b.rounds[i].candidates.join(','),
      `determinism.candidates.${i}`,
    );
    eq(a.rounds[i].word.tier, DAILY_TIER_CURVE[i], `session.tierCurve.${i}`);
  }
  eq(a.challengeNumber, getChallengeNumber('2026-07-13'), 'session.challengeNumber');
}

// ── Rotation spacing: no word repeats within 4 consecutive days ──

{
  const lastSeen = new Map<string, number>();
  for (let day = 0; day < 90; day++) {
    const date = new Date(2026, 6, 1 + day);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const session = buildDailySession(`${y}-${m}-${d}`);
    const dayIds = new Set<string>();
    for (const round of session.rounds) {
      ok(!dayIds.has(round.word.id), `rotation.uniqueWithinDay.${y}-${m}-${d}`);
      dayIds.add(round.word.id);
      const prev = lastSeen.get(round.word.id);
      if (prev !== undefined) {
        ok(
          day - prev >= 4,
          `rotation.minGap.${round.word.id}: reappeared after ${day - prev} days`,
        );
      }
      lastSeen.set(round.word.id, day);
    }
  }
}

// ── Claim flow: solve all five, win, clue speed captured ─────────

function solveAll(session: DailySession, waits: number[]): DailySession {
  let s = session;
  for (let i = 0; i < DAILY_ROUND_COUNT; i++) {
    s = revealDailyCluesByElapsed(s, waits[i] ?? 0);
    const round = s.rounds[s.currentRoundIndex];
    s = claimDailyWord(s, round.word.answer).session;
  }
  return s;
}

{
  let s = buildDailySession('2026-07-13');
  // fast, fast, waited to clue 2, waited to clue 3, fast
  s = solveAll(s, [0, 0, 5000, 9000, 0]);
  eq(s.status, 'won', 'win.status');
  eq(s.solvedCount, 5, 'win.solvedCount');
  eq(s.chancesRemaining, DAILY_CHANCES, 'win.chancesUntouched');

  const result = createDailyResult(s);
  eq(result.goldFeatherEarned, true, 'win.goldFeather');
  eq(result.wordResults[0].cluesUsed, 1, 'win.cluesUsed.fast');
  eq(result.wordResults[2].cluesUsed, 2, 'win.cluesUsed.clue2');
  eq(result.wordResults[3].cluesUsed, 3, 'win.cluesUsed.clue3');
  ok(result.shareText.includes('🟨🟨🟪⬜🟨'), 'win.shareGrid');
  ok(result.shareText.includes('POLYWORDS Daily #'), 'win.shareTag');
}

// ── Claim flow: wrong claims burn chances and reveal clues ───────

{
  let s = buildDailySession('2026-07-13');
  const round = s.rounds[0];
  const wrong = round.candidates.find(c => c !== round.word.answer)!;

  const first = claimDailyWord(s, wrong);
  eq(first.result.isCorrect, false, 'miss.first.incorrect');
  eq(first.result.chancesRemaining, 1, 'miss.first.chances');
  eq(first.result.pollyReaction, 'firstMiss', 'miss.first.reaction');
  eq(first.session.rounds[0].revealedClueCount, 2, 'miss.first.clueBump');
  eq(first.session.status, 'active', 'miss.first.stillActive');

  const second = claimDailyWord(first.session, wrong);
  eq(second.result.chancesRemaining, 0, 'miss.second.chances');
  eq(second.session.status, 'lost', 'miss.second.lost');
  eq(second.result.pollyReaction, 'loss', 'miss.second.reaction');

  const result = createDailyResult(second.session);
  eq(result.status, 'lost', 'loss.resultStatus');
  eq(result.goldFeatherEarned, false, 'loss.noFeather');
  eq(result.wordResults[0].status, 'missed', 'loss.roundMissed');
  eq(result.wordResults[0].cluesUsed, 3, 'loss.cluesUsedMax');
  eq(result.wordResults[1].status, 'unreached', 'loss.roundUnreached');
  ok(result.shareText.includes('🟥⬛⬛⬛⬛'), 'loss.shareGrid');

  // claims after the session ends are ignored
  const after = claimDailyWord(second.session, round.word.answer);
  eq(after.session.status, 'lost', 'loss.claimsIgnored');
}

// ── Timed clue reveals ────────────────────────────────────────────

{
  let s = buildDailySession('2026-07-13');
  eq(s.rounds[0].revealedClueCount, 1, 'reveal.startsAtOne');
  s = revealDailyCluesByElapsed(s, 3999);
  eq(s.rounds[0].revealedClueCount, 1, 'reveal.beforeClue2');
  s = revealDailyCluesByElapsed(s, 4000);
  eq(s.rounds[0].revealedClueCount, 2, 'reveal.clue2');
  s = revealDailyCluesByElapsed(s, 8000);
  eq(s.rounds[0].revealedClueCount, 3, 'reveal.clue3');
  // never goes backwards
  s = revealDailyCluesByElapsed(s, 0);
  eq(s.rounds[0].revealedClueCount, 3, 'reveal.neverRegresses');
}

console.log('OK');
