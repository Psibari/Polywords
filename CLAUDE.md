# POLYWORDS Architecture

`AGENTS.md` owns authority and workflow. This file holds durable architecture and the rules
that keep it working. Current state, branches and open work live in `CONTEXT.md`. Code and
data outrank every doc; verify before you rely on a line here.

> Never write a number `npm run state` can print (words, boss words, hidden pairs, REAL
> masks, traps, gpsTag pools, Daily pool size, Polly line counts). Run it instead.

## Source Map

| Area | Owner |
| --- | --- |
| Hunt rules, scoring, results, first-run onboarding | `docs/GAME_REFERENCE.md` |
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
  `FEATHER_MILESTONES`/`consumeFeatherMilestone()` are read by nothing, `streakMilestone`
  (3/5/7) is written but read by nothing (`consumeMilestone()` has no caller), and no content
  carries `isRare`.
- Momentum: four tiers on `chainMultiplier` — STEADY 1.0×, SHARP 1.5×, RAZOR SHARP 2.0×,
  UNTRAPPABLE 2.5×+ (cap 3.0×). The HUD label (`resolveReadTier`), swipe SFX pitch
  (`CHAIN_TIER_SFX_RATE`) and music rate/volume (`HUNT_MOMENTUM_RATE`) share those
  boundaries. A broken chain flashes FELL OFF (`fellOffSeverity`) before STEADY.

### First-run onboarding (LOCKED, Pete, device-approved 2026-09-28)

Player-facing flow and copy: `docs/GAME_REFERENCE.md`. Merged into `play-screen-overhaul` at
`af72a0e`.

- One versioned state, `FirstRunOnboardingState` (`firstRunOnboarding.ts`), saved under
  `ONBOARDING_STATE_KEY` at `ONBOARDING_VERSION` 1. A version mismatch hydrates to defaults,
  which would re-run onboarding for every player, so new fields get hydrate-time defaults and
  the version stays put. `INTRO_SEEN_KEY` is only a migration source for installs that saw
  the retired fake-card intro; the old intro component has been removed.
- Home: the first-ever Home plays Polly's four lines through `PollyHomePerch` (no modal), then
  `HomeScreen` glows HUNT once.
- The first Hunt (`coreCompleted` false) is 8 gentle rounds opening on FINE with pinned masks
  (`FIRST_RUN_FINE_MASK_IDS`: guided REAL, guided TRAP, first unaided). It is the real mounted
  board with real scoring and feedback; `FirstRunHuntOnboarding.tsx` only presents. Phases live
  on `activeRun`: recognition, challenge, guided-real(-result), guided-trap(-result), unaided,
  complete.
- The active Hunt is authoritative. `reconcileOnboardingRun` (every game change, and resume)
  only moves the phase forward from committed swipes and `stepIndex`, so resume never replays a
  scored decision. `finishedRunSeed` stops it rebuilding a closed run (the Hunt keeps
  `onboardingMode` for life); without it the hand-off came back on the next swipe (`46ffc6d`).
- Direction limits come from `resolveOnboardingInputMode` (`up-only`, `right-only`, `locked`)
  through MaskBoard's `inputMode` → `externalInputLocked` → SwipeMask `disabled`. A locked board
  hides its cards from screen readers and offers no actions.
- First Hunt Replay (Settings, `replayRequested`) re-runs only the FINE opening on the next new
  Hunt. It never resets the Boss or Haunt one-time gates, or the HUD lessons.

HUD lessons teach a HUD element the first time the player lives the event behind it. There is
no HUD tour, and the old automatic feather beat at the end of FINE is retired.

- `resolveHudLesson` returns one lesson or null, priority multiplier → feather → streakBreak →
  progress; never on a Boss or Returning Haunt word, never once the Hunt is over.
  `resolveOnboardingInputMode` returns `locked` whenever it is non-null, so the lock lands in
  the same render as the triggering swipe. Never lock through `gameplayGateActive`: it
  unmounts `GameContent`.
- State is `hudLessons` on the onboarding state, not on `activeRun` (cleared at hand-off): four
  flags that only go false → true, set when a lesson fully finishes (Polly included), plus
  `featherPendingRunSeed`/`streakBreakPendingRunSeed`. Saves without `hudLessons` hydrate as
  all done when core onboarding is complete, so established players are never tutorialized.
- Feather and streak break are events: `fellOffSeverity` is cleared by the HUD within about
  0.4 s. `captureHudLessonEvents` records them in the store's decision actions with both Hunt
  states. A loss is a new mistake on the same word, which counts Mercy (lives rise in the same
  update) and excludes fatal losses. Multiplier and progress are derived from saved state.
  `streakMilestone` is not a trigger.
- The progress lesson is the FINE hand-off: `completeHudLesson('progress')` closes the run, so
  word 2's card stays hidden and locked until it ends. A resume inside the hand-off keeps it
  open for an untaught lesson; a run that already has it (a Replay) gets the short ONE WORD
  DOWN banner.
- `HudLessonLayer.tsx` is the one spotlight, in `GameDirector` at zIndex 300 (above the pause
  button, below BossIntro and ExitConfirm). It waits the lesson's `settleMs`, measures the live
  target and itself with `measureInWindow`, draws four scrim rects, a ring and an arrow
  (`resolveHudSpotlightGeometry` in `hudLessons.ts`), waits for a tap (armed after 450 ms),
  then plays Polly's line, then records the lesson. Targets are refs `GameDirector` passes to
  `TopBar`: the feather row, a plain wrapper around the streak control (the control itself
  pulses and shakes), and the RoundChips row, all `collapsable={false}`. If measuring fails 12
  times the panel shows over a full scrim so the Hunt never stays locked.
- While a lesson is due: reactive Polly visits are suppressed and dropped (`dismissVisits`),
  the 15 s idle/static music timer is paused, and the response clock restarts when the card
  unlocks (`huntDecisionClock.ts`), so hold time never counts. iOS gets
  `accessibilityViewIsModal`; Android hides the HUD, board and pause button. Reduce Motion
  drops only the fade.

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
- It opens directly into the book. The stale one-time archive explainer was removed on
  2026-09-30; do not restore an intro unless a new player problem justifies one.

### Daily (castle)

Deterministic, one attempt per date, five UP-only rounds, two lives. Rules and the full
sequence are in `docs/DAILY_CHALLENGE_SPEC.md`. Rebuilt as the castle on `daily-castle-test`,
merged into `play-screen-overhaul` on 2026-09-27.

- One scene, `DailyCastleStage.tsx`, behind entry, play and Results. `castle_cartoon.png` and
  `answerwall_framed.png` share one 1290 × 2796 canvas, drawn full width and bottom-anchored
  as one piece; never position either alone.
- **Castle: LOCKED (Pete, 2026-09-27), colour included.** Cartoon art to match Polly (Pete, 2026-09-26), in the hero book's cover purple
  (Pete, 2026-09-27: its last step retints the stone from `hero-book-rig-v1/cover-outer.png`;
  the answer blocks' face is that purple too). `build_daily_castle.py` builds
  it from `tools/art/source/castle_cartoon_src.png`: gold trim (caps, ropes, step edges) remapped to white, arch
  centred, straight sides stretched for the clue planks, opening cut out, measurements
  printed, floor retinted to Pete's mock (`FLOOR_TARGET`). It also writes
  `castle_cartoon_gold_flash.png` (the trim in gold, clear elsewhere), which the gold hit
  lights (below). The old painted `ARCHNEW.png` is deleted.
- **Tunnel: LOCKED (Pete, device-approved 2026-09-27; re-locked with the castle's purple and
  gold light the same day).** Cartoon like the rest: `build_daily_tunnel.py` draws
  stepped stone rings in the castle's purple at the opening's exact size, narrowing to a far
  opening lit gold (Pete, 2026-09-27) at the
  throw's end point (`DAILY_CASTLE_FLIGHT.end`); move both together. Don't change it without
  Pete reopening it.
- **Answer wall: LOCKED (Pete, device-approved 2026-09-26).** Pete's cartoon design, drawn by
  `build_daily_answer_wall.py`: slate-violet frame with strong lit and shadow edges and black
  outlines, no cracks; each panel is black mortar with three block recesses (since 2026-09-27). It prints the
  sill's foot colour; `DAILY_ANSWER_WALL_FOOT` must match it. Don't change it without Pete
  reopening it.
- The clues sit centred in the door (Pete, 2026-09-26), so the gate position is per phone:
  `resolveDailyClueTop(frame, hudBottom)` picks the first plank's canvas y between
  `DAILY_CLUE_TOP_MIN` (216: above it the arch is too narrow for the 176 pt clue box) and
  `DAILY_CLUE_TOP_MAX` (the planks end above the steps and the gate still covers the crown),
  centred unless the HUD would cover it. The gate helpers (`dailyGateClosed`,
  `dailyGateLineY`, `dailyGateOpenTravel`, `dailyGateMaxSink`, `resolveDailyGateClueRects`)
  take that clue top. The scene only drops when even `DAILY_CLUE_TOP_MAX` is under the HUD.
- **Door and clues: LOCKED (Pete, device-approved 2026-09-26).** `gate_door.png` from
  `build_daily_door.py`: cartoon indigo planks in Pete's tint (x1.45 since the castle went
  dark, 2026-09-27; the popped block's top face shares it), dark 2.5 pt seams, two iron
  straps off the clue planks. Planks are 52 pt; clues capped at 20 pt, split into two even
  lines (`balanceDailyClue`). Never gold seams (too busy). Don't change the door, its tint,
  the seams or the clue size without Pete reopening it. The castle has three steps: the build
  script removes the top one and extends the door into its place.
- **Answer blocks: LOCKED (Pete, device-approved 2026-09-27).** Flush in the wall, marked only by white mortar (gold until Pete, 2026-09-27)
  (`answerplaque_stone.png`); pressed, the block pops out and `answerblock_top.png` grows
  above it (`DailyAnswerCard`); pulled or wrong, it leaves the recess cut into the wall art.
  New rounds slide into the recesses (`DailyCastlePlaqueSlot`). With no blocks in play
  (entry, Results) the stage draws six blank blocks. The blocks fill their panels one
  `DAILY_ANSWER_MORTAR_PX` in: the wall script cuts the recesses by the same rule. Don't change
  their look or behaviour without Pete reopening it.
- The action label is placed from the screen bottom, not the inset (absolute children
  ignore the SafeAreaView's padding): `dailyActionLabelBottom` (10 pt, 4 pt with no home
  bar, so a 375 x 667 phone fits) is shared by the label and the grid's clearance.
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
  gate is down. Win: blank gate, white coins sink, the gold coin rises, then the coin finale
  (below) before Results.
- **Gold hit: LOCKED (Pete, device-approved 2026-09-29).** The castle lights gold the moment
  a correct claim is confirmed: `handleClaim` bumps `goldHitToken` beside `correctClaim`, and
  `DailyCastleStage` runs the hit on its own progress value, separate from the thrown
  block's `flightProgress`, so it also plays under Reduce Motion and with no measured throw.
  Back to front: a `coin_glow.png` bloom behind each tower cap, the gold trim, then the trim
  again tinted `#F5C842` at runtime (the art is untouched). Full motion: 100 ms ignition
  with one small overshoot (tint and glow; the bloom swells 0.8 → 1.12 → 1.0), 200 ms hold,
  400 ms fade: 700 ms, over before the next round's gate comes down. Reduce Motion or
  Reduce Flashes: the same gold and glow, 200 / 150 / 400 ms, no swell or overshoot. Every
  layer rests at 0. Timing, keyframes and cap/bloom positions are in `dailyCastleScene.ts`
  (`DAILY_GOLD_HIT`, `dailyGoldHitKeyframes`, `DAILY_CASTLE_CAPS`, `DAILY_CASTLE_CAP_GLOWS`).
  Don't change it without Pete reopening it.
- **Gold-coin finale: LOCKED (Pete, device-approved 2026-09-29).** The win's reward, after
  the gold hit and the gold coin's normal floor rise. One progress value
  (`coinFinale`, steps 0–5 in `DAILY_COIN_FINALE_STEPS`) drives the floor coin's hand-off
  (`DailyFloorCoins`) and the hero (`DailyCoinFinale.tsx`, a screen-level layer at zIndex 3,
  over the castle, HUD and Polly). Full motion, from landing: 300 ms rest on the floor, 520 ms
  flight toward the player (it grows and turns face-on, the scene dims to 42%), one 106%
  overshoot settling over 200 ms, an 800 ms hero hold with one 440 ms glint at its start, a
  220 ms fade. The `mastered` chime and `mastery` Success haptic fire at hero arrival, once,
  from `runGoldCoinFinale`. Results waits for the finale's end. Reduce Motion: no flight,
  zoom, turn or overshoot; the floor coin crossfades (360 ms) to the hero in place, 900 ms
  hold, 220 ms fade. Reduce Flashes: no glint. The floor rest stretches when needed so lift-off
  waits for the gold hit to end (`dailyCoinFinaleFloorHoldMs`); they never overlap.
  - The hero is drawn in code from `build_daily_coins.py`'s recipe (ring, edge, enamel,
    `feather-gold-reward.png`, `coin_glow.png`), not by stretching `coin_gold.png`: that art
    is the coin at the floor's angle with an upright feather, which stretches ~1.9x face-on.
    Tilted back to the floor's angle the hero matches it, which is where it takes over.
  - Continuity: once the coin leaves the floor, the floor coin stays hidden through the hero's
    fade and behind Results. After a win the value rests at gone
    (`dailyCoinFinaleRestingStep`); it returns to 0 only when a new session goes active
    (`dailyCoinFinaleResetsFor`), with the gold coin sunk. Reopening an already-won Daily
    still shows the gold coin on the floor as the completed-state marker.
  - Timing, keyframes, geometry and colours are in `dailyCoinFinale.ts`, covered by
    `dailyCoinFinale.test.ts`. Don't change it without Pete reopening it.
- `DailyFloorCoins.tsx`: every coin owns its own Animated values for life; unearned coins
  wait sunk at the spot they first appear.
- Polly perches on the left tower under the HUD (`hudBottom`); her bubble sits on the steps
  (`DAILY_POLLY_BUBBLE`, `tail='up'`) and waits `dailyThrowGoneMs` after a correct claim.
- Derived art is built by scripts in `tools/art/` (door, castle, plaque, answer wall,
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
- The words are the game; Polly is the pressure. She mixes convincing traps among real
  meanings, betting she can make the player doubt what they already know. POLYWORDS system
  text explains mechanics; Polly adds one short jab after a meaningful moment and never
  teaches. Detail: `docs/POLLY_DIALOGUE_BANK.md`.
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
- First-run onboarding is one versioned state (see Modes); the Boss and Returning Haunt
  explainers are separate one-time overlays with their own AsyncStorage gates.
- `playtestTelemetry.ts` is local only; Daily reminders are optional local notifications.
- Theme/material tokens live in `app/ui/`; render code outranks abandoned plans.
- Preserve all stashes. Never merge `play-screen-overhaul` into `main`, or a branch into
  `play-screen-overhaul`, without Pete's approval.
