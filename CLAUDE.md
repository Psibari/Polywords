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
  `audioSession.ts` owns the single app-wide session configuration; `sfx.ts` owns on-demand
  SFX players and their bounded overlap queue. SFX and music construct players with real
  sources and use native load-status events rather than screen-local preload races.
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
- Mastered words return to ordinary Hunt play as marked revisits. They stay out of the Boss slot and Returning Haunt reservation, but are mixed into the tension and panic pools so mastery changes a word's status without deleting its visible REALs. `isMasteredReturn` marks these ordinary returns; `isMasteryRematch` is legacy compatibility only and is no longer generated.

#### Scoring

- Score sources are `realMaskPoints`, `trapMaskPoints` and `mysteryMasteryPoints` in
  `polyRunEngine.ts`. `addBonusScore()` is exported and wired into the store but has no caller
  anywhere in `app/` — treat as dead.
- `realMaskPoints`' isRare 300-point tier has no data behind it: zero of the 908 visible REAL
  masks carry isRare.
- `FEATHER_MILESTONES` fires for FX only. The old score-to-extra-life conversion was
  deliberately removed as regressive and stays removed.
- `ranks.ts` uses the current absolute ladder: D 0, C 3,000, B 6,000, A 9,000, S 11,500,
  MASTER 14,000. The ladder was retuned against the current 197-word corpus and observed
  flawless-run ceiling; rank remains a per-run skill verdict, not long-term Vault progress.

### Vault

- The Vault's headline is visible REAL meanings claimed (`realMaskIdsFound`, a count with no
  denominator); personalBest and the rank letter are secondary, accessible through the run-rank
  link rather than the bookplate identity. Books represent words, plain once any visible REAL is
  found and finished once all visible REALs are claimed. A banished Haunt leaves the active ghost
  queue, but a permanent Haunt-clear history entry is not yet part of the Vault.

### Daily

- Daily is a deterministic, one-attempt-per-date, five-round UP-only mode with two Chances.

### Audio

- Audio lifetime is app-owned. `App.tsx` warms the shared audio session and forwards app
  foreground/background changes to `MusicEngine`; Hunt and Daily only claim music ownership
  while focused and do not create or destroy shared SFX during navigation transitions.
- `sfx.ts` loads effects on demand from their real source files. Each effect has at most two
  players for legitimate overlap, a small pending queue, native `playbackStatusUpdate`
  readiness, and teardown-safe ownership. It does not eagerly create every SFX player at boot.
- `MusicEngine.ts` owns one persistent looping player, switches tracks by focused owner,
  resumes after app backgrounding, and restarts a new Hunt from the beginning. Track loading
  has a bounded fallback, but normal playback is released by native status events.
- Polly's ordinary laughs, boss hidden-failure laugh, Returning Haunt final laugh, and the
  Hunt-loss Results chuckle are separate event beats. The Hunt-loss chuckle is requested by
  `ResultsScreen` with cooldown bypass so an earlier Polly laugh cannot suppress it; do not
  remove or merge that sound without an explicit product decision.
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
  memory, and whole-image motion. All four live perches (Home, Hunt, Daily, Results) render
  a single flat pose.
- A layered face rig exists behind a `__DEV__` gate only: `PollyFaceRigDevViewer` in Settings,
  driving `assets/images/polly/rig2/*.png` (base, crown, beak, eye, brow, feet, far wing,
  tail). Device-confirmed for blink, brow, crown tilt and breathe. The brow rides the blink
  at BROW_FOLLOW 0.33, device-confirmed; that value must travel with the rig when it is wired
  live — it currently exists only in the dev viewer. It is not wired to any live screen. Pete
  approved reviving the layered approach on 2026-08-27, overriding the "do not revive" note in
  `assets/images/polly/rig/README.md`.
- `assets/images/polly/rig/` (the old rig), `PollyRig.tsx`, `pollyPerformances.ts`,
  `pollyRigParts.ts`, `PollyActor.tsx`, `PollySprite.tsx`, `usePollyAnimator.ts`,
  `pollyAnimations.ts` and the six `polly_*.webp` files are dead — nothing imports them.
  `PollyActor.tsx` still defaults to `renderer: 'rig'`, which contradicts that README.
  Do not delete `polly_shocked.png`, `polly_angry.png` or `polly_pointing.png`: they are
  also referenced by live `pollyPoses.ts`.
- `sprite4.png` is the master pose for layered work. Other poses map onto it by beak width:
  sprite2 ×1.000, sprite5 ×0.883, sprite7 ×0.883. Use sprite7, not sprite5, as the
  open-mouth donor — same three-quarter head angle as sprite4.
- Perched, both of Polly's wings fold back toward the tail and point the same direction —
  never mirror the far wing.
- One-time Hunt, Boss, Haunt, and Vault explainers use separate AsyncStorage gates. Hunt,
  Boss, and Haunt block play; Vault does not.
- Theme/material tokens live under `app/ui/`; current render code outranks abandoned plans.

## Services and Boundaries

- `playtestTelemetry.ts` stores local playtest events and exposes manual share/clear in
  Settings; it does not transmit data.
- Daily reminders are optional local notifications, off by default.
- Preserve all stashes. Do not merge `play-screen-overhaul` into `main` without approval.
