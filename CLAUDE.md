# POLYWORDS Architecture

`AGENTS.md` owns authority/workflow. `CONTEXT.md` owns current branches, priorities and open work.
Focused product rules live in `docs/`. Runtime code/data outrank every doc.

> Never write a count `npm run state` can print. Counts rot; the command does not.

## Source Map

| Area | Owner |
| --- | --- |
| Hunt rules, scoring, onboarding | `docs/GAME_REFERENCE.md` |
| Hunt pacing | `docs/GOLDEN_PACING_SYSTEM.md` |
| Hunt editorial law | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily gameplay/castle | `docs/DAILY_CHALLENGE_SPEC.md` |
| Daily editorial law | `docs/DAILY_CONTENT_WRITING_STANDARD.md` |
| Polly voice | `docs/POLLY_DIALOGUE_BANK.md` |
| Polly relationship | `docs/POLLY_RELATIONSHIP_MEMORY_V2.md` |
| Polybook | `docs/POLYBOOK.md`, `docs/POLYBOOK_LIVING_JOURNAL.md` |
| Visual system | `DESIGN.md`, `app/ui/` |
| Workflow | `docs/WORKFLOW.md` |

## Runtime

- Expo SDK 57, React Native 0.86 New Architecture, strict TypeScript.
- Zustand + immer own state; AsyncStorage owns persistence.
- React Native Animated handles most motion; Reanimated owns finger-tracked cards.
- Bebas Neue is the hero face; Barlow Condensed is UI/tile/dialogue.
- `MusicEngine.ts` owns persistent music; `audioSession.ts` owns the app audio session;
  `sfx.ts` owns on-demand SFX players.

### Native rules learned on device

- Never swap a native-driven transform between an Animated node and a plain number across renders.
- Stacking containers that must survive native flattening use `collapsable={false}` + zIndex.
- Full-size art containers carry no padding; give bundled absolute images explicit dimensions.
- Huge `borderRadius` is not a soft glow. Use art.
- JSX shape changes remount nodes; animation on the old node silently dies.
- A rig-or-Image either/or that mounts fresh image views on a pose switch draws an empty frame or
  two. Keep every pose layer mounted and switch by opacity.
- A one-time timer started at screen load cannot drive an arrival that happens later. Tie the
  pose switch to the end of the arrival animation.
- Pete's DEV RESET DAILY reuses the same perch instance; per-session state must reset when `show`
  turns true, not on mount.

`wallShake.ts` is the shared stone-wall shake channel. Consumers use its helpers and call
`resetWallShake()` on unmount. Never scale the wall; the Boss ledge derives from full-width,
bottom-anchored geometry.

## Hunt Architecture

- `huntGenerator.ts` builds 10-round standard and 8-round fledgling arcs. Polly's Word is final;
  Returning Haunt is round 5 / round 4 and never gets Boss presentation.
- UP claims a REAL; RIGHT rejects a trap. Six starting feathers. Up to five visible masks.
- Boss: survive visible masks, then judge three hidden cards one at a time. All three correct =
  MASTERED; any hidden miss or Boss death = HAUNTED. `bossOutcome` is authoritative.
- Returning Haunt re-tests the exact hidden pair that won. Mastered words may return only as
  ordinary tension/panic `isMasteredReturn` revisits, never Boss/Haunt candidates, with one
  exception: MASTER'S REMATCH.
- MASTER'S REMATCH: only when no unmastered word with hidden Boss content is left,
  `generateHunt` makes the final round a mastered boss word flagged `step.isMasteryRematch`
  instead of throwing. Hunts with an unbeaten boss word are unchanged. A rematch win adds no
  crown and no Polybook mastery; a loss creates no Haunt. A win still counts as beating Polly
  in `recordRunComplete` (streaks, mood).
- GPS arc: Confidence → Flow → Tension → Panic → Boss. `docs/GOLDEN_PACING_SYSTEM.md` owns the
  product rhythm; `huntGenerator.ts` owns executable pools/fallbacks.
- Runtime Hunt entries are validated before selection. Invalid difficulty/gpsTag, malformed or
  duplicate mask IDs, non-Boolean REAL/trap flags, missing swipe-direction coverage, or Boss
  entries without hidden content must fail loudly rather than silently disappear from pools.
- `assets/data/huntData.json` is the single live Hunt bank. The generator and every Hunt
  validation, audit and state tool consume it directly; parallel runtime override banks are not
  part of the architecture.
- Scoring is computed/persisted but player-facing nowhere. Rank is retired. Momentum is the live
  STEADY / SHARP / RAZOR SHARP / UNTRAPPABLE system with FELL OFF on a broken chain.

## First-Run Onboarding

Player-facing flow/copy: `docs/GAME_REFERENCE.md`.

- One versioned `FirstRunOnboardingState`; version mismatch must not casually re-tutorialize
  established players.
- First Home uses Polly's four-line perch intro and a one-time HUNT glow.
- First Hunt is the real 8-round board, opens on FINE, and pins guided REAL, guided TRAP and first
  unaided masks. No practice board.
- Active Hunt state is authoritative. Resume reconciles only from committed decisions.
- Direction limits flow through MaskBoard input mode to SwipeMask disabled state.
- Settings replay re-runs only the FINE opening; it does not reset Boss/Haunt/HUD lesson gates.
- HUD lessons teach feathers, momentum, broken run and Hunt progress only after the player lives
  the event. `HudLessonLayer.tsx` owns the spotlight and accessibility lock. Do not use
  `gameplayGateActive` for this because it unmounts gameplay.

## Boss Presentation

### Gauntlet entrance

`BossGauntletSpines.tsx` owns the three wall-brick cards. Sprite padding and derived closed-card
height are geometry contracts. Wall holes are an overlay; never cut the wall art.

### Outcome

`HeroBook.tsx` swaps neutral/mastered/haunted rigs on one canvas; `MaskBoard.tsx` owns the
continuous open → transform → close choreography. Boss outcome music stays fully silent through
both outcomes. Returning Haunts do not use this package.

MASTER'S REMATCH outcomes (timings first-pass, not device-confirmed):
- Lost (missed hidden card or ran out of feathers): BUSTER. Plain text, no plaque, book stays
  the neutral rig: MASTER shows, "MA" drops, "BU" lands. One punch as BU lands
  (`streakBreakImpact` + `fellOffSmall` haptic). Results label and share text read BUSTER;
  the Results line under it is "Bird brain" (Results only, not on the board).
- Won: KING drops in over MASTERED on the gold plaque. Results label and share text read KING.

## Polybook

- Vault route is Polly's book. Current architecture: closed physical book → one large portrait
  page, not the retired miniature two-page spread.
- Navigation: TODAY / JOURNAL / MASTERY on bottom forked ribbons, plus visible `< COVER` return.
- Never display a meaning, trap or hidden pair. Words recur, so that becomes an answer key.
- TODAY/JOURNAL/MASTERY interior behavior is owned by the Polybook docs. Do not duplicate its
  typography, pagination or visual tuning here.
- Old Lexicon rollback components remain until Pete decides to delete them.
- The nav tab and in-round spine both say POLYBOOK; renaming remains Pete's decision.

## Daily

Deterministic, one attempt per date, five UP-only rounds, two lives. `docs/DAILY_CHALLENGE_SPEC.md`
owns the sequence and device-approved castle behavior.

Architecture only:
- `DailyCastleStage.tsx` owns the persistent scene behind entry/play/results.
- Measured geometry and animation constants live in `app/ui/dailyCastleScene.ts`; re-measure when
  exported art changes rather than copying coordinates into docs.
- Derived castle/door/wall/tunnel/coin art comes from `tools/art/`; rerun scripts, never hand-edit
  generated output.
- Text fitting uses measured widths, not browser-dependent auto-fit behavior.
- Correct claim, gold hit and gold-coin finale are separate progress systems. Input stays locked
  until the gate settles; Results waits for the finale.
- Polly perch (`PollyDailyPerch.tsx`): she sits at the wall, in front of it, the whole time.
  `DAILY_POLLY_SCALE` (1.25) grows her from the base 150 pt box's bottom-left; the spot
  (`DAILY_POLLY_PERCH`) and bubble (`DAILY_POLLY_BUBBLE`, to her right, tail left, width capped by
  `screenMargin` 12 pt) are castle units in `dailyCastleScene.ts`.
- Arrival: when play starts she flies in from the top-left in `fly` (`DAILY_POLLY_ENTRY_*`) and
  switches to idle when the descent lands. Pose and flags reset every time `show` turns true.
- Every perch pose is a mounted layer switched by opacity (`PERCH_LAYER_POSES`, incl. `flyAngry`
  and `flyGrin`). Never conditionally mount or unmount pose images.
- End: after her last line she flies out (win `flyAngry`, loss `flyGrin`); Results waits for the
  fly-out (`DAILY_POLLY_EXIT_FAILSAFE_MS` 6 s safety release). The gate stays blank on a win during
  the hold; the board stays locked on a loss.
- The results view (also what an already-finished Daily opens to) shows Polly's pose only: no
  bubble and no remembered line (Pete). The perch is the only place the Daily line is said and
  remembered. On unmount the screen clears the in-memory claim result (`clearDailyReaction`),
  so leaving during the ending and returning does not replay her reaction or hold Results.

## Audio and Haptics

- App owns audio lifetime; screens claim music only while focused.
- Loudness is partly asset-level. Measure/normalize files before blaming player volume.
- `cueAsync` in `app/utils/haptics.ts` is the only haptic gateway; heavy belongs to Boss beats.
- A REAL claim (UP) and a trap rejection (RIGHT) have different haptic shapes, each climbing with
  the round's light/medium/heavy phase tier; tier-ups have three escalating shapes (SHARP,
  RAZOR SHARP, UNTRAPPABLE). `huntFeedbackPolicy.ts` picks the cue; shapes live in `haptics.ts`.
- Polly's short wrong-swipe squawk fires always when a real chain FELL OFF, otherwise on every
  third other wrong swipe. The count lives in `GameScreen` for the whole Hunt (reset per run),
  not in the board, which remounts per word.
- Polly's ordinary laugh, Boss laugh, Returning Haunt laugh and Hunt-loss Results chuckle are
  separate product beats. The Hunt-loss Results laugh is locked (Pete) and unchanged.
- Daily perch sound: silent on right answers and the winning claim; `pollySqwawkShort` on the
  first miss; `pollySqwawkLaugh` on the lost last chance. An explicit allow-list, so new reactions
  default to quiet.
- Do not guess what a sound is: `pollySqwawkShort` is the sound Pete calls "the laugh".

## Content and Data

- Live Hunt bank: `assets/data/huntData.json`.
- Editorial workbooks are staging only and never update runtime automatically.
- Word/mask/hidden-pair IDs are persistence contracts. Never renumber approved live content.
- Runtime validation is a shipping gate, not an editorial writer: it catches structural failures;
  Pete's approval and `docs/CONTENT_WRITING_STANDARD.md` decide whether copy is good.
- Daily runtime content is `app/game/dailyPool.ts`, governed separately from Hunt.
- Retired: `assets/data/huntData.v2.json`, `tools/content/_deprecated/mask-rewriter/`.
- Any change to `assets/data/huntData.json` must pass `npm run content:quality` against the real
  file before commit. A validator self-test passing is not evidence: FOAM/FOLD shipped below the
  3-trap minimum on 2026-08-31 that way.
- New tiles get fresh ids. Retired ids are never reused for different content.

## Polly Architecture

- Polly authored the traps. The words are the game; Polly is the pressure. She jabs, she does not
  teach. Voice law: `docs/POLLY_DIALOGUE_BANK.md`.
- Relationship Memory V2 is durable/reversible in the documented split: permanent progression is
  monotonic; current rivalry/form may move. Do not replace it with freeform LLM dialogue or a
  visible relationship meter.
- Life hierarchy: immediate gameplay event > relationship life profile > ambient idle. Logical
  profiles are neutral, cocky, watchful, rattled, hauntFocused; they are behavior policy, not
  saved progression labels.
- `PollyHomePerch` + `PollyPerchRig` + `usePollyAmbientMotion` are the current Home foundation.
  Rig 2 articulates face/crown but most body anatomy remains baked. Preserve device-approved
  `BROW_FOLLOW = 0.33`.
- Pose art is the master set (`assets/images/polly/master/`, 792x845, all face right), through one
  small table per screen: Hunt `app/ui/pollyHuntPoses.ts` (multiplier 1; falls back to
  `POLLY_POSES`/`POLLY_POSE_SCALE` only for rattled, idle, cocky); Results and Daily
  `app/ui/pollyScreenPoses.ts` (incl. `flyAngry`, `flyGrin`); Home `app/ui/pollyHomePoses.ts` plus
  the pure, tested `app/game/pollyHomeRestingPose.ts`. Idle and smug stay on the face rig (sprite4)
  on Results, Daily and Home: both point at the same `POLLY_POSES.idle` object, which the rig
  check compares against.
- Hunt visits: she flies in on `fly` (she cannot know who wins), except the Returning Haunt gloat,
  which flies in on `hauntTaunt`. Only the exit shows the result: mastery exits `flyAngry`; the
  Haunted gloat exits `flyGrin` but holds the perch, so that exit is rarely seen. Boss entry
  perches `point` (perchScale 1.05); mastery `angryYell`; Haunted gloat `hauntTaunt` (perchScale
  1.24); streak x10 `embarrassed`; two one-feather lines `laugh03`; laugh visits `bigLaugh`. Exit
  arc: +0.6 × screen width, -(screen height + 80), tilt -1 (nose-up), scale 0.86, `FLY_OUT_MS`
  500 / `FAST_EXIT_MS` 250. No Hunt visit sleeps; the Hunt looping-Z work was reverted.
- Home perch: 246 pt box; `POLLY_HOME_MASTER_SCALE` (1.07) matches master poses to the rig's
  resting size. Awake poses (rig, fly, embarrassed, angry) are mounted together and switched by
  opacity (`HOME_AWAKE_LAYER_POSES`). Post-win resting pose is master `angry` (closed beak), not
  `angryYell`; the rattled profile uses `embarrassed`. After the entrance settles, the resting pose
  and life profile follow LIVE memory; the greeting stays frozen. Home stays mounted under the
  Hunt; `enteredThisSession` limits the entrance to once per app session.
- Home's "back after an absence" look (watchful) relaxes after the first completed Hunt of the app
  session (`homeBeatForSession` with the in-memory `sessionStartRunsCompleted`; nothing saved). A
  Hunt quit from the pause menu is not recorded, so it does not count.
- Home sleep: master `asleep` plus three looping Z's (`HOME_Z_*`, native driver), running only
  while fully asleep, Home focused and motion allowed; Reduce Motion shows one still medium Z. She
  wakes only when Home loses focus; touches on Home do not wake her (Pete accepted).
- Do not delete the old sprites or `POLLY_POSE_SCALE` until every consumer has moved. Remaining:
  the three screen tables (`POLLY_POSES.idle`/`POLLY_POSE_SCALE.idle` for the rig; the Hunt's
  rattled/idle/cocky fallback); unrendered `PollyFlightLandingAnimation`,
  `PollyFlightLandingPrototype`, `PollyPoseAnimation` (+ `pollyPoseAnimations.ts`); and
  `pollyAnimations.ts` (old `polly_*` art) behind the unused `PollyActor`/`PollySprite`.
- The DEV ALIVE LOOP whole-image lean/rotation experiment was rejected. Do not wire it to Home.
- The parked articulation plan lives in `CONTEXT.md`: inventory existing separated art, then
  prove one DEV Neutral articulated sequence before new art or production life-profile
  animation.
- Approved but NOT built: a permanent Polly turn, a second one-way door in the Polybook mood
  (`resolveRivalryState`, `pollyMood.ts`) after a placeholder 12 masteries, after which AMUSED
  is unreachable. Lines are unwritten; revisit the milestone after TestFlight. Today AMUSED is
  still reachable at any mastery count.

## Services and Boundaries

- `ErrorBoundary.tsx` wraps the navigator and uses system fonts in fallback UI.
- Boss and Returning Haunt explainers have separate one-time persistence gates from onboarding.
- `playtestTelemetry.ts` is local only; Daily reminders are optional local notifications.
- Theme/material tokens live in `app/ui/`; render code outranks abandoned plans.
- Preserve stashes and unrelated local art. Branch merges require Pete's approval.
- The public website lives on orphan branch `gh-pages` (GitHub Pages), never mixed with game code.
  Adding any network, analytics, crash-reporting or ads SDK requires updating both `PRIVACY_TEXT`
  in `SettingsScreen.tsx` and `gh-pages:privacy/index.html` in the same release, plus the App
  Store privacy answers.
