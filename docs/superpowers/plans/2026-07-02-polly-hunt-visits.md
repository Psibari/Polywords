# Polly Hunt Visits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Polly on the standard Hunt play screen as visit-based fly-in/out appearances (pose images + speech bubble + SFX), driven by the existing `firePollyEvent` call sites in MaskBoard.

**Architecture:** Three new units — a pure, RN-free visit policy (`resolveVisit`) that maps `PollyEvent`s to visit specs under a per-word budget; a director hook (`usePollyVisits`) that owns the visit queue/flags and exposes the same `firePollyEvent(event)` signature `usePollyAnimator` has today; and a render component (`PollyHuntVisit`) that animates one visit arc (fly-in → perch/speak → fly-out) with the same Animated idioms as the shipped `PollyDailyPerch`. MaskBoard swaps one hook call and adds one render element; its ~15 `firePollyEvent` call sites do not change.

**Tech Stack:** Expo SDK 54 managed, TypeScript strict, React Native `Animated` (NOT Reanimated), `expo-audio` via `app/audio/sfx.ts`, plain-Node test script via `npx tsx`.

**Spec:** `docs/superpowers/specs/2026-07-02-polly-hunt-visits-design.md` (approved).

## Global Constraints

- Windows dev box: use `npx.cmd` for npx invocations in PowerShell.
- `useNativeDriver: true` → transform + opacity ONLY. Never mix drivers on the same `Animated.Value`. All animation in this feature is transform/opacity → native driver everywhere.
- Use `setTimeout` between animation phases, NOT `.start()` callbacks.
- Reanimated is locked to `SwipeMask.tsx` — do not import it anywhere in this feature.
- `babel.config.js` is frozen — do not touch it.
- `MaskBoard.tsx` is warroom-gated: surgical edits only, exactly the edits shown in Task 6.
- Polly never appears on the right side of the screen (reject lane). She lives bottom-left.
- Never-change lines, verbatim: `Thought so.` and `BBBLAAAAHHAHAHA!`
- Polly Green `#4CAF50` is Polly-only; this feature adds no new UI chrome colors.
- Quarantine, don't delete: `usePollyAnimator.ts`, `PollySprite.tsx`, `PollyActor.tsx`, `PollyRig`, `PollyCard`, `polly/*.webp` all stay in-repo untouched.
- After every task: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short` — all clean before commit.
- Task 6 (visual wiring) requires a device screenshot (Expo Go) before its commit; tag `v0.working-YYYYMMDD` only after device confirmation.
- Do not pop/drop/clear any stash.

---

### Task 1: Clean sprite9 (sulk pose) background

The sulk pose asset `assets/images/polly/poses/sprite9.png` currently has purple background remnants and must be re-stripped from the source sprite with the same pngjs edge flood-fill technique used for the other poses. Source sprites live at `assets/images/sprite<N>.png` (committed in `798eb26`).

**Files:**
- Create (temp, NOT committed): `<scratchpad>/clean-sprite9.js` — use the session scratchpad directory, never the repo
- Modify (binary overwrite): `assets/images/polly/poses/sprite9.png`

**Interfaces:**
- Consumes: `assets/images/sprite9.png` (source with background)
- Produces: transparent-background `assets/images/polly/poses/sprite9.png`, referenced by Task 2's `pollyPoses.ts` as the `sulk` pose

- [ ] **Step 1: Confirm the source sprite exists**

Run: `Test-Path assets/images/sprite9.png`
Expected: `True`. If `False`, STOP and report — do not substitute another sprite.

- [ ] **Step 2: Install pngjs without touching package.json**

Run: `npm install --no-save pngjs`
Expected: exits 0. `git status --short` must NOT show `package.json` or `package-lock.json` modified afterward; if it does, `git checkout -- package.json package-lock.json`.

- [ ] **Step 3: Write the flood-fill script to the scratchpad**

Write this file as `clean-sprite9.js` in the scratchpad directory (full content):

```js
// clean-sprite9.js — strip background to transparent via edge flood fill.
// Seed color = average of the 4 corner pixels; BFS from all border pixels;
// any contiguous pixel within TOLERANCE color distance of the seed goes alpha 0.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const REPO = 'c:/Users/pdiba/poly-words';
const SRC = path.join(REPO, 'assets/images/sprite9.png');
const OUT = path.join(REPO, 'assets/images/polly/poses/sprite9.png');
const TOLERANCE = Number(process.argv[2] || 60);

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width, height, data } = png;
const idx = (x, y) => (width * y + x) << 2;

const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
let sr = 0, sg = 0, sb = 0;
for (const [x, y] of corners) {
  const i = idx(x, y);
  sr += data[i]; sg += data[i + 1]; sb += data[i + 2];
}
sr /= 4; sg /= 4; sb /= 4;

const isBg = (i) => {
  const dr = data[i] - sr, dg = data[i + 1] - sg, db = data[i + 2] - sb;
  return Math.sqrt(dr * dr + dg * dg + db * db) <= TOLERANCE;
};

const visited = new Uint8Array(width * height);
const stack = [];
for (let x = 0; x < width; x++) stack.push([x, 0], [x, height - 1]);
for (let y = 0; y < height; y++) stack.push([0, y], [width - 1, y]);

let cleared = 0;
while (stack.length) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= width || y >= height) continue;
  const p = width * y + x;
  if (visited[p]) continue;
  visited[p] = 1;
  const i = p << 2;
  if (!isBg(i)) continue;
  data[i + 3] = 0;
  cleared++;
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

fs.writeFileSync(OUT, PNG.sync.write(png));
console.log(`wrote ${OUT} (${width}x${height}), cleared ${cleared} px, tolerance ${TOLERANCE}`);
```

- [ ] **Step 4: Run it**

Run (from the repo root): `node <scratchpad>/clean-sprite9.js`
Expected: `wrote ...sprite9.png (WxH), cleared N px, tolerance 60` with N > 0.

- [ ] **Step 5: Visually verify the output**

Read `assets/images/polly/poses/sprite9.png` with the Read tool (it renders the image). Check: background fully transparent (no purple field), Polly's hunched-angry-glare art intact (no bites into wings/beak/crown). If purple remains, re-run with a higher tolerance (`node clean-sprite9.js 80`); if the fill eats into the art, lower it (`node clean-sprite9.js 45`). Iterate until clean. A thin white sticker-style outline around her is acceptable (other poses have it); a purple halo is not.

- [ ] **Step 6: Verify repo hygiene and commit**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; only `assets/images/polly/poses/sprite9.png` modified (binary).

```powershell
git add assets/images/polly/poses/sprite9.png
git commit -m @'
Re-strip sprite9 (sulk pose) background to clean transparency

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 2: Shared pose map `pollyPoses.ts` + Daily import swap

**Files:**
- Create: `app/ui/pollyPoses.ts`
- Modify: `app/components/PollyDailyPerch.tsx:26-33` (the `POSE` map and `POSE_FLY` — import-only change, zero behavior change)

**Interfaces:**
- Produces: `POLLY_POSES: Record<PollyPoseName, ImageSourcePropType>` and `type PollyPoseName = 'idle' | 'smug' | 'laugh' | 'point' | 'shocked' | 'sulk' | 'fly' | 'flyAngry' | 'flyGrin'` — consumed by Task 5's `PollyHuntVisit` and by `PollyDailyPerch`.

- [ ] **Step 1: Create `app/ui/pollyPoses.ts`**

```ts
import { ImageSourcePropType } from 'react-native';

// Shared Polly pose art (clean transparent full-pose drawings).
// Both Daily and Hunt render these; expression lives in the art,
// life comes from whole-image motion.
export const POLLY_POSES = {
  idle: require('../../assets/images/polly/poses/sprite4.png'),     // smug perched, watchful
  smug: require('../../assets/images/polly/poses/sprite6.png'),     // half-lidded smug perch
  laugh: require('../../assets/images/polly/poses/sprite5.png'),    // laughing wide
  point: require('../../assets/images/polly/poses/sprite7.png'),    // pointing taunt
  shocked: require('../../assets/images/polly/poses/sprite8.png'),  // shocked recoil
  sulk: require('../../assets/images/polly/poses/sprite9.png'),     // hunched angry glare
  fly: require('../../assets/images/polly/poses/sprite2.png'),      // neutral fly
  flyAngry: require('../../assets/images/polly/poses/sprite10.png'),// angry open-beak fly
  flyGrin: require('../../assets/images/polly/poses/sprite1.png'),  // confident grinning fly (reserve)
} as const;

export type PollyPoseName = keyof typeof POLLY_POSES;

// Type-check the values without widening the const map.
const _check: Record<PollyPoseName, ImageSourcePropType> = POLLY_POSES;
void _check;
```

- [ ] **Step 2: Swap PollyDailyPerch onto the shared map**

In `app/components/PollyDailyPerch.tsx`, add to the imports:

```ts
import { POLLY_POSES } from '../ui/pollyPoses';
```

Then replace lines 25–33 (the comment + `POSE` map + `POSE_FLY`):

```ts
// Clean full-pose drawings (background stripped to transparent). The expression
// lives in the art; life + menace come from whole-image motion + the SFX.
const POSE: Record<'idle' | 'happy' | 'laughing' | 'shocked', ImageSourcePropType> = {
  idle: POLLY_POSES.idle,        // smug perched — watchful
  happy: POLLY_POSES.point,      // pointing taunt (wrong)
  laughing: POLLY_POSES.laugh,   // laughing wide (out of lives)
  shocked: POLLY_POSES.shocked,  // shocked (win)
};
const POSE_FLY = POLLY_POSES.fly; // fly-in entrance
```

The mapping must be exactly this (Daily's `happy` = pointing sprite7, unchanged behavior). Nothing else in the file changes.

- [ ] **Step 3: Verify**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; exactly `app/ui/pollyPoses.ts` (new) and `app/components/PollyDailyPerch.tsx` (modified).

- [ ] **Step 4: Commit**

```powershell
git add app/ui/pollyPoses.ts app/components/PollyDailyPerch.tsx
git commit -m @'
Extract shared Polly pose map (pollyPoses.ts); Daily imports it (no behavior change)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 3: Pure visit policy `pollyVisitPolicy.ts` (TDD)

The policy is RN-free on purpose: the repo has no jest, so the test is a plain Node assert script run with `npx tsx` (same spirit as `app/game/polyRunEngine.test.ts`). Do NOT import anything from `react-native` or from `app/hooks/` in these two files.

**Files:**
- Create: `app/game/pollyVisitPolicy.ts`
- Test: `app/game/pollyVisitPolicy.test.ts`

**Interfaces:**
- Produces (consumed by Task 4's hook):
  - `type PollyEvent` — same 22 event names as `usePollyAnimator`'s union (MaskBoard call sites pass these literals).
  - `type VisitSpec = { kind: 'guaranteed' | 'heckle'; flyPose: 'fly' | 'flyAngry'; perchPose: 'smug' | 'laugh' | 'point' | 'shocked' | 'sulk'; line: string | null; sfx: 'pollySqwawkShort' | 'pollySqwawkLaugh' | null; holdPerch: boolean; perchMs: number }`
  - `type PollyBudgetState = { busy: boolean; heckleUsedThisWord: boolean; wrongSeenThisWord: boolean; cleanSweepSeenThisRun: boolean; isSpeedRound: boolean }`
  - `type VisitDecision = { action: 'none' } | { action: 'wordEntry' } | { action: 'visit'; spec: VisitSpec }`
  - `resolveVisit(event: PollyEvent, state: PollyBudgetState): VisitDecision`

- [ ] **Step 1: Write the failing test `app/game/pollyVisitPolicy.test.ts`**

```ts
// Run with: npx.cmd -y tsx app/game/pollyVisitPolicy.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import { resolveVisit, PollyBudgetState, VisitDecision, VisitSpec } from './pollyVisitPolicy';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

const idle: PollyBudgetState = {
  busy: false,
  heckleUsedThisWord: false,
  wrongSeenThisWord: false,
  cleanSweepSeenThisRun: false,
  isSpeedRound: false,
};

function visitSpec(d: VisitDecision, label: string): VisitSpec {
  if (d.action !== 'visit') throw new Error(`${label}: expected a visit, got ${d.action}`);
  return d.spec;
}

// ── Guaranteed beats ────────────────────────────────────────────

// bossEntry: flyAngry → point, line + short squawk, flies out
{
  const s = visitSpec(resolveVisit('bossEntry', idle), 'bossEntry');
  eq(s.kind, 'guaranteed', 'bossEntry.kind');
  eq(s.flyPose, 'flyAngry', 'bossEntry.flyPose');
  eq(s.perchPose, 'point', 'bossEntry.perchPose');
  eq(s.line, 'This word stays mine.', 'bossEntry.line');
  eq(s.sfx, 'pollySqwawkShort', 'bossEntry.sfx');
  eq(s.holdPerch, false, 'bossEntry.holdPerch');
}

// gateMasteredBoss: flyAngry → sulk, silent, holds perch
{
  const s = visitSpec(resolveVisit('gateMasteredBoss', idle), 'gateMasteredBoss');
  eq(s.perchPose, 'sulk', 'gateMasteredBoss.perchPose');
  eq(s.line, null, 'gateMasteredBoss.line');
  eq(s.sfx, null, 'gateMasteredBoss.sfx');
  eq(s.holdPerch, true, 'gateMasteredBoss.holdPerch');
}

// gameOver and hauntFailed: laugh, never-change line, laugh squawk, holds perch
for (const ev of ['gameOver', 'hauntFailed'] as const) {
  const s = visitSpec(resolveVisit(ev, idle), ev);
  eq(s.perchPose, 'laugh', `${ev}.perchPose`);
  eq(s.line, 'BBBLAAAAHHAHAHA!', `${ev}.line`);
  eq(s.sfx, 'pollySqwawkLaugh', `${ev}.sfx`);
  eq(s.holdPerch, true, `${ev}.holdPerch`);
}

// Guaranteed beats fire even when busy, mid-heckle-budget, or in speed rounds
{
  const jammed: PollyBudgetState = {
    busy: true, heckleUsedThisWord: true, wrongSeenThisWord: true,
    cleanSweepSeenThisRun: true, isSpeedRound: true,
  };
  eq(resolveVisit('bossEntry', jammed).action, 'visit', 'bossEntry while jammed');
  eq(resolveVisit('gameOver', jammed).action, 'visit', 'gameOver while jammed');
  eq(resolveVisit('gateMasteredBoss', jammed).action, 'visit', 'gateMasteredBoss while jammed');
}

// ── cleanSweep tiering ──────────────────────────────────────────

// First of the run: guaranteed shocked
{
  const s = visitSpec(resolveVisit('cleanSweep', idle), 'cleanSweep first');
  eq(s.kind, 'guaranteed', 'cleanSweep first.kind');
  eq(s.perchPose, 'shocked', 'cleanSweep first.perchPose');
  eq(s.line, "Bet you can't do that again.", 'cleanSweep first.line');
  eq(s.holdPerch, false, 'cleanSweep first.holdPerch');
}

// Later ones: demoted to heckle (still fires when budget free)
{
  const s = visitSpec(
    resolveVisit('cleanSweep', { ...idle, cleanSweepSeenThisRun: true }),
    'cleanSweep repeat',
  );
  eq(s.kind, 'heckle', 'cleanSweep repeat.kind');
  eq(s.perchPose, 'shocked', 'cleanSweep repeat.perchPose');
}

// Later ones are dropped when the word's heckle budget is spent
eq(
  resolveVisit('cleanSweep', { ...idle, cleanSweepSeenThisRun: true, heckleUsedThisWord: true }).action,
  'none',
  'cleanSweep repeat with budget spent',
);

// ── Heckles ─────────────────────────────────────────────────────

// wrong: first of the word → smug "Thought so."
{
  const s = visitSpec(resolveVisit('wrong', idle), 'wrong first');
  eq(s.kind, 'heckle', 'wrong.kind');
  eq(s.perchPose, 'smug', 'wrong.perchPose');
  eq(s.line, 'Thought so.', 'wrong.line');
  eq(s.sfx, 'pollySqwawkShort', 'wrong.sfx');
}

// wrong: second wrong of the same word is ignored
eq(resolveVisit('wrong', { ...idle, wrongSeenThisWord: true }).action, 'none', 'second wrong');

// hesitation6s → point taunt; 3s and 9s are ignored
{
  const s = visitSpec(resolveVisit('hesitation6s', idle), 'hesitation6s');
  eq(s.perchPose, 'point', 'hesitation6s.perchPose');
  eq(s.line, 'YES... NO... MAYBE SO...', 'hesitation6s.line');
  eq(s.sfx, null, 'hesitation6s.sfx');
}
eq(resolveVisit('hesitation3s', idle).action, 'none', 'hesitation3s ignored');
eq(resolveVisit('hesitation9s', idle).action, 'none', 'hesitation9s ignored');

// ghostEntry → smug "Remember me."
{
  const s = visitSpec(resolveVisit('ghostEntry', idle), 'ghostEntry');
  eq(s.perchPose, 'smug', 'ghostEntry.perchPose');
  eq(s.line, 'Remember me.', 'ghostEntry.line');
}

// Heckles drop when busy, when budget spent, and in speed rounds
for (const [i, block] of [
  { ...idle, busy: true },
  { ...idle, heckleUsedThisWord: true },
  { ...idle, isSpeedRound: true },
].entries()) {
  eq(resolveVisit('wrong', block).action, 'none', `blocked wrong #${i}`);
  eq(resolveVisit('hesitation6s', block).action, 'none', `blocked hesitation6s #${i}`);
  eq(resolveVisit('ghostEntry', block).action, 'none', `blocked ghostEntry #${i}`);
}

// ── Ignored events + budget reset ───────────────────────────────

eq(resolveVisit('wordEntry', idle).action, 'wordEntry', 'wordEntry resets budget');

for (const ev of [
  'correct', 'streakX10', 'oneHeartLeft', 'oneWrongMove', 'allMasksFound',
  'hiddenFound', 'hesitationCleared', 'ghostFoundLate', 'ghostDissolved',
  'gateMastered', 'hiddenMasterFailed',
] as const) {
  eq(resolveVisit(ev, idle).action, 'none', `${ev} ignored`);
}

console.log('OK — pollyVisitPolicy: all assertions passed');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx.cmd -y tsx app/game/pollyVisitPolicy.test.ts`
Expected: FAIL — cannot find module `./pollyVisitPolicy`.

- [ ] **Step 3: Write `app/game/pollyVisitPolicy.ts`**

```ts
// Pure visit policy for Hunt Polly. RN-free on purpose so it runs under
// plain Node (npx tsx) — do not import react-native or app/hooks here.
//
// Spec: docs/superpowers/specs/2026-07-02-polly-hunt-visits-design.md
// Scarcity is the menace: guaranteed big beats always fire; heckles are
// capped at one visit per word and dropped (never queued) when blocked.

// Same event vocabulary as usePollyAnimator — MaskBoard call sites pass
// these literals and must not change.
export type PollyEvent =
  | 'wordEntry'
  | 'correct'
  | 'allMasksFound'
  | 'hiddenFound'
  | 'cleanSweep'
  | 'wrong'
  | 'bossEntry'
  | 'ghostEntry'
  | 'ghostFoundLate'
  | 'ghostDissolved'
  | 'oneHeartLeft'
  | 'hesitation3s'
  | 'hesitation6s'
  | 'hesitation9s'
  | 'hesitationCleared'
  | 'streakX10'
  | 'gameOver'
  | 'gateMastered'
  | 'gateMasteredBoss'
  | 'hiddenMasterFailed'
  | 'hauntFailed'
  | 'oneWrongMove';

export type PollyVisitSfx = 'pollySqwawkShort' | 'pollySqwawkLaugh';

export type VisitSpec = {
  kind: 'guaranteed' | 'heckle';
  flyPose: 'fly' | 'flyAngry';
  perchPose: 'smug' | 'laugh' | 'point' | 'shocked' | 'sulk';
  line: string | null;
  sfx: PollyVisitSfx | null;
  holdPerch: boolean; // terminal beats stay perched until the board unmounts
  perchMs: number;
};

export type PollyBudgetState = {
  busy: boolean;                 // a visit is currently on screen
  heckleUsedThisWord: boolean;   // one heckle visit per word
  wrongSeenThisWord: boolean;    // only the FIRST wrong swipe of a word heckles
  cleanSweepSeenThisRun: boolean;// first cleanSweep of the run is guaranteed
  isSpeedRound: boolean;         // speed rounds suppress heckles entirely
};

export type VisitDecision =
  | { action: 'none' }
  | { action: 'wordEntry' } // caller resets per-word budget flags
  | { action: 'visit'; spec: VisitSpec };

const NONE: VisitDecision = { action: 'none' };

const BOSS_ENTRY: VisitSpec = {
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'point',
  line: 'This word stays mine.', sfx: 'pollySqwawkShort',
  holdPerch: false, perchMs: 2500,
};

const BOSS_MASTERED_SULK: VisitSpec = {
  kind: 'guaranteed', flyPose: 'flyAngry', perchPose: 'sulk',
  line: null, sfx: null, // silent — defeat needs no line
  holdPerch: true, perchMs: 2500,
};

const GAME_OVER_LAUGH: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'laugh',
  line: 'BBBLAAAAHHAHAHA!', sfx: 'pollySqwawkLaugh',
  holdPerch: true, perchMs: 2500,
};

const CLEAN_SWEEP_LINE = "Bet you can't do that again.";

const CLEAN_SWEEP_FIRST: VisitSpec = {
  kind: 'guaranteed', flyPose: 'fly', perchPose: 'shocked',
  line: CLEAN_SWEEP_LINE, sfx: 'pollySqwawkShort',
  holdPerch: false, perchMs: 2000,
};

const CLEAN_SWEEP_REPEAT: VisitSpec = {
  ...CLEAN_SWEEP_FIRST, kind: 'heckle',
};

const WRONG_SMUG: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'smug',
  line: 'Thought so.', sfx: 'pollySqwawkShort',
  holdPerch: false, perchMs: 1800,
};

const HESITATION_POINT: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'point',
  line: 'YES... NO... MAYBE SO...', sfx: null,
  holdPerch: false, perchMs: 2000,
};

const GHOST_SMUG: VisitSpec = {
  kind: 'heckle', flyPose: 'fly', perchPose: 'smug',
  line: 'Remember me.', sfx: null,
  holdPerch: false, perchMs: 1800,
};

export function resolveVisit(event: PollyEvent, state: PollyBudgetState): VisitDecision {
  if (event === 'wordEntry') return { action: 'wordEntry' };

  // ── Guaranteed big beats: ignore all budgets ──────────────────
  if (event === 'bossEntry') return { action: 'visit', spec: BOSS_ENTRY };
  if (event === 'gateMasteredBoss') return { action: 'visit', spec: BOSS_MASTERED_SULK };
  if (event === 'gameOver' || event === 'hauntFailed') {
    return { action: 'visit', spec: GAME_OVER_LAUGH };
  }
  if (event === 'cleanSweep' && !state.cleanSweepSeenThisRun) {
    return { action: 'visit', spec: CLEAN_SWEEP_FIRST };
  }

  // ── Heckles: max one per word, dropped (not queued) when blocked ──
  const heckleBlocked = state.busy || state.heckleUsedThisWord || state.isSpeedRound;
  if (heckleBlocked) return NONE;

  if (event === 'wrong' && !state.wrongSeenThisWord) return { action: 'visit', spec: WRONG_SMUG };
  if (event === 'hesitation6s') return { action: 'visit', spec: HESITATION_POINT };
  if (event === 'ghostEntry') return { action: 'visit', spec: GHOST_SMUG };
  if (event === 'cleanSweep') return { action: 'visit', spec: CLEAN_SWEEP_REPEAT };

  return NONE; // everything else: silence is menace
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx.cmd -y tsx app/game/pollyVisitPolicy.test.ts`
Expected: `OK — pollyVisitPolicy: all assertions passed`

- [ ] **Step 5: Verify and commit**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; exactly the two new files.

```powershell
git add app/game/pollyVisitPolicy.ts app/game/pollyVisitPolicy.test.ts
git commit -m @'
Add pure Polly visit policy (curated trigger map, per-word heckle budget) + assert tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 4: Director hook `usePollyVisits.ts`

**Files:**
- Create: `app/hooks/usePollyVisits.ts`

**Interfaces:**
- Consumes: `resolveVisit`, `PollyEvent`, `PollyBudgetState`, `VisitSpec` from `app/game/pollyVisitPolicy.ts` (Task 3).
- Produces (consumed by Tasks 5–6):
  - `type ActiveVisit = { id: number; spec: VisitSpec; fastExit: boolean }`
  - `usePollyVisits(isSpeedRound: boolean): { visit: ActiveVisit | null; onVisitDone: (id: number) => void; firePollyEvent: (event: PollyEvent) => void }`
  - `firePollyEvent` is intentionally signature-compatible with `usePollyAnimator`'s — MaskBoard call sites don't change.

- [ ] **Step 1: Create `app/hooks/usePollyVisits.ts`**

```ts
import { useCallback, useRef, useState } from 'react';
import {
  PollyBudgetState,
  PollyEvent,
  VisitSpec,
  resolveVisit,
} from '../game/pollyVisitPolicy';

export type ActiveVisit = {
  id: number;
  spec: VisitSpec;
  fastExit: boolean; // component cuts to a ~250ms fly-out when this flips true
};

// Director for Hunt Polly visits. Owns the budget flags and the one-deep
// queue; the pure policy decides, PollyHuntVisit animates. Exposes the same
// firePollyEvent(event) signature as the quarantined usePollyAnimator so
// MaskBoard's call sites stay untouched.
export function usePollyVisits(isSpeedRound: boolean) {
  const [visit, setVisit] = useState<ActiveVisit | null>(null);
  const visitRef = useRef<ActiveVisit | null>(null);
  const pendingRef = useRef<VisitSpec | null>(null);
  const idRef = useRef(0);
  const flagsRef = useRef({
    heckleUsedThisWord: false,
    wrongSeenThisWord: false,
    cleanSweepSeenThisRun: false,
  });
  const isSpeedRoundRef = useRef(isSpeedRound);
  isSpeedRoundRef.current = isSpeedRound;

  const setVisitBoth = (v: ActiveVisit | null) => {
    visitRef.current = v;
    setVisit(v);
  };

  const startVisit = (spec: VisitSpec) => {
    idRef.current += 1;
    if (spec.kind === 'heckle') flagsRef.current.heckleUsedThisWord = true;
    setVisitBoth({ id: idRef.current, spec, fastExit: false });
  };

  // Component reports its arc finished (fly-out done, or fast exit done).
  const onVisitDone = useCallback((id: number) => {
    if (visitRef.current?.id !== id) return;
    setVisitBoth(null);
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) startVisit(pending);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const firePollyEvent = useCallback((event: PollyEvent) => {
    const flags = flagsRef.current;
    const state: PollyBudgetState = {
      busy: visitRef.current !== null || pendingRef.current !== null,
      heckleUsedThisWord: flags.heckleUsedThisWord,
      wrongSeenThisWord: flags.wrongSeenThisWord,
      cleanSweepSeenThisRun: flags.cleanSweepSeenThisRun,
      isSpeedRound: isSpeedRoundRef.current,
    };
    const decision = resolveVisit(event, state);

    // Flag bookkeeping happens on the EVENT, not only on shown visits:
    // the first wrong of a word consumes eligibility even if dropped.
    if (event === 'wrong') flags.wrongSeenThisWord = true;
    if (event === 'cleanSweep' && decision.action === 'visit' && decision.spec.kind === 'guaranteed') {
      flags.cleanSweepSeenThisRun = true;
    }

    if (decision.action === 'wordEntry') {
      flags.heckleUsedThisWord = false;
      flags.wrongSeenThisWord = false;
      // Word advanced while a heckle was on screen → fast fly-out.
      // Guaranteed visits are never cut by a word change.
      const cur = visitRef.current;
      if (cur && cur.spec.kind === 'heckle' && !cur.fastExit) {
        setVisitBoth({ ...cur, fastExit: true });
      }
      return;
    }

    if (decision.action !== 'visit') return;

    const cur = visitRef.current;
    if (cur) {
      // Only guaranteed specs reach here while busy (policy drops busy
      // heckles). Hard-cut the current visit and queue this one behind it.
      pendingRef.current = decision.spec;
      if (!cur.fastExit) setVisitBoth({ ...cur, fastExit: true });
      return;
    }
    startVisit(decision.spec);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { visit, onVisitDone, firePollyEvent };
}
```

- [ ] **Step 2: Verify**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; exactly the one new file.

- [ ] **Step 3: Commit**

```powershell
git add app/hooks/usePollyVisits.ts
git commit -m @'
Add usePollyVisits director hook (visit queue + budget over the pure policy)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 5: Render component `PollyHuntVisit.tsx`

One visit arc: fly-in from off-screen bottom-left (~600ms) → perch bottom-left with reaction pose + whole-image punch + speech bubble + SFX (~1.8–2.5s per spec) → fly-out (~500ms), or hold the perch for terminal beats. Fast exit (~250ms) when `fastExit` flips. Built on `PollyDailyPerch`'s Animated idioms (whole-image motion only, native driver, `setTimeout` phase chaining, Daily's bubble styling).

**Files:**
- Create: `app/components/PollyHuntVisit.tsx`

**Interfaces:**
- Consumes: `ActiveVisit` from `app/hooks/usePollyVisits` (Task 4); `POLLY_POSES`, `PollyPoseName` from `app/ui/pollyPoses` (Task 2); `playSfx` from `app/audio/sfx`; `FONTS` from `app/constants/fonts`.
- Produces: `PollyHuntVisit({ visit, onDone }: { visit: ActiveVisit | null; onDone: (id: number) => void })` — rendered once by MaskBoard (Task 6).

- [ ] **Step 1: Create `app/components/PollyHuntVisit.tsx`**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import { playSfx } from '../audio/sfx';
import { POLLY_POSES, PollyPoseName } from '../ui/pollyPoses';
import type { ActiveVisit } from '../hooks/usePollyVisits';

const FLY_IN_MS = 600;
const FLY_OUT_MS = 500;
const FAST_EXIT_MS = 250;
const BUBBLE_IN_MS = 180;
const BUBBLE_OUT_MS = 150;
const OFF_X = -240; // off-screen bottom-left start/end of the arc
const OFF_Y = 200;

type Props = {
  visit: ActiveVisit | null;
  onDone: (id: number) => void;
};

// Hunt Polly's body: renders exactly one visit arc at a time, bottom-left
// (the play field already clears this lane; the right side is the reject
// lane and is never used). Whole-image motion only — no part seams.
export function PollyHuntVisit({ visit, onDone }: Props) {
  const [pose, setPose] = useState<PollyPoseName>('fly');
  const [line, setLine] = useState<string | null>(null);

  // Arc position (fly-in/out) — native driver, transforms only.
  const arcX = useRef(new Animated.Value(OFF_X)).current;
  const arcY = useRef(new Animated.Value(OFF_Y)).current;
  // Continuous life on the perch (offset periods = organic).
  const breatheY = useRef(new Animated.Value(0)).current;
  const breatheX = useRef(new Animated.Value(0)).current;
  // Per-reaction whole-image punch.
  const reactX = useRef(new Animated.Value(0)).current;
  const reactY = useRef(new Animated.Value(0)).current;
  const reactScale = useRef(new Animated.Value(1)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const visitIdRef = useRef<number | null>(null);
  const exitingRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }
  function later(fn: () => void, ms: number) {
    timersRef.current.push(setTimeout(fn, ms));
  }

  useEffect(() => clearTimers, []);

  // Breath + sway loops run for the component's lifetime; invisible while
  // she is off-screen, alive the moment she lands.
  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheY, { toValue: -6, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breatheY, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheX, { toValue: 3, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breatheX, { toValue: -3, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    bob.start();
    sway.start();
    return () => {
      bob.stop();
      sway.stop();
    };
  }, [breatheY, breatheX]);

  function runExit(ms: number) {
    if (exitingRef.current) return;
    exitingRef.current = true;
    clearTimers();
    Animated.timing(bubbleOpacity, { toValue: 0, duration: BUBBLE_OUT_MS, useNativeDriver: true }).start();
    setPose('fly');
    Animated.parallel([
      Animated.timing(arcX, { toValue: OFF_X, duration: ms, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(arcY, { toValue: OFF_Y, duration: ms, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    later(() => {
      const id = visitIdRef.current;
      visitIdRef.current = null;
      if (id !== null) onDoneRef.current(id);
    }, ms + 30);
  }

  function runPunch(perchPose: PollyPoseName) {
    reactX.setValue(0);
    reactY.setValue(0);
    reactScale.setValue(1);
    if (perchPose === 'laugh') {
      // Sharp bark: quick pop + hard shake.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.08, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactX, { toValue: 9, duration: 55, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: -9, duration: 60, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    } else if (perchPose === 'shocked') {
      // Fast recoil pop.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.1, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 320, delay: 60, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactY, { toValue: -10, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactY, { toValue: 0, duration: 400, delay: 80, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else if (perchPose === 'sulk') {
      // Slow deflating droop.
      Animated.timing(reactY, { toValue: 6, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.timing(reactScale, { toValue: 0.95, duration: 500, useNativeDriver: true }).start();
    } else {
      // smug / point: cold lean toward the puzzle (she's on the left → lean right).
      Animated.sequence([
        Animated.timing(reactX, { toValue: 12, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 540, delay: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    }
  }

  useEffect(() => {
    if (!visit) return;

    // Same visit object flipping fastExit → cut to a fast fly-out.
    if (visit.id === visitIdRef.current) {
      if (visit.fastExit) runExit(FAST_EXIT_MS);
      return;
    }

    // New visit: reset and run the arc.
    visitIdRef.current = visit.id;
    exitingRef.current = false;
    clearTimers();
    reactX.setValue(0);
    reactY.setValue(0);
    reactScale.setValue(1);
    bubbleOpacity.setValue(0);
    arcX.setValue(OFF_X);
    arcY.setValue(OFF_Y);
    setLine(visit.spec.line);
    setPose(visit.spec.flyPose);

    Animated.parallel([
      Animated.timing(arcX, { toValue: 0, duration: FLY_IN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(arcY, { toValue: 0, duration: FLY_IN_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    later(() => {
      // Landed: reaction pose + punch + bubble + squawk.
      setPose(visit.spec.perchPose);
      if (visit.spec.sfx) playSfx(visit.spec.sfx);
      runPunch(visit.spec.perchPose);
      if (visit.spec.line) {
        Animated.timing(bubbleOpacity, { toValue: 1, duration: BUBBLE_IN_MS, useNativeDriver: true }).start();
      }
      if (!visit.spec.holdPerch) {
        later(() => runExit(FLY_OUT_MS), visit.spec.perchMs);
      }
      // holdPerch: stay until fastExit or unmount (terminal beats).
    }, FLY_IN_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit]);

  if (!visit) return null;

  return (
    <View style={styles.root} pointerEvents="none">
      {/* Speech bubble — to Polly's right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{line ?? ''}</Text>
        </View>
        <View style={styles.tailBorder} />
        <View style={styles.tailFill} />
      </Animated.View>

      {/* Polly — whole-image motion only, bottom-left, faces right */}
      <Animated.View
        style={[
          styles.pollyWrap,
          {
            transform: [
              { translateX: arcX },
              { translateY: arcY },
              { translateX: breatheX },
              { translateY: breatheY },
              { translateX: reactX },
              { translateY: reactY },
              { scale: reactScale },
            ],
          },
        ]}
      >
        <Image source={POLLY_POSES[pose]} style={styles.pollyImage} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
    zIndex: 40, // above stage/tiles, below GameScreen flash overlays (50)
  },
  pollyWrap: {
    position: 'absolute',
    left: -64,
    bottom: -20,
    width: 260,
    height: 260,
  },
  pollyImage: {
    width: 260,
    height: 260,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 148,
    bottom: 140,
  },
  bubble: {
    backgroundColor: '#1A1055',
    borderWidth: 1.5,
    borderColor: 'rgba(245,200,66,0.55)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 185,
  },
  bubbleText: {
    fontFamily: FONTS.brand,
    fontSize: 15,
    lineHeight: 21,
    color: '#FFF7D6',
    flexWrap: 'wrap',
  },
  tailBorder: {
    position: 'absolute',
    left: -9,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 9,
    borderRightColor: 'rgba(245,200,66,0.55)',
  },
  tailFill: {
    position: 'absolute',
    left: -7,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 9,
    borderRightColor: '#1A1055',
  },
});
```

- [ ] **Step 2: Verify**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; exactly the one new file.

- [ ] **Step 3: Commit**

```powershell
git add app/components/PollyHuntVisit.tsx
git commit -m @'
Add PollyHuntVisit: fly-in/perch/fly-out visit body on shared pose images

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 6: Wire MaskBoard + device verification

`MaskBoard.tsx` is warroom-gated — make exactly these three edits, nothing else. The ~15 `firePollyEvent(...)` call sites throughout the file stay byte-identical (the hook's event union covers them all).

**Files:**
- Modify: `app/components/MaskBoard.tsx:19` (import swap), `app/components/MaskBoard.tsx:307-310` (hook swap), `app/components/MaskBoard.tsx:2122` (render insert)

**Interfaces:**
- Consumes: `usePollyVisits(isSpeedRound)` (Task 4), `PollyHuntVisit` (Task 5). `step: WordStep` is already in scope (component prop, line 294); `step.eventType === 'speedRound'` is the existing speed-round discriminator (same check `PollyCard` used).

- [ ] **Step 1: Swap the import (line 19)**

Replace:

```ts
import { usePollyAnimator } from '../hooks/usePollyAnimator';
```

with:

```ts
import { usePollyVisits } from '../hooks/usePollyVisits';
import { PollyHuntVisit } from './PollyHuntVisit';
```

- [ ] **Step 2: Swap the hook call (lines 307–310)**

Replace:

```ts
  // ── Polly animator ────────────────────────────────────────────
  const {
    firePollyEvent,
  } = usePollyAnimator(store.game.streak, store.game.lives, store.game.stepIndex);
```

with:

```ts
  // ── Polly visits (fly-in/out on pose images; usePollyAnimator quarantined) ──
  const {
    visit: pollyVisit,
    onVisitDone: onPollyVisitDone,
    firePollyEvent,
  } = usePollyVisits(step.eventType === 'speedRound');
```

- [ ] **Step 3: Render the visit layer**

Directly BEFORE the component's closing `</Animated.View>` (line 2123, right after the `wordOutcome === 'haunted'` block ends at line 2122), insert:

```tsx
      {/* ── Polly visit layer — bottom-left, never blocks touches ── */}
      <PollyHuntVisit visit={pollyVisit} onDone={onPollyVisitDone} />
```

- [ ] **Step 4: Verify types and diff discipline**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; only `app/components/MaskBoard.tsx` modified. Run `git diff` and confirm the diff contains ONLY the three edits above — any other hunk in MaskBoard is a failure; revert and redo.

- [ ] **Step 5: Rerun the policy test (regression)**

Run: `npx.cmd -y tsx app/game/pollyVisitPolicy.test.ts`
Expected: `OK — pollyVisitPolicy: all assertions passed`

- [ ] **Step 6: Device verification (Expo Go) — REQUIRED before commit**

Start: `npx.cmd expo start` and open on device via QR. This is a human-in-the-loop step: ask Pete to run the manual pass and confirm each item:

1. Start a Hunt → no Polly on screen during normal play; swiping is unaffected.
2. Make a wrong swipe → she flies in bottom-left, smug pose, "Thought so." + short squawk, flies out ~2s later. A second wrong swipe on the same word → nothing.
3. Idle ~6s on a word → pointing taunt "YES... NO... MAYBE SO..." (only if no heckle already used this word).
4. First perfect word clear of the run → shocked visit, "Bet you can't do that again."
5. Reach Round 10 (dev BOSS button) → angry fly-in, pointing, "This word stays mine."
6. Master the boss → angry fly-in, sulk, silent, stays perched until Results.
7. Fail the Returning Haunt (Round 8) → laugh visit "BBBLAAAAHHAHAHA!" + laugh squawk, flies
   out ~2.2s, run continues. (Note: `gameOver`'s "stays perched until Results" on-board beat
   is de-scoped — the board unmounts to Results instantly, so it is not observable on device;
   skip checking it for this pass.)
8. During any visit, tiles remain fully swipeable (she never blocks touches).
9. Screenshot at least the smug heckle and boss entry for the commit record.

- [ ] **Step 7: Commit (only after device confirmation)**

```powershell
git add app/components/MaskBoard.tsx
git commit -m @'
Wire Hunt Polly visits into MaskBoard (usePollyVisits + PollyHuntVisit; animator quarantined)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

- [ ] **Step 8: Tag the device-confirmed checkpoint**

Run: `git tag v0.working-20260702-hunt-polly` (adjust date to the actual confirmation day).

---

## Post-plan notes (not tasks)

- If the sulk pose renders soft/blurry at 260px (sprite9 source is lower-res than the others), accept it — it's placeholder art until the proper layered Polly set exists.
- If pose swaps visibly "jump" in size on device, that's the known per-pose normalization follow-up from memory — a separate task, do not fix inline.
- `docs/GAME_REFERENCE.md`'s "Hunt behavior (not yet wired to the new poses)" paragraph becomes stale after Task 6 — update it in a docs-only follow-up commit if Pete confirms the device pass.

## Post-review amendments (2026-07-02)

Final-review found three issues after Task 3 landed. Task 3's trigger-map table and code
listing above are illustrative plan text and were left as originally written; the approved
fixes below are what actually shipped in `app/game/pollyVisitPolicy.ts` /
`.test.ts` — see the design spec's Trigger map for the corrected tables.

1. **`hauntFailed` no longer shares `GAME_OVER_LAUGH`.** A failed haunt does not end the run,
   so it must not hold the perch. Added a dedicated `HAUNT_FAILED_LAUGH` spec (same laugh
   pose/line/SFX as game-over, `holdPerch: false`, `perchMs: 2200`) and split the combined
   `if (event === 'gameOver' || event === 'hauntFailed')` branch in `resolveVisit` so each
   event maps to its own spec.
2. **`WRONG_SMUG`'s `sfx` changed from `'pollySqwawkShort'` to `null`.** The wrong swipe
   itself already plays `pollySqwawkShort` in MaskBoard; the heckle visit playing it again
   was a double squawk on every mistake.
3. **Test file updated to match:** `gameOver` and `hauntFailed` are asserted separately
   (`gameOver` keeps `holdPerch: true`; `hauntFailed` asserts `holdPerch: false` as the
   regression guard), and the `wrong` heckle assertion now expects `sfx: null`.

Task 6's device checklist item 7 above reflects this: it now checks the Round 8 haunt-failed
fly-out instead of the game-over "stays perched" beat, which is on-board-de-scoped (see the
design spec's Terminal-visits rule).
