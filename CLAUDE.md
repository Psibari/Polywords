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
- `workbooks/POLYWORDS_Daily_Challenge_60_LOCKED_2026-08-28.xlsx` is the canonical Daily
  authoring source; `app/game/dailyPool.ts` is the runtime representation. Supersedes
  `POLYWORDS_Daily_Challenge_Locked_2026-08-24.xlsx` (retired, kept for history), which is a
  strict subset — all 43 of its entries carried over unchanged, plus 17 new entries.

## Presentation and Character

- Polly is NOT a word thief and does not own or steal meanings. She is the antagonist who
  authored the traps — the designer of the deception, not a burglar. Pete ruled this
  2026-08-29. Five shipped lines still contradict it and are pending rewrite: `huntBossMine`,
  `homeTakeTime`, `resultsWantBack`, `resultsEmptyVault`, `resultsKeepWord`. "My traps
  remember you" is the model for the correct voice. Note that the polywords-feel-engine
  skill still describes her as a "smug theatrical word-burglar" and is stale.
- Hunt lines now rotate. `VisitSpec` still carries one resolved `lineId` and
  `line`, but `resolveVisit` picks them at fire time from a candidate pool
  via the exported pure helper `pickFreshLine(candidates, recent, roll)` in
  `pollyVisitPolicy.ts`. It filters out anything in `pollyMemory.recentLineIds`
  (last five, any surface) and indexes the survivors with a caller-supplied
  0–1 roll. `PollyBudgetState` gained `recentLineIds` and `lineRoll` for this;
  `usePollyVisits` fills them from `useGameStore.getState()` (never a
  selector — a subscription would re-render mid-visit) and `Math.random()`.
  Randomness is an input so the policy file stays pure and still runs under
  plain node. Two pools exist: `WRONG_HECKLE_LINES` (12) and `STREAK_LINES`
  (6). Every other moment still holds a single fixed line. (d623087)
- Polly now has a losing register in the Hunt. `streakX10` fires from
  `useBoardMechanics` on every multiple of ten and used to be discarded;
  it now resolves to `STREAK_RATTLED` — flyPose `fly`, perchPose `rattled`,
  heckle, 1800ms, no sfx — with its own line pool of her explaining why the
  streak does not count. Heckle rather than guaranteed on purpose: it is a
  flourish, it must not hard-cut a bigger beat, and it fires again at twenty.
  `runPunch` in `PollyHuntVisit.tsx` gained a `rattled` branch: flinch back,
  then over-correct upright. Without it a new pose falls through to the smug
  branch, which leans her toward the puzzle — confident, and wrong here.
  (2e82c32)
- Home is the lobby; Play is the semantic arena; Vault is the player's reclaimed archive;
  Settings owns preferences/development utilities; Daily is separate.
- The in-round intake object is the **Polybook**. Vault remains **WORD VAULT**.
- Live Polly uses `assets/images/polly/poses/*.png`, authored copy, deterministic local
  memory, and whole-image motion. Home, Daily and Results now render the layered face rig
  while she is settled in her idle/smug pose; the Hunt perch and every non-idle pose on all
  four perches still render a single flat pose.
- The layered face rig is live. `app/components/PollyPerchRig.tsx` stacks five `rig2` layers
  (base, beak, eye, brow, crown) as contain-fitted images inside a square box and runs the
  idle blink with the brow riding it at BROW_FOLLOW 0.33. Every tuning value is a fraction of
  the `size` prop, so the rig scales to any perch. `crownTilt` and `angryBrow` are props that
  default to false and are currently unused. `reduceMotion` true or null renders the neutral
  static stack and schedules no timers. The component adds no breathe or bob —
  `usePollyAmbientMotion` already moves the whole figure at each call site.
- Rollback is one line: `POLLY_PERCH_RIG_ENABLED`, exported from `PollyPerchRig.tsx`.
- The swap rule: the rig renders only when the settled pose is the sprite4 drawing — Home
  idle/smug, Daily `POSE.idle`, Results `complete`. Fly-ins and every other pose stay flat art.
  Shipped in `5c6f92a` (Home), `44b4114` (Daily), `d39ca2e` (Results), each device-confirmed
  before commit.
- The Hunt perch is not wired, and the blocker is code, not content. The 1800ms perch on
  `WRONG_SMUG`/`GHOST_SMUG` only prevents the idle BLINK, which is scheduled 2000–6000ms after
  mount — it does not prevent a FACE: mouth, eye and brow swaps are hard cuts that land the
  instant she arrives. The real blocker is that `VisitSpec` has no field for a face — `perchPose`
  is a single enum conflating body pose and expression across seven values, and the rig draws
  only sprite4. So the rig can reach 2 of 13 visit specs (`WRONG_SMUG`, `GHOST_SMUG`) until
  `VisitSpec` carries a face separately.
- `PollyFaceRigDevViewer` remains in Settings behind `__DEV__` as the tuning harness. Pete
  approved reviving the layered approach on 2026-08-27, overriding the "do not revive" note in
  `assets/images/polly/rig/README.md`.
- `assets/images/polly/rig/` (the old rig), `PollyRig.tsx`, `pollyPerformances.ts`,
  `pollyRigParts.ts`, `PollyActor.tsx`, `PollySprite.tsx`, `usePollyAnimator.ts`,
  `pollyAnimations.ts` and the six `polly_*.webp` files are dead — nothing imports them.
  `PollyActor.tsx` still defaults to `renderer: 'rig'`, which contradicts that README.
  Do not delete `polly_shocked.png`, `polly_angry.png` or `polly_pointing.png`: they are
  also referenced by live `pollyPoses.ts`.
- The six dead `polly_*.webp` files are all 362x724, six frames, ~0.6–0.8s loops. All had a
  light-grey halo along the alpha edge, left over from being cut off a white background, plus
  1-bit alpha with no anti-aliasing; on a dark background that reads as static. `polly_sulk`
  and `polly_idle` were de-fringed and re-feathered and committed clean in `fde5902` (edge
  colour ~(146,146,146) to ~(21,20,18), near-white edge pixels ~18% to ~0%). The other four —
  fly_in, laugh, boss_warning, taunt_point — are unusable and cannot be repaired: the canvas is
  too narrow for spread-wing and pointing poses, so wingtips, tail and hand are clipped flat at
  the margins. Those pixels were never drawn and cannot be recovered. They need re-rendering at
  724x724 square, which also matches the square perch boxes. Nothing in the app plays animated
  webp today; React Native `<Image>` will not animate one on Android without additional work.
- `sprite4.png` is the master pose for layered work. Other poses map onto it by beak width:
  sprite2 ×1.000, sprite5 ×0.883, sprite7 ×0.883.
- An open mouth cannot be harvested from any existing pose. This supersedes the earlier
  "use sprite7 as the open-mouth donor" note. Tested 2026-08-28: sprite7's open beak was cut
  cleanly, including the mouth cavity and tongue, and placed on the perched head at several
  scales and alignments. All of them fail the same way — sprite7's mouth opens down and to the
  left, across what is her cheek and eye on sprite4. Crown and skull register between those
  poses; the mouth does not, because her head is turned further in the perch. sprite7 also has
  her pointing wing crossing the mouth, so part of the lower beak was never drawn. sprite5's
  open mouth is unobstructed but her head is tipped back, which is further off, not closer.
  Pete drew it instead, painting directly onto sprite4 and changing only the mouth.
  That workflow is the one to repeat: paint on sprite4, change only the target
  feature, export transparent. Three parts now exist — `polly_beak_open.png`
  (e46281c), `polly_eye_wide.png` and `polly_brow_shock.png` (ae2257c). Watch for
  the recurring defect in first passes: moving a cut jaw leaves the back of the
  mouth see-through, because nothing was drawn behind it. Always check for
  transparent gaps inside a part before accepting it.
- `beak_open` reads as a talking or shouting mouth, not a gasp. Her shocked face is
  wide eye plus shocked brow with the beak CLOSED. A rounder, more vertical gape shipped in
  `54c85bb` as `polly_beak_gape.png`. `rig2` now holds base, crown, beak, beak_open, beak_gape,
  eye, eye_wide, brow, brow_shock, plus banked feet, far wing and tail.
- `rattled` is a new flat pose (`assets/images/polly/poses/rattled.png`,
  ff3e68d): perched, sweating, blushing, forced closed grin — losing and
  covering for it. It was exported crown-matched to sprite4 on the same
  283x413 canvas, so its `POLLY_POSE_SCALE` entry is 1 by construction, not
  by tuning. She reads slightly smaller in the body than sprite4 because the
  drawing gives her a larger head; that is the art, not a scale error.
  It is a whole-pose drawing, NOT rig-compatible — the body is a fresh
  drawing rather than a repaint of sprite4, so no part cut from it will
  register on the rig.
- `PollyPerchRig` takes `mouth` ('closed' | 'open' | 'gape'), `eye` ('default' | 'wide') and
  `brow` ('default' | 'shocked'). Art variants are named strings rather than
  booleans because a third brow and a third mouth exist. `angryBrow` remains a boolean and
  drives motion only — the downward offset and rotation. All swaps are hard cuts, no
  cross-fade. No live screen passes any of them yet; the three faces exist only in
  the dev viewer, which now has MOUTH, EYE and BROW toggles.
- Poses are contain-fitted into square boxes, but the drawings have very different canvas
  aspect ratios, so they rendered at very different sizes. sprite4 is portrait 283x413;
  sprite9 is landscape 238x178 and rendered ~1.45x larger in the same box. `POLLY_POSE_SCALE`
  in `app/ui/pollyPoses.ts` normalizes this, anchored on sprite4 because it is the most-seen
  pose and the drawing rig2 is cut from. Values derive from crown width, which is
  near-constant across poses. The perch components hold an image source rather than a pose
  name, so they use `pollyPoseScale(source)`; `PollyHuntVisit` uses `POLLY_POSE_SCALE[name]`.
  Applied on the Image, never on the parent Animated.View — those transform stacks are
  native-driven. Rig branches are unaffected. (`f6394e1`)
- `VisitSpec.exitPose` ('fly' | 'sulk', default 'fly') controls the pose held during the
  fly-out. Before it, `runExit` hardcoded 'fly', so she always left neutral regardless of
  what had just happened. Use an inline union, never an import from `pollyPoses.ts` —
  `pollyVisitPolicy.ts` is RN-free so it runs under plain node. (`e23979d`)
- `masterShock` and `masterAngry` are no longer selected by any visit spec after `e23979d`.
  They remain in `POLLY_POSES` and in the type unions. Do NOT delete `polly_angry.png` or
  `polly_shocked.png` regardless: they are the reference art the rig was measured from and
  the reference for the gape mouth.
- There is an app-wide error boundary (`fb72f65`). `app/components/ErrorBoundary.tsx`
  wraps the navigator inside `SafeAreaProvider`; its reset bumps a `navKey` so the
  navigator remounts to a clean Home. The fallback uses system fonts only, so it
  still renders if a font failure is what broke the app. Device-confirmed both ways.
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
