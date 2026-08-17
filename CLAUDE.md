# POLYWORDS Architecture

`AGENTS.md` defines authority and non-negotiable workflow. This file records durable
architecture; current progress belongs in `CONTEXT.md`.

## Source Map

| Area | Source |
| --- | --- |
| Hunt, scoring, Vault, feedback | `docs/GAME_REFERENCE.md` |
| Hunt pacing and placement | `docs/GOLDEN_PACING_SYSTEM.md` |
| Content feeling | `docs/CONTENT_PHILOSOPHY.md` |
| REAL/trap editorial law | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily Challenge | `docs/DAILY_CHALLENGE_SPEC.md` |
| Polly voice | `docs/POLLY_DIALOGUE_BANK.md` |
| Patch workflow | `docs/WORKFLOW.md` |

## App

- Expo SDK 54, React Native 0.81, TypeScript strict, New Architecture.
- Navigation: Home / Play / Vault / Settings, plus Daily. GameScreen is nav-free.
- State: Zustand + immer; persistence uses AsyncStorage.
- Motion: React Native Animated for most surfaces; Reanimated remains isolated to
  `SwipeMask.tsx`.
- Audio: `expo-audio`; `MusicEngine.ts` owns one persistent, owner-scoped player.
- Non-default `playSfx` rate: `expo-audio`'s `AudioPlayer.shouldCorrectPitch` defaults to
  `true` (built for slow-motion video — a rate change alters duration only, not pitch,
  unless disabled). `sfx.ts`'s `restartPlayer` must set `shouldCorrectPitch = (rate !== 1.0)`
  before every `setPlaybackRate` call, or a pitched cue (e.g. the wrong-swipe deflate layer
  at 0.55x) plays at its normal bright pitch instead — present unnoticed since the deflate
  cue shipped 2026-07-09, fixed 2026-08-16. `setPlaybackRate` failures are now logged and
  skip playback rather than silently falling through to the default pitch.
- Telemetry: `playtestTelemetry.ts` persists locally in every build, not dev-only —
  hesitation, ambiguous-swipe, decision-timeline, ghost/Haunt-lifecycle, and boss-entrance
  events. Never networked; surfaced only via Settings > Playtest Data (manual on-device
  Share). See `CONTEXT.md` for the live event-type list and collection status.
- Runtime fonts: Bebas Neue (hero) and Barlow Condensed (UI, tiles, Polly bubbles).
  Rammetto One is retained only for offline brand icon generation.

Native-driver rule: transform/opacity use `true`; layout/color use `false`. Never mix
drivers on one `Animated.Value`.

## Hunt

- 10 rounds; Round 10/index 9 is Polly’s Word (`eventType: 'bossWord'`). `generateHunt`
  (`huntGenerator.ts`) is the sole arc source; `createGame` requires a `steps` arg.
  Fledgling runs (first 3, `runsCompleted < 3`) use an 8-round arc instead, with the boss at
  index 7 — nothing may hardcode index 9 as "the boss."
- Round 8/index 7 is the Returning Haunt slot and remains a standard event.
- Mastery/haunt is decided by the engine's per-run `bossOutcome`
  (`'pending'|'mastered'|'haunted'`), never by score. Results, rank, and Polly-memory all
  derive from it. Surviving the visible boss tiles unlocks the hidden gauntlet regardless
  of visible mistakes; a perfect visible round is not required to master — it only sets
  `bossFlawless`. A wrong gauntlet tile or death on the boss = HAUNTED.
- Boss round judgment math: ROUTE C, shipped 2026-07-23 — survive visible tiles, then a
  3-tile hidden gauntlet, each tile judged UP/RIGHT independently; all three correct =
  MASTERED, one wrong = HAUNTED immediately. Chosen over 1-tile and 2-card, both of which
  were coin flips. `HUNT_POLLY_REBUILD_PLAN.md` described the old one-mystery-tile rule
  and has been retired.
- Boss gauntlet *interaction and presentation* — "Pick Your Trap", designed 2026-07-31,
  shipped 2026-08-01 — superseded Route C's fixed-sequence tile order and the
  `BossGauntletStack.tsx` throw-in cards it shipped with. All three gauntlet tiles now
  arrive together as closed cards (`BossGauntletSpines.tsx` — file name predates the
  2026-08-15 card rework below, still the live component; `useBoardMechanics.ts`
  `pickGauntletTile`/`gauntletIndex`) and the player picks which one to face and in what
  order — a real choice, made three times per boss round. The judgment math itself is
  unchanged (still per-tile UP/RIGHT, still economy-neutral, no re-simulation needed).
  Picking a card opens it (reveal); judging it is a separate, later swipe — irrevocable
  once a card is opened. This is the direction that replaced every earlier
  presentation-only attempt at "looking like a boss round" (the original
  `BOSS_ROUND_SPEC.md` build reverted for looking "layered/blurry on device", an
  abandoned chest object, an abandoned locks-on-the-book branch) — those attempts changed
  Aesthetics without changing Mechanics/Dynamics, which is why none of them landed
  regardless of polish. Full design:
  `docs/superpowers/specs/2026-07-31-boss-gauntlet-pick-your-trap-design.md`
  (git-ignored, local only). Presentation moved on 2026-08-15 (`aa08db6`): Pete called the
  standing-spine shape "sticks standing up" on device, so the closed state is now three
  small face-down cards that flip open on pick (a `rotateY` roll, not a literal two-sided
  flip, so it never depends on the Android `backfaceVisibility` bug already hit once in
  `HeroBook.tsx`) — pick-order mechanic and judgment math untouched, this replaced only
  the closed-state shape and material. Opened-card material now reuses the same painted
  texture every regular tile uses (`MaskCardArtwork`) plus a gold rim accent, closing the
  book-material-skin open item below; the closed-state marker is Pete's crown artwork
  (`assets/images/gauntlet/crown-marker.png`), tinted gold/rose/lavender per tile. Full
  presentation detail: `docs/superpowers/specs/2026-08-15-gauntlet-card-flip-design.md`.
  Still open/deferred, not decided by either design: exact card layout/dimensions/aspect
  ratio (device-tuning starting values, not locked) and a gauntlet-open music stinger —
  none exists yet, the boss track just continues unchanged when the gauntlet opens,
  pending Pete's call on whether to commission one.
  Separately, the boss *word* itself (not the gauntlet) stays plain `Text` — a
  2026-08-02 attempt to switch it to the same `FoilWord` treatment every other word uses
  was reverted the same day after device testing showed the bevel layers don't register
  cleanly at the boss word's larger size/heavier `FONTS.bossWord` face; they read as
  visibly doubled letters instead of a subtle foil effect. Don't retry this without a
  device-verified fix to `FoilWord` itself (or a boss-specific variant), not just
  re-plugging it in. The gold-absorption/wrong-swipe overlay FX that were previously
  hard-disabled for boss specifically ARE re-enabled and sized off `styles.wordBoss` —
  that part is unaffected, since it's a single flat text layer (the same technique the
  existing Haunt tint already uses successfully), not FoilWord's multi-layer stack.
- Boss words require BOTH `hiddenMeaning` and `hiddenTrap` (`hasBossContent` enforces it).
- Boss content spec: target ~3 hidden meaning/trap pairs per boss word, written hard enough
  that a good player misses ~1 in 4. `WordStep.hiddenPairs` (array schema) shipped with
  Route C 2026-07-23 — schema is no longer singular-only. As of 2026-08-11 all 13 live
  boss words ship with a full hand-written 3-pair `hiddenPairs` set; zero `PLACEHOLDER TEST`
  slots remain.
- Only failed boss words become HAUNTED. Mastered words graduate permanently.
- RUN IT BACK draws a fresh Hunt with ghost priority.
- Hunt economy is locked (`docs/GAME_REFERENCE.md`): target ~54% survive, ~25%
  master, deaths land late. Difficulty ramps via trap sharpness per phase, not tile count.
- Gold Feather: earned only by winning the Daily; one use, expires. Revives at 1 life on the
  same word and resets `bossOutcome` to 'pending' — a second shot at the boss is
  intentional, not a bug to fix.
- Never-change text: `Thought so.` (`BINGO BANGO ZZZZINGO!` was unassigned from the mastery
  sequence by Pete on 2026-07-23 — may be placed elsewhere later; do not reintroduce it into
  mastery without a new decision).
- Master Gate is gone.
- `MaskBoard.tsx` and `SwipeMask.tsx` are warroom-gated — a warroom pass is required
  before either is edited.
- Gauntlet's 3rd (final) tile gets a distinct double-pulse haptic on correct
  judgment; tiles 1-2 unchanged.
- Fatal wrong-swipe → Results transition is held open, not instant: `GameScreen.tsx`'s
  `deathHoldActive` gate (same pattern as `bossTransitionActive`) keeps `isDone` false for
  780ms (`SwipeMask.tsx`'s wrong-swipe exit duration) on a FRESH `playing`→`gameOver`
  transition only — a resumed already-gameOver session skips the hold. Shipped 2026-08-16
  (`617417b`) after a device recording showed the board disappearing in ~33ms with no death
  animation. The gate must be set synchronously during render, not in a `useEffect` — an
  effect-based flip still paints one stale frame first (a visible blink to Results and
  back), since effects run after commit. `useBoardMechanics.ts`'s `onTileExitComplete` must
  likewise check `game.status !== 'playing'` before its `revealNext()` mask-list mutation
  promotes the next card — that check didn't exist before the hold gave the old,
  previously-never-exercised code path a window to run in.

The visual hierarchy is hero word, active mask tile, HeroBook/Vault target, HUD, then
Polly visit. Ordinary tiles share one neutral treatment until commitment.

## Polly

Polly is an authored trickster and trap-setter. She never owned the words and never
generates dialogue. The live system is:

- `assets/images/polly/poses/*.png`
- `app/ui/pollyPoses.ts`
- `app/game/pollyCharacter.ts`
- `app/game/pollyMemory.ts`
- `app/hooks/usePollyVisits.ts`
- shared perch/visit/bubble components
- Boss entrance (BOSS_ENTRY) holds 4200ms at 1.45x scale. bossEntry/bossCorrect
  haptics are now distinct (double-pulse vs single).

Memory is bounded, deterministic, versioned, and local. Motion respects reduced-motion
and stops off-screen.

## Screens and Materials

- Home is the lobby/launchpad.
- Play is the semantic arena.
- Vault is the player’s reclaimed archive, with no Polly presence.
- Settings owns profile/preferences/about and the development-only pose viewer.
- Daily is a separate UP-only five-round mode.

Theme and material sources live under `app/ui/`; behavior should be read from live code,
not old design plans. `app/ui/ambientSkyTuning.ts` gives all four screens' backgrounds one
shared deep tone — the earlier plan to give Boss its own rose/ember tint as a deliberate
escalation was tried and then killed by Pete (2026-08-02) as still off-palette; there is
no per-screen background exception anymore.

## Content Boundary

`assets/data/huntData.json` is now the real working content, not a test corpus. On
2026-08-07 Pete had it fully replaced — the old ~400-word broken test set was wiped
entirely (not merged, not kept alongside) — with the ~150-word set built from his new
editorial workbook (`tools/content/build-hunt-data.mjs`, run against
`POLYWORDS_content_data_2026-08-06_ARMS_NAIL_COMPLETE_LOCKED.xlsx`, which on 2026-08-07
also replaced the tracked `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` as the master —
verified byte-identical `huntData.json`/`build-report.json` regeneration before the swap).
13 words currently ship as full boss cards (KERNEL was demoted from boss by Pete
2026-08-11, replaced by a promoted fruit-stone REAL). As of 2026-08-11 all 13 have their
full 3-pair `hiddenPairs` set hand-written — the COURT/IRON/STRIKE gauntlet-review commits
that day closed out the standing 3-pair target; no `PLACEHOLDER TEST` slots remain on any
boss word. Boss words are governed by the live JSON: `assets/data/huntData.json` is
the source of truth for which words ship as bosses and their hand-written
`hiddenPairs`, superseding the workbook and `build-hunt-data.mjs` wherever they
differ. (They currently do: the workbook stores one hidden pair per boss word and
still marks KERNEL and WAKE boss-ready, and `build-hunt-data.mjs` emits 1-real +
2-`PLACEHOLDER TEST` pairs — so a rebuild is not authoritative until the pipeline
reproduces the live 13 × 3-pair set.) 2 words (REVOLUTION, PROJECT) were
separately, explicitly demoted from boss by
Pete earlier and ship as regular words only, per his own documented reasoning in the
workbook. `huntData.v2.json` (0 words) and the mask-rewriter AI-assisted content-generation
pilot were both retired 2026-08-11 — Pete: mask-rewriter never produced one usable line
across many attempts — and moved to `tools/content/_deprecated/`; no longer an active
track.

`gpsTag` and `difficulty` are not in the workbook at all — `build-hunt-data.mjs`
placeholder-assigns them so the game can run (`gpsTag` is load-bearing — `huntGenerator.ts`
pools words by it and throws on an empty pool) before a real editorial pass exists, per
`docs/GOLDEN_PACING_SYSTEM.md`. That pass ran 2026-08-07 and is now complete: all 137
non-boss words have a real hand-reviewed `gpsTag`/`difficulty`, grounded in each word's
actual REAL/trap content against the phase table, tracked in
`tools/content/pacing-overrides.json` (git-tracked, merged in by `build-hunt-data.mjs`
before falling back to placeholder, so it survives a workbook rebuild — only the 13 boss
words still fall back to a placeholder `difficulty`, not covered by this pass). A batch of
37 words were briefly held back mid-pass as "traps restate their REAL" before Pete
clarified that's not a defect — `docs/CONTENT_WRITING_STANDARD.md` defines a trap as
"guilty-close, legally wrong," not required to oppose the REAL — so they were folded back
in. Two words' traps were genuinely fixed: BULB's onion trap was cut (onions are literal
bulbs, not a fair trap) and DATE's "wrinkled purple fruit" trap (actually a fig near-miss,
not a color error) was rewritten to "a one-night stand." Applying the pass also exposed and
fixed a real crash risk in `huntGenerator.ts`'s phase fallback chains (some phases couldn't
reach the confidence pool as a last resort) and a placeholder-stability bug (the
round-robin placeholder shifted for unreviewed words every time another word gained an
override) — see `CONTEXT.md` for the full history.

## Key Files

```text
App.tsx
app/screens/{Game,Home,Vault,Settings,DailyChallenge,Results}Screen.tsx
app/components/MaskBoard.tsx
app/components/SwipeMask.tsx
app/components/ui/{HeroBook,Bookcase,BookSpine}.tsx
app/game/{huntGenerator,polyRunEngine,dailyChallengeEngine,playtestTelemetry}.ts
app/store/useGameStore.ts
app/audio/{MusicEngine,sfx,audioSession}.ts
app/ui/pwTheme.ts
assets/data/huntData.json
localworkbooks/POLYWORDS_HAUNT_TILES.xlsx
```

## Repository Rules

- Active branch: `play-screen-overhaul`; do not merge to `main` without approval.
- Preserve the named stashes listed in `CONTEXT.md`.
- Verify code with `npx.cmd tsc --noEmit`; use `npm.cmd test` for game logic changes.
- Do not commit generated editorial output, local credentials, or dependency caches.
- Never guess or assume app state — verify against repo/workbook/live code before stating
  anything about it, including anything recalled from memory of a prior session. Ask Pete
  on canon/design intent.
- Explain findings and fixes in the simplest plain-language terms first; save file/line
  and mechanism detail as supporting reference, not the headline.
- Never take the easy shortcut to fix something. Find and name the actual root cause, and
  say plainly whether a proposed fix addresses it or is a patch — even unprompted.
