# POLYWORDS Architecture

`AGENTS.md` owns authority and workflow. This file records durable architecture only;
current state and blockers live in `CONTEXT.md`. Verify runtime claims against code/data.

## Source Map

| Area | Owner |
| --- | --- |
| Hunt rules, scoring, results | `docs/GAME_REFERENCE.md` |
| Hunt pacing | `docs/GOLDEN_PACING_SYSTEM.md` |
| Hunt editorial law | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily gameplay/rules | `docs/DAILY_CHALLENGE_SPEC.md` |
| Daily content/editorial writing | `docs/DAILY_CONTENT_WRITING_STANDARD.md` |
| Polly voice | `docs/POLLY_DIALOGUE_BANK.md` |
| Visual system | `DESIGN.md`, `app/ui/` |
| Patch workflow | `docs/WORKFLOW.md` |

## Runtime

- Expo SDK 54, React Native 0.81, strict TypeScript, New Architecture.
- Zustand + immer own state; AsyncStorage owns local persistence.
- React Native Animated handles most motion. Reanimated owns finger-tracked cards in
  `SwipeMask.tsx` and `DailyAnswerCard.tsx`.
- `expo-audio` supplies music/SFX. `MusicEngine.ts` owns the persistent music player;
  `audioSession.ts` owns session configuration.
- Bebas Neue is the hero face; Barlow Condensed is the UI/tile/dialogue face.
- Transform/opacity animations may use the native driver; layout/color animations may not.

## Navigation and Modes

`App.tsx` registers Home, Game, Vault, Settings, and Daily. Home/Vault/Settings expose the
navigation shell; active Hunt and Daily play are nav-free.

### Hunt

- `huntGenerator.ts` builds the only Hunt arc: 10 rounds normally, 8 for the first three
  fledgling runs. Polly's Word is always last.
- The Returning Haunt slot is round 5 standard / round 4 fledgling and is never boss UI.
- UP claims a REAL; RIGHT rejects a trap. Wrong choices cost one of six feathers and reset
  the chain. Up to five visible masks appear per word.
- Surviving Polly's visible word opens three hidden gauntlet cards. The player picks the
  order, opens one card, then judges it with UP/RIGHT. All three correct = MASTERED; one
  wrong or death on the boss = HAUNTED.
- A Returning Haunt re-tests the exact hidden pair that previously won. Success banishes it;
  failure keeps it queued. Ordinary missed meanings are not Haunts.
- `bossOutcome` is authoritative. Score/rank never decides mastery.

### Daily

- Daily is a deterministic, one-attempt-per-date, five-round UP-only mode with two Chances.
- `useGameStore.ts` creates sessions through `dailyChallengeEngine.ts` and persists active
  sessions/results separately from Hunt.
- Correct-answer presentation is physical: the submitted card lands on the clue parchment,
  the matching rod/reward paper covers it, reward appears, then the paper rolls up over the
  already-rendered next clue. Input stays locked until the reveal finishes.
- `app/game/dailyPool.ts` contains the approved 43-word Daily runtime pool. Each source word
  has three clues and nine approved candidates; a round deterministically presents six.

## Content and Data

- `assets/data/huntData.json` is the live Hunt bank and outranks workbook/tool output.
- `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` is editorial staging. Runtime changes require
  an explicit additive merge and verification.
- Stable word/mask IDs are persistence contracts. Never rebuild or renumber existing content
  casually.
- `assets/data/huntData.v2.json` and `tools/content/_deprecated/mask-rewriter/` are retired.
- `workbooks/POLYWORDS_Daily_Challenge_Locked_2026-08-24.xlsx` is the canonical Daily
  authoring source; `app/game/dailyPool.ts` is the runtime representation.

## Presentation and Character

- Home is the lobby; Play is the semantic arena; Vault is the player's reclaimed archive;
  Settings owns preferences/development utilities; Daily is separate.
- The in-round intake object is the **Polybook**. Vault remains **WORD VAULT**.
- Live Polly uses `assets/images/polly/poses/*.png`, authored copy, deterministic local
  memory, and whole-image motion. Dormant rig code/assets are not the live path.
- One-time Hunt, Boss, Haunt, and Vault explainers use separate AsyncStorage gates. Hunt,
  Boss, and Haunt block play; Vault does not.
- Theme/material tokens live under `app/ui/`; current render code outranks abandoned plans.

## Services and Boundaries

- `playtestTelemetry.ts` stores local playtest events and exposes manual share/clear in
  Settings; it does not transmit data.
- Daily reminders are optional local notifications, off by default.
- Preserve all stashes. Do not merge `play-screen-overhaul` into `main` without approval.
