# POLYWORDS Architecture

`AGENTS.md` owns authority and workflow. This file holds durable architecture and the rules
that keep it working. Current state, branches and open work live in `CONTEXT.md`. Code and
data outrank every doc; verify before you rely on a line here.

> Never write a number `npm run state` can print (words, boss words, hidden pairs, REAL
> masks, traps, gpsTag pools, Daily pool size, Polly line counts). Run it instead.

## Source Map

| Area | Owner |
| --- | --- |
| Hunt rules, scoring, results | `docs/GAME_REFERENCE.md` |
| Hunt pacing | `docs/GOLDEN_PACING_SYSTEM.md` |
| Hunt editorial law | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily gameplay, castle sequence | `docs/DAILY_CHALLENGE_SPEC.md` |
| Daily editorial writing | `docs/DAILY_CONTENT_WRITING_STANDARD.md` |
| Polly voice | `docs/POLLY_DIALOGUE_BANK.md` |
| Polybook screen | `docs/POLYBOOK.md` |
| Visual system | `DESIGN.md`, `app/ui/` |
| Patch workflow | `docs/WORKFLOW.md` |

## Runtime

- Expo SDK 57, React Native 0.86 (New Architecture), strict TypeScript.
- Zustand + immer own state; AsyncStorage owns persistence.
- React Native Animated for most motion; Reanimated owns the finger-tracked cards
  (`SwipeMask.tsx`, `DailyAnswerCard.tsx`). Transform/opacity may use the native driver;
  layout/colour may not.
- Bebas Neue is the hero face; Barlow Condensed is the UI/tile/dialogue face.
- `expo-audio`: `MusicEngine.ts` owns the one persistent music player, `audioSession.ts` the
  app-wide session, `sfx.ts` on-demand SFX players (two per effect, small pending queue,
  native load-status events).

### Native rules (learned on device; the browser preview hides all of them)

- Never swap a native-driven transform between an Animated node and a plain number across
  renders. The view keeps the last value the native driver wrote. Keep it bound to a value.
- A layout-only View can be flattened on native, letting its children's zIndex compete with
  its siblings. Give a stacking container `collapsable={false}` and its own zIndex.
- An absolutely placed child's `100%` size resolves inside the parent's padding on native.
  Containers that hold full-size art carry no padding.
- A bundled image with only `absoluteFill` can take the file's pixel size. Pass explicit
  width/height.
- A View with a huge borderRadius is a hard-edged pill, not a soft glow. Use an image.
- A JSX branch that changes shape remounts its node; an animation on the old node silently
  does nothing.

### `wallShake.ts`

A module-level channel for shaking the stone wall (`GraphicGround`, behind Home, the Polybook,
Settings and every Hunt round). `wallTremble` and `wallKick` are linear 0 → 1 timings read
through a zigzag interpolation whose envelope is 0 at both ends. Consumers use
`wallShakeTransform()`/`wallShakeOffset()`, never re-derive the oscillation, and **must call
`resetWallShake()` on unmount**. Never scale the wall: `bossGauntletLedge.ts` derives the
brick ledge from the wall at full width, bottom-anchored.

## Modes

`App.tsx` registers Home, Game, Vault (the Polybook), Settings and Daily. Active Hunt and
Daily play are nav-free.

### Hunt

- `huntGenerator.ts` builds the only arc: 10 rounds, 8 for the first three fledgling runs.
  Polly's Word is last; the Returning Haunt slot is round 5 (4 fledgling) and is never boss UI.
- UP claims a REAL, RIGHT rejects a trap. A wrong choice costs one of six feathers and resets
  the chain. Up to five visible masks per word.
- Boss: survive the visible word, then three hidden gauntlet cards, picked, opened and judged
  one at a time. All three correct = MASTERED; any miss or death = HAUNTED. `bossOutcome` is
  authoritative; score never decides mastery.
- A Returning Haunt re-tests the exact hidden pair that won. Mastered words return to ordinary
  tension/panic play flagged `isMasteredReturn` (the HUD shows MASTERED RETURN), never as Boss
  or Haunt. `isMasteryRematch` is legacy only.
- Scoring (`polyRunEngine.ts`) is computed and stored but shown nowhere; rank is retired
  (`ranks.ts` is imported by nothing). Dead: `addBonusScore()` has no caller,
  `FEATHER_MILESTONES`/`consumeFeatherMilestone()` are read by nothing, and no content carries
  `isRare`.
- Momentum: four tiers on `chainMultiplier` — STEADY 1.0×, SHARP 1.5×, RAZOR SHARP 2.0×,
  UNTRAPPABLE 2.5×+ (cap 3.0×). The HUD label (`resolveReadTier`), swipe SFX pitch
  (`CHAIN_TIER_SFX_RATE`) and music rate/volume (`HUNT_MOMENTUM_RATE`) share those
  boundaries. A broken chain flashes FELL OFF (`fellOffSeverity`) before STEADY.

### Boss gauntlet entrance (`BossGauntletSpines.tsx`)

- Sealed cards are bricks that punch out of the wall. Each sprite
  (`gauntlet/brick{1,2,3}_rn.png`) carries bottom padding equal to its top face so the
  centre-origin rotation lands on the front face. Never trim or swap the padding;
  `BRICK_SPRITES` hardcodes each sprite's dimensions.
- `CARD_CLOSED_HEIGHT` is derived from that table; never type it in.
  `GAUNTLET_CARD_OPEN_MIN_HEIGHT` is the opened card's floor, a different thing.
- Brick sprites are colour-matched per brick to the wall brick each replaces, never averaged.
- The wall art is never cut: the three holes are an overlay the gauntlet owns.

### Boss outcome (LOCKED, Pete, device-approved 2026-09-01; music rule 2026-09-08)

- `HeroBook.tsx` `variant` (`neutral | mastered | haunted`) swaps three 3-piece rigs on one
  shared canvas and hinge. `MaskBoard.tsx` `triggerBossOutcomeSlam` drives one continuous
  open → transform → close. The boss headword is one `Animated.Text` whose colour comes from
  the variant; the wrong-swipe red mixes into that same node.
- Pacing, SFX and haptic beats are tuned constants in `MaskBoard.tsx`/`useBoardMechanics.ts`.
  Boss result plaques are `assets/images/results/*-result-plaque.png` (see that README).
- `MusicEngine.setBossOutcomeMusicSilenced()` makes boss music fully silent through either
  outcome. Do not retime the choreography or restore music without Pete reopening it.
- Returning Haunts do not use this package.

### Polybook (the Vault route)

- `PolybookSpread.tsx` is the screen, behind `VaultScreen`'s `POLYBOOK_SPREAD_ENABLED` (on).
  Modules: `pollyMood.ts` (run stamp, rivalry state), `bookPage.ts` (day buckets, line
  choice), `bookLog.ts` (one `BookDayRecord` per day), `pollyBookLines.ts` (authored copy,
  transcribed from `docs/POLLY_POLYBOOK_LOG_LINES.md` only).
- Never display a meaning, a trap or a hidden pair here: words recur, so it would be an answer
  key. Counts, status and titles only.
- `LexiconPrototype.tsx`/`Bookcase.tsx` (the pre-Polybook screen) render only with the flag
  off. Deleting them is Pete's call.
- Naming collision, not fixed: the nav tab says "Polybook" and so does the in-round book's
  spine in `MaskBoard.tsx` (style `vaultLabel`). Renaming either is Pete's call.
- The Polybook is Polly's book, kept in the old Vault; the player reads it (Pete, 2026-09-26).

### Daily (castle)

Deterministic, one attempt per date, five UP-only rounds, two Chances. Rules and the full
sequence are in `docs/DAILY_CHALLENGE_SPEC.md`. Rebuilt on branch `daily-castle-test`
(see `CONTEXT.md`).

- One scene, `DailyCastleStage.tsx`, behind entry, play and Results. `castle_cartoon.png` and
  `answerwall_framed.png` share one 1290 × 2796 canvas, drawn full width and bottom-anchored
  as one piece; never position either alone.
- The castle is cartoon art to match Polly (Pete, 2026-09-26). `build_daily_castle.py` builds
  it from `tools/art/source/castle_cartoon_src.png`: golds remapped to the game's, arch
  centred, straight sides stretched for the clue planks, opening cut out, measurements
  printed. The old painted `ARCHNEW.png` is no longer drawn; the tunnel and answer-wall scripts
  still read it until they go cartoon too.
- The clues sit centred in the door (Pete, 2026-09-26), so the gate position is per phone:
  `resolveDailyClueTop(frame, hudBottom)` picks the first plank's canvas y between
  `DAILY_CLUE_TOP_MIN` (216: above it the arch is too narrow for the 176 pt clue box) and
  `DAILY_CLUE_TOP_MAX` (the planks end above the steps and the gate still covers the crown),
  centred unless the HUD would cover it. The gate helpers (`dailyGateClosed`,
  `dailyGateLineY`, `dailyGateOpenTravel`, `dailyGateMaxSink`, `resolveDailyGateClueRects`)
  take that clue top. Planks are 52 pt: two lines of 24 pt, exactly. The scene only drops
  when even `DAILY_CLUE_TOP_MAX` is under the HUD. The castle has three steps: the build
  script removes the top one and extends the door into its place.
- Every measured coordinate lives in `app/ui/dailyCastleScene.ts` beside its pixel
  measurement (opening, gate planks, clue rects, plaque grid, throw, coins, Polly's bubble),
  covered by `dailyCastleScene.test.ts`. Re-measure if an export changes.
  `dailyCastleLayout.ts` is the older registration; only a width fallback in
  `DailyAnswerCard` still reads it.
- Stacking: the stage is outside the SafeAreaView (its art is registered to the full screen
  and the throw origin comes from `measureInWindow`). Stage root `collapsable={false}` at
  zIndex 1; the SafeAreaView (`box-none`, HUD, Polly, labels, cards, Results) at zIndex 2.
- Text fits by measured advance widths, not `adjustsFontSizeToFit` (the web ignores it):
  clues via `fitDailyClueFontSize`, block labels via `fitDailyAnswerFontSize`. Tests fit
  every clue and candidate in the live pool.
- Correct claim: gate lifts, the block is drawn twice on one progress value (in front of the
  castle, then behind the gate line) and flies down the tunnel; the gate drops with the next
  round on it while a floor coin rises (`DailyCoinRise.token`). Input stays locked until the
  gate is down. Win: blank gate, white coins sink, the gold coin rises, then its presentation
  (`coinCelebrate`: glow, pop, `mastered` chime, Success haptic) and a hold before Results.
- `DailyFloorCoins.tsx`: every coin owns its own Animated values for life; unearned coins
  wait sunk at the spot they first appear.
- Polly perches on the left tower under the HUD (`hudBottom`); her bubble sits on the steps
  (`DAILY_POLLY_BUBBLE`, `tail='up'`) and waits `dailyThrowGoneMs` after a correct claim.
- Derived art is built by scripts in `tools/art/` (gate recolour, plaque, answer wall,
  tunnel, coins and glow). Rerun the script, never hand-edit its output, and delete the
  `__pycache__` it leaves. The wall script asserts the wall is opaque.

## Audio and Haptics

- Audio lifetime is app-owned (`App.tsx` warms the session and forwards foreground/background
  to `MusicEngine`); screens claim music only while focused.
- Loudness is part of the asset: `player.volume` can't exceed 1.0. Peak-normalize near -1 dB
  and balance with the multiplier; measure the file before debugging the player.
- Gauntlet entrance: `stoneRumble` under the tremble, then one `stoneTear{n}` and one
  `stoneLand{n}` per slot by index. The three land names share one config (`STONE_LAND_SFX`)
  so their overlapping landings aren't capped. The land fires from the same callback as the
  landing dust. `warmGauntletEntranceSfx` runs from `BossGauntletSpines`.
- `cueAsync` in `app/utils/haptics.ts` is the only haptic gateway (preference-gated). Heavy is
  the ceiling and belongs to boss beats; routine cues climb by rhythm, not force.
- Polly's ordinary laughs, boss laugh, Returning Haunt laugh and the Hunt-loss Results chuckle
  (requested by `ResultsScreen` with cooldown bypass) are separate beats. Don't merge them
  without a product decision.

## Content and Data

- `assets/data/huntData.json` is the live Hunt bank and outranks every workbook and tool.
- `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` is editorial staging; runtime changes need an
  explicit additive merge. Dated `..._LOCKED.xlsx` batch workbooks live beside it.
  `tools/content/import-workbook.mjs` captures all three hidden pairs per boss word
  (`ca887d0`); `runtimeHuntValidation.mjs` enforces exactly three.
- Word and mask IDs are persistence contracts. Never renumber existing content.
- `workbooks/POLYWORDS_Daily_Challenge_60_LOCKED_2026-08-28.xlsx` is the Daily source;
  `app/game/dailyPool.ts` is its runtime form.
- Retired: `assets/data/huntData.v2.json`, `tools/content/_deprecated/mask-rewriter/`.

## Polly

- Polly authored the traps; she is not a word thief and never owns or steals meanings (Pete,
  2026-08-29). "My traps remember you" is the voice.
- Live Polly is flat pose art (`assets/images/polly/poses/`) with whole-image motion. The
  layered face rig (`PollyPerchRig.tsx`, `rig2` layers) renders only when she is settled in
  the sprite4 idle pose on Home, Daily and Results; rollback is `POLLY_PERCH_RIG_ENABLED`.
  The Hunt perch is not wired because `VisitSpec` has no face field separate from
  `perchPose`. The rig's `mouth`/`eye`/`brow` variants exist only in the dev viewer.
- New face parts are painted directly on `sprite4.png`, changing only the target feature;
  check for see-through gaps inside a part. Shocked = wide eye + shocked brow + closed beak.
- `POLLY_POSE_SCALE` (`pollyPoses.ts`) normalises pose size to sprite4. Measure by crown
  width, or figure height when the head tilts. Apply it on the Image, never on the
  native-driven parent. `rattled` and `asleep` are whole-pose art, not rig-compatible.
- Hunt lines rotate through `pickFreshLine` (`pollyVisitPolicy.ts`, RN-free so it runs under
  node). `VisitSpec.exitPose` uses an inline union for the same reason.
- Perched, both wings fold back toward the tail; never mirror the far wing.
- Dead, imported by nothing live: `PollyActor.tsx`, `PollyRig.tsx`, `ui/PollySprite.tsx`,
  `usePollyAnimator.ts`, `app/animations/polly*`, `assets/images/polly/rig/` and the six
  `polly_*.webp`. Keep `polly_shocked.png`, `polly_angry.png`, `polly_pointing.png`: live
  `pollyPoses.ts` uses them.

## Services and Boundaries

- App-wide `ErrorBoundary.tsx` wraps the navigator; its fallback uses system fonts only.
- One-time Hunt, Boss, Haunt and Vault explainers use separate AsyncStorage gates.
- `playtestTelemetry.ts` is local only; Daily reminders are optional local notifications.
- Theme/material tokens live in `app/ui/`; render code outranks abandoned plans.
- Preserve all stashes. Never merge `play-screen-overhaul` into `main`, or a branch into
  `play-screen-overhaul`, without Pete's approval.
