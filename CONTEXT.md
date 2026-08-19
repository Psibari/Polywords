# POLYWORDS Current Context

Updated August 18, 2026. Active branch: `play-screen-overhaul`.

## Current Build

HEAD: 279ccf5. Tags: v0.working-20260722-hudchips, -vaultcopy, -economy1,
v0.working-20260723-music, -lossfx, -routec1, -routec2, v0.working-20260725-hook, -fork,
v0.working-20260729-chest, v0.working-20260815-workbook-merge, v0.working-20260816-option-c,
-telemetry-v2, -death-sequence-fix.

## Session — 2026-08-17/18

- **Home art swap** (`4b709a5`, `6b24d40`, 2026-08-17): the code-drawn stacked-gradient
  book replaced with painted art (`assets/images/homebook/homebook1.png`); three route
  plates reworked to sit inside the painted gold trim (deboss treatment, haptics, press
  glow); dev-only plate tuning panel and treatment switcher stripped once values locked.
- **Content merge** (`f2f6def8`, 2026-08-16 — landed just before this window): purely
  additive merge of 23 new words via the new `merge-workbook-additions.mjs`, 150→173
  words. `build-hunt-data.mjs` retired as the normal update path (see `CLAUDE.md`
  Content Boundary). One gap surfaced by this doc pass: KERNEL (demoted from boss
  2026-08-11, after the pacing pass closed) has no `pacing-overrides.json` entry and is
  still on the placeholder `gpsTag`/`difficulty` — the only one of 160 non-boss words in
  that state.
- **Cross-run repeat suppression** (`82430d1`, 2026-08-18): `generateHunt` gained a
  `recentWordIds` param; each `gpsTag` pool reorders (never excludes) recently-shown
  words to the back. Fixes confidence-pool's ~32% run-to-run repeat odds (12-word pool,
  2 drawn/run) with no change to the existing cross-pool fallback chain.
- **Returning Haunt repositioned** (`279ccf5`, 2026-08-18): moved from round 8/6
  (standard/fledgling) to round 5/4 — round 8 was too deep for players who don't
  reliably reach it to ever see their revenge match. Surfaced and fixed a real bug in
  the same change: the ghost's emotional weight (role/haptic) previously inherited
  whatever phase label happened to sit at that array index rather than being a
  deliberate choice — now explicitly forced to `adrenaline`/heavy regardless of arc
  length or position. Side effect: haunted runs previously skipped the Panic phase
  entirely as a byproduct of the old index; at the new position Panic survives intact.
- **Doc reconciliation pass** (2026-08-19): `CLAUDE.md`, this file, and the docs in
  `docs/` re-verified against live code/data rather than trusted as-is. Found and fixed:
  stale Returning Haunt round numbers in three docs, `CONTENT_WRITING_STANDARD.md`'s
  Data Boundary section directly contradicting `CLAUDE.md` (it still called
  `huntData.json` placeholder/test content), stale word counts (150→173) throughout, a
  retired-tool reference (`build-hunt-data.mjs` presented as the live pipeline), and the
  KERNEL gap above. Confirmed several previously-listed issues are now already fixed in
  code with no doc actually claiming otherwise (Reduce Motion coverage, outcome-overlay
  dismiss-tap indication, the four sub-14px legibility floor violations) — see the
  trimmed Deferred list below.

## Session — 2026-08-16

- **Telemetry V2 shipped** (`4fe13b9`, landed just before this session's bug-fix work):
  `playtestTelemetry.ts` now tracks 6 new event types beyond the original 9 —
  `hunt_decision` (fires on every resolved swipe, not just ambiguous ones),
  `ghost_created`, `haunt_reached`, `haunt_failed`, `boss_entered`, `boss_playable`.
  Persistence moved from write-on-every-event to a debounced write (trailing 800ms) via
  the reused `activeGamePersistence` coordinator, with an explicit `flushPlaytestEvents()`
  forced-write at `hunt_complete`, `hunt_death`, `daily_complete`, and `daily_loss` so a
  run-ending moment can't lose its tail to the debounce window if the app backgrounds or
  dies. Verified on device: data survives a full app force-quit/reopen. Status:
  instrumented and actively collecting on Pete's device — under 30 logged Hunt runs, the
  app's own summary already flags itself as "too few to compare meaningfully"; treat
  nothing pulled before that volume as reliable.
- **Three bugs found and fixed**, all confirmed on device, commit `617417b`:
  1. Fatal-swipe render race (`GameScreen.tsx`) — `isDone` swapped the board for
     `ResultsScreen` the instant `game.status` became `'gameOver'`, with no gate, so the
     wrong-swipe death animation (780ms/760ms reduce-motion, `SwipeMask.tsx`) never got to
     play — a device recording showed the board vanish in ~33ms with no animation at all.
     Fixed with a `deathHoldActive` gate (same pattern as the existing
     `bossTransitionActive` effect), held 780ms on a FRESH `playing`→`gameOver` transition
     only, never on a resumed already-dead session. First implementation set the gate from
     a `useEffect` and still produced a visible blink (hearts UI flashing back before
     Results reappeared) — effects run after React commits/paints, so one stale frame
     always painted first. The real fix sets the gate synchronously during render instead
     (React's documented "adjust state while rendering" pattern), which lets React redo
     the render before anything is ever painted.
  2. Card-promotion-during-death-hold (`useBoardMechanics.ts`) — surfaced BY fix #1:
     `onTileExitComplete`'s `revealNext()` had no `game.status` check, so once the board was
     correctly held open for 780ms, this old, previously-never-exercised code path used
     that window to promote a new card right before Results appeared. Fixed by skipping
     just the mask-list mutation (not the ref cleanup) when `game.status !== 'playing'`.
  3. Wrong-swipe deflate-cue mispitch (`sfx.ts`) — the "you broke a 1.5x+ chain" wrong-swipe
     sound layer (`correctClaim` reused at rate 0.55) has sounded like a normal, unpitched
     correct chime since the feature shipped 2026-07-09 — not a regression, a day-one bug
     only caught now via focused testing. Root cause: `expo-audio`'s
     `AudioPlayer.shouldCorrectPitch` defaults to `true` (built for slow-motion video), and
     the deflate code never set it `false`. Fixed: `shouldCorrectPitch = (rate !== 1.0)`
     before every `setPlaybackRate` call; `setPlaybackRate` failures are now logged
     (previously silently swallowed) and skip playback rather than falling through to the
     default pitch.
- **Gameplay-mechanics audit status**, from the war-room-style audit that opened this
  session: P0 Telemetry V2 — done. P0 fatal-swipe → Results continuity — done. P0
  REAL-absorption P50/P90, P1 repeat-boss entrance compression, P1 Haunted reach-rate +
  runs-waited — instrumented, blocked on real play volume (30+ Hunt runs minimum, per the
  app's own built-in threshold). The P1 "Round 5/6 vs Round 8 Haunt-return" question this
  list originally flagged for a data-driven A/B test was instead resolved by direct design
  decision 2026-08-18 (see Session — 2026-08-17/18 above) — Round 8 was moved to Round 5/4
  outright, no A/B needed. P1
  selectable next-card deck prototype (Tension/Panic) — correctly not started, explicitly
  sequenced behind the volume-gated items above. P2 items (boss gauntlet strategic
  consequence, prestige/history tracking, RUN IT BACK signal) — not started.
- `.freebuff/` added to `.gitignore` — a local duplicate git worktree + SQLite db from
  tooling/session scratch state, never project content.

## Session — 2026-08-11/12

- Boss content pass complete: COURT/IRON/STRIKE gauntlets finished (`cd16cbd`, `a143933`,
  `63f7c85`), alongside BATTER/CLICK/SENTENCE/IRON/GRACE content fixes. KERNEL was demoted
  from boss by Pete (replaced by a promoted fruit-stone REAL). All 13 current boss words now
  have their full 3-pair `hiddenPairs` hand-written — zero `PLACEHOLDER TEST` slots remain
  anywhere. `CLAUDE.md`'s Content Boundary section corrected to match (it still said 14 boss
  words, mostly incomplete).
- Technical hardening, same window: "Fix Daily and Haunt readiness timing" (`a09eb2d`) and
  "Harden Hunt interruption persistence" (`44e92e5`) — new `activeGamePersistence.ts`,
  `returningHauntResolution.ts`, `boardDecisionReadiness.ts`, `dailyClaimPresentation.ts`,
  all with test coverage.
- First-ever Android real-device test (custom EAS dev-client build) surfaced real RN/Android
  platform gaps — not code that regressed, code that had simply never been tested on that
  platform. Root-caused and fixed: `HeroBook.tsx`'s `backfaceVisibility:'hidden'` (unreliable
  on Android; added an `opacity: 0` backstop), `FoilWord.tsx`'s per-layer
  `adjustsFontSizeToFit` truncating text instead of shrinking (numberOfLines now allows a
  2nd-line fallback), and app-wide missing `includeFontPadding: false` clipping text (added
  across 137 style spots in 20 files — `MaskBoard.tsx`/`SwipeMask.tsx` still need the same
  fix once a warroom pass unlocks them). Also surfaced: every prior test session has been
  Expo-Go-only on iPhone (Pete has no Apple Developer account yet), so even "working" iOS
  behavior has never been checked against a real compiled build either. Pete's explicit call:
  park all further device-hardening work until content/feel/pacing is further along. Full
  detail in memory (`project_android_device_pass_deferred`).
- Retired two content-generation tools at Pete's direction — `tools/content/mask-rewriter/`
  (never produced one usable line despite being fully wired to real API keys) and
  `generate-rewrite-review.mjs` — moved to `tools/content/_deprecated/`. `CLAUDE.md`,
  `AGENTS.md`, `.gitignore`, and `wordCapPolicy.test.mjs` updated to the new paths.
- Full-game retention/engagement audit (level-design + game-feel + gameplay-mechanics lenses
  via `polywords-warroom`) found: zero production telemetry (`playtestTelemetry.ts` was
  `__DEV__`-only, so the 54%/25% economy targets this doc's Hunt section cites were
  unverifiable against real play), no re-engagement mechanism for Daily's streak, and a
  browse-only Vault with no stats or history. Shipped: `playtestTelemetry.ts` now persists
  locally in every build (Settings > Playtest Data can share/clear a summary — local only,
  never networked); an opt-in local Daily-streak reminder via `expo-notifications` (off by
  default, no push server, no account); a Vault stats header (mastered/total, haunted,
  streak), rank-up history (`ranks.ts` `computeRankHistoryUpdates`), and ghost detail cards
  now surface their already-stored `hiddenMeaningReal`/`hiddenMeaningTrap` (data that existed
  but was never shown). The deeper Vault interaction redesign (book pulls off the shelf,
  turns to face the player, opens) is mid-brainstorm with mockups via the visual-companion
  tool — paused, not dropped, not yet an approved design.
- Confirmed working as designed, not a bug: the true first-ever "Who are you? What do you
  want?" Polly line (`pollyMemory.ts` `homeFirstMeeting`) fires once per install, before any
  Hunt or Daily is ever played. Pete's own dev device passed that state long ago, which is
  why he stopped seeing it. Reproducible via Settings > Reset Progress.

## Session — 2026-08-07

Full audit pass, then a full content replace at Pete's explicit direction:

- Audit found `9ff2242` (music/SFX self-heal on native audio failures) and `39b202c`
  (startup readiness coordination) had already fixed the two bugs this file's "Open Bugs"
  section still listed as open.
- Pete supplied a new 150-word editorial workbook. Built `import-workbook.mjs`
  (staging/diff) and `build-hunt-data.mjs` (the rebuild) to parse it, deduping
  non-contiguous duplicate rows by phrase text.
- Pete's call: gut `assets/data/huntData.json` and replace with only this 150-word set
  (14 boss-ready then, 2 demoted-from-boss words shipped regular-only, `gpsTag`/
  `difficulty` placeholder-assigned since the workbook has neither). `generateHunt`
  smoke-tested across all 4 session lengths plus mastered/ghost scenarios. Committed
  `f593a24`. `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` swapped to the 2026-08-06
  workbook as tracked master (byte-identical regen verified first), `936c50c`.
- Device test found and fixed two real audio gaps, commit `4e86b0c`: SFX's retry budget
  (200ms total) was too short to actually benefit from `9ff2242`'s rebuild self-heal on a
  genuinely slow cold load — given the same backoff ladder `MusicEngine.ts` already
  proved (`[60,150,300,600,1200]`ms); and hunt music had a 1-3s cold-start delay because
  nothing preloaded a track before Hunt's own `startMusic` call — fixed with
  `preloadHuntTrack()`/`preloadSfx()` called from `App.tsx` at boot (`086c300`).
- First gpsTag/difficulty editorial pass, commit `7290f90`: 91 of 136 non-boss words
  hand-reviewed against `docs/GOLDEN_PACING_SYSTEM.md`'s phase table, tracked in the new
  git-tracked `tools/content/pacing-overrides.json`. Exposed and fixed a real crash risk:
  `huntGenerator.ts`'s tension/panic fallback chains couldn't reach the confidence pool
  as a last resort, so a heavily-mastered late-game player could exhaust two pools at
  once and crash — every phase's fallback chain now reaches every pool as an absolute
  last resort.
- Placeholder-stability fix, commit `a2ce6b7`: the round-robin placeholder for
  not-yet-reviewed words walked a shared cursor, so reviewing 91 words silently shifted
  which placeholder phase the remaining words landed on (35 of 45 drifted). Fixed by
  hashing each word's own spelling into its placeholder instead of shared position.
- `0a0099e`/`bfbd2f2`/`8e0b1a5`: the remaining 45 held-back words resolved — a trap not
  opposing its REAL is not a defect per `CONTENT_WRITING_STANDARD.md`'s "guilty-close,
  legally wrong" definition, so most were folded in as-is. Two words had genuine content
  issues, fixed directly in the workbook: BULB's onion trap was cut (onions are literally
  bulbs, not a fair trap); DATE's "wrinkled purple fruit" trap was actually a fig
  near-miss, rewritten to "a one-night stand." Pass complete at the time: all 136
  non-boss words had a real hand-reviewed gpsTag/difficulty (see 2026-08-17/18 above for
  the KERNEL gap the later 2026-08-16 merge opened).

## Session — 2026-08-04

Feel pass, tsc-clean, device-confirmed, commit eea4e6c:

- Boss entrance (pollyVisitPolicy.ts): perchMs 3400->4200, perchScale 1.3->1.45.
- Gauntlet 3rd-tile: MaskBoard.tsx onGauntletCorrect adds a second Heavy
  haptic ~120ms after the first, only on the gauntlet-ending tile.
- Haptics: bossEntry is now a double-pulse, distinct from bossCorrect's single.

Recurring issue, not new: music intermittently drops and later self-recovers.
Pete investigating. Known contributing gap: MusicEngine's load retry ladder
(60/150/300/600/1200ms) gives up permanently on a slow load and only gets a
fresh shot on the next real track switch — not fixed this session.

Hunt/Polly rebuild in progress — plan: docs/HUNT_POLLY_REBUILD_PLAN.md (read first).
Shipped + tagged today, all tsc-clean + device-confirmed:

- Phase 1 (tag v0.working-20260721-phase1): engine owns per-run bossOutcome ('pending'|'mastered'|'haunted') + bossFlawless. Rule: survive boss tiles → mystery unlocks → correct = MASTERED regardless of visible mistakes; wrong mystery or boss death = HAUNTED. Persistence reconciled off the outcome in useGameStore; MaskBoard is presenter-only. Loss-laugh echo/replay-lag fixed (GAME_OVER_LAUGH.sfx=null; ResultsScreen owns the loss laugh).
- Phase 2 (tag v0.working-20260721-phase2): Results/rank/Polly-memory read bossOutcome, not score. FLAWLESS badge on clean master. Rank is score-only.
- Phase 3 (tag v0.working-20260721-phase3): deleted dead session.ts (12-round SESSION contradicting canon). generateHunt is the only arc source (10 rounds, boss idx 9, haunt idx 7). createGame requires steps. hasBossContent requires hiddenMeaning && hiddenTrap.
- Phase 4 (tag v0.working-20260721-phase4): scoring single-sourced in polyRunEngine (chainMultiplierForStreak + point helpers), MaskBoard reads them; dropped dead createGame ghostWordIds param; GAME_REFERENCE ranks reconciled to ranks.ts + dead rare-300 claim removed. No behavior change.
- HUD (tag v0.working-20260722-hudchips): 10 numbered round chips (white resting / purple current + boss crown). Gold retired from chip row.
- Book open timing: onNearTarget -> onCardTouch, triggerBookOpen -> handleCardTouch. Fires on card arrival, not 45% mid-flight.
- Vault copy (tag v0.working-20260722-vaultcopy): MASTERED/HAUNTED. "POLLY'S WORD — MASTERED", "Run it back next Hunt." No ownership language remains.
- Economy phase 1 (tag v0.working-20260722-economy1): VISIBLE_MASK_CAP=5 in huntGenerator (guarantees >=1 real + >=1 trap), starting lives 6, score->life milestones removed at all 3 sites, MAX_FEATHERS=6. Tests updated, tsc 0, suite OK.
- Music ownership consolidation (tag v0.working-20260723-music): ownership now follows navigation focus only; game status selects the track via setMusicState, never the owner. setMusicState('off') pauses the transport in place instead of releasing the owner, so a run-back can no longer drop its desired state into a null-owner engine. Hunt start/stop call sites: 6 -> 2.
- Loss-path FX fix (tag v0.working-20260723-lossfx): triggerWrongFail no longer spawns a shard effect with no variant, which fell through FXLayer to the 'generic' celebration burst on HAUNTED.
- Route C phase 1 (tag v0.working-20260723-routec1): hidden-pair schema (HiddenPair, WordStep.hiddenPairs) + gauntlet engine in polyRunEngine (beginMysteryGauntlet, isMysteryTerminal, resolveMysteryTile resolves one tile at a time and writes bossOutcome only on the terminal tile, mastery scores exactly once). Also fixed a ghost-reservation bug where a haunt word missing hidden content could reach the board with no mystery and auto-fail a perfect round.
- Route C phase 2 (tag v0.working-20260723-routec2): 3-tile hidden gauntlet wired into MaskBoard. One tile per hidden pair (up to 3), independent coin flip per tile (12.5% guess-through vs the old 50%). Returning Haunt re-tests the exact pair that beat the player last run, read off the ghost. Presentation was a placeholder ("N OF M" counter, existing tile framing) at the time — `docs/BOSS_ROUND_SPEC.md`'s planned phase 3+ presentation was never built (see the flag at the top of that doc); "Pick Your Trap" (`CLAUDE.md` Hunt section) shipped instead, 2026-08-01.

Locked run-end verdicts (from bossOutcome): mastered → "SLIPPED PAST POLLY'S TRAP"; survived-not-mastered → "ALMOST, BUT ALMOST DOESN'T COUNT."; died → "GOT SNAPPED BY POLLY'S TRAP".

## Audio

Corrects stale stem info — stems are GONE.

- Music = 5 mp3s in `assets/audio/bgm/`: hunt_suspense_loop, tension_quirky_background, boss_of_the_rats, daily_detective_clue_patrol, static_idle_loop.
- SFX in `assets/audio/sfx/`. All requires resolve; folder layout is clean. Dead asset: correct_claim.mp3 (code uses correct_claim_v2.wav).

## Open Bugs

- Music intermittent (fresh reload plays, run-back silent): FIXED (tag v0.working-20260723-music). Ownership consolidated to navigation focus; 'off' pauses in place instead of releasing the owner.
- Music/SFX going permanently silent after a native audio-server hiccup ("Server was dead"/"Session lookup failed"/"Session activation failed"): FIXED 2026-08-06, commit `9ff2242`, self-heal mechanism fully device-confirmed 2026-08-07 for both engines (see Session log above). SFX's retry budget was too short to actually benefit from the mechanism on a genuinely slow load — fixed same session, commit `4e86b0c`.
- Glitchy staggered startup: FIXED 2026-08-06, commit `39b202c` — subsystems now coordinate readiness instead of racing.
- Cold-start hunt music delay (1-3s before music starts on first Hunt entry after reload): FIXED 2026-08-07, commit `4e86b0c` — hunt track now preloads in the background from `App.tsx` instead of loading cold at Hunt entry.
- Resolved: `[MusicEngine] failed to play ... track — Session activation failed` warning (previously "Unchased", seen once on a boss-track switch) — reproduced on hunt track 2026-08-07, confirmed the existing self-heal recovers it within 2 rebuild attempts.
- Total audio silence, music AND SFX, every play attempt: FIXED 2026-08-19. Root cause was
  `audioSession.ts` requesting `interruptionMode: 'mixWithOthers'` — on iOS this made every
  `player.play()` throw expo-audio's native `Session activation failed`, which is why the
  self-heal from the bug above (and every other audio commit before it) could never
  actually clear it: rebuilding the JS player object re-invokes the same broken native call
  every time. Switched to `interruptionMode: 'doNotMix'`, device-confirmed fixed (heard
  music + SFX again on iOS Expo Go). `setAudioModeAsync did not settle within 2500ms` still
  logs every launch — harmless now that activation itself no longer fails, not investigated
  further this session. Separately caught mid-investigation: a "totally silent, zero errors"
  report was the in-app Settings > Sound toggle switched off, unrelated to this bug — rule
  that out first before chasing a native/session cause.

## Deferred — Pre-Launch Accessibility/Polish Pass (found 2026-08-09)

Not urgent, explicitly deferred by Pete (not near launch). Found via a ui-ux-pro-max
checklist audit of the Hunt session + boss round; re-verified against live code
2026-08-19 — three of the original five items are now already fixed (code, not doc
drift — MaskBoard.tsx is warroom-gated and none of this needed that pass):

1. ~~Reduce Motion gaps in `MaskBoard.tsx`~~ — FIXED (`30db2a9`): `triggerBoardShake`,
   the deck-entrance cascade (incl. `bookSlideX`), and the word-lock pulse are all gated
   now.
2. ~~Outcome overlay's 1200ms non-interactive dismiss window had no visual signal~~ —
   FIXED: `continueOpacity` now starts dim and brightens once the tap actually starts
   working, in both `MasteredOutcomeOverlay` and `HauntedOutcomeOverlay`.
3. ~~Four text elements under the 14px legibility floor~~ — FIXED: `vaultLabel`,
   `FONT_SIZES.hudLabel` (boss stakes kicker + outcome CONTINUE), and
   `FONT_SIZES.ghostSubLabel` (card era badge) are all 14px now, with an explicit
   in-code comment recording the floor.
4. Boss gauntlet swipe threshold (`HUNT_SWIPE_THRESHOLD = 40`, huntSwipeDirection.ts:3)
   is still thin for what `CLAUDE.md` calls an irrevocable action — still open,
   confirmed unchanged. Lower-confidence finding, worth a second look rather than an
   automatic fix.
5. Boss stakes badge text `numberOfLines`/`adjustsFontSizeToFit` safeguard — **not
   re-verified this pass**, exact current location wasn't pinned down; treat as
   unconfirmed rather than either fixed or open until someone checks it directly.

## Active Runtime Boundaries

- Live content: `assets/data/huntData.json` — real 173-word working list as of the
  2026-08-16 additive merge (see Session log above and `CLAUDE.md` Content Boundary),
  not the old test corpus.
- Editorial master: `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` — now Pete's 2026-08-15
  workbook (`POLYWORDS_content_data_2026-08-15_DIRECT_DISCHARGE_LOCKED.xlsx`).
- Retired V2 export: `assets/data/huntData.v2.json` (schema shell, 0 words).
- Live Polly art: `assets/images/polly/poses/*.png`.
- Live music: `assets/audio/bgm/*.mp3` through `app/audio/MusicEngine.ts`.

## Next Product Work

1. Phase 5 verify; Phase 6 feel pass (wrong-swipe-as-snare).
2. Joint writing still owed: haunt re-theme, run-language, wrong-swipe copy.

## Protected Stashes

Reference by name only; never pop, drop, or clear without instruction:

- `wip hud material pass needs feather asset`
- `wip haunt loop type scaffolding`
- `wip intake sliver not approved - needs SwipeMask handoff`
- `wip failed View-based Hunt hero book V5`

Durable rules live in `CLAUDE.md`; gameplay specifics live in focused docs.
