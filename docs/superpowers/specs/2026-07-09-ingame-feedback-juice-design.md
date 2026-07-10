# In-Game Feedback & Juice — Design

## Why

Engagement audit (2026-07-09) found sound/haptic/visual coverage solid on individual swipe
outcomes but silent on **state escalation and meta-progress moments**: chain multiplier climb,
rank-up, daily reward reveal, ambient tension at boss/haunt beats. Push notifications are a
separate, later pass — out of scope here.

## Principle

Feedback intensity scales with event rarity, not with how satisfying it'd be to make loud.
High-frequency events (every correct swipe) get subtle escalation reusing existing assets. Rare
events (rank-up, streak milestone) can afford a fuller, distinct beat. No new SFX/music assets;
reuse existing sounds at altered playback rate where variation is needed (`expo-audio`
`AudioPlayer` supports rate control — not runtime synthesis, which stays banned for music).

## Bundle 1 — Score gain + chain multiplier (`MaskBoard.tsx`, `sfx.ts`, `ScoreFloat.tsx`, `StreakDisplay.tsx`)

Ordinary correct swipes (`handleSwipeUp`/`handleSwipeRight`, ~1424-1496) currently get **no
haptic at all** — only `correctClaim`/`trapShatter` sfx (the existing `notificationAsync(Success)`
only fires on the boss mystery tile and mastery finale). This bundle adds tiered haptic to
ordinary swipes for the first time and ties sound/visual escalation to chain tier.

3 tiers from `chainMult` (already computed inline at both call sites): Base (1.0), Building
(1.5-2.0), Max (2.5-3.0).

- Sound: `correctClaim` played at incrementally higher rate per tier via a new optional `rate`
  param on `playSfx()`.
- Haptic: Base/Building unchanged pattern added (`notificationAsync(Success)`, newly present);
  Max adds one extra `impactAsync(Light)` immediately after.
- Visual: `ScoreFloat` takes a `tier` prop scaling font size + glow; `StreakDisplay`'s existing
  pulse (1→1.3→1.0) peaks higher at Max tier.

Chain-break deflate (only when `store.game.chainMultiplier >= 1.5` at the moment
`triggerWrongSwipeFeedback()` fires, before the reset lands): layer a pitched-down `correctClaim`
under the existing `wrongLame`, swap the plain error haptic for one `impactAsync(Heavy)`, and give
`StreakDisplay` a translateY+8px/fade-out drop instead of a flat opacity cut. A miss at 1.0x is
untouched.

## Bundle 2 — Rank-up celebration (`ResultsScreen.tsx`)

`computeRank(score)` already exists locally (~68-75); `prevBest` is already captured via
`useState(() => progress.personalBest)` (~366). Add `prevRank = computeRank(prevBest)` and
`didRankUp = isNewBest && rank.letter !== prevRank.letter`. On mount, if `didRankUp`: `playSfx
('mastered')` (reused — same "achievement" audio motif as word mastery), `notificationAsync
(Success)` followed by one delayed `impactAsync(Heavy)` (mirrors the existing mastery-sequence
haptic shape at MaskBoard ~1196-1211). Visually, the existing `rs.rankRow` (~460-463) gets a
spring scale pulse + temporary glow intensify on the rank letter — same pulse shape already used
in `StreakDisplay`, no new component. No change to `VaultScreen.tsx`'s separate rank table.

## Bundle 3 — Daily reward reveal (`DailyChallengeScreen.tsx`)

`ResultsOverlay`'s `featherWrap` block (~267-280) already renders for both `isWin` and
`streakMilestoneReward` — one shared UI moment for two grant paths (`grantGoldFeather()` fires
for both, store ~406-408). Add one mount-only `useEffect` (mirrors the existing `pollySqwawkLaugh`
mount pattern in `ResultsScreen.tsx`): when either condition is true, `playSfx('mastered')` +
`notificationAsync(Success)`, and give the feather image a scale-in + brief glow-pulse entrance
(new local `Animated.Value`s on the existing `Image`, no new component).

## Bundle 4 — Restrained screen shake (`MaskBoard.tsx`)

No screen shake exists anywhere in the codebase today. Kept deliberately minimal — two trigger
points only, both already carry a heavy-haptic precedent to match:

- Boss entrance (~960-978): a ~3-4px translateX jitter sequence on the board's root container,
  synced with the existing triple `impactAsync(Heavy)` timer.
- Haunted outcome only (`showWordOutcome`, ~1025-1032, `outcome === 'haunted'` branch): same
  small jitter, timed with the existing `playSfx('haunted')`.

`useNativeDriver: true` (transform only), no amplitude increase beyond ~4px — reads as impact,
not gimmick. Mastered outcome and ordinary word transitions get no shake.

## Scope boundaries

Untouched: `SwipeMask.tsx`, `MusicEngine.ts` (chain-break ducking flagged, not fixed here — stem
contract stays locked), `VaultScreen.tsx`, boss/final-tile mystery-tile handlers (already have
their own haptic). Each bundle is a separate surgical patch/commit per CLAUDE.md workflow; `tsc
--noEmit` + `git diff --check` after each.

## Out of scope

Push notifications, new gameplay hooks/mechanics (separate future pass per user decision
2026-07-09), any new SFX/music assets, MusicEngine architecture changes.
