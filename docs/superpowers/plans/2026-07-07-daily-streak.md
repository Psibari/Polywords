# Daily Streak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track and display a daily-completion streak (current + longest) that increments when the player finishes today's Daily Challenge, win or lose, and resets on a missed day.

**Architecture:** Three pure functions in a new `app/game/dailyStreak.ts` module compute the streak transition and the display value from `PlayerProgress`. `useGameStore.ts` calls the update function at the existing Daily Challenge completion point and persists the result through the existing `PROGRESS_KEY` AsyncStorage path. `HomeScreen.tsx` reads the derived display value and renders a small badge on the Daily Challenge door.

**Tech Stack:** React Native / Expo, TypeScript strict, Zustand store, AsyncStorage. No test framework installed — this repo's convention (see `app/game/pollyVisitPolicy.test.ts`) is a plain-assert script run via `npx.cmd -y tsx <file>.test.ts`, throwing on first failure and printing `OK` on success.

## Global Constraints

- TS strict; every task ends with `npx.cmd tsc --noEmit` passing clean.
- Dates are `YYYY-MM-DD` strings in the player's **local** timezone, produced by the existing `getTodayDateString()` in `app/game/dailyChallengeEngine.ts` — new date math must stay in local time to match it, not UTC.
- Non-gameplay UI text has a 14px legibility floor (project convention already encoded as `homeType` in `app/ui/pwHomeMaterials.ts`).
- Palette: gold (`PW.color.gold`, `#F5C842`) is the locked token for score/reward/mastery UI — use it for the streak badge.
- No new npm dependencies.
- Streak counts a *finished* Daily Challenge (win or loss) — not a win-only streak.

---

### Task 1: Pure streak logic

**Files:**
- Create: `app/game/dailyStreak.ts`
- Create: `app/game/dailyStreak.test.ts`
- Modify: `app/game/types.ts:160-164` (the `PlayerProgress` type)

**Interfaces:**
- Consumes: `PlayerProgress` type from `./types`; `getTodayDateString(date?: Date): string` from `./dailyChallengeEngine`.
- Produces: `getPreviousDateString(dateString: string): string`, `applyDailyStreak(progress: PlayerProgress, today: string): PlayerProgress`, `getDisplayStreak(progress: PlayerProgress, today: string): number` — all exported from `app/game/dailyStreak.ts`, consumed by Task 2 (store) and Task 3 (UI).

- [ ] **Step 1: Extend `PlayerProgress`**

Edit `app/game/types.ts:160-164`, replace:

```ts
export type PlayerProgress = {
  masteredWords: MasteredWordRecord[];
  personalBest: number;
  runsCompleted: number;
};
```

with:

```ts
export type PlayerProgress = {
  masteredWords: MasteredWordRecord[];
  personalBest: number;
  runsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
};
```

- [ ] **Step 2: Write the failing test**

Create `app/game/dailyStreak.test.ts`:

```ts
// Run with: npx.cmd -y tsx app/game/dailyStreak.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import { applyDailyStreak, getDisplayStreak, getPreviousDateString } from './dailyStreak';
import { PlayerProgress } from './types';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function progress(overrides: Partial<PlayerProgress> = {}): PlayerProgress {
  return {
    masteredWords: [],
    personalBest: 0,
    runsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    ...overrides,
  };
}

// ── getPreviousDateString ────────────────────────────────────────
eq(getPreviousDateString('2026-07-07'), '2026-07-06', 'previous.plain');
eq(getPreviousDateString('2026-07-01'), '2026-06-30', 'previous.monthRollover');
eq(getPreviousDateString('2026-01-01'), '2025-12-31', 'previous.yearRollover');

// ── applyDailyStreak ──────────────────────────────────────────────

// First ever completion
{
  const p = applyDailyStreak(progress(), '2026-07-07');
  eq(p.currentStreak, 1, 'first.currentStreak');
  eq(p.longestStreak, 1, 'first.longestStreak');
  eq(p.lastStreakDate, '2026-07-07', 'first.lastStreakDate');
}

// Consecutive day increments
{
  const start = progress({ currentStreak: 4, longestStreak: 4, lastStreakDate: '2026-07-06' });
  const p = applyDailyStreak(start, '2026-07-07');
  eq(p.currentStreak, 5, 'consecutive.currentStreak');
  eq(p.longestStreak, 5, 'consecutive.longestStreak');
}

// Gap day resets to 1, longest is preserved
{
  const start = progress({ currentStreak: 5, longestStreak: 5, lastStreakDate: '2026-07-01' });
  const p = applyDailyStreak(start, '2026-07-07');
  eq(p.currentStreak, 1, 'gap.currentStreak');
  eq(p.longestStreak, 5, 'gap.longestStreakPreserved');
}

// Same day called twice is idempotent
{
  const start = progress({ currentStreak: 3, longestStreak: 3, lastStreakDate: '2026-07-07' });
  const p = applyDailyStreak(start, '2026-07-07');
  eq(p.currentStreak, 3, 'idempotent.currentStreak');
  eq(p, start, 'idempotent.sameReference');
}

// ── getDisplayStreak ──────────────────────────────────────────────

// Played today
eq(
  getDisplayStreak(progress({ currentStreak: 3, lastStreakDate: '2026-07-07' }), '2026-07-07'),
  3,
  'display.playedToday',
);

// Played yesterday, not yet today — streak still shows (not yet lapsed)
eq(
  getDisplayStreak(progress({ currentStreak: 3, lastStreakDate: '2026-07-06' }), '2026-07-07'),
  3,
  'display.playedYesterday',
);

// Missed 2+ days — shows 0 even though stored currentStreak is stale
eq(
  getDisplayStreak(progress({ currentStreak: 3, lastStreakDate: '2026-07-01' }), '2026-07-07'),
  0,
  'display.lapsed',
);

// Never played
eq(getDisplayStreak(progress(), '2026-07-07'), 0, 'display.never');

console.log('OK');
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx.cmd -y tsx app/game/dailyStreak.test.ts`
Expected: fails with a module-not-found error for `./dailyStreak` (file doesn't exist yet).

- [ ] **Step 4: Implement `app/game/dailyStreak.ts`**

```ts
import { PlayerProgress } from './types';
import { getTodayDateString } from './dailyChallengeEngine';

export function getPreviousDateString(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day - 1);
  return getTodayDateString(date);
}

export function applyDailyStreak(progress: PlayerProgress, today: string): PlayerProgress {
  if (progress.lastStreakDate === today) return progress;

  const isConsecutive = progress.lastStreakDate === getPreviousDateString(today);
  const currentStreak = isConsecutive ? progress.currentStreak + 1 : 1;

  return {
    ...progress,
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastStreakDate: today,
  };
}

export function getDisplayStreak(progress: PlayerProgress, today: string): number {
  if (progress.lastStreakDate === today) return progress.currentStreak;
  if (progress.lastStreakDate === getPreviousDateString(today)) return progress.currentStreak;
  return 0;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx.cmd -y tsx app/game/dailyStreak.test.ts`
Expected: prints `OK` with no errors.

- [ ] **Step 6: Typecheck**

Run: `npx.cmd tsc --noEmit`
Expected: no errors. (`DEFAULT_PROGRESS` in `useGameStore.ts` is missing the three new required fields at this point — if `tsc` errors there, that's expected and gets fixed in Task 2. If it errors anywhere else, stop and investigate.)

- [ ] **Step 7: Commit**

```bash
git add app/game/dailyStreak.ts app/game/dailyStreak.test.ts app/game/types.ts
git commit -m "Add pure daily streak logic"
```

---

### Task 2: Wire streak updates into the store

**Files:**
- Modify: `app/store/useGameStore.ts:28-34` (imports), `:64-68` (`DEFAULT_PROGRESS`), `:369-393` (`claimDailyAnswer`)

**Interfaces:**
- Consumes: `applyDailyStreak(progress: PlayerProgress, today: string): PlayerProgress` from Task 1's `app/game/dailyStreak.ts`.
- Produces: `progress.currentStreak` / `progress.longestStreak` / `progress.lastStreakDate` are now live in the store's `progress` state and persisted to `AsyncStorage` under `PROGRESS_KEY`, readable via `useGameStore(s => s.progress)` — this is what Task 3 reads.

- [ ] **Step 1: Add the import**

In `app/store/useGameStore.ts`, the existing import block at lines 28-34 reads:

```ts
import {
  buildDailySession,
  claimDailyWord,
  createDailyResult,
  getTodayDateString,
  revealDailyCluesByElapsed,
} from '../game/dailyChallengeEngine';
```

Add directly below it:

```ts
import { applyDailyStreak } from '../game/dailyStreak';
```

- [ ] **Step 2: Extend `DEFAULT_PROGRESS`**

Replace `app/store/useGameStore.ts:64-68`:

```ts
const DEFAULT_PROGRESS: PlayerProgress = {
  masteredWords: [],
  personalBest: 0,
  runsCompleted: 0,
};
```

with:

```ts
const DEFAULT_PROGRESS: PlayerProgress = {
  masteredWords: [],
  personalBest: 0,
  runsCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastStreakDate: null,
};
```

- [ ] **Step 3: Typecheck to confirm Task 1's dangling error is now fixed**

Run: `npx.cmd tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Update `claimDailyAnswer`**

Replace `app/store/useGameStore.ts:369-393`:

```ts
  claimDailyAnswer: (answer: string) => {
    const dailySession = get().dailySession;
    if (!dailySession || dailySession.status !== 'active') return;

    const claim = claimDailyWord(dailySession, answer);
    const dailyResult = claim.session.status === 'active'
      ? null
      : createDailyResult(claim.session);

    set({
      dailySession: claim.session,
      daily: toQuarantinedDailyState(claim.session),
      dailyLastClaimResult: claim.result,
      ...(dailyResult ? { dailyResult } : {}),
    });

    if (dailyResult) {
      const resultKey = DAILY_RESULT_KEY_PREFIX + dailyResult.date;
      AsyncStorage.setItem(resultKey, JSON.stringify(dailyResult)).catch(() => {});
    }

    if (dailyResult?.goldFeatherEarned) {
      get().grantGoldFeather();
    }
  },
```

with:

```ts
  claimDailyAnswer: (answer: string) => {
    const dailySession = get().dailySession;
    if (!dailySession || dailySession.status !== 'active') return;

    const claim = claimDailyWord(dailySession, answer);
    const dailyResult = claim.session.status === 'active'
      ? null
      : createDailyResult(claim.session);

    const progress = dailyResult
      ? applyDailyStreak(get().progress, dailyResult.date)
      : get().progress;

    set({
      dailySession: claim.session,
      daily: toQuarantinedDailyState(claim.session),
      dailyLastClaimResult: claim.result,
      ...(dailyResult ? { dailyResult } : {}),
      progress,
    });

    if (dailyResult) {
      const resultKey = DAILY_RESULT_KEY_PREFIX + dailyResult.date;
      AsyncStorage.setItem(resultKey, JSON.stringify(dailyResult)).catch(() => {});
      AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)).catch(() => {});
    }

    if (dailyResult?.goldFeatherEarned) {
      get().grantGoldFeather();
    }
  },
```

`PROGRESS_KEY` is the existing constant already defined at `useGameStore.ts:37` — no new import needed.

- [ ] **Step 5: Typecheck**

Run: `npx.cmd tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification**

This mutates store state driven by daily-challenge completion, which has no existing unit test harness (`claimDailyWord`/`createDailyResult` are exercised only through the screen). Run the app (`npx.cmd expo start`), open Daily Challenge, finish a round (win or lose), and confirm via a temporary `console.log(useGameStore.getState().progress)` (or React DevTools) that `currentStreak` is `1` and `lastStreakDate` is today's date. Remove any temporary logging before committing.

- [ ] **Step 7: Commit**

```bash
git add app/store/useGameStore.ts
git commit -m "Update daily streak on Daily Challenge completion"
```

---

### Task 3: Streak badge on the Home screen

**Files:**
- Modify: `app/ui/pwHomeMaterials.ts:18-26` (`homeType`)
- Modify: `app/screens/HomeScreen.tsx` (imports, component body, `styles`)

**Interfaces:**
- Consumes: `getDisplayStreak(progress: PlayerProgress, today: string): number` and `getTodayDateString(): string` from Task 1/existing code; `useGameStore(s => s.progress): PlayerProgress`.
- Produces: nothing consumed by later tasks (this is the last task).

- [ ] **Step 1: Add the badge font size token**

In `app/ui/pwHomeMaterials.ts:18-26`, replace:

```ts
export const homeType = {
  tagline: 18,
  dareLabel: 32,
  doorEyebrow: 14,
  doorTitle: 21,
  doorCopy: 15,
  greeting: 16,
  settingsLink: 14,
} as const;
```

with:

```ts
export const homeType = {
  tagline: 18,
  dareLabel: 32,
  doorEyebrow: 14,
  doorTitle: 21,
  doorCopy: 15,
  greeting: 16,
  settingsLink: 14,
  streakBadge: 14,
} as const;
```

- [ ] **Step 2: Add imports to `HomeScreen.tsx`**

At the top of `app/screens/HomeScreen.tsx`, the existing import block includes:

```ts
import { FONTS } from '../constants/fonts';
import { useGameStore } from '../store/useGameStore';
import { cardMaterial, stageMaterial } from '../ui/pwMaterials';
```

Add two more imports directly below the `useGameStore` import:

```ts
import { getTodayDateString } from '../game/dailyChallengeEngine';
import { getDisplayStreak } from '../game/dailyStreak';
```

- [ ] **Step 3: Read the streak in the component**

In `HomeScreen.tsx`, inside `export default function HomeScreen({ navigation }: Props) {`, directly below the existing `const startGame = useGameStore(s => s.startGame);` line, add:

```ts
  const progress = useGameStore(s => s.progress);
  const streak = getDisplayStreak(progress, getTodayDateString());
```

- [ ] **Step 4: Render the badge on the Daily door**

The Daily door `Pressable` currently reads:

```tsx
              <Pressable
                onPress={() => navigation.navigate('Daily')}
                style={({ pressed }) => [
                  cardMaterial.base,
                  styles.door,
                  styles.dailyDoor,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.doorEyebrow}>DAILY CHALLENGE</Text>
                <Text style={styles.doorTitle}>{DAILY_TITLE}</Text>
                <Text style={styles.doorCopy}>{DAILY_PROMISE}</Text>
              </Pressable>
```

Add the badge as the first child, before `doorEyebrow`:

```tsx
              <Pressable
                onPress={() => navigation.navigate('Daily')}
                style={({ pressed }) => [
                  cardMaterial.base,
                  styles.door,
                  styles.dailyDoor,
                  pressed && styles.pressed,
                ]}
              >
                {streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>{`\u{1F525} ${streak}`}</Text>
                  </View>
                )}
                <Text style={styles.doorEyebrow}>DAILY CHALLENGE</Text>
                <Text style={styles.doorTitle}>{DAILY_TITLE}</Text>
                <Text style={styles.doorCopy}>{DAILY_PROMISE}</Text>
              </Pressable>
```

(`\u{1F525}` is the fire emoji, written as an escape to avoid any source-encoding ambiguity.)

- [ ] **Step 5: Add the badge styles**

In the `styles = StyleSheet.create({...})` block in `HomeScreen.tsx`, directly after the existing `doorCopy` style (`app/screens/HomeScreen.tsx:246-252`), add:

```ts
  streakBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  streakBadgeText: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    fontSize: homeType.streakBadge,
    letterSpacing: 0.5,
  },
```

- [ ] **Step 6: Typecheck**

Run: `npx.cmd tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual verification**

Per `CLAUDE.md`, visual changes need a device check before committing. Run the app in Expo Go: confirm the badge is invisible at `currentStreak: 0` (fresh install / no completions yet), and appears in the top-right corner of the Daily Challenge door after completing a Daily Challenge. Confirm it reads clearly at the 14px floor and doesn't collide with `doorEyebrow` text.

- [ ] **Step 8: Commit**

```bash
git add app/ui/pwHomeMaterials.ts app/screens/HomeScreen.tsx
git commit -m "Show daily streak badge on Home screen"
```
