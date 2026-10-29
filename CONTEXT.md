# POLYWORDS Current Context

Updated 2026-10-27 (Build 15 accessibility/beta hardening, the Build 16 iOS audio watchdog fix, true Hunt pause/quit, and the dedicated POLYWORDS DEV phone-testing path are now committed and pushed; device-validation status is recorded below). Current state + next work only. `CLAUDE.md` owns durable architecture;
focused rules live in `docs/`; runtime code/data outrank docs.

## Branches

| Branch | Role |
| --- | --- |
| `play-screen-overhaul` | Main working branch. |
| `daily-castle-test` | Finished and merged. Do not work on it. |
| `onboarding-wip` | Finished and merged. Do not work on it. |
| `main` | Stale. Never merge into it without Pete's approval. |
| `gh-pages` | Live public website (GitHub Pages). Orphan branch, no shared history with game code. Never merge into or out of it. |

Phone testing uses the dedicated `POLYWORDS DEV` development client against the local checkout, not the TestFlight app and not GitHub. Normal loop: `APP_VARIANT=development npx expo start --dev-client`; add `-c` only when Metro's cache needs clearing. Make sure the local checkout contains the target commit before testing.

## Current State

- **Home (Pete, 2026-10-21): the OUTDOOR night terrace IS the real Home** (merged into `play-screen-overhaul`).
  `App.tsx` `Home` route renders `HomeTerraceScreen`; the old `HomeScreen.tsx` is parked and reachable only under `__DEV__` as `HomeOld`. Pete device-tested the swap 2026-10-21 and approved it
  ("Everything works good"). Read [docs/HOME_SCREEN_LOCKDOWN.md](docs/HOME_SCREEN_LOCKDOWN.md) (sections "Pete rulings, 2026-10-20" and "2026-10-21") and the Home section of `CLAUDE.md` before any Home work.
  Built: locked positions (Pete's 2026-10-21 20:54 readout is `TERRACE_DEFAULTS`); flat button art (`assets/images/home/terrace/`); entrance on every Home focus (Daily, Hunt, Polybook come out in turn with the
  Daily's own constants, thuds, one grind, tremble of wall and console); Hunt and Polybook pop out when pressed; the Daily plaque (in the wall recess, behind the console) rises from behind the console edge and
  is pressed in, not out; Lilita One labels (ENTER / tiny THE / HUNT; POLYBOOK; DAILY CHALLENGE); crowns at both ends of ENTER THE HUNT (white; gold once the Daily is played); plaque gold while unplayed, gold
  reading GOLD FEATHER READY while a Gold Feather is ready, gray once played with none; Daily streak left the moon 2026-10-23 and is on the Daily HUD (below); first Hunt only: START / HERE breathe under the Hunt crowns;
  first-run Hunt glow is a gold wash over the Hunt button; DEV positioner + Daily/Feather/Streak/Start-here toggles under `__DEV__` only.
  Tap dives (Pete device-confirmed 2026-10-22; all timings live in `app/ui/homeTerraceDive.ts`: `TERRACE_DIVE`, `TERRACE_DAILY_DIVE`, `TERRACE_BOOK_DIVE`):
  - Hunt dive: Polybook then Hunt (150 ms later) retreat into the hall (travel plus shrink to 0.3, fading only in the last quarter); the hall is static (Pete: it should do nothing); then a zoom into the hall's golden end, a gold flash (`#F5C842`), then Game. Zoom is 850 ms (was 1100; Pete: "a little faster", then "the speed is good now").
  - Daily dive: the castle is hidden until Daily is pressed, then rises between the mountain ranges from behind the front hill, zoom into the painted golden door (`TERRACE_CASTLE_DOOR`, measured from `castle.webp`), gold flash, then Daily ("works perfect"). The door is painted, so it never goes dark; only the small windows do. Pete chose: leave it as painted when the Daily is played.
  - Polybook dive: buttons retreat as in the Hunt dive; the Polybook screen then opens transparent over Home, its closed cover rises alone out of the hall to its resting spot on the Polybook page, and only after it lands do the page background, header and bottom nav fade in (350 ms). Confirmed working.
  - Sky and front hill are separate DEV elements; Pete's 17:09 readout is locked as defaults: background {-5.89,-150.81,473.12,1025.46}, front {-212.03,329.43,655.84,689.4}, moon {344.38,88.95,65.5,65.5}, castle {149.72,338.28,163.85,111.6}.
  (Superseded 2026-10-23: moon rise, shooting stars and Polly's fall-in are built; see the 2026-10-23 entries below. The cage fall is now a Polybook-page item.)
  Pete's later ideas (noted 2026-10-22): moon rise on app open with a different moon each time (half, crescent); shooting stars now and then (Polly's idle blink on the perch is already built and is not tied to the stars; Pete only meant they look nice together); sound effects for the zoom and dive motions.
  Pete's rulings 2026-10-22 (PM): the Daily streak number comes OFF the moon; new spot undecided (maybe at the bottom where the cage is). The cage fall (cage opening sequence) is still not built. Moon rise: from behind the back mountains (Claude cuts a ridge layer from `bg.webp`, Pete approves the cut); the moon shown is the real phase for today's date. Pete makes the Polybook page background and finds the dive sounds himself.
  Built and Pete-confirmed 2026-10-22 evening: moon rise from behind the back mountains (ridge layer `ridge.webp`, cut by `tools/art/home_terrace/make_ridge.py`; real moon phase for today; once per app open; climb now 3000 ms, Pete wanted it at least twice as fast) and shooting stars (one now and then; timings in `app/ui/homeTerraceSky.ts`). Pete said lock these as they are.
  Built and Pete-confirmed 2026-10-23:
  - Polly falls in from above the top of the screen and lands on the perch ("the land feels right"): `TERRACE_POLLY_DROP` and `terracePollyDropDistance` in `app/ui/homeTerraceScene.ts`, `drop` prop on `PollyHomePerch` (timing, ease-out, no spring; the old Home still springs up from below).
  - Polybook page: Pete's room painting `assets/images/polybook/polybook_room_bg.webp` (1285x2778) replaces the old sky, wash and candle glow. It needs an explicit `width/height 100%` style: `StyleSheet.absoluteFill` alone drew it at pixel size, about 3.4x too big (same iOS gotcha CLAUDE.md already lists; fixed, Pete confirmed).
  - Cage taken OFF Home ("too busy"; cage layers, ids and test entries removed). The cage art (the old static `polybook_cage.webp`, since deleted and replaced by the rope, hanging cage, base and dome pieces) sat on the Polybook page, placed from the header by `app/ui/polybookCage.ts`. It is only a static prop for now.
  - Dive sounds, all Pixabay Content License (credits in `assets/audio/LICENSES.md`), named in `TERRACE_DIVE_SFX` (`app/ui/homeTerraceDive.ts`): Hunt and Daily play `terraceWhooshEpic` (Daily starts 250 ms in); the Polybook rise plays `terraceWhooshCape`; `polybookThud` plays when the book lands (`PolybookSpread`); the buttons' retreat plays `terraceStoneShift` (Pete: "that works"). `polybook_thud` had 0.57 s of silence before the hit and `cape` 0.15 s; both were trimmed. The terrace button press sound (`pressHoldStart`) was removed at Pete's request. Volumes were set from measurement, not by ear. Pete: "everything seems all right on that front".
  Closed 2026-10-23/24: the Polybook cage fall/crash is built, the Daily streak moved off Home to the Daily HUD, the Polybook/Settings bottom nav was removed, and HOME buttons now return through the shared Home control. Dive sounds and the Polybook room background are also built.
  Parked: a lost-Daily retry-after-a-wait idea remains undecided; the deterministic puzzle and retry reward still need a product ruling before any implementation.

- **Hunt:** UP claims a REAL; RIGHT rejects a trap. Standard arc is 10 rounds; fledgling is 8.
  Polly's Word is final. Returning Haunt is round 5 standard / round 4 fledgling.
- **Hunt content/runtime integrity:** the 2026-10-05 audited replacements and metadata repairs
  live directly in canonical `assets/data/huntData.json`; the temporary runtime override layer is
  retired. Hunt entries validate at load so malformed difficulty/gpsTag, missing/duplicate mask
  IDs, invalid REAL/trap flags, missing swipe-direction coverage, or Boss entries without hidden
  content fail loudly instead of being silently bypassed. Existing GPS arc, fallback pools,
  mastery revisits, Boss selection and Returning Haunt behavior remain. FOAM and FOLD (boss)
  shipped 2026-08-31 with one regular trap each; two Pete-approved traps each were added
  2026-10-06 (b505951, ids foam_t91/t92, fold_t91/t92). The live bank now passes
  `npm run content:quality` with 0 structural and 0 launch blockers, and Quality Checks CI runs
  that gate on pushes to play-screen-overhaul and on pull requests.
- **First-run onboarding:** merged, device-approved, locked. FINE teaches recognition on the real
  board; HUD lessons teach feathers, momentum, a broken run and Hunt progress.
- **Daily castle:** the Daily Challenge screen art is UNLOCKED for rework (Pete's ruling
  2026-10-11). Gameplay behavior remains locked unless Pete explicitly reopens it.
- **Daily content expansion (Pete-approved and verified 2026-10-22):** 50 new Daily puzzles are
  committed on `play-screen-overhaul`, bringing the live Daily pool to 110 entries: 60 legacy
  nine-source-candidate entries plus 50 new six-card entries. New authoring is the actual visible
  puzzle: exactly three clues plus six cards total (target + five traps), with the clue difficulty
  coming primarily from the trap cards rather than Hunt-style masking. The universal leak rule is
  locked: no answer-card word may appear in any clue, including obvious inflections/derivatives.
  `dailyChallengeEngine.ts` combines the legacy pool with `dailyPoolExpansion.ts` and accepts six
  or nine source candidates while always presenting six cards. `dailyPoolExpansion.test.ts`
  verifies the new batch's structure, uniqueness, target-once rule, no card-word leakage, tier
  validity and runtime reachability. Pete's local verification passed clean on 2026-10-22:
  `npm run typecheck`, full `npm test`, and `npm run state`; state reported 110 Daily entries with
  the expected 60/50 split. Editorial review and automated runtime verification are both complete;
  an exhaustive phone hunt for all 50 is not required.
- **Polybook:** portrait Living Journal interior is device-approved and locked. Closed book opens
  to one portrait page; navigation is TODAY / JOURNAL / MASTERY with bottom forked ribbons.
  Closed-cover side-ribbon cleanup remains deferred.
- **Visual system:** shared grammar, not identical skins (`DESIGN.md`). Daily Entry and Settings
  use the utility-panel family where it helps; Daily Results, Boss intro/outcome, Hunt decisions,
  Polybook pages and first-run teaching keep their stronger native treatments.
- **Polly relationship:** Relationship Memory V2 and its comeback/slump/return/Haunt dialogue
  presentation are implemented and device-checked.
- **Polly animation:** the ALIVE LOOP whole-image experiment was rejected. Existing Rig 2 is
  useful for face/crown motion but the baked body cannot provide convincing head/wing/feet/tail
  articulation. Do not promote the rocking experiment to production.
- **Polly master art (2026-10-08):** the master set (`assets/images/polly/master/`) is used by
  the Hunt (1a3a2f9, then 289d349 for laugh03/angryYell), Results (ed03503), Daily Challenge
  (95ca56b) and Home (47e0e4e) on `play-screen-overhaul`, each through its own pose table. Pete
  device-tested each before its commit. Idle and smug remain on the face rig.
- **Polly follow-ups (2026-10-08):** d2f9681 removed the repeated Polly line from the Daily
  results view (pose only, no bubble, no remembered line; the perch is the only place the line is
  said and remembered). a9c668e relaxes Home's "back after an absence" watchful look after the
  first completed Hunt of the app session, in memory only (`homeBeatForSession`,
  `sessionStartRunsCompleted`); a Hunt quit from the pause menu is not recorded, and the saved
  memory format and `lastVisitAt` recording are unchanged. 4c1f6d6 clears the in-memory claim
  result when the Daily screen unmounts, so leaving during the ending and returning does not
  replay her reaction or hold Results. Dev 'return' seed: it raises `runsCompleted` to at least
  5, so seeding mid-session can count as a played Hunt; its own message says to fully close and
  relaunch the app. Unverified: closing passes through the background, which stamps
  `lastVisitAt` (App.tsx) and may cancel the seeded absence.
- **Results:** Hunt Results is the current integrated post-Hunt experience and is device-approved.
  It owns verdict, consequences, recap, Gold Feather recovery when eligible, START A NEW HUNT,
  SHARE RESULT, HOME, and Polly. There is no separate Run It Back screen to redesign.
- **Master's Rematch and Boss outcome cleanup (2026-10-09):** MASTER'S REMATCH, BUSTER and
  KING are wired through the real production path and device-approved. Rematches start on the
  gold Master book; KING keeps it gold and resolves to the crown plaque, while BUSTER visibly
  returns the book to purple and runs the approved MASTER -> BUSTER transformation. DEV preview
  buttons use the same shared plaque component as production. Normal Boss and rematch headers are
  now `POLLY'S WORD` / `MASTER'S REMATCH`; visible 2x framing and Boss mastery-point copy are
  retired while internal scoring remains intact. MASTERED / HAUNTED / BANISHED use the shared
  physical plaque-text treatment. The split claim/trap/tier-up haptics and wrong-swipe squawk rule
  remain device-checked. `Bird brain` remains Results-only unless Pete rules otherwise.
- **Hunt momentum feedback:** committed on `play-screen-overhaul` and exercised in native builds. Shared momentum accent, press/outcome haptics, wall strain shake (2026-10-28; the wall-vein pulse still fires but nothing draws it), SHARP `#6EC3FF`, and the current timing are the production path. Device evidence: vein timing and haptics read well; the pressed-card glow remains nearly invisible because the transformed tile clips its own shadow. Pete explicitly chose to leave that known issue rather than reopen the card geometry without stronger evidence.
- **Build 15 accessibility/beta hardening (`4ec96f6`, 2026-10-27):** Hunt and Daily short-feedback effects now share `resolveGameplayFeedbackAccessibility`. Reduce Motion removes unnecessary movement and also suppresses the implied flash channel; Reduce Flashes suppresses flash/pulse feedback while motion may remain. The hardening pass also made the Hunt-leave warning truthful ("Leave now and this run ends. Your score and remaining feathers are lost."), made Daily Results HOME a full-width active secondary action, and shows native version/build in Settings.
- **Build 16 iOS audio watchdog fix (`d6b4c3a`, 2026-10-27):** the known `expo-audio 57.0.5` iOS watchdog bug is backported with `patch-package` instead of forcing an SDK 58 migration. `patches/expo-audio+57.0.5.patch` is applied by `postinstall`; `tools/expoAudioPatch.test.mjs` guards it in the normal test suite. Fresh install/typecheck/full tests passed, and repeated device background/foreground testing on Build 16 did not reproduce the watchdog crash. Keep the patch until an intentional native/SDK upgrade replaces it and the replacement is device-verified.
- **True Hunt pause + quit (`60bd43a`, `272b020`, `8e7813c`, 2026-10-27):** the pause icon now opens one locked HUNT PAUSED menu: RESUME HUNT, HOME, SETTINGS, QUIT HUNT. HOME and SETTINGS preserve the exact active run; Home shows RESUME HUNT; Settings Back returns to the still-paused Hunt. QUIT HUNT is the only destructive path and opens the locked Polly confirmation with the truthful loss warning and "See you later, LOSER." Reduce Motion presents the pause/quit states without the pop/bounce motion. Automated typecheck/full-suite/pause regression checks passed; the HUNT PAUSED and quit-confirm visuals were device-checked in POLYWORDS DEV and Pete locked the visuals. A complete exact-state HOME/SETTINGS/QUIT behavior pass on-device remains the final acceptance check.
- **Fast device-testing path (`22d61a6`, 2026-10-27):** production remains `POLYWORDS` / `com.pdb8080.polywords`; development is a separate `POLYWORDS DEV` app / `com.pdb8080.polywords.dev`, selected by `APP_VARIANT=development` in `app.config.js` and the EAS development profile. Pete's iPhone is registered for internal distribution, Developer Mode is enabled, and the dev client is installed and working. Ordinary JS/TS iteration should use Metro + POLYWORDS DEV instead of consuming TestFlight builds. Rebuild the dev client only when native dependencies/config/SDK change.
- **Branding / splash:** the current app icon is approved and passed device inspection. The splash artwork is approved, but Build 15 proved its rendered mark is too small under the current contain treatment; the remaining work is a scale/fit correction, not a redesign.
- **TestFlight:** build/submit/install works end to end. Build 16 is the current verified production-native baseline; store name remains `POLYWORDS: Hunt or Be Trapped`; iPad support is off. Use TestFlight for release-candidate/native-production verification, not every ordinary JS/TS iteration.
- **Website:** live at https://psibari.github.io/Polywords/ with /privacy/ and /support/.
  Contact polywords123@gmail.com. The Daily share text links there
  (`dailyChallengeEngine.ts`). polywords.app is NOT owned yet; when bought, set it as the
  Pages custom domain and switch the share link back. The public privacy page must match
  the in-app `PRIVACY_TEXT`.
- **Editorial workbook:** current file is
  POLYWORDS_CANONICAL_HUNT_CONTENT_2026-10-06_LIVE_SYNC_LOCKED.xlsx, synced to the live
  bank at b505951. Older workbooks are behind the game; never import from them.

## Current Product Rulings

- Recognition over vocabulary instruction.
- Rank and score are player-facing nowhere.
- Mastery comes from the Boss gauntlet, not score.
- Haunted words return; a successful rematch banishes the active Haunt.
- Daily is deterministic, five rounds, UP-only, two lives, one attempt per date.
- New Daily authoring uses the six visible cards directly: target + five traps. Legacy nine-card
  source entries remain supported only for existing content. The challenge lives primarily in the
  traps and staged convergence, not in Hunt-style clue disguise.
- No Daily answer-card word may appear in any clue for that puzzle. Obvious revealing inflections,
  derivatives and compounds are also rejected unless Pete explicitly approves a narrow exception.
- Gold is scarce and meaningful; ordinary choices stay neutral before commitment.
- Visual consistency requires a player-facing benefit, not cosmetic sameness.
- Hunt visits: Polly flies in on the normal fly pose (except the Returning Haunt gloat, which flies
  in on hauntTaunt); the result shows only on the exit: flyAngry on mastery, flyGrin on haunted.
- Daily: Polly stays at the wall for the whole Daily, arriving by flying in from the top-left
  when play starts (the same moment as before), and flies out before Results (win flyAngry, loss
  flyGrin).
- Daily sound: Polly is silent on right answers and the win; short squawk on the first miss;
  laugh on the second miss (the loss).
- Home: after a win she rests in master angry until the player loses a Hunt; her resting pose
  updates after a Hunt without an app restart; sleeping Z's loop; she wakes only when Home loses
  focus.
- Polly sleeps only on Home (a doze timer from when Home gains focus; touches do not reset it,
  Pete accepted), never during a Hunt or the Daily.
- Daily results card: Polly's pose only, no line (Pete).
- Home: after a long absence she looks watchful until the first completed Hunt of the session,
  then relaxes (Pete).

## Next Work

**Single most valuable next step:** clear the remaining launch blockers. Polish and new
animation wait until these are done.

In order:
1. Paste the privacy and support URLs into App Store Connect; privacy answer "Data Not Collected".
2. Crash reporting (nothing currently reports crashes off-device).
3. Store listing: screenshots and description.
4. Free vs paid: Pete's decision.
5. Android device testing beyond one phone.
6. Buy polywords.app, then custom domain + share-link switch.

The Daily content-capacity task is complete; do not reopen it just to manufacture more volume.
Current active design work is the Home redesign (outdoor terrace) unless Pete redirects. Daily
castle art remains unlocked for a later focused pass, but its gameplay/content system is not the
current blocker.

Home, open:
- Next session (Pete, 2026-10-21): the movements (the grind sound is DONE and locked, below). Moon rise (with the streak), shooting stars, the Daily challenge castle reveal, the Hunt dive, the transition into the Polybook. Ask Pete for the sequence
  and feel of each before building; do not assume.
- Hunt and Polybook empty-space art is DONE (Pete, 2026-10-21): crowns on the Hunt button; Polybook stays plain by his decision so the Hunt reads as the main button. A book and a Polly silhouette were tried and
  rejected. Nothing is pending from Pete on this.
- Crown art is Pete's flat white/gold PNGs (about 100x72, `crown_white.png`, `crown_gold.png`); judged fine at size. Do not recolor the Results crowns for this.
- Home grind sound LOCKED (Pete, device-tested 2026-10-22: "perfect"). The terrace plays its own cue `terraceStoneShift` (`stone_rumble.mp3` at 0.41, the gauntlet's `stoneRumble` level), warmed by `warmTerraceEntranceSfx()` on every Home focus (`useTerraceEntrance.ts`). Cause of the old silence: Home reused the Daily's `dailyStoneShift` (0.22, about 6 dB under the gauntlet, chosen to sit under the Daily's claim sound) and never warmed it; the exact split between the two was not isolated. The Daily's `dailyStoneShift` is unchanged. The grind runs about 0.5 s, shorter than the gauntlet's moment; Pete accepts that.
- Pete's own saved DEV overrides equal the locked defaults; a fresh install shows the defaults.
- Not decided: whether Hunt/Polybook need a delay so the press-pop shows on a quick tap (navigation fires on release).
- Known, pre-existing: `dailyDevControls.test.mjs` fails on a clean tree (not from the terrace
  work, not investigated).
- Open for Pete: where the cage base rests and the fall path from the logo; whether the
  app-opening crash still plays; any console entrance; moon rule (2026-10-13 states vs the mock's
  phases vs other); floor color; redraw of the wall's two angled pieces; sky placement of moon,
  bubble and stars; which 2026-10-13 rulings still apply (the lockdown section lists them as not
  yet confirmed); whether the Daily streak badge (small number on the Daily plate, shown when
  streak > 0) stays and where (Pete has not answered).
- Still to check in code before building: how the real Hunt entry currently runs; what the Daily
  zoom lands on; what grants the timed gold feather (`grantGoldFeather` in `useGameStore.ts`,
  called from two places) and whether any moon-won state covers it; that wall/console geometry can
  be bottom-anchored like the Boss ledge and `app/ui/dailyCastleScene.ts`.

Hunt momentum feedback, open:
- Pressed-card glow is clipped by its own card view (`CLAUDE.md` known issue). Left as is.
- A device screenshot at STEADY shows the lifted card overlapping the "SWIPE UP TO CLAIM" label.
  Not investigated; separate job.
- The four momentum rungs follow the streak colour even while HUNTED (existing behaviour). Pete
  has not ruled.
- The board's top spacing (`DEFAULT_GRID_PADDING_TOP` = 110 in `tileTextLayout.ts`, shrinking to
  48 on short boards) was raised for the old torches, per the stale comment on
  `styles.gridWrap` in `MaskBoard.tsx` (that style's own 110 is overridden at runtime). Check on
  a phone before changing.
- Gauntlet black-strip bug: resolved 2026-10-28 by removing the recess/hole layer from
  `BossGauntletSpines.tsx` (Pete: the gauntlet looks fine without holes). Only matters if holes return.
- 2026-10-28 (pushed, `b08e120` and `7c299e6`): `StoneWall2.png` is the shared wall; new gauntlet
  stones and crowns are in; wall strain shake by tier works; new Hunt chime `correctClaimHunt` plays
  when the book accepts the card. See `CLAUDE.md` for details.
- OPEN: the FELL OFF wall zoom is committed but not visible on device.
- OPEN, undecided (Pete): HUNTED soft-thud book entrance, card dealing speed by tier, a foreground
  jolt on reconnect. The gauntlet swipe-up chime still plays at release; the Daily's correct sound is
  not ruled on. A white box at the HUD top-left was seen once and not investigated. Check the full
  Pixabay licence before launch (the chime mixes in a Pixabay hit).
- Unused art still in the repo: `wall-veins/veins*.png`, `shelf*.png`, `brick1-3_rn.png`,
  `crown-marker.png`, `spine.png`, `tools/art/build_wall_veins.py`. Delete only with Pete's say-so.
- Possible dropped or late claim/trap haptic cue (`CLAUDE.md` known risks) is unconfirmed on
  device.
- Android pass deferred: shadow colour only on Android 9+, haptic styles collapse to three
  strengths.
- Unused haptic cues and dead overlay code are listed in `CLAUDE.md`.

Open, needs Pete's ruling:
- FAST `fast_r04` "WHAT BREAKFAST BREAKS" contains the headword (BREAKFAST).
- `app/screens/dailyDevControls.test.mjs` passes on Node 24 (Pete's PC, CI) but fails on
  Node 22; unmerged fix branch `fix/dev-controls-test-esm` exists. Until then, run `npm test`
  on Node 24.
- Permanent Polly turn: her lines (about 15) and the milestone (placeholder 12 masteries).
- Whether "Bird brain" should also show on the in-round BUSTER panel (Results only today).
- Whether a rematch win should count as `playerBeatPolly`. It does today, so it extends the
  win streak and feeds Polly's mood.
- DEV rematch test run: a dev run writes to the real save in about seven places (REAL ids,
  hidden pairs, Haunt pruning, run completion, Polly lines, Gold Feather, resume snapshot), so
  it needs a backup/restore or a throwaway save. Not built.
- Timer: undecided. No Hunt timer exists today; decide from real TestFlight player data, not
  developer test swipes.
- More boss words: the rematch is a stopgap for players who master all of them.
- Polly sounds: she has no angry sound. Her only sounds are the short squawk (which Pete calls
  "the laugh") and the longer laugh. One is needed for when she loses (moments and source
  undecided). Her fly-ins are silent (some Hunt visits squawk on landing); Pete thinks they should
  have sound.
- Face rig: its angry brow does nothing without the beak also changing; rigging the beak for an
  angry face is a big job, parked.
- Pause button: Pete wants to move it eventually. The boss-entry bubble overlaps it for about a
  second; Pete said leave it.
- Mastery pose: Results shows the bent sulk, the Hunt shows angryYell. Undecided whether they
  should match.
- The Haunted gloat's flyGrin exit is rarely seen because Results cuts in; Pete is leaving it.
- Poses and sounds still unruled: Returning Haunt gloat, game over laugh, haunt failed laugh.
- Unused master art: in the Hunt table, sulk, asleep, jumpAngry, masterShock and masterAngry (no
  visit uses them); never referenced anywhere: laugh01, laugh02, blink, neutral, smirk,
  sulkUpright.
- Small-phone fit of the fixed-size Polly boxes is unchecked; the Daily size was checked only on
  390x844 and 375x812, by calculation.
- Never found: why the old laugh loop did not loop on device, and the cause of the old 2 to 2.5x
  Hunt size bug.
- Only master angry was checked for leftover white background pockets; the other master poses
  were not checked.
- Some Daily bubble lines wrap with one word alone on line two (for example "BAT."); Pete writes
  the lines, so nothing was changed.
- Two Daily entry-screen button colors, `#F2EEF8` (`startButtonText`) and `#CFC7DC`
  (`startHomeText`), are flagged by the design checker on every edit of
  `DailyChallengeScreen.tsx`. They date from 64418b1 (2026-09-29) and are not in `DESIGN.md`'s
  palette. Pete has not ruled whether they are intentional; do not change them or add checker
  ignores.
- Unverified on device: whether iOS swipe-back works on the Daily screen in this build, and the
  re-entry test for 4c1f6d6 (finish with a final miss, swipe back within about 2 s, return).

## Immediate sequence (2026-10-27)

1. Finish one full real-device Hunt-pause behavior pass: Resume exact state; Pause -> Home -> RESUME HUNT; Pause -> Settings -> Back/Home; KEEP HUNTING; confirmed LEAVE THE HUNT. No more visual tuning unless that pass exposes a real defect.
2. Correct the splash **rendered scale/fit** while preserving the approved artwork.
3. Audit Daily's equivalent pause/settings behavior only if it is a real beta-path gap; do not redesign Daily.
4. Run one systematic phone-readability pass across supporting Hunt/Daily/Polly/results/settings text; no piecemeal random font inflation.
5. Freeze the candidate and run the First Flock external beta.

Do not start an SDK 58 migration, new progression systems, more Daily content, a full Polly articulation project, monetization, or remote analytics merely because the core build is close to beta.

## Do Not Work On Yet

- **Home scope boundary (updated 2026-10-21):** the outdoor terrace is the real Home; follow
  `docs/HOME_SCREEN_LOCKDOWN.md`. The approved menu label is POLYBOOK. Do not perform an unrelated
  cosmetic pass, and do not build movement Pete has not described. Moon faces
  and new Polly animation systems remain deferred while the room/console geometry is established.
- New Polly art or WEBP restoration before the articulation inventory.
- Production Home life-profile animation before the DEV Neutral proof.
- Crown/Polybook progression, additional relationship states, or Polybook interior changes.
  The permanent Polly turn is approved in principle but unbuilt (lines unwritten).
- Changes to the device-approved `BROW_FOLLOW = 0.33`.
- Decorative passes on approved screens other than the Daily Challenge (its art is unlocked,
  Pete 2026-10-11).
- Re-skinning strong native surfaces merely to make screens look alike.
- Deleting the old Lexicon rollback path without Pete's decision.
- Deleting the old Polly sprites or `POLLY_POSE_SCALE` before every consumer has moved to the
  master set (`CLAUDE.md` lists the remaining consumers).

## Parked: Polly Rig 3 (after launch blockers)

1. Inventory clean separated Polly art in `assets/images/polly/rig/`, `rig2/`, `flight-rig/`,
   poses and large PNG sources; identify reusable vs rough/dormant pieces.
2. Build a DEV-only articulated Neutral prototype in the Polly Face Rig workbench using real
   part movement rather than whole-sticker rocking.
3. Prove one 30–60 second Neutral living sequence: blink + glance/attention + weight/posture
   shift + settle, with irregular quiet gaps, before adding other life profiles or production Home.

- Polly reads as alive without dialogue or labels.
- Motion comes from believable articulation, not rotating the whole image.
- Reaction and resting disposition remain distinct; apparent size/anchor stays stable.
- No clipping or alpha defects.
- Reduce Motion remains authoritative in production.
- PC proof precedes production Home and phone verification.

## Protection

Preserve every stash and unrelated worktree change. Pete's local art is his; do not touch
untracked/local art without approval. No branch merges without Pete's approval.

## 2026-10-23 (evening): Polybook cage and bottom nav
- Cage built from Pete's mockup (see CLAUDE.md): rope + mirrored cage top-left, falls on the book's thud the first Polybook open per app launch, broken on the floor after. Fall and crash sound (`polybookCageCrash`, plays at the slam) confirmed on Pete's phone..
- Bottom nav removed from Polybook and Settings; HOME button added to both (`HomeButton.tsx`). The Polybook keeps the nav's 86 pt bottom band so the book did not move; Pete can reclaim it. `BottomNav.tsx` and the old `polybook_cage.webp` deleted.
- Matching round gold icon buttons (settings gear on Home, Hunt pause, HOME on Polybook/Settings), all `UI_ICON_BUTTON_SIZE` 44 pt via `UiIconButton`; replaced the thin grey SVG gear, the grey pause bars and the HOME pill. The Home gear sits under the console and is drawn above the console shadow (committed b03635b). Phone-confirmed 2026-10-23: gear evenly gold above the shadow, dives still end in the gold flash, Hunt pause at 44 pt clear of the controls.

## 2026-10-29 (part 2): Daily pause card and HOME stack fixes
- Daily pause icon and card built (73e178e): round gold pause top-right beside the DAILY # plate, ONE card with Polly and her bubble over CONTINUE / HOME / SETTINGS, no QUIT, clock frozen while open (see CLAUDE.md). Pete confirmed the pause card on his phone.
- HOME stack fixes: the Daily's HOME and NOT NOW (1b5a1da) and the Hunt Results HOME (4dfa425) now return to the existing Home with `{ pop: true }` instead of pushing a second Home over the finished screen. Pete confirmed the Hunt Results fix on his phone.
- Open: the Hunt Results journal link (`ResultsScreen` `handleOpenJournal`) opens the Polybook over the Game, not from Home. Pete has not ruled on it.
- Open: if midnight passes while the Daily pause card is open, CONTINUE keeps playing yesterday's Daily and finishing it records a result under yesterday's date (going HOME instead discards it). Not changed.
- Open: possible clue-timer race when the Daily closes: Home's focus `loadDailyResult` may read the saved session before the Daily's leave-screen save lands, losing a few seconds of the round's clue timer in the player's favour. Inferred from the order things run; not seen on a phone.
- Open: the splash screen is very tiny and needs adjusting (Pete, 2026-10-29; the scale/fit correction already listed above).
