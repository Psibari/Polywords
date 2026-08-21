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
  `SwipeMask.tsx` and `DailyAnswerCard.tsx` (added 2026-08-21 — same live-drag
  transform pattern, ported for the same JSI-direct responsiveness under
  finger; both files' non-touch-critical entry/layout values still stay on
  plain RN `Animated`).
- Audio: `expo-audio`; `MusicEngine.ts` owns one persistent, owner-scoped player.
- Non-default `playSfx` rate: `expo-audio`'s `AudioPlayer.shouldCorrectPitch` defaults to
  `true` (built for slow-motion video — a rate change alters duration only, not pitch,
  unless disabled). `sfx.ts`'s `restartPlayer` must set `shouldCorrectPitch = (rate !== 1.0)`
  before every `setPlaybackRate` call, or a pitched cue (e.g. the wrong-swipe deflate layer
  at 0.55x) plays at its normal bright pitch instead — present unnoticed since the deflate
  cue shipped 2026-07-09, fixed 2026-08-16. `setPlaybackRate` failures are now logged and
  skip playback rather than silently falling through to the default pitch.
- Total audio silence (music AND SFX, zero errors from the mute case but real native errors
  otherwise) root-caused 2026-08-19: `audioSession.ts`'s `setAudioModeAsync` was requesting
  `interruptionMode: 'mixWithOthers'`, which on iOS made every subsequent
  `AudioPlayer.play()` throw expo-audio's native `Session activation failed`
  (`AVAudioSession.setActive`). `MusicEngine.ts`/`sfx.ts`'s bounded rebuild self-heal (added
  across 7+ prior commits chasing this same symptom) could never fix it, since rebuilding a
  JS-side player just re-invokes the same broken native call. Switched to
  `interruptionMode: 'doNotMix'`, which does not add the failing category option — device-
  confirmed fixed on iOS Expo Go. Separately: a "totally silent, zero errors" report during
  this investigation turned out to be the in-app Settings > Sound toggle switched off, not a
  code bug — check that first before assuming a native/session issue.
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
- The Returning Haunt slot moved earlier 2026-08-18 (`279ccf5`): round 5/index 4 in the
  standard 10-round arc, round 4/index 3 in the 8-round fledgling arc (was round 8/6 —
  too deep for players who don't reliably reach that far to see their revenge match).
  `huntGenerator.ts`'s `hauntIdx` is now an explicit per-length value, not a `length - 3`
  formula. It remains a standard event — never boss presentation. Its emotional weight
  (role/haptic) no longer inherits whatever phase happened to sit at that array index; it
  is explicitly forced to `adrenaline`/heavy regardless of arc length or position.
- Cross-run repeat suppression shipped 2026-08-18 (`82430d1`): `generateHunt` takes a
  `recentWordIds` param (the last ~30 words actually shown, persisted on
  `PlayerProgress`); each `gpsTag` pool is reordered so recently-shown words sink to the
  back, never excluded — the existing cross-pool fallback chain sees an unchanged pool.
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

## Onboarding

Four one-time explainer overlays, each gated by its own AsyncStorage key
(`app/constants/storageKeys.ts`) and never shown twice to the same player:

| Overlay | Fires | Gates gameplay? | Polly visit after dismiss? |
| --- | --- | --- | --- |
| `HuntIntroOverlay` | First Hunt round ever | Yes — blocks board mount | `huntIntro` |
| `BossIntroOverlay` | First boss round ever | Yes — blocks board mount | `bossEntry` (separate trigger, not chained to this overlay) |
| `HauntIntroOverlay` | First Returning Haunt round ever | Yes — blocks board mount | `hauntIntro` |
| `VaultIntroOverlay` | First Vault visit ever | No — Vault renders underneath it immediately | None — Vault is Polly-free (see Screens and Materials) |

The three gating overlays are wired through `GameScreen.tsx`'s
`gameplayGateActive` — fail-open, same as every other flag in that gate: a
failed AsyncStorage read is treated as "already seen," never blocks play
forever. Settings > Tutorial Replay clears the three gating keys only;
Vault's key is deliberately not included — no gameplay-blocking precedent
exists for replaying a non-gating overlay yet.

The book players swipe cards into during a Hunt round is named
**Polybook** (in-round spine text, `MaskBoard.tsx`; Home cover book title,
`HomeScreen.tsx`) — distinct from the **Vault**, the archive screen where
finds get recorded (`VaultScreen.tsx`'s own title and its Home nav button
both correctly still say "WORD VAULT"). Naming locked 2026-08-21.

## Screens and Materials

- Home is the lobby/launchpad.
- Play is the semantic arena.
- Vault is the player’s reclaimed archive, with no Polly presence.
- Settings owns profile/preferences/about and the development-only pose viewer.
- Daily is a separate UP-only five-round mode.

Theme and material sources live under `app/ui/`; behavior should be read from live code,
not old design plans. `app/ui/ambientSkyTuning.ts` gives all four screens' backgrounds one
shared deep tone — the earlier plan to give Boss its own rose/ember tint as a deliberate
escalation was tried and then killed by Pete (2026-08-02) as still off-palette. One
deliberate per-screen exception does exist: Home renders `showGround: false` and stays
sky-only (stars, moon, gradient) with no ground band at all, since the painted Home book
already covers most of its ground. Every other screen (Hunt, Boss, Daily, Vault,
Settings) shares one painted stone-wall ground art (`assets/images/background/
StoneWall.png`, added 2026-08-20) at its native aspect ratio, bottom-anchored, with two
torches (`GroundTorch`) pinned at a fixed `bottom: 300` offset. Vault additionally
layers painted stone shelving (`assets/images/vault/shelves.png`, 3 slots) over the
shared wall; Daily and Settings layer a tiled stone texture
(`assets/images/textures/stoneTile.png`) behind their panel chrome specifically. An
SE-class phone (375×667) crops roughly the top 18% of the wall art due to aspect-ratio
math — confirmed cosmetic only (two brick rows + a few vine sprigs, never the
compositional ledge) and closed won't-fix 2026-08-21; do not resurface without new
on-device evidence.

## Content Boundary

`assets/data/huntData.json` is the real working content and the source of truth for what
ships — not a test corpus, and not subordinate to the workbook. Current corpus (verified
directly against the live file, 2026-08-19): **173 words**, gpsTag pools confidence 12 /
flow 33 / tension 62 / panic 53 / boss 13, 39 hand-written hidden meaning/trap pairs
across the 13 boss words, zero `PLACEHOLDER TEST` slots. History: Pete fully replaced the
old ~400-word broken test set 2026-08-07 with a 150-word set built from his editorial
workbook; a purely-additive merge 2026-08-16 (`f2f6def8`) brought in 23 more words
(150→173) via the new `tools/content/merge-workbook-additions.mjs`, which reads mask ids
verbatim from the workbook's Content ID column and never touches an existing word's masks
or `hiddenPairs`.

`tools/content/build-hunt-data.mjs` — the original full-rebuild tool — is retired as the
normal update path and now refuses to run without
`POLYWORDS_ALLOW_DESTRUCTIVE_REBUILD=1`: it predates stable content identities and would
regenerate most hand-written `hiddenPairs` as placeholder content, drop their ids, and
break every saved player record against the current corpus. Kept only as a record of how
the original 150-word corpus was built. `merge-workbook-additions.mjs` is the live,
additive path for bringing new workbook words in.

13 words ship as full boss cards, each with a full hand-written 3-pair `hiddenPairs` set
(KERNEL was demoted from boss by Pete 2026-08-11, replaced by a promoted fruit-stone REAL;
REVOLUTION and PROJECT were separately demoted earlier and ship as regular words only).
`assets/data/huntData.json` is authoritative over the workbook and both build scripts
wherever they differ.

`localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` is the tracked editorial-master pointer;
its current backing file is `POLYWORDS_content_data_2026-08-15_DIRECT_DISCHARGE_LOCKED.xlsx`
(166 words, refreshed from Pete's 2026-08-15 working copy). `huntData.v2.json` (schema
shell, `words: {}`, 0 entries) and the mask-rewriter AI-assisted content-generation pilot
were both retired 2026-08-11 — Pete: mask-rewriter never produced one usable line across
many attempts — and moved to `tools/content/_deprecated/`; no longer an active track.

`gpsTag` and `difficulty` are not in the workbook at all — the build tooling
placeholder-assigns them so the game can run (`gpsTag` is load-bearing — `huntGenerator.ts`
pools words by it and throws on an empty pool) before a real editorial pass exists, per
`docs/GOLDEN_PACING_SYSTEM.md`. The first pass (2026-08-07) hand-reviewed all 136 non-boss
words that existed at the time; the 2026-08-16 merge added real, cross-checked
`gpsTag`/`difficulty` for the 23 new words alongside it, tracked in
`tools/content/pacing-overrides.json` (git-tracked, merged in ahead of the placeholder
fallback so it survives a workbook rebuild). **One gap found this pass:** KERNEL — demoted
from boss 2026-08-11, after the pacing pass closed — has no entry in
`pacing-overrides.json` and is still on the placeholder assignment; every other one of the
160 non-boss words has a real hand-reviewed tag. Boss words' `difficulty` still falls back
to placeholder throughout — never in scope for this pass. Full session-by-session history
(BULB/DATE trap fixes, the fallback-chain crash fix, the placeholder-stability fix) is in
`CONTEXT.md`.

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
