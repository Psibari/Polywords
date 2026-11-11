# POLYWORDS Current Context

Updated 2026-11-10 (Polybook MASTERY tally, KING counter, KING plaque art; see the 2026-11-10 entry at the end). Updated 2026-11-07 evening (audio rebuild after a long absence for the build 17 freeze, DOWN trap reworded, fairness audit; see the last entry). Before that, 2026-11-06 (Hunt wrong-swipe and book-shut sounds, stronger Hunt haptics, pause button moved; see the 2026-11-06 entry at the end). Earlier, 2026-11-04: the Daily entry card teaches the mode once and gates every attempt; the graded castle gold hit is removed; the breach was built 2026-11-04/05. Build 15 accessibility/beta hardening, the Build 16 iOS audio watchdog fix, true Hunt pause/quit, and the dedicated POLYWORDS DEV phone-testing path are committed and pushed; device-validation status is recorded below. Current state + next work only. `CLAUDE.md` owns durable architecture;
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
- **Branding / splash:** the current app icon is approved and passed device inspection. The splash artwork is approved, but Build 15 proved its rendered mark is too small under the current contain treatment; the remaining work is a scale/fit correction, not a redesign. Scale/fit correction DONE 2026-10-29 on the POLYWORDS DEV build (`eebdebb`, `c99364b`; see 2026-10-29 part 3). Not yet verified: TestFlight (needs a new build), Android (not tested; 288 chosen to avoid clipping), Android 12+ icon masking (unknown).
- **TestFlight:** build/submit/install works end to end. Build 16 is the current verified production-native baseline; store name is `POLYWORDS: KNOW WHAT I MEAN?` (Pete changed it and saved it in App Store Connect 2026-11-07; it was `POLYWORDS: Hunt or Be Trapped`; subtitle `Claim meanings. Reject traps.`, also saved 2026-11-07); the home-screen name stays `POLYWORDS` from `app.json`; iPad support is off. Use TestFlight for release-candidate/native-production verification, not every ordinary JS/TS iteration.
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
  updates after a Hunt without an app restart. (Sleeping Z's and waking on blur are built but
  switched off, see the next line.)
- Polly does not sleep anywhere right now. The Home doze is switched off (Pete, 2026-11-11,
  `HOME_DOZE_ENABLED` false in `PollyHomePerch.tsx`; see the 2026-11-11 entry at the end). She never
  slept during a Hunt or the Daily.
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
- Pressed-card glow: FIXED 2026-11-07 (`styles.tile` overflow now visible), device-checked by Pete on all four tiers. Uncommitted until Pete commits.
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
- DONE 2026-11-02: the FELL OFF wall fall now works and Pete approved the look (see the 2026-11-02 entry).
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
2. Correct the splash **rendered scale/fit** while preserving the approved artwork. DONE 2026-10-29 on the POLYWORDS DEV build (`eebdebb`); not yet verified on TestFlight (needs a new build) or Android (not tested; Android 12+ icon masking unknown).
3. Audit Daily's equivalent pause/settings behavior only if it is a real beta-path gap; do not redesign Daily. DONE 2026-10-29: Daily pause icon and card built (`73e178e`).
4. Run one systematic phone-readability pass across supporting Hunt/Daily/Polly/results/settings text; no piecemeal random font inflation.
5. Freeze the candidate and run the First Flock external beta.

Do not start an SDK 58 migration, new progression systems, more Daily content, a full Polly articulation project, monetization, or remote analytics merely because the core build is close to beta.

## Do Not Work On Yet

- **Home scope boundary (updated 2026-10-21):** the outdoor terrace is the real Home; follow
  `docs/HOME_SCREEN_LOCKDOWN.md`. The approved menu label is POLYBOOK. Do not perform an unrelated
  cosmetic pass, and do not build movement Pete has not described. New Polly animation systems
  remain deferred while the room/console geometry is established. Moon faces were dropped
  (Pete, 2026-11-08).
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
- Open: if midnight passes while the Daily pause card is open, CONTINUE keeps playing yesterday's Daily and finishing it records a result under yesterday's date (going HOME instead discards it). Not changed. DONE (`62a23b3`): CONTINUE (`handleContinue`) now checks for an expired session first and shows the TIME'S UP card instead; no result is recorded.
- Open: possible clue-timer race when the Daily closes: Home's focus `loadDailyResult` may read the saved session before the Daily's leave-screen save lands, losing a few seconds of the round's clue timer in the player's favour. Inferred from the order things run; not seen on a phone.
- Open: the splash screen is very tiny and needs adjusting (Pete, 2026-10-29; the scale/fit correction already listed above). DONE 2026-10-29 on the POLYWORDS DEV build (see part 3); TestFlight and Android not yet verified.

## 2026-10-29 (part 3): Home doze nod, splash logo and hold
- Home doze reworked (77efd89): a nod with the eyes closing, one hard cut to the asleep pose, then a short settle, replacing the old cross-fade (see CLAUDE.md). Pete tested it on his phone: improved. The remaining visibility of the art swap (rig art and `asleep.png` are different drawings) is accepted. Animating the angry resting pose is deferred. The Daily has no sleeping pose and needs none.
- Splash logo (eebdebb): `assets/splash-icon.png` is now Pete's transparent, tightly cropped logo (1356x476) and the splash plugin entry in `app.json` has `imageWidth: 288`. Cause of the tiny, boxed splash: `imageWidth` defaulted to 100, and the old image was opaque with a `#250843` background drawn against the `#241338` splash colour. Phone-confirmed on the POLYWORDS DEV development build: large, no rectangle.
- Splash hold (c99364b): the native splash stays up until Home has mounted (`NavigationContainer` `onReady`), with an 8 s failsafe; the boot placeholder View is now `#241338`. The handoff into Home was phone-confirmed clean on the dev build.
- Open: `scripts/generate-brand-icons.ts` would overwrite the splash image with the old 1200x307 lockup (line 45). Do not run it until it is updated. DONE 2026-10-29: the script no longer writes the splash image (`26e0503`) or the app icon (`524b307`).
- Open: the Android adaptive icon (`assets/adaptive-icon.png`, written by the script) is still the old flat July design, not matching the hand-made crown `icon.png`. How Android crops it is unverified, and Android is not being tested yet. Pete to decide. DONE (`62a23b3`): `assets/adaptive-icon.png` is now the hand-made crown icon (`icon.png` scaled to 531 px, centered on `#240353`, 1024x1024) inside the Android safe zone (a circle 66/108 of the canvas). `scripts/generate-brand-icons.ts` no longer writes it and carries a comment saying so. Do not regenerate it.
- Open: if a font fails to load, the boot gate in `App.tsx` never opens (the `useFonts` error is not checked). The 8 s failsafe brings the splash down, but the app then stays on the blank boot View. DONE 2026-10-29 (`7ee75fe`): a font error now counts as fonts finished, so the app boots with the system font. Pete has not seen a font failure on a phone.
- Open: Home art could pop in late after the splash hides (`onReady` does not wait for images to decode). Not observed.

## 2026-10-30: Daily expiry, result cards, larger text
- Daily expiry (`62a23b3`, `2d7f014`): an unfinished Daily is LOST when its day ends. No result, no streak credit, no Gold Feather; a new puzzle starts. The player sees one plain card (no Polly, no button): headline "TIME'S UP", small line "DAILY #N" (N = the unfinished Daily's own number). It holds 2.5 s then fades; a tap closes it sooner. It shows once, also when they come back the next day. Files: `app/game/dailyExpiry.ts` (`isDailySessionExpired`, `readExpiredDailyNumber`), `app/ui/dailyExpiredCopy.ts` (words; change only on Pete's word), `app/components/DailyExpiredCard.tsx`, store `dailyExpiredNotice` + AsyncStorage key `polywords_daily_expired_notice_v1`. Detection is in `loadDailyResult`; guards in `DailyChallengeScreen` (`handleContinue`, `handleClaimStart`, `handleClaim`, AppState active). Known gap: the 250 ms clue timer does not check for midnight; the card appears at the next interaction or app return.
- Result cards (`6051dfd`; headline lettering REPLACED 2026-10-30, see the next entry): Mastered, Banished and Haunted show ONLY the headline and the word (headline 40, word 56). Removed: "Not one of Polly's traps. / You saw through it.", HAUNT BROKEN, and the Haunted missed phrase / TRAP CLAIMED lines (never show a meaning, trap or hidden pair: words recur, so it becomes an answer key). KING/BUSTER (`RematchOutcomePlaque`) never had body text: headline 36, word 42, CONTINUE 18. `splitHauntedDetail` and the `plaqueDanger*` styles in `MaskBoard.tsx` are now unused (left in place). New `carvedStonePlaque` PlaqueText material (see CLAUDE.md).
- Text sizes (`6051dfd`; Pete, 2026-10-29: nothing below ~18 for copy): Polly speech bubble default 23 (line height 25) via `POLLY_BUBBLE_FONT_SIZE` / `POLLY_BUBBLE_LINE_HEIGHT` in `PollySpeechBubble.tsx`, Results included. Onboarding, HUD lesson, Boss/Haunt intro and Daily entry card text enlarged (numbers only).
- DONE 2026-10-30: plaque lettering (see the next entry).
- Open: the Hunt pause button overlaps Polly's bubble. Not blocking; noted.
- Open: TestFlight splash build skipped (monthly build quota); the splash logo is tiny there.
- Open: the Hunt Results journal link stays as it is (Pete).
- Open: push the three commits. DONE 2026-10-30: the three code commits were already on origin; the doc commits are pushed too.

## 2026-10-30 (night): plaque lettering, KING/BUSTER presentation, plaque sounds
- Lettering: the fixed headline is carved into the plaque art (`*-lettered.png`); only the round's word is live text. MASTERED Cinzel Black; HAUNTED and BANISHED Caesar Dressing (Banished chipped and cracked); KING now carries carved `KING` text under the crown (reverses the old "no literal KING text" note). The white fringe was cleaned off the plaque art and the Mastered Hero Book pieces (`b8cc8d8`). Details and file names: CLAUDE.md "Result plaques". Pete approved all of it on a phone.
- MASTER -> KING: the Mastered plaque shrinks and the KING plaque pops up from it with a gold shine (Pete: "perfect"). MASTER -> BUSTER unchanged and approved. The rematch lead-in card still reads MASTER (not MASTERED).
- Bug fixed: BUSTER/KING started on their final plaque because reduce-motion reads `null` until the system value loads.
- Sounds (all Pixabay, supplied by Pete): MASTERED card and rematch MASTER card = trumpet fanfare (the odd old sting is gone); MASTER -> KING = swoosh, then a bigger KING fanfare at the pop; BUSTER = BU-drop punch, then a failure sound 250 ms later. Pete confirmed by ear that they play correctly.
- DEV: Settings > Development has previews for every result plaque.
- Open (Pete): Polly ANGRY SOUNDS. She has sounds for being happy (two squawks, a laugh, two laughs, a chuckle, two chuckles) but nothing angry for when the player WINS. Pete wants one or two angry sounds, next session. Source and the exact moments are not decided (she is already shown angry on a win; sounds would go with that).
- Open: add the source page URLs for the four plaque sounds to `assets/audio/LICENSES.md` (Pete has the Pixabay links).
- Open (unchecked, optional): the Haunted book rig and `banishcrown.png` fringe; a tiny speck at the left edge of the Mastered plaque; word position on the plaques was set by measurement and may want small nudges; the other `MASTER` label near `MaskBoard.tsx` line ~2487 was not investigated; the `masteredResult` sting file/table entry is likely unused now (check before removing).
- Still open from before: onboarding and Daily entry text sizes need a look on the device; TestFlight splash build deferred; Hunt pause button overlaps Polly's bubble; FELL OFF wall zoom is invisible.

## 2026-10-31 (night): Polly reaction sounds (`be88a91`)

- Wordless Polly reaction sounds are in and wired (Pete: no spoken words, ever). Made with Higgsfield Seed Audio text-to-speech using the two repo squawks as references; levelled and cut by Claude, picked by Pete by ear. Pete says Higgsfield gives him ownership and commercial use; his reference squawks came from Pixabay (free, commercial). Terms are recorded in `assets/audio/LICENSES.md` as read 2026-10-31; the Pixabay page URLs and the two original squawk files are NOT yet listed there.
- Pools: ANGRY `pollyAngry1..6` (random, never the same twice in a row) and STARTLED `pollyStartled1..4` (same rule). Pure picker `pickReactionSfx` and the `VisitSpec` fields `sfxGroup` (landing), `exitSfxGroup` (exit start) and `exitSfx` (one fixed exit sound) live in `app/game/pollyVisitPolicy.ts`; `app/audio/pollyReactionSfx.ts` keeps the last pick per group, shared by Hunt and Daily.
- Placement: Hunt win (both mastered events) angry on fly-off; Daily win startled on landing and angry on fly-off; first Hunt clean sweep startled on landing, repeat sweeps silent; streak x10 plays `pollyEmbarrassedExit` on fly-off only; first arrival at RAZOR SHARP in a run plays one startled pick (`shouldPlayRazorStartle` in `huntFeedbackPolicy.ts`, module-level `lastRazorStartleRunSeed` in `GameScreen.tsx`; muted while the HUD is hidden and during an unfinished onboarding run). Reduce Motion does not mute them.
- Volumes are the 0.42 first guess. Pete tested on his phone (POLYWORDS DEV) and approved all of it, including Claude's guessed streak x10 and RAZOR SHARP placement.
- `pollyLaughChamp` and `pollyLaughBurst8` are in the repo but unused by Pete's ruling; nothing existing was replaced.
- Verification: `npx tsc --noEmit` clean; full `npm test` passed on Pete's machine.
- Closed: the "Polly ANGRY SOUNDS" open item above is done (angry and startled pools).
- Still open: source page URLs (with dates) for the Pixabay squawks, the four plaque sounds and the Higgsfield terms in `assets/audio/LICENSES.md`; the two original squawk files are not listed there yet.

## 2026-11-02: FELL OFF wall fall, momentum armor rulings

- Wall fall (see CLAUDE.md "FELL OFF wall fall"): background falls down a hole, crashes, a beat, then the camera (HUD, book, cards) falls and lands on top; all ends at rest. Fixes: the fall used to be cut short by a fixed 430 ms timer (every real fall reported `finished=false`); it now ends on animation completion. Hole look = stone rings + dim glow at the bottom + side haze, plus air streaks rushing up. Pete: "the visuals look good, keep as is."
- Sounds LOCKED (Pete heard both pairings): background slam = hard heavy impact, camera slam = boulder impact (both from dragon-studio, supplied by Pete); the whooshes are off (`WALL_FALL_WHOOSH_ENABLED` false). Pete does not think falling whooshes are needed. Both impact files are from Pixabay (Pete confirmed); their page URLs are recorded in `LICENSES.md` (not opened by Claude). Tails are untrimmed (2.1 s / 2.9 s).
- The old punch `streakBreakImpact` still plays at the moment of the break, on top of the first whoosh. Not ruled on.
- Left in on purpose: the dev `FALL 3` button (`__DEV__` only) so the fall can be replayed while tuning sounds. Remove when Pete says.
- Momentum ARMOR (Pete's rulings, NOT BUILT): once UNTRAPPABLE (streak >= 9, chain multiplier >= 2.5), the next wrong answer costs no feather. The word still counts as wrong, the streak resets to 0 and the tier falls to STEADY. Armor returns every time UNTRAPPABLE is reached again (no counter, no cap). It protects feathers only. It works on the boss word, not in the boss hidden-tile gauntlet. Higher survival is fine with Pete. Share line idea: `Best chain N - Armor xN` (armor part only when above 0). Armor HUD look and Polly's reaction are undecided: it should match the wall shake and music speed, and Polly should be affected.
- Armor build, when started (separate prompts): (1) engine in `resolveLifeLoss`/the three wrong-swipe paths in `polyRunEngine.ts` with tests, modelled on Mercy, after confirming the gauntlet never calls `resolveLifeLoss`; (2) HUD, sound and Polly signal; (3) share line; (4) fix the stale SHARP HUD lesson text (pinned by `hudLessons.test.ts`) and add an armor line.
- Squawk licences recorded in `assets/audio/LICENSES.md` (`2691480`).
- Open: the quit warning in `PollyExitConfirm.tsx` still says "Your score and remaining feathers are lost" (there is no score); onboarding follow-up checks; Hunt pause button overlapping Polly's bubble; TestFlight splash build; Firefly long-laugh licence terms (see 2026-11-08).
- ARMOR ENGINE BUILT (2026-11-02, engine only, no HUD/sound/Polly/share yet): while the chain is UNTRAPPABLE (`isArmored`: multiplier >= `UNTRAPPABLE_MULTIPLIER` 2.5, i.e. streak >= 9, and not `gauntletActive`) a wrong swipe costs no feather. It goes through `resolveWrongSwipeLoss` in `polyRunEngine.ts` on all three wrong-swipe paths; armor is checked before Mercy, so an absorbed miss never spends a Mercy revive. The word still counts wrong (`mistakesOnWord`), streak and chain reset, FELL OFF still fires (severity 3). New state: `armorAbsorbed` (UI flag, cleared by `consumeArmor`, store action `consumeArmor`) and `armorUsed` (per-run count for the share line). Old saves restore as false / 0. The gauntlet never loses feathers (`resolveMysteryTile` has no life loss), so nothing changed there. `submitWrongSwipe` in the store has no caller in the UI. First-run HUD lesson capture ignores an armor-absorbed miss (it takes no feather). Nothing in the UI reads `armorAbsorbed` yet, so a player currently sees no sign of armor. Tests: 'ARMOR' block in `polyRunEngine.test.ts`.
- Armor rulings, 2026-11-02 (Pete): armor works at ANY feather count, including the last one ("if you're untrappable, then you're untrappable"; extra breathing room is the point). Polly keeps her existing near-miss reactions for now; Pete wants to see how it looks first. The armor LOOK is undecided (Pete is thinking). Share line `Best chain N - Armor xN` not yet answered. KNOWN GAP to settle with the look: at one feather the HUD shows HUNTED and the wall shake is off, so an armored player at one feather currently has no on-screen sign of it.
- Share line for armor: PARKED by Pete (2026-11-02). Nothing is added to the Hunt share message (`buildShareMessage` in `ResultsScreen.tsx`, today: title + verdict, then the square grid). We will design it together AFTER the armor visuals are done, with creative wording; do not add a line before then. Before building: find where best chain is saved (`bestCombo` exists in `GameState`) so the share number matches Results.
- PINNED for the NEXT TestFlight build (Pete, 2026-11-02): the build-size warning ("your build is 300-something MB, you can make it smaller"). Pete will bring the EXACT message (which service sends it, and which number it quotes: download size vs installed size) when the next build runs. Do not start the shrink work before that. Measured so far (source files, not the build): `assets` 163 MB, of which ~106 MB is referenced by code (PNG ~85 MB in 163 files, audio ~19 MB); ~57 MB is not referenced by file name (mostly `assets/images/vault/quill.glb`, 28 MB) and should not be in the bundle. On the 30 biggest referenced PNGs (54 MB): lossless WebP ~32 MB, lossy q90 ~5 MB (needs an eye check). Many images exceed iPhone width. Switching a file to .webp means editing its `require`s. The rest of a 300+ MB build is the app itself, not yet analysed. Plan: exact message first, then before/after samples for Pete to judge, then the image pass in small steps with a phone test after each, audio last.

**2026-11-02 (evening) — cleanup, delegated by Pete ("take control of the technical part").** Commit `a172f0d`: removed unused imports (`LinearGradient` in MaskBoard/BossGauntletSpines, `heroBookMaterial`, `Circle`/`Path` in HomeTerraceScene, `Easing`/`FONT_SIZES` in GameScreen), four unused layout constants in MaskBoard and one unread variable in audioSession. No behaviour change; type-check clean. Deliberately NOT removed (may be parked work, Pete to say): `splitHauntedDetail`, `BusterOutcomeOverlay`, `getResolvedTileState`, `playSystemStingerWord` (MaskBoard), `hopBig`/`FLYING_POSES` (usePollyAnimator), two unused test variables. Unreferenced assets were audited and left in place: deleting them does not shrink the build (Metro only bundles required files).

**2026-11-02 (night) — UNTRAPPABLE armor look, first pass (Pete's idea).** The whole Hunt top bar is a slab with two faces. While `isArmored(game)` is true (UNTRAPPABLE and not the gauntlet) it turns over on its long edge (rotateX, 460 ms in) to a gold back face that says only UNTRAPPABLE (extruded letters, reference colours `#DDB44A` / `#FFD84D` / `#54404F` from Pete's image), with the feathers kept visible on a dark plate. The word pulses and vibrates once the flip lands, in four levels by streak (9, 12, 15, 18+; `ARMOR_*` constants in GameScreen). A wrong answer flips it back (280 ms) to the front, which shows FELL OFF as before; the wall fall still plays. UNTRAPPABLE wins over HUNTED at one feather, which closes the old no-tell gap. Reduce Motion: no rotation or loops, the face swaps instantly. Dev button `ARMOR STEP` cycles the streak 0/9/12/15/18 to preview it. NOT seen on a device yet; all timings and sizes are first pass. Round chips are not shown on the back face (to confirm with Pete). Still open: sound for the flip, the feather texture on the gold face, the stale SHARP lesson text, the new armor lesson line, the share line.

**2026-11-02 (late) — armor flip rulings after Pete's device test.** Flip animation and timing approved as is. Back face: feathers removed, now the HUD's own dark (`rgba(11,9,32,0.95)`, purpleSoft border) with gold glowing letters, word centred and sized to the face (Pete chose A/C from mock-ups, no cracks; the mock-ups are on the "UNTRAPPABLE back face options" canvas). Flip sound: existing `polybookThud`, played when the bar lands on UNTRAPPABLE (not on remount, not on the way back; the wall fall covers the way back). Tier-up and FELL OFF flashes are now on the word itself (white copies of the label), not a box behind it; the old accent pulse box was dropped. HUNTED now shows at one feather only while the streak is below SHARP (`resolveLiveHuntControl`: `lives <= 1 && readTier === 'steady'`); from SHARP up the streak tier shows, and the wall, glow and shake follow it (they read the same resolver). `huntControl.test.ts` updated to the new rule. Wall fall: pale haze on the shaft sides is now dark. Still open: feather texture on the back face, round chips on the back (Pete to see first), stale SHARP lesson text, armor lesson line, share line.

**2026-11-02 (night, later) — UNTRAPPABLE back face = mock-up E (Pete: "I like E a lot").** Flat bright gold letters on the HUD's dark, a white copy of the word pulsing over them (white-hot), the face's inner glow and gold ring breathing with the pulse, and a soft band of light sweeping across the face; the pulse, vibration, sweep speed and whiteness all rise by level (streak 9, 12, 15, 18+; `ARMOR_*` constants in GameScreen). The offset-copy extrusion was dropped: on device it read as a smeared ghost. Fixed a one-frame STEADY flash before FELL OFF (the FELL OFF text was set in an effect one frame after the streak reset; `showFellOffText` now also follows `fellOffSeverity` directly). Flip sound: Pete heard nothing at the flip with the Polybook thud (about 5 dB under the punch, low pitched; no gating bug found in `playSfx`), so it is now `mystical_chime.mp3` at volume 0.50 (about level with the fell-off punch), played as the flip starts. NOT heard by Pete yet; if it is still silent, it is a bug, not a level problem.

**2026-11-02 (end of session) — corrections and final state of the armor / haunt-loss work.** SUPERSEDES the flip numbers, the flip sound and the haunt-loss card in the entries above. (1) Flip in is 340 ms, not 460 (Pete: faster). (2) Flip sound is `armorFlipChime` (`assets/audio/sfx/armor_flip_chime.mp3`, volume 0.45, cooldown 1500), a shortened and quickened cut of `mystical_chime.mp3`; the 0.50 full-length chime was too long and lingered past the flip. Pete confirmed he hears it (2026-11-02, evening). The licence entry is in `assets/audio/LICENSES.md`. (3) RETURNING HAUNT LOSS CARD (Pete, locked "it looks good"): the old generic panel (HAUNTED / word / "Polly's trap held. It'll be waiting." / "Trap claimed: <meaning>") is gone. It printed the trap's meaning, an answer key (Pete's rule: never display a meaning, trap or hidden pair). Pete chose option A: the carved HAUNTED plaque through the full scrim, with STILL as live carved text in the gap under the baked HAUNTED, dropping in after the plaque settles with the BUSTER punch and haptic; the word sits lower on this card. First try (plain white STILL above the plaque) was rejected as plain. Details in CLAUDE.md. (4) Wall-fall haze is dark. Flashes are on the word only. HUNTED yields to the streak tier from SHARP up. A one-frame STEADY flash before FELL OFF is fixed. (5) Delegated cleanup of unused imports and constants is done (`a172f0d`); `BusterOutcomeOverlay`, `splitHauntedDetail`, `getResolvedTileState`, `playSystemStingerWord`, `hopBig`/`FLYING_POSES`, two unused test variables, and the unused haunted panel styles are left for Pete to decide. Commits this stretch, all pushed: `9dc33d4` to `509e230`. STILL OPEN: round chips on the armor back face, feather texture, share line (parked), stale SHARP lesson text ("CONSECUTIVE CORRECT CALLS BOOST YOUR SCORE." / "KEEP IT GOING TO REACH 3×.", pinned by `hudLessons.test.ts`), an armor lesson line, the quit warning in `PollyExitConfirm.tsx` ("Your score and remaining feathers are lost", there is no score), dev `FALL 3` and `ARMOR STEP` buttons to remove when Pete says, build-size warning (Pete brings the exact message), TestFlight splash build, Hunt pause button overlapping Polly's bubble.

**NEXT SESSION, FIRST ITEM (Pete, 2026-11-02, end of session): DAILY CHALLENGE ONBOARDING.** The only explanation a player gets is the single entry card (DAILY #N / DAILY CHALLENGE / FIVE WORDS · TWO LIVES / "One word connects the clues. Swipe UP to claim it. This is your one attempt for today, and it begins when you enter." / BEGIN DAILY / NOT NOW). Pete: nothing explains that the three clues come in stages, how the Daily works, or how you get a feather, and "we totally forgot about that". Before designing, read the Daily code and these docs for the real rules (clue staging, feather award, Gold Feather, one attempt a day, midnight expiry); do not assume them. Then agree the format (first-run cards like the Hunt lessons, a better entry card, or in-play hints) and the wording with Pete; the wording is his to approve.

## 2026-11-03: UNTRAPPABLE onboarding, armor back face, Daily findings

Pushed: `5f8d0e4` (armor lesson, run-meter rewrite, flip turn sound) and `0173cce` (back face D,
chips, row fit). Pete pushes from Git Bash; Claude has no credentials for this repo.

**Standing ruling (Pete, 2026-11-03).** Nothing in POLYWORDS is permanently locked EXCEPT the swipe
grammar — swipe up claims, swipe right rejects — which never changes. Everything else is open to
debate because the game keeps evolving, including anything marked LOCKED in these docs. Claude
should propose changes to locked items freely, saying that the item is marked locked and why it
should move, and must never change one silently. Pete decides.

**Done (all device-approved).** Fifth HUD lesson for armor; the run-meter lesson rewritten off the
dead score line; streak-targeted lessons spotlight the slab while the bar is flipped; `REPLAY
LESSONS` dev button; the flip turn sound under the chime; back face mock-up D (bone letters, gold
rim); round chips on the back face; the chip row made to fit. Details in CLAUDE.md.

**Regression caught on device and fixed the same session:** pointing `hudTargets.streak` at
`momentumBarTargetRef` while armored put the SAME RefObject on two views; the inner one mounts last
and overwrote `.current`, so the spotlight measured the small box for both lessons. Fixed by keeping
`hudTargets` one-ref-per-view and giving HudLessonLayer a separate `hudLessonTargets` map. Rule:
never alias two HUD target entries to one ref.

**Device bridge note.** Every BINARY file written to Pete's disk through the bridge gains about
5.8 KB of injected C2PA metadata (text files are unaffected). Both armor flip MP3s went to GitHub
carrying it; decoded audio is unchanged. Stripped later, 2026-11-06 (`4a4cfda`). Strip binaries before committing, or
accept the bloat knowingly — it matters for the pinned build-size item.

### DAILY CHALLENGE — findings, nothing built

Counted live 2026-11-03: **110 puzzles — 34 tier 1, 51 tier 2, 25 tier 3.** `DAILY_TIER_CURVE` is
`[1,1,2,2,3]`, so a day burns two tier-1, two tier-2, one tier-3.

1. **Content repeats after 17 days.** Tier 1 is the choke point (34 / 2). Tier 2 and 3 last 25 days.
   The pool is a fixed shuffled rotation indexed by challenge number, so it cycles rather than
   reshuffling. To reach 30 days needs about 40 more puzzles, mostly tier 1. Pete says Daily writing
   is quick, so this is a to-do, not a wall. He does NOT author by tier and did not recall seeing a
   tier scale; `docs/DAILY_CONTENT_WRITING_STANDARD.md` does not mention tiers. WHO assigned the
   existing tiers, and against what definition, is UNRESOLVED — check before writing more.
2. **Retry every 2 hours (Pete's idea) is blocked, twice.** `buildDailySession(dateString)` seeds
   everything from the date alone, so a same-day retry serves the identical five words, cards and
   order — a replay with the answers, which also defeats the bait writing. And more attempts walk
   players into the 17-day repeat wall several times faster.
3. **With all three clues the puzzle is deterministic.** Each distractor baits exactly one clue
   (RACKET: SCAM/HUSTLE bait the scheme clue, DIN/CLATTER the noise clue, PADDLE the tennis clue);
   only the answer fits all three. So guessing early carries risk and pays nothing, while waiting
   carries no risk and costs nothing. Waiting strictly dominates. The CLUE SPEED grid on Results is
   the only counterweight and it is cosmetic.
4. **Feel-engine answer (not built), inside the existing rules.** (a) Tier the correct-claim
   celebration by `revealedClueCount`, which the round already tracks: three clues keeps today's
   presentation exactly, two is brighter, one gets the big castle hit, a startled Polly and a
   heavier coin. (b) Make the clue arrival visibly Polly's move so taking help feels like conceding
   — constrained by the spec rule that she must never cover the clues, blocks or UP lane. (c) The
   dead four seconds between clues could carry a build; riskiest, as it can read as a timer when
   nothing is actually running out. Pete has not chosen.

## 2026-11-04: Daily entry card, jab pool, tint removed

Pushed: `d6f9264` then `71efc5e` (same message on both; together they are correct).

Two things about that push. The graded gold-hit tint never reached GitHub — it only ever existed as
uncommitted changes in Pete's working tree, so removing it produced no diff and appears in neither
commit. And `dailyClaimPresentation.ts` plus its test (the clue-count grade plumbing, 57 lines) went
up in the first commit after sitting uncommitted since 2026-11-03.

**Built; device-tested and approved by Pete (onboarding and entry card 2026-11-06, entry card with the tease line 2026-11-07).** The Daily finally explains itself. Architecture is in the Daily
section of CLAUDE.md. Shape: the entry card is the attempt gate and can never stop appearing, but
the explanation shows only the first time; after that it is the short gate plus HOW TO PLAY, which
reopens the same lines from the same constants. Three real buttons now (ACCEPT CHALLENGE gold, NOT
NOW outlined, HOW TO PLAY outline-only) because a bare NOT NOW did not read as pressable. New flag
`polywords_daily_intro_seen`; new copy module `app/ui/dailyEntryCopy.ts`.

**Pete's copy rulings (2026-11-04).**
- It is POLLY'S CHALLENGE by name. The win card already said YOU BEAT POLLY'S CHALLENGE.
- `FIVE ROUNDS • TWO LIVES` (was FIVE WORDS). ACCEPT CHALLENGE replaces BEGIN DAILY.
- The card says LIVES, never feathers: the reward is a GOLD FEATHER, so "feather" on this card must
  mean only the reward or the player has to work out that the gold one is not a third Daily feather.
- The jab is the GAME's voice ABOUT Polly, third person. A first-person draft was rejected — in her
  own mouth those lines read as the rules explaining themselves. Her own dialogue stays first person
  and stays governed by `docs/POLLY_DIALOGUE_BANK.md`.
- The six approved jabs, verbatim, rotating by challenge number on the short card:
  TRY NOT TO LOSE TO A CARTOON BIRD. / EENY, MEENY, MINY, MO IS NOT A STRATEGY. / WIN THE FEATHER.
  NOT POLLY'S RESPECT. / ARE YOU ALLERGIC TO FEATHERS? / SIX WORDS. FIVE OF THEM ARE POLLY'S. /
  THREE CLUES IS FAIR. AND EMBARRASSING. The first-run card keeps the cartoon-bird line, fixed.
- Nothing may claim the clues get easier. `docs/DAILY_CONTENT_WRITING_STANDARD.md` orders them
  hardest-to-easiest only "when that improves the progression" and the live pool varies, so the line
  would be a lie on some days.

**The graded tint is dead (Pete, device-tested).** "There is no difference at all." A percentage of
brightness was never going to carry the payoff. Removed entirely. The clue-count grading of the
CLAIM HAPTIC survives. The real payoff is the breach, below.

**Process note, cost real time.** `device_commit_files` reported success with no rejections and
advanced the file mtime while the OLD content stayed on Pete's disk; the staging read then served a
stale snapshot that would have been reported as verified. Caught only by comparing byte counts.
Rule now in AGENTS.md: verify disk writes through the device SHELL and compare a hash, and write
CRLF because Pete's working tree is CRLF while the repo is LF.

### THE BREACH — built 2026-11-04/05 (commits ec7e3bb … c2b31db)

The answer to "waiting strictly dominates": the gate itself behaves differently by how many clues the
player needed.

**Art and sound.** The broken gate is `assets/images/dailycastle/gate_door_broken.png`, the same
1399x1597 frame as `gate_door.png`, with the hole where clue planks two and three are painted (so the
broken gate shows the first clue only: `dailyGateShownClueCount` in `app/ui/dailyBreach.ts`). The
four sounds are `breachGateCrack`, `breachCastleRumble`, `breachSmash` and `breachThunder` in
`app/audio/sfx.ts`. All four are Pixabay Content License; sources are in `assets/audio/LICENSES.md`
("Sound effects added 2026-11-04"). Their Pixabay page URLs were not opened.

**Design as built.** Every correct claim, the winning round included, is graded by that round's own
`revealedClueCount`. `resolveDailyBreachTier` gives `open` (three or more clues), `hit` (two) and
`smash` (zero or one), through `resolveDailyCelebrationGrade`, so the Daily keeps one clue ladder.
- **Open:** today's sequence with the bigger gold hit (big3). Its gold hit has a light white wash (peak 0.18).
- **Hit (two clues):** the plaque hits the SHUT gate and presses into it. A shake of 7 pt for 720 ms,
  door cracks, the gate shudders, dust, gold hit big2 (white wash peak 0.45), and a 0.18 screen flash.
  The gate lifts 760 ms after the contact. Sounds: gate crack and rumble. Polly: shocked, a
  straight-up jump, then embarrassed.
- **Smash (zero or one clue):** the plaque breaks through. Broken gate art, splinters, dust, two
  lightning bolts (each with a 0.5 screen flash), thunder, a 13 pt shake for 950 ms, and gold hit big1
  (white wash peak 0.6). Sounds: smash, rumble and thunder. Polly: her fury move (since
  2026-11-06 she is blown off the screen and flies back; see the 2026-11-06 night section).
- **A winning round** plays the tier move first, then today's win (shocked, startled sound, bubble,
  angry fly-off).
- **First lost life:** Polly's dance (laugh, hop, hover pointing with the butter-knife line, land
  laughing) replaces the pointing lean.
- The gold hit's old LOCKED label no longer applies (Pete, 4 Nov). The comment in
  `app/ui/dailyCastleScene.ts` still says "LOCKED"; it is stale. Per `AGENTS.md`, only the swipe
  grammar and the premise are permanently locked.
- **Photosensitivity:** no tier may show more than three flashes in one second
  (`DAILY_BREACH_FLASH_LIMIT`). The smash is at that maximum.

**How it is built.**
- One native clock per tier (`breachHitClock`, `breachSmashClock` in
  `app/screens/DailyChallengeScreen.tsx`) starts in the same tick as the plaque's first leg. Every
  contact visual reads it: the shake, gold hit, flash, bolts, dust and splinters in
  `app/components/DailyCastleStage.tsx`; the shudder, cracks and broken art in
  `app/components/DailyGate.tsx`; the plaque press on the screen.
- The effect layers are mounted with the stage, not at the claim (only while motion is allowed).
- Contact sounds and haptic fire from the first leg's real completion callback (`fireContactCues`),
  haptic first. The four breach sounds are pre-rewound (`PRE_REWOUND_SFX` in `sfx.ts`).
  `BREACH_CONTACT_LEAD_MS` is 0.
- Timing, effects and the flash budget live in `app/ui/dailyBreach.ts`; the gold hit tiers in
  `DAILY_GOLD_HIT_TIERS` (`app/ui/dailyCastleScene.ts`).
- Polly's moves ride the tier clock (`app/ui/pollyDailyBreach.ts`); the dance has its own clock
  (`app/ui/pollyDailyDance.ts`). Which pose layer is visible is decided in
  `app/ui/pollyDailyPerchLayers.ts`, which `app/components/PollyDailyPerch.tsx` composes from. Each
  move has an on/off switch, set to 0 before its clock is stopped, so a stopped move cannot leave a
  stale second Polly (fix 7b1005c).
- Breach haptic tables (`breachHit`, `breachSmash`) are in `BREACH_HAPTICS`, `app/utils/haptics.ts`,
  the one place to tune them. Pete approved them on the phone as built (5630fda). The code comment
  still calls them START values. `Haptics.cancelBreach()` runs in `restBreachClocks` (a new claim, a
  wrong claim, pause, unmount).

**Reduce Motion / Reduce Flashes.** Every decision comes from
`dailyBreachEffects(reduceMotion, reduceFlashes)` in `app/ui/dailyBreach.ts`, which the screen, the
castle stage and the perch read. The gate makes no decision of its own; its effects only move while
a breach clock runs.
- **Reduce Motion, and Reduce Motion still unknown, take the calm path.** No contact beat, hold,
  shake, shudder, cracks, press, dust, splinters, plaque flight, Polly tier move or dance motion.
  Every tier gets a 120 ms gate lift, today's claim chime (`correctClaim`) and the calm gold hit.
  `breachHit` / `breachSmash` fire once at the claim.
- That claim-moment haptic default was not explicitly approved by Pete, who said he has no preference.
- **Reduce Flashes (motion on)** keeps the shake, dust, splinters and the broken gate. It removes the
  lightning, all screen flashes (including the hit's 0.18), the white wash and the halo, and plays
  the calm gold hit for every tier.
- **Where the settings live:**
  - **Reduce Motion:** the phone's own setting (iOS Settings › Accessibility › Motion › Reduce Motion,
    read through `AccessibilityInfo`), OR'd with the in-app Settings › Reduce Motion toggle
    (`reduceMotionOverride`). Both are combined in `useReducedMotionPreference`
    (`app/hooks/usePollyAmbientMotion.ts`). Each hook instance is unknown (`null`) until its own phone
    read returns. The Daily holds its cards for at most 600 ms while unknown
    (`DAILY_PLAQUE_MOTION_FAILSAFE_MS`), then unlocks.
  - **Reduce Flashes:** in-app only, Settings › Reduce Flashes (`reduceFlashesOverride`).
    `useReducedFlashesPreference` is also true whenever Reduce Motion is on or unknown.

**Tests.** Source-reading tests normalise `\r\n` (`.replace(/\r\n/g, '\n')`) because Pete's working
tree is CRLF (270e553, commit message "tieer"). The breach is covered by `dailyBreach.test.ts`,
`pollyDailyBreach.test.ts`, `pollyDailyDance.test.ts`, `pollyDailyPerchLayers.test.ts` and
`dailyHaptics.test.ts` (all in `app/ui/`).

**Known open items.**
- The castle's breach effects (shake, gold hit, flashes, bolts, dust, splinters, cracks, shudder,
  press) have no on/off switch like Polly's. They could freeze mid-effect if a clock is stopped
  mid-run. Not verified.
- The idle cost of the effect views mounted with the stage is not measured.
- A win on one or two clues takes about 6 s to reach Results: Polly's move and hold (2823 / 2960 ms),
  then the win bubble (2.72 s) and fly-out (0.5 s). Accepted.
- On a 375x667 phone the plaque misses the hole by about 22 pt. Pete does not care.
- The dance's hop wing overlaps clue plank 3. Pete accepted.
- The dev build is slow and the three-clue claim chime plays late there, but not on TestFlight.
- The design check flags `#12041F`, `#A98CFF` and `rgb(210,195,235)` in `app/ui/dailyBreach.ts`. Left alone.
- (Closed 2026-11-07) The 4 Nov Daily entry card and onboarding card were device-tested; Pete approved the entry card with the tease line.

### NEXT SESSION

1. **The breach is built** (section above). What is left is its known open items.
2. **Device-test the entry card.** Nothing built on 2026-11-04 has run on a phone. Reset Progress
   gives the long card, DEV RESET DAILY gives the short one. Watch for: the long card on a short
   phone (it scrolls), the three-button hierarchy, and whether HOW TO PLAY reads as pressable now
   that it is outline-only.
3. **Daily in-play lessons.** Still open, and separate from the entry card. Pete's ruling stands:
   teach in play as each thing happens, Polly speaking, with the clue clock frozen (`pausedRef`
   already proves it works). The Hunt's `HudLessonLayer` can NOT be reused wholesale — it is wired
   to Hunt lesson ids and to Polly flying in, and on the Daily she is already perched. The pure
   spotlight geometry IS reusable. Note the entry card now covers most of the six gaps, so the
   in-play set should be re-scoped before anything is built.
4. **Daily content.** 110 puzzles repeat after 17 days, tier 1 being the choke point; about 40 more
   are needed for 30 days, mostly tier 1. Pete's 118-entry workbook was cross-checked 2026-11-06 (see the 2026-11-06 entry): no new words in it. Who
   assigned the existing tiers and against what definition is still UNRESOLVED — settle before
   writing more.
5. (Done 2026-11-06) `armor_flip_turn.mp3` is a Pixabay file (47177), not Freesound; its source is recorded in `assets/audio/LICENSES.md`. No Freesound link is needed.
6. (Done 2026-11-06, `4a4cfda`) The injected C2PA metadata was stripped from both armor flip MP3s without re-encoding.
7. A deliberate 10-ROUND test pass. All first-run testing uses the 8-round fledgling arc, so
   anything that only breaks at ten rounds has been invisible (the chip overflow was one).
8. (Done 2026-11-06) Polly's "Trap. Trap. Trap." chant lives in the lost Returning Haunt laugh (`huntHauntChant`). Pete saw it on his phone 2026-11-07: "excellent".
   Candidates raised: the game-over laugh, or the Returning Haunt gloat. The armor-break moment was
   ruled out as too crowded.
9. Still open from before (the Hunt pause button overlap was FIXED 2026-11-06, `e31898c`); TestFlight splash build;
   build-size warning (Pete brings the exact message); dev `FALL 3` / `ARMOR STEP` / `REPLAY
   LESSONS` buttons to remove when Pete says.

## 2026-11-06: Hunt sounds and haptics, pause button, Daily workbook check

Branch `play-screen-overhaul`. Commits, in order: `e31898c` pause button, `ff24714` wrong swipe sound and book-shut file,
`7029e45` stronger Hunt haptics, `5761ed0` cover-shut slam, `7a0e94b` cover-shut thump, `e28e022` trap-reject haptic.
All six commits are pushed to origin. Details of every number are in `CLAUDE.md`
(Audio and Haptics, Hunt pause). All sound volumes and haptic shapes are TEST VALUES that Pete approved by ear and hand.

- **Hunt pause button** moved to bottom-right (bottom 8), under all of Polly's bubbles. Dev overlay lifted to bottom 58.
  Pete confirmed with screenshots.
- **Wrong swipe** (both directions, all card kinds): `wrongSlap` at judgement, the whistle 125 ms later as the card falls,
  `huntWrong` haptic (Rigid + Heavy +60). The streak-break punch no longer plays here.
- **Book shut:** door slam (`book_shut_door_slam.mp3`) 440 ms after an accepted card lands, with a Heavy thump. Pete: the
  old `book_close_v2` was never heard. He hears the new one and likes the last card as it is.
- **Hunt haptics were weak** against the Daily: card press, claims, trap rejects and the wrong swipe each moved up a
  notch. Heavy is now allowed on those Hunt cues (Pete's override of the Boss-only rule). The Daily's cues were left
  alone by giving the Hunt its own `hunt*` cue names.
- **Correct-RIGHT (trap reject) haptic was not felt at all.** A `[TRAPCUE]` device log showed the cue firing with the shatter
  and `hapticsEnabled: true`, so it was not wiring. Swapping in a Medium-then-Heavy cue made it felt. All three trap tiers are
  now Medium + Heavy +90 until Pete asks to tier them again. In the hand a trap reject now equals a heavy-tier claim.
- **Daily workbooks:** `POLYWORDS_content_data_20260808_REWRITE_PASS.xlsx` and `..._20260817_DRAFT_DRAIN_LOCKED.xlsx` are identical
  (118 rows). The live pools (60 legacy in `dailyPool.ts` plus 50 six-card in `dailyPoolExpansion.ts` = 110) match the workbook.
  Not live: LEAN, LEFT, LEMON, LETTER, LITTER, LOCK, MARCH, MARKET ("Draft Batch 2026-09-02"). Pete set them aside back then for a
  reason and will review them himself later; nothing was imported. Standing flags: LEMON leaks a clue, LEFT has a grammar
  issue; every imported row must be exactly six cards (target plus five traps), each trap tempting one or two clues.
- **Onboarding device test:** Pete device-tested onboarding and the Daily entry card (told 2026-11-06). Closed: on 2026-11-07 he confirmed the entry card with the tease line is solid and approved.

### Open as of 2026-11-06 afternoon (superseded by the end-of-session list below)

1. `assets/audio/LICENSES.md`: the Freesound licence for `armor_flip_turn.mp3` (Pete has it), and source pages/licences for
   `wrong_slap.mp3` and `book_shut_door_slam.mp3` (entries exist and say unverified).
2. Strip the injected C2PA metadata from the two armor flip MP3s.
3. `#FFD700` is the `hiddenPhrase` text colour in `SwipeMask.tsx` (about line 1218, Boss cards); the palette gold is `#F5C842`.
   The design check flags it. Pete's call: keep it on purpose or change it.
4. Daily in-play lessons: re-scope first (the entry card covers most of the gaps).
5. 10-round test pass, Polly's "Trap. Trap. Trap." chant home, TestFlight splash build, build-size warning, and the dev buttons
   (BOSS, BOSS CRISIS, FALL 3, ARMOR STEP, REPLAY LESSONS) to remove only when Pete says.
6. Not done: the trap-reject tiers are identical; the `[BOOKCLOSE]` and `[TRAPCUE]` diagnostics were one-offs and are removed.

## 2026-11-06 (night): licences, tag strip, chant, Daily clue-1 blast-off

Branch `play-screen-overhaul`. Pushed by Pete: `4a4cfda` (armor flip MP3 tag strip), `4be65d9` and `9105af0` (licence
sources). Both pushed by Pete (verified on origin 2026-11-07): `74db273` (blast-off) and `ad27b36` (chant). Details are in `CLAUDE.md`.

- **Licences:** `assets/audio/LICENSES.md` now records the Pixabay source pages for the wrong-swipe slap (48025), the door slam
  (172171) and the armor page flip (47177, credited qubodup / Freesound). Licence summaries were not checked. The page flip is a
  Pixabay download (Pete confirmed 2026-11-06; its page states the Pixabay Content License), so no Freesound link is needed.
- **Armor MP3 tag:** the hidden C2PA tag was stripped from `armor_flip_turn.mp3` and `armor_flip_chime.mp3` without re-encoding.
- **`#FFD700` closed:** `splitBorderColor` (`SwipeMask.tsx` about line 162) is declared and never used, and the `hiddenPhrase`
  state (about line 1218) is never set anywhere. Pete said to leave it; nothing changed.
- **Daily in-play lessons: none.** Pete decided the entry card is enough (the Hunt's first-word pauses are already a lot).
- **Chant:** a lost Returning Haunt now says "Trap. Trap. Trap." (new line `huntHauntChant`, only `HAUNT_FAILED_LAUGH`).
  Pete saw it on his phone on 2026-11-07 and says it looks excellent.
- **Clue-1 blast-off:** on a one-clue win Polly is blown up and back off the top-left, tumbling, gone a beat, then flies back in on
  `fly` and lands. 2960 ms move (was 2870). Pete watched it on the phone, first at 520 ms (a blur, "hit by lightning"), then at
  1000 ms: "perfect". Clue 2 is unchanged (a straight-up jump). The recordings Pete sent (C1, C2 in Downloads) showed the old
  clue-1 move rose only 30 pt higher than the clue-2 jump (apex -120 against -90) and landed on the same perch, which is why
  it did not read as "blown away".
- **Sandbox limits worth knowing:** the Cowork sandbox cannot run `tsx` from the repo (`node_modules` has the Windows esbuild), so
  Claude ran the touched tests from a temp copy; `tsc` was clean. `dailyDevControls.test.mjs` could not run there. Pete should run
  `npm test` on the PC. Git in the sandbox leaves lock files unless deletion is approved; stale `.git/stale-*.lock` files are
  harmless leftovers and can be deleted.

### Open as of the end of 2026-11-06

1. (Done) `74db273` and `ad27b36` are pushed (verified on origin 2026-11-07); Pete reported `npm test` clean.
2. (Done 2026-11-07) The chant was device-checked: Pete says it looks excellent on the phone.
3. (Done) Daily entry card tease line: `ANSWER fast. Surprise Polly.` is the fifth rule line, between `WAIT for another clue, free.` and
   `WRONG ANSWER costs one life.` in `app/ui/dailyEntryCopy.ts`. Pete's idea and wording; device-tested and approved 2026-11-07 ("solid", locked in)
   (the card was not re-measured in points). The long card is one line taller, not re-measured.
4. (Closed) The page flip needs no Freesound link: it is a Pixabay file (47177).
5. The GitHub "Claude" app asked for repository-creation permission. Pete has not accepted; the recommendation was to leave it.
6. Carried over: the 10-round test pass, the TestFlight splash build (costs monthly allowance), the build-size warning, the dev
   buttons (BOSS, BOSS CRISIS, FALL 3, ARMOR STEP, REPLAY LESSONS; remove only when Pete says), the 8 parked Daily words (Pete's
   review), the trap-reject tiers still being identical (accepted), launch work (privacy URLs, crash reporting, store listing,
   Android testing), the friends beta (about Monday or Tuesday).

## 2026-11-07: icon check, stale-doc cleanup, build-size look

- **Android icon: nothing to fix.** The black-and-white cubes Pete saw was `assets/favicon.png` (48x48, Expo starter, first commit) in a browser tab on the web build. `app.json` uses it only as the web favicon. Android uses `assets/adaptive-icon.png` (the crown). Verified from config and files only; no Android build has been run.
- **Dev buttons:** the BOSS / FALL 3 / ARMOR STEP stack is wrapped in `__DEV__` (`GameScreen.tsx` about line 2092), so a TestFlight or production build (release, `__DEV__` false) does not draw it. Only the POLYWORDS DEV build keeps it. Nothing to remove for TestFlight; remove from the source only when Pete says. Each label was not checked separately; only the block start and FALL 3.
- **Build size (read-only look, nothing changed):** `assets/` is about 163 MB on disk (images 142 MB, audio 19 MB). By a name search of the code, about 106 MB across 259 files is referenced and about 57 MB across 73 files is not (this is a heuristic; confirm before deleting). The unreferenced pile includes `assets/images/vault/quill.glb` (28 MB), which Metro would not bundle. The biggest bundled files are PNGs of 1.4 to 5.6 MB (`polybook_open.png`, `homebook1.png`, the Polly perch and pose PNGs, the results crowns and plaques) and the four BGM mp3s of 1.7 to 3.5 MB. The warning's exact number comes from a TestFlight build (Pete will bring it). Likely savings, not yet measured: lossless PNG optimisation or WebP, and a lower-bitrate BGM re-encode.
- **10-round test pass:** Pete has older ten-round test passes; none is recent. Still to do before testers.
- **Build-size measurements (2026-11-07, on scratch copies, repo untouched):** the 11 biggest referenced PNGs total 29.5 MB. Lossless PNG optimisation gives 25.6 MB (about 13% saved). Lossless WebP gives 16.9 MB (about 43% saved, pixel-identical). Lossy WebP at quality 92 gives 2.6 MB (about 91% saved) with PSNR 33 to 44 dB, so some art would visibly change (GoldenCrown 33 dB and the Polly poses 35 dB were the lowest). All 166 referenced PNGs total 89.9 MB. The six BGM mp3s are all 256 kbps (15.8 MB); at 128 kbps they total 7.9 MB (file sizes only; listening and loop-gap checks not done). Converting PNG to WebP means changing file names, so every `require`, the art scripts and any test that pins a file name must change with it. `.webp` is already in use (`assets/images/ui/icon_*.webp`). Nothing applied; waiting on Pete.

## 2026-11-07: Hunt content currency and fairness pass

- Pete and Claude checked the newest words for fairness and replaced eight Hunt traps (commit `1effc33`): LINE, LEFT, LAST, LAP, LIME, LEAD, EXCHANGE, DRAW. Old and new ids are in `CLAUDE.md` > Content and Data. Each word keeps its trap count (one out, one in). `content:quality` and `test:content-runtime` pass; `tsc --noEmit` is clean.
- Pete's trap test: a trap must not be a true meaning of its own headword, needs a lure toward the headword and a definite non-headword answer. Naming frames ("what X calls...") keep synonyms from being fair answers. Wordplay and puns are fine in traps. Do not write a trap to oppose a REAL, but incidental overlap with a REAL or a card on another headword is accepted.
- Kept on purpose (Pete): the two LAST "end" cards, LEFT upside-down card (`left_t1`), LETTER Scrabble card, LITTER Times Square card, LOCK "stuck" pair, LEAN, LOBE and KICK cards.
- Workbook: `POLYWORDS_CANONICAL_RECONCILED_2026-11-07.xlsx` (Pete's Projects folder, not in the repo) carries the eight new rows and eight Change Log entries and matches `huntData.json` id for id. Earlier copies are superseded.
- Generator check (6,000 simulated hunts): every word and every visible card is playable, none is blocked. Confidence words come up about three times as often as Panic words because that pool is small. No blocked-word list exists in the repo; Pete's "blocked words" meant words the generator never plays, so none to fix. Card choice and card order are both reshuffled every hunt (see `CLAUDE.md`).
- Open: TestFlight production build (Pete runs it), then TestFlight test info, external group, public link capped at 15, Beta App Review. Older words were not fairness-checked (Pete: not a full audit).

## 2026-11-07 evening: DOWN fix, fairness audit, build 17 audio freeze

- **DOWN trap:** `down_t01` is retired; `down_t06` (`THE WAY YOU FIX A ZIPPER WHEN YOUR FLY IS OPEN`) replaces it (commit `a516f07`). The old wording contradicted its answer. Workbook `POLYWORDS_CANONICAL_RECONCILED_2026-11-07_DOWN_FIX.xlsx` (Pete's Projects folder, not in the repo) supersedes the earlier 2026-11-07 copy: it carries the new DOWN row, a Change Log entry, and the `exchange_t1` to `exchange_t10` fix in the Boss Words (Production) sheet. Game and workbook ids match id for id. Pete chose not to rebuild TestFlight for this one card; it reaches phones with the next build (no expo-updates).
- **REAL/TRAP mix-up check (Pete's worry that earlier cuts shifted things):** no type conflicts across the workbooks, no type flips in git since 25 Sept, no old text left under a new id among the text changes. Nothing was switched or misaligned.
- **Fairness audit (read-only, report `FAIRNESS_AUDIT_2026-11-07.md` sent to Pete, not in the repo):** a list of traps that may be true meanings of their headword. Pete has NOT gone through it, and noted many flags from the last pass were accepted on purpose. No card is authorised to change beyond DOWN. Strongest groups: DRIVE (five traps that read as motivation or urge), CORD, TRIP, `dump_t03`, `pool_t3`, `fine_t02`. REAL-validity doubts: `park_r1`, `bridge_r4`, `pen_r5`, `kind_r3`. One factual error: `rank_t0` (the Purple Heart is for being wounded, not for bravery). Also: LEFT has three traps whose answer is "wrong"; `clap_r3` has an age-rating note; profanity in `deal_r04`, `kick_r7`, `jack_r4`. `kind_r3` rewrite is undecided (Pete has not picked one of the offered wordings or given his own).
- **Build 17 crash (TestFlight, iPhone 12, iOS 26.6.2):** Pete opened Polybook after bringing the app back from the background; it froze, then was killed (watchdog `0x8BADF00D`, "Failed to terminate gracefully after 5.0s"). Same family as the Oct-26 crash (build 15) but a different stack, so the expo-audio patch does not cover it. Whether the patch reached build 17 cannot be proven from here (`patch-package` is a devDependency; EAS normally installs those). The second file Pete uploaded (`duetexpertd` disk writes) is an unrelated iOS daemon report. Polybook itself is fine; this happened once.
- **Fix written, awaiting phone test:** rebuild the music and SFX players when the app returns after 60 s or more away. Details and tests in `CLAUDE.md` > "Audio rebuild after a long absence". Test plan: run POLYWORDS DEV, leave the app a bit over a minute (also once locked), reopen, check music returns, sounds play, Polybook opens. The 60 s is a TEST VALUE. The freeze is rare, so only a TestFlight build in testers' hands over time can show it is gone. Pete ran `npm test` (clean, new tests included) before committing.
- **Polybook first-open layout (found 2026-11-07 from Pete's two screenshots):** the first open of an app launch drew the book tall with the title under the status bar; every later open was correct. The first screen sat about 47 pt too high at the top and 34 pt too low at the bottom, the iPhone 12's top and bottom safe-area insets, so it was laid out with zero insets (happens on TestFlight too). Cause not proven: the Polybook is a `transparentModal` from Home and its own `SafeAreaView` is the suspect. Fix written, awaiting phone test: `VaultScreen.tsx` now pads from `useSafeAreaInsets()` (the app-wide provider, as Home and the Daily do); pinned by `app/screens/vaultSafeArea.test.mjs`. Not a Rev 2 / Rev 3 art issue: only `POLYBOOKREV3.png` is referenced; `POLYBOOKREV2.png` is unused. Why only the first open is unexplained. Polybook has never had music (no music owner in git history); Home's music stops when Home loses focus and nothing replaces it. Whether to give Polybook music is Pete's decision.
- **Open:** phone test of the Polybook first-open fix; phone test of the audio rebuild; next TestFlight build (carries the audio fix and `down_t06`); Pete's pass through the audit list; `kind_r3`; `rank_t0` factual fix (not authorised yet); TestFlight external-group steps (test info, public link capped at 15, Beta App Review); the carried-over items from the end of 2026-11-06.
- **TestFlight external testing (2026-11-07 evening, App Store Connect):** build 18 (uploaded 7:36 PM, version 1.0.0) is in an external group named `Friends` and was submitted to Beta App Review (status: Waiting for Review). Test Information is saved: feedback email polywords123@gmail.com, privacy URL https://psibari.github.io/Polywords/privacy/ (the path is case-sensitive, `Polywords`), review contact Pete DiBari, sign-in not required, a beta description covering the Hunt, the Daily and the Polybook. NOT done yet: the Public Link (turn it on after Apple approves, then set the tester limit; the Open line above says capped at 15) and sending the link to friends. Pete expects approval tomorrow (2026-11-08) and testing then. Do not upload another build before approval.

## 2026-11-08: ship line, licences, privacy page

- **Device-proven by Pete (2026-11-08):** the return-from-background audio rebuild (build 17 freeze) and the Polybook first-open layout fix both work on his phone. The freeze cause is still unconfirmed. Apple Beta App Review for build 18 (Friends group) still pending.
- **SHIP LINE.** FRIEND BETA (TestFlight): no ads, no purchases; dev buttons are hidden by `__DEV__` (read in code, no release build run; removal optional). PUBLIC LAUNCH: ads on or after the Results screen, never mid-round, plus a one-time "remove ads" purchase; friend beta runs without them. Needs: ad network choice, purchase code, native build, rewrite of `PRIVACY_TEXT` (SettingsScreen.tsx) + the gh-pages privacy page + App Store privacy answers (rule in CLAUDE.md), Apple requirements check (tracking prompt unverified), App Store Connect paid-apps paperwork, Small Business Program enrolment (15% under $1M proceeds), licences closed (below), more Daily puzzles (live pool 110, repeats about 17 days), Android after iPhone results, crash-reporting decision. LATER: Polly outfits (only with traction), Daily replay, free-play flip mode, slang/phrase modes, insult battle, fun fact between rounds, Polly's permanent turn, armor back-face feather texture, share line, Android card glow. DROPPED: Daily timer, moon faces, letter-box (probably).
- **Daily words:** LEAN, LEFT, LEMON, LETTER, LITTER, LOCK, MARCH, MARKET are the 8 extra rows in the 118-row Daily workbook ("Draft Batch 2026-09-02", all LOCKED). They are not in the live pool of 110. Pete: leave them OUT; likely mixed in from the Hunt list (the first six are Hunt words). No work needed.
- **Polly laugh licence:** `pollySqwawkLaugh.wav` is an exact slice (1.5 to 2.5 s) of an Adobe Firefly sound effect generated 2026-06-29 (C2PA data in the original). Pete is on the FREE Adobe plan. Details in `assets/audio/LICENSES.md`. Open: whether Firefly showed a beta / not-for-commercial notice that day; Pete's dated screenshots of the Firefly history entry and Adobe terms sections 1, 3, 8; free-plan eligibility for Adobe's indemnity unconfirmed. Fallback: replace the laugh. DECISION (Pete, 2026-11-08): leave the laugh question until after the friends beta, then decide (Pixabay swap by ear, keep, or regenerate). Note: the Higgsfield Polly sounds used this laugh as an audio reference, so a swap does not clean their lineage.
- **Pixabay:** full Terms of Service read 2026-11-08 (recorded in LICENSES.md). Commercial use allowed, no attribution; no standalone sale/distribution; nothing about apps or games by name. Open: whether audio in a public repo counts as distribution, page URLs missing for early batches, Freesound-origin sounds not traced, save a dated copy of the Terms.
- **Privacy page / domain:** https://psibari.github.io/Polywords/privacy/ is live (capital P), free GitHub Pages, no custom domain, published 2026-10-06; the App Store Connect URL recorded on 2026-11-07 matches. The repo appears public, so `huntData.json` (the Hunt answer key), code and audio are downloadable. DECISION (Pete, 2026-11-08): keep the repo public through the friends beta, then make it private. Order when the time comes: (1) create a small separate public repo holding only the privacy and support pages, (2) check its privacy URL loads, (3) change the URL in App Store Connect, TestFlight test info and anywhere the app links to it, (4) only after Apple's review is done, make the game repo private. Needs Pete's go for the GitHub account change; GitHub Free Pages-on-private-repos limit not yet confirmed for his account.

## 2026-11-09: text scaling, ledge anchoring, Mercy lesson, feather lesson

- **Done (all on `play-screen-overhaul`, pushed):** `7580264` gameplay text ignores the iPhone system text size (cards clipped their last letter with Text Size / Bold Text up; device-checked by Pete); `81abbae` the Hunt deck is pushed down to meet the wall ledge on taller phones (Pete's 375 x 812 unchanged, push 0); `22fcbe2` one-time Mercy lesson card, feather lesson cut to three lines with Polly's new reply "I’ll take that one.", DEV MERCY button; `2e203db` the Mercy card only claims a revive it can show, so the float plays on the last card before Polly's Word, before a Returning Haunt or at the end of the Hunt. Rules and file maps: `CLAUDE.md` (Text sizes, Hunt Architecture, First-Run Onboarding) and `docs/POLLY_DIALOGUE_BANK.md` (feather exception, HUD lesson replies).
- **Open, in Pete's priority order:**
  - (a) Cut TestFlight build 19 with all of the above.
  - (b) The tester's missing Polybook crown: needs her MASTERY page screenshot, the "N CROWNS" count and the word. The "Cork" misspelling report: all five Cork cards in `assets/data/huntData.json` read correctly; ask which card. Her phone model, Display Zoom and Text Size are unknown.
  - (c) Polly sleep seam on Home (the cut from the rig to the master asleep sprite is visible). CLOSED 2026-11-11 by switching the Home doze off; see the 2026-11-11 entry.
  - (d) Whether the card grows past the 290 pt cap on wide phones (the art is already stretched).
  - (e) Trim `CLAUDE.md` as its own commit, MOVING long finished-feature detail into `docs/` with a pointer rather than deleting (retired ids, native rules and TEST VALUE labels stay).
  - (f) Optional `.gitattributes` (`* text=auto eol=lf`) as its own commit.
  - (g) Friends group tester count (cap 15).
  - (h) Tall-phone behaviour of the ledge anchoring.
- **Hazard: line endings.** Windows git has `core.autocrlf=true` (system gitconfig); HEAD files are LF, but checkouts and scripts produce CRLF. Write every touched file LF and compare plain `git diff --stat` with `git diff --stat --ignore-cr-at-eol` before committing. About 113 untouched files are CRLF on disk.

## 2026-11-10: Polybook tally, KING counter, KING plaque

- **Done on `play-screen-overhaul`, pushed to origin 2026-11-10 (at `f683d47`, which also adds the session prompts file in `Claude outputs/`):** `54eb44e` KING plaque art + `kingWord.top` 56.5% (TEST VALUE); `ef44507` MASTERY four-crown tally + `kingcrown.png`; `40e1baa` KING counter (`kingWins`, `lastKingWinId`); `6bf7c4c` strip `caBX` from the two new PNGs; `da4ad05` DEV REMATCH button.
- **Device-checked by Pete (POLYWORDS DEV, 2026-11-10):** the KING plaque with EXCHANGE and the tally at normal and at max Text Size + Bold with counts 0 and 123 both "look good"; he accepted the crowns shrinking at max text so everything fits.
- **Device-proven (Pete, his phone, 2026-11-10):** the KING counter and the REMATCH button: a Master's Rematch win moved KING from 0 to 1 exactly once; KING stayed 1 after reopening the Polybook; a lost rematch left KING at 1, MASTERED unchanged, and created no Haunt (MASTERED showed 1 because Pete first beat a Boss with the BOSS button).
- **Pete's decisions:** tally over the 9-slot grid; Haunted = active haunts only; KING crown is Polly green; the tally keeps `hauntcrown.png` (not the Results padlock); nothing in POLYWORDS is locked except the swipe and the premise.
- **Parked, not open work: BUSTER lettering** (`2d8c6dd`): BU, STER, BUSTER and the word use `raisedGoldPlaque` (TEST VALUES). A magenta test proved it is wired in, but the look barely changed; Pete stopped there. Keep the gold; do not retune. Detail and untried options in CLAUDE.md "Result plaques".
- **Open:**
  - (a) Done: `c097a94`, `75ee5c5` and `058dbfc` are on origin (verified 2026-11-10).
  - (b) BANISHED undercounts saves older than 2026-10-03 (detail in CLAUDE.md "Polybook"). Accept, or rebuild from the journal log for the 2026-09-04 to 2026-10-03 window? Pete has not decided.
  - (c) Tally label can be 17.9 pt on a very short page (under the 18 floor); JOURNAL and MASTERY ribbon labels fill their ribbons edge to edge at max Text Size (old styles, untouched).
  - (d) The design hook lists 31 colour findings in `PolybookSpread.tsx` (old styles; the tally adds no colour). Not silenced; silencing records a colour as approved, needs Pete's OK.
  - (e) Four older PNGs still carry `caBX` (`GoldenCrown`, `banishcrown`, `hauntcrown`, `Padlock`); an optional lossless strip as its own commit.
  - (f) Carry-over from the 2026-11-09 list, per Pete 2026-11-10: TestFlight builds 19 and 20 failed, build 21 went through and is on his phone only, testers are on build 18; Polly's visits are too quick to read her bubble (check whether the perch clock starts at flight start or at landing); Polly sleep seam on Home; 8 vs 10 rounds (hunts 1 to 3 are already 8; Pete does not want to give more lives; undecided); whether to bring in stranger testers (undecided); the tester's missing crown (the tally's MASTERED count now shows whether her mastery was saved; needs her screenshot); tall-phone ledge check; CLAUDE.md trim.
- **Hazard, line endings:** `types.ts` was CRLF on disk and was converted to LF (the commit diff is 7 lines). CONTEXT.md and CLAUDE.md are LF on disk; `docs/POLYBOOK.md` is CRLF on disk (LF in the index). Compare `git diff --stat` with `git diff --stat --ignore-cr-at-eol` before committing.

## 2026-11-11: Home doze switched off

- **Done (`048b8aa`, device-checked by Pete on POLYWORDS DEV 2026-11-11: she keeps blinking and never nods off):** Polly no longer falls asleep on Home. `HOME_DOZE_ENABLED` (`app/components/PollyHomePerch.tsx`) is `false` and the doze effect returns before it arms its timer, so there is no nod, no asleep pose and no Z's in any resting pose, Reduce Motion included. Seven added lines; `tsc --noEmit` is clean; `npm test` was not run (the sandbox cannot run `tsx`); no test names the doze.
- **Why (Pete):** the idle face rig is sprite4 art and `asleep.png` is master art, so the swap between them shows, and a couple of testers pointed it out. Pete wants to keep the idle rig as it is ("it works good").
- **Tried and rejected the same night:** (1) Higgsfield `/illustration-animation` for animating the master poses: it is a local After Effects workflow, not a cloud generator, and the Higgsfield account had 5.6 credits against 12 for the cheapest clip; nothing was generated. (2) Making the idle rig itself sleep with a drawn closed-eyelid layer: Pete rejected the mock-up (brow gone, head upright, still smiling; it does not read as asleep). (3) Moving the Home idle to master art: Pete does not want to replace the idle rig.
- **Kept in place:** all doze code, `assets/images/polly/master/asleep.png` and the three Z images. Set the flag to `true` to restore the doze exactly as it was.
- **Open:** Bringing sleep back waits for a new rig or a re-rig of the master art, so the idle and the sleeper are one drawing.
- **Hazard, line endings:** `PollyHomePerch.tsx` is CRLF on disk and LF in the index; from the Linux sandbox `git diff --stat` shows the whole file. `git diff --stat --ignore-cr-at-eol` shows the real 7 lines.

## 2026-11-11 (part 2): Home idle jabs

- **Built (local, NOT committed, NOT device-checked):** Pete's alternative to the doze. While the player sits on Home, Polly says up to three jabs in her bubble (first at 10 s, then every 20 s, each up 4 s; all TEST VALUES), then goes quiet until Home is focused again. New `app/game/pollyHomeIdleJabs.ts` (pools, picker, timing) and `pollyHomeIdleJabs.test.ts` (added to `npm test`); 24 new lines in `pollyCharacter.ts` (`homeIdle*` 13, `homeSore*` 11); one effect and the bubble line in `PollyHomePerch.tsx`. `tsc --noEmit` clean; the new test passes under plain Node (the sandbox cannot run `tsx`, so the full `npm test` was not run).
- **Copy (Pete approved every line; his own: "I got all day, pal.", "Sooooo...", "So are we just gonna stand here or what?", "What are you looking at?", "Cheater.", "Who did you pay to play for you?", "Must be AI."):** normal pool for the idle and smug poses, sore-loser pool for the angry pose. Rejected: "My traps are getting cold." Dropped as a near-twin of his line: "I can wait all day." "What are you looking at?" is in the angry pool only (Pete).
- **Wording to confirm with Pete:** he typed "who did pay to play for you"; it went in as "Who did you pay to play for you?".
- **Open:** embarrassed Polly (the rattled profile) says nothing; Pete may write a couple of lines for her. Pete to tune the four timing numbers on his phone. Jabs are silent; no sound was asked for.
- **Hazard, line endings:** `pollyCharacter.ts` and `PollyHomePerch.tsx` are CRLF on disk; use `git diff --stat --ignore-cr-at-eol` from the Linux sandbox.
