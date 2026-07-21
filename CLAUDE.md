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
- Round 8/index 7 is the Returning Haunt slot and remains a standard event.
- Mastery/haunt is decided by the engine's per-run `bossOutcome`
  (`'pending'|'mastered'|'haunted'`), never by score. Results, rank, and Polly-memory all
  derive from it. Surviving the visible boss tiles unlocks the mystery tile regardless of
  visible mistakes; a perfect visible round is not required to master — it only sets
  `bossFlawless`. Wrong mystery or death on the boss = HAUNTED.
- Boss words require BOTH `hiddenMeaning` and `hiddenTrap` (`hasBossContent` enforces it).
- Only failed boss words become HAUNTED. Mastered words graduate permanently.
- RUN IT BACK draws a fresh Hunt with ghost priority.
- Never-change text: `Thought so.` and `BINGO BANGO ZZZZINGO!`.
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
not old design plans.

## Content Boundary

`assets/data/huntData.json` is live test content. The tracked Haunt workbook is the
editorial master, while `huntData.v2.json` and mask-rewriter output stay dormant until an
explicit production merge. Workbook approval never changes live JSON automatically.

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
