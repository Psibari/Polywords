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
  arrive together as closed spines (`BossGauntletSpines.tsx`, `useBoardMechanics.ts`
  `pickGauntletTile`/`gauntletIndex`) and the player picks which one to face and in what
  order — a real choice, made three times per boss round. The judgment math itself is
  unchanged (still per-tile UP/RIGHT, still economy-neutral, no re-simulation needed).
  Picking a spine opens it (reveal); judging it is a separate, later swipe — irrevocable
  once a spine is opened. This is the direction that replaced every earlier
  presentation-only attempt at "looking like a boss round" (the original
  `BOSS_ROUND_SPEC.md` build reverted for looking "layered/blurry on device", an
  abandoned chest object, an abandoned locks-on-the-book branch) — those attempts changed
  Aesthetics without changing Mechanics/Dynamics, which is why none of them landed
  regardless of polish. Full design:
  `docs/superpowers/specs/2026-07-31-boss-gauntlet-pick-your-trap-design.md`
  (git-ignored, local only). Still open/deferred, not decided by this design: exact spine
  layout/dimensions, closed-state icon/texture, and the book-material skin in pixel
  detail (leather/gold-trim direction carried over from `BOSS_ROUND_SPEC.md` Part C5).
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
  Route C 2026-07-23 — schema is no longer singular-only. Most live boss words still have
  only one real pair populated; the other two slots are `PLACEHOLDER TEST` content pending
  real editorial writing.
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

`assets/data/huntData.json` is live test content. The tracked Haunt workbook is the
editorial master, while `huntData.v2.json` and mask-rewriter output stay dormant until an
explicit production merge. Workbook approval never changes live JSON automatically.

Live huntData.json's ~400 words are the old broken set, kept deliberately as a test
corpus — do not strip it. Real content is ~110 words (100 standard + ~10-11 boss) in the
workbook.

## Key Files

```text
App.tsx
app/screens/{Game,Home,Vault,Settings,DailyChallenge,Results}Screen.tsx
app/components/MaskBoard.tsx
app/components/SwipeMask.tsx
app/components/ui/{HeroBook,Bookcase,BookSpine}.tsx
app/game/{huntGenerator,polyRunEngine,dailyChallengeEngine}.ts
app/store/useGameStore.ts
app/audio/{MusicEngine,sfx,audioSession}.ts
app/ui/pwTheme.ts
assets/data/huntData.json
localworkbooks/POLYWORDS_HAUNT_TILES.xlsx
tools/content/mask-rewriter/
```

## Repository Rules

- Active branch: `play-screen-overhaul`; do not merge to `main` without approval.
- Preserve the named stashes listed in `CONTEXT.md`.
- Verify code with `npx.cmd tsc --noEmit`; use `npm.cmd test` for game logic changes.
- Do not commit generated editorial output, local credentials, or dependency caches.
- Never guess or assume app state — verify against repo/workbook/live code before stating
  anything about it. Ask Pete on canon/design intent.
