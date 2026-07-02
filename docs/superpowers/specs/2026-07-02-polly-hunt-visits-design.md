# Polly Hunt Visits — Design

**Date:** 2026-07-02 · **Branch:** `play-screen-overhaul` · **Status:** Approved design, pre-plan

## Goal

Bring the shipped Daily Polly treatment (transparent pose images, fly-in entrance,
whole-image motion, speech bubble, SFX) to the standard Hunt play screen. Today MaskBoard
fires ~15 `firePollyEvent` call sites into `usePollyAnimator`, but nothing renders her —
the animator's visual outputs are dropped and `PollyCard` is unmounted. The Hunt has a
trigger system with no body; Daily has the body with a 3-reaction map.

## Decisions (settled in brainstorming)

1. **Visit-based, not continuous.** Polly flies in from the bottom-left when a trigger
   fires, perches, delivers the reaction + line, flies out. She is not perched all run.
2. **Curated big beats + budgeted heckles.** Most animator events are ignored; a small
   guaranteed set always fires; heckles are capped at one visit per word.
3. **Approach A.** New Hunt-specific component + director hook reusing Daily's pose
   assets and motion idioms. Daily's shipped component is untouched except an
   import-only change. Old renderers are quarantined, not deleted.

## Components & files

### New

- **`app/ui/pollyPoses.ts`** — shared pose require-map, imported by both Daily and Hunt:

  | Key | Asset | Reading |
  |---|---|---|
  | `idle` | `poses/sprite4.png` | smug perched, watchful |
  | `smug` | `poses/sprite6.png` | half-lidded smug perch |
  | `laugh` | `poses/sprite5.png` | laughing wide |
  | `point` | `poses/sprite7.png` | pointing taunt |
  | `shocked` | `poses/sprite8.png` | shocked recoil |
  | `sulk` | `poses/sprite9.png` | hunched angry glare (needs cleanup — see Assets) |
  | `fly` | `poses/sprite2.png` | neutral fly-in |
  | `flyAngry` | `poses/sprite10.png` | angry open-beak fly |
  | `flyGrin` | `poses/sprite1.png` | confident grinning fly (reserve) |

- **`app/hooks/usePollyVisits.ts`** — the director. Exposes
  `firePollyEvent(event: PollyEvent)` with the **same signature and event names** as
  `usePollyAnimator`, plus visit state for the render component. Owns the visit queue,
  per-word budget flags, and interruption rules.

- **`app/game/pollyVisitPolicy.ts`** — the decision logic: a **pure, RN-free**
  `resolveVisit(event, budgetState)` plus the event→visit spec map. Separate module
  (not inside the hook file) so the test runs under plain Node via `npx tsx` — the repo
  has no jest, and importing the hook would drag in react-native.

- **`app/components/PollyHuntVisit.tsx`** — the body. Renders the active visit using
  `PollyDailyPerch`'s Animated idioms: native-driver transforms + opacity only,
  `setTimeout` between phases, whole-image motion (no part seams), Daily's speech-bubble
  styling (tail points at her). Always `pointerEvents="none"`.

### Changed (surgical)

- **`app/components/MaskBoard.tsx`** (warroom-gated): swap
  `usePollyAnimator(streak, lives, stepIndex)` → `usePollyVisits(...)` (adds an
  `isSpeedRound` flag), render `<PollyHuntVisit …/>` once at board root. Zero changes to
  the `firePollyEvent` call sites.
- **`app/components/PollyDailyPerch.tsx`**: import poses from `pollyPoses.ts`
  (import-only; no behavior change).

### Assets

- **`assets/images/polly/poses/sprite9.png`** must be re-cleaned (purple background
  remnants + white outline) with the same pngjs flood-fill pass used for the others,
  before the sulk pose ships. Note: `sprite3` was never cleaned into `poses/`; the set
  is sprites 1, 2, 4–10.

### Quarantined (untouched, disconnected)

`usePollyAnimator.ts`, `PollySprite.tsx`, `PollyActor.tsx`, `PollyRig`, `PollyCard`
(already unmounted), all `polly/*.webp` assets. Nothing deleted.

## Visit lifecycle

One fixed arc, ~3.2s for heckles, longer for guaranteed beats:

1. **Fly-in (~600ms):** enters off-screen bottom-left on a rising arc
   (translateX + translateY, native driver). Pose `fly`; `flyAngry` for `bossEntry` and
   `gateMasteredBoss`.
2. **Perch (~1.8–2.5s):** lands bottom-left — the lane the play field already clears
   (`gridWrap paddingTop` grounds the tile away from her). Reaction pose + speech bubble
   fade-in + whole-image punch (smug lean / laugh shake / shocked recoil — Daily's
   recipes). Idle breathe/sway runs underneath; she is never frozen.
3. **Fly-out (~500ms):** bubble fades, lifts off out the bottom-left corner, pose `fly`.

### Rules

- Right side never used — reject lane (design lock). Direction cues remain help-only.
- Gameplay never pauses. Layer is `pointerEvents="none"`, zIndex below the flash
  overlays (< 50).
- **Interruption:** a guaranteed event fired mid-visit hard-cuts the current visit to a
  fast fly-out (~250ms) and queues behind it. Heckles never interrupt and never queue —
  if she is on screen or the budget is spent, they are dropped silently.
- **Word advance** while a heckle visit is active → fast fly-out. `wordEntry` resets the
  per-word budget and never cuts a guaranteed visit.
- **Terminal visits hold the perch:** `gameOver`/`hauntFailed` (laugh) and
  `gateMasteredBoss` (sulk) do not fly out; they stay until the Results transition
  unmounts the board.
- **Speed rounds** suppress heckle visits; guaranteed beats still fire.

## Trigger map

### Guaranteed (always fly in, ignore budget)

| Event | Pose | Line | SFX |
|---|---|---|---|
| `bossEntry` | fly `flyAngry` → perch `point` | "This word stays mine." | `pollySqwawkShort` |
| `gateMasteredBoss` | fly `flyAngry` → perch `sulk` | *silent* | — |
| `gameOver` / `hauntFailed` | perch `laugh` | "BBBLAAAAHHAHAHA!" | `pollySqwawkLaugh` |
| `cleanSweep` — **first of the run only** | perch `shocked` | "Bet you can't do that again." | `pollySqwawkShort` |

### Budgeted heckles (max one visit per word, first-come; dropped if busy/spent)

| Event | Pose | Line | SFX |
|---|---|---|---|
| `wrong` (first wrong swipe of the word) | `smug` | "Thought so." | `pollySqwawkShort` |
| `hesitation6s` (3s/9s ignored) | `point` | "YES... NO... MAYBE SO..." | — |
| `ghostEntry` | `smug` | "Remember me." | — |
| `cleanSweep` (second and later of the run) | `shocked` | "Bet you can't do that again." | `pollySqwawkShort` |

### Ignored (call sites untouched; hook accepts and no-ops)

`correct`, `streakX10`, `oneHeartLeft`, `oneWrongMove`, `allMasksFound`, `hiddenFound`,
`hesitationCleared`, `ghostFoundLate`, `ghostDissolved`, `gateMastered`,
`hiddenMasterFailed`. `wordEntry` no-ops visually but resets the per-word budget.

Rationale for the cleanSweep tiering: scarcity is the menace. The first clean sweep
establishes "you can hurt her"; after that, a strong player would otherwise see her more
than a struggling one, inverting the antagonist. Typical run: 2–3 heckles + first clean
sweep + boss beats.

Never-change lines preserved verbatim: "Thought so." · "BBBLAAAAHHAHAHA!". All lines are
existing dialogue-bank/animator lines; no new dialogue.

## Error handling / edge behavior

- All timers (`setTimeout` phase chains, budget timers) are cleared on unmount.
- Reaction/pose state is per-visit; nothing persists across words except the run-level
  first-cleanSweep flag and per-word budget flag.
- If an unknown/future `PollyEvent` value reaches the hook, it no-ops.

## Testing & verification

- Unit test `resolveVisit()`: budget spend/reset, guaranteed-vs-heckle priority,
  cleanSweep tiering, speed-round suppression, drop-when-busy.
- Per patch: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short`.
- Device (Expo Go) manual pass: wrong-swipe heckle, hesitation taunt, boss entry, boss
  mastered sulk-hold, game-over laugh-hold, first-vs-later clean sweep, speed-round
  silence, no touch blocking during visits.
- Device screenshot before the visual commit; tag `v0.working-YYYYMMDD` after device
  confirmation.
