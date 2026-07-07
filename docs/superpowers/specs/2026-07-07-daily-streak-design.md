# Daily Streak — Design

## Why

Retention audit (2026-07-07) found no daily streak mechanic despite it being the strongest
known day-over-day retention lever for word games. See `docs/CONTENT_PHILOSOPHY.md` context
sibling — this doc is scoped to the streak feature only.

## Data

Extend `PlayerProgress` (`app/game/types.ts`):

```ts
export type PlayerProgress = {
  masteredWords: MasteredWordRecord[];
  personalBest: number;
  runsCompleted: number;
  currentStreak: number;      // new
  longestStreak: number;      // new
  lastStreakDate: string | null; // new, YYYY-MM-DD via getTodayDateString()
};
```

`DEFAULT_PROGRESS` in `useGameStore.ts` gets `currentStreak: 0, longestStreak: 0,
lastStreakDate: null`. Existing `{ ...DEFAULT_PROGRESS, ...parsed }` merge on load makes this
backward-compatible with saved progress automatically.

## Update trigger

A streak day = the player finishes today's Daily Challenge, win **or** loss (not win-only —
"did you show up" framing, not a win-streak). Reuses the existing `dailyResult` completion
point, not a new one.

In `useGameStore.ts`'s `claimDailyAnswer`, at the point `dailyResult` is first computed for
today (session status becomes `'won'` or `'lost'`), call a new pure helper:

```ts
function applyDailyStreak(progress: PlayerProgress, today: string): PlayerProgress {
  if (progress.lastStreakDate === today) return progress; // idempotent
  const isConsecutive = progress.lastStreakDate === getPreviousDateString(today);
  const currentStreak = isConsecutive ? progress.currentStreak + 1 : 1;
  return {
    ...progress,
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastStreakDate: today,
  };
}
```

`getPreviousDateString` is a new small helper alongside `getTodayDateString` in
`app/game/dailyChallengeEngine.ts` (date - 1 day, same `YYYY-MM-DD` format).

Persist through the same progress-save path `masteredWords`/`personalBest` already use.

## Display (derived, not stored)

Storage only updates at completion, so a player who hasn't played today but broke their streak
2+ days ago would still see a stale number if the raw field were read directly. A pure selector
fixes this without extra storage writes:

```ts
function getDisplayStreak(progress: PlayerProgress, today: string): number {
  if (progress.lastStreakDate === today) return progress.currentStreak;
  if (progress.lastStreakDate === getPreviousDateString(today)) return progress.currentStreak;
  return 0;
}
```

## UI

Small flame + number badge on the "DAILY CHALLENGE" door, `app/screens/HomeScreen.tsx`
(~line 98-111). Gold per palette (`PW.color.gold`), text at 14px+ per the existing legibility
floor rule. No milestone rewards, no notifications — out of scope for this pass.

## Out of scope

Grace days / streak freezes, milestone rewards, push notifications, cloud sync of streak state.
All explicitly deferred to a later pass per user decision.
