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
  CLUE LENGTH CAP (Pete, 2026-11-12): every Daily clue must fit the gate plank in two lines. Write
  clues at 46 characters or fewer (spaces included); anything longer must pass
  `npm run daily:fit -- "THE CLUE"` (or `--xlsx <workbook>`). `npm test` refuses any clue in any
  Daily pool that does not fit. Three-line clues were rejected (too cluttered): a long clue is shortened.
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

- **Built (local, NOT committed; Pete saw the jabs on POLYWORDS DEV 2026-11-11, before the flustered pool was added):** Pete's alternative to the doze. While the player sits on Home, Polly says up to three jabs in her bubble (first at 10 s, then every 20 s, each up 4 s; all TEST VALUES), then goes quiet until Home is focused again. New `app/game/pollyHomeIdleJabs.ts` (pools, picker, timing) and `pollyHomeIdleJabs.test.ts` (added to `npm test`); 32 new lines in `pollyCharacter.ts` (`homeIdle*` 13, `homeSore*` 11, `homeFluster*` 8); one effect and the bubble line in `PollyHomePerch.tsx`. `tsc --noEmit` clean; the new test passes under plain Node (the sandbox cannot run `tsx`, so the full `npm test` was not run).
- **Copy (Pete approved every line; his own: "I got all day, pal.", "Sooooo...", "So are we just gonna stand here or what?", "What are you looking at?", "Cheater.", "Who did you pay to play for you?", "Must be AI."):** normal pool for the idle and smug poses, sore-loser pool for the angry pose, flustered pool for the embarrassed pose (Pete kept five of Claude's drafts and added "I guess miracles do happen.", "Whatever.", "No one will believe you anyway."). Rejected: "My traps are getting cold." Dropped as a near-twin of his line: "I can wait all day." "What are you looking at?" is in the angry pool only (Pete).
- **Wording confirmed (Pete, 2026-11-14):** he typed "who did pay to play for you"; it went in as "Who did you pay to play for you?", which is what he meant.
- **Fly-away (built after the above, local, NOT committed, NOT device-checked):** Pete ruled the limit stays at three and that she then leaves: 3 s after the third jab fades she flies off silently (the drop-in reversed, flight pose by mood) and only drops back in when the player returns to Home. Empty perch: only the rig's log has one (`assets/images/polly/rig2/polly_perch_empty.png`, Claude's automatic cut; Pete accepted it); from the angry or embarrassed pose the perch leaves with her until an artist makes those two empty logs (Pete's option 2). Details in `CLAUDE.md` (HOME FLY-AWAY). Pete tested the flustered pool on his phone and it passed.
- **Terrace perch stick off (`587f05d`, pushed; Pete saw it on his phone and kept it):** Pete's screenshots showed a second perch behind her. It was the terrace scene's own stick (`perch.png`), not the Polly art. `HomeTerraceScene.tsx` no longer draws it (`TERRACE_SCENE_PERCH_ENABLED` false), and the empty rig log now also waits for her on the app-open entrance when she lands in a rig pose.
- **Open:** artist art for the angry and embarrassed empty logs; the flight pose for smug (`flyGrin`) and embarrassed (`fly`) are Claude's guesses. Pete to tune the four timing numbers on his phone. Jabs are silent; no sound was asked for.
- **Hazard, line endings:** `pollyCharacter.ts` and `PollyHomePerch.tsx` are CRLF on disk; use `git diff --stat --ignore-cr-at-eol` from the Linux sandbox.

## 2026-11-11 (part 3): Polly's Hunt bubbles get reading time

- **Why:** testers said her speech bubble is gone before they can read it. Checked: the perch clock starts at LANDING (the open question from 2026-11-10 is answered), but every visit held a fixed `perchMs` whatever the line's length. At 15 characters a second plus 0.5 s to notice it, the one-feather line needed 3.9 s and got 2.0; the mastered line needed 3.1 s and got 1.6; the Hunt intro needed 3.2 s and got 2.5; heckles needed up to 2.3 s and got 1.8. Only Boss entry (4.2 s) had enough. Second cause: a word change fast-exited any heckle, and the board advances about 1 s after the last swipe, so a heckle on a word's last card got about 1 s.
- **Built, committed and pushed; device-checked by Pete 2026-11-11 ("way better now with the timing"):** (1) `resolveVisitPerchMs(spec)` in `pollyVisitPolicy.ts` = the larger of the spec's `perchMs` and `pollyLineReadMs(line)` (`POLLY_READ_NOTICE_MS` 500 + 15 chars/s, capped at `POLLY_READ_MAX_MS` 5000; TEST VALUES). `PollyHuntVisit.tsx` uses it, so it also covers the first-run onboarding visits and the HUD-lesson replies, which share that component (they wait for the visit to finish, so they simply run a little longer). Nothing gets shorter. (2) `usePollyVisits.ts`: a word change no longer cuts a heckle (Pete: a player reading the heckle is not reading the new word). One heckle per word and the guaranteed-visit cut (Polly's Word, Returning Haunt) are unchanged.
- **Daily, checked only, NOT changed:** every reaction bubble holds a fixed 2.5 s (`PollyDailyPerch.tsx`). 23 of 27 Daily lines fit; four need 2.6 to 3.0 s (`dailyConcedingDrawingBoard`, `dailyAmusedKnewIt`, `dailyRattledReallyHappening`, `dailyAmusedPredictable`). The real short one is the first-miss dance: the butter-knife bubble is up from 850 to 1650 ms of the dance (`POLLY_DANCE_BUBBLE`), about 0.8 s for a line that needs 2.1 s. Pete to rule on both.
- **Daily fixes (built after the push; local, NOT committed, NOT device-checked):** Pete said do both. `PollyDailyPerch.tsx` now holds each bubble for 2.5 s or its line's reading time, whichever is longer, and the butter-knife bubble stays up after the dance's hover until about 2.95 s (the dance and its keyframes are unchanged; see `CLAUDE.md`).
- **Open:** Pete's phone test of the Daily fixes (first miss; a long mood line); Results was not checked; Pete will make empty-perch art for the angry and embarrassed poses later.

## 2026-11-11: Hunt fairness audit and the nine fact fixes

- Full read-only audit of all 253 Hunt words: `Claude outputs/HUNT_FAIRNESS_AUDIT_2026-11-11.md` (wrong facts, traps that are really true, unfair Boss pairs, judgment calls, too-hard senses, writing slips). Pete has NOT ruled on sections 2 to 7 yet; nothing there is authorised to change.
- The nine wrong-fact cards were rewritten with Pete line by line and are in `assets/data/huntData.json` (NOT committed yet): RANK `rank_t5`, CIRCUIT `circuit_t95` (generator; a NASCAR-left card would cross `left_r9`), HORN `horn_r4`, BOW `bow_t4` ("outboard" rules out bow-mounted trolling motors), BILL `bill_t6` (Miranda; same arrest scene as `charge_t6`, Pete accepted), CONTEST `contest_r04`, BRIDGE `bridge_r5`, hidden REALs `battery_h02` and `check_h01` (ids kept, see `CLAUDE.md` > Content and Data).
- Checks: `content:quality` 0 structural / 0 launch blockers; `test:content-runtime` passes; 20,000 simulated hunts dealt every one of the 2,526 visible cards and every new card, no retired id, BATTERY and CHECK reached Polly's Word with all three pairs. New warning: CHECK hidden pair 1 REAL is 7 words longer than its trap (Hidden Truth parity).
- Workbook: `POLYWORDS_CANONICAL_RECONCILED_2026-11-11_FACT_FIXES.xlsx` (Pete's Projects folder) supersedes the 11-07 DOWN_FIX copy; 9 Change Log rows; matches the game id for id (2,526 cards, 75 hidden pairs).
- Pete's crossing rule (2026-11-11): shared everyday words across DIFFERENT headwords are fine; the line is no crossing inside the same headword. Old open items still stand: `rank_t1` castling and `court_r0` court ladder (small fact slips), `kind_r3` rewrite.
- DRIVE (same day, not in commit `ba3b073`): the five motivation traps were flagged on 11-07 but never changed; now cut and replaced by four Pete-approved traps (`drive_t10` to `drive_t13`). Pete's trap rule, restated: a trap must make the player think the HEADWORD itself fits (coast, ride, ski, bump, sail pattern), not just sit in the same topic; and it must not repeat a REAL's own scene (the gear-shifter draft was rejected for copying `drive_r4`). Same checks rerun: 0 blockers, 20,000 hunts dealt every card (2,525) and each new DRIVE trap about 200 times. Workbook `..._2026-11-11_FACT_FIXES.xlsx` updated in place (5 CUT + 4 new Change Log rows), still id for id.
- TRAIN (same day): all three traps were true meanings; replaced by `train_t6` (veil), `train_t7` (school bus), `train_t8` (practice makes perfect). Pete refined the crossing rule: generic words shared inside a headword ("saying", "bride"/"bridesmaid") are fine; what must not repeat is a REAL's own scene or meaning. Checks rerun: 0 blockers, all 2,525 cards dealt in 20,000 hunts. Workbook updated in place, id for id.
- TRIP (same day): all three traps were true meanings; replaced by `trip_t5` (tour), `trip_t6` (hurdles), `trip_t7` (job relocates you). Pete's trap rule, again: the card must make the player think the HEADWORD fits, not just sit in the same situation, and must not give the answer away ("over every hurdle" was rejected for that). Checks rerun: 0 blockers, all 2,525 cards dealt in 20,000 hunts. Workbook updated in place, id for id.
- CORD (same day): `cord_t03` to `cord_t05` were cords; replaced by `cord_t06` (tug-of-war rope), `cord_t07` (floss), `cord_t08` (ribbon at a grand opening). `cord_t00` laces, `cord_t01` leash, `cord_t02` tassel kept. Police tape was rejected as a copy of FOIL `foil_t4`. Checks rerun: 0 blockers, all 2,525 cards dealt in 20,000 hunts. Workbook updated in place, id for id.
- FACE (same day): `face_t00`, `face_t01`, `face_t03` were true senses (facade, moon, west face); cut. Added `face_t04` (mask at a costume party) and `face_t05` (cheeks Grandma pinches); `face_t02` kept, so FACE has three traps (Pete: no forced fourth). Checks rerun: 0 blockers, all 2,524 cards dealt in 20,000 hunts. Workbook updated (one Tiles row deleted, CUT logged).
- FIGURE (same day): cut `figure_t01`, `figure_t04`, `figure_t06` (true senses: estimate, result, digits). Five traps left. `figure_t00` (tailor's numbers) was reworded in Pete's words as `figure_t08` (tuxedo fitting, measurements). `figure_t05` (graph numbers, axis) replaced by `figure_t09` (flex in the gym mirror, muscles). Checks rerun: 0 blockers, all 2,521 cards dealt in 20,000 hunts.
- FINE (same day, the tutorial word): cut `fine_t02` and `fine_t04` (fine = okay; a new player could lose a feather on word one for swiping what the intro just taught). Three traps left (`fine_t00` pinned, `fine_t01`, `fine_t03`); `fine_t01` (sanded wood) is close to the line and kept. Tutorial cards untouched. Checks: 0 blockers, all 2,519 cards dealt; 2,000 first-run Hunts all open on FINE with the three pinned cards; firstRunOnboarding, huntDeterminism, hudLessons and polyRunEngine tests pass (compiled with tsc, run with node).
- NEXT (Pete, 2026-11-11): finish the fairness pass first (STICK is next: t1 superglue, t2 baton, t3 clutch flagged, not changed yet; then POOL, FIELD, FILE, CRANE, CHARACTER, DIRECT, DRAFT, DIE, BOLT, BOUND, CLIP, CHEST, LONG, FORGE, CONCENTRATION, the boss pairs, sections 4-7 of `Claude outputs/HUNT_FAIRNESS_AUDIT_2026-11-11.md`). THEN a separate project: 75 old July-era words never rewritten into the longer question style (avg ~6 words/card, ~15% start WHAT/WHO/WHERE vs ~8.6 and ~58% for words added in the LOCKED workbooks). Checked against all 125 workbooks in Downloads: nothing was ever cut down; these words were simply never redone. List: ABSTRACT ADDRESS ANCHOR ARROW ARTICULATE BACK BALANCE BAND BANK BARK BASS BAT BEAM BEAR BED BELT BERRY BILL BLADE BLOCK BLOW BOLT BRIEF CAN CHARACTER CHIP CONCENTRATION CORK CORNER COURSE COURT CRANE CURRENT DATE DRAW DROP ENGAGED EXCHANGE FILE FLY JAM KEY LOG LONG MATCH MINE MISS PARK PITCH PLANT PLAY PLOT PLUG POINT POOL POT POUND POWDER PROJECT PUPIL RANK REVOLUTION RING ROCK ROW RULER SCALE SEAL SOUND SPRING STICK TABLE WATCH WAVE WELL.

## 2026-11-12: fairness pass scope change, FIELD

- SCOPE (Pete, 2026-11-12): the fairness pass now SKIPS the 75 old July-era words (list in the 2026-11-11 entry above). Writing new cards for them now would clash with their short style and be redone in the rewrite. Their audit flags are NOT fixed and must be the rewrite's starting checklist: STICK `stick_t1`, `stick_t2`, `stick_t3`; POOL `pool_t2`, `pool_t3`; FILE `file_t0`; CRANE `crane_t1`; CHARACTER `character_t0`; BOLT `bolt_t2`; LONG `long_t2`; CONCENTRATION `concentration_t6`, `concentration_r3`; fact slips `rank_t1` (castling), `court_r0` (court ladder); boss pairs `exchange_h04`, `court_h03`; plus every old-word card in sections 4-7 of `Claude outputs/HUNT_FAIRNESS_AUDIT_2026-11-11.md` (e.g. `park_r1`, `well_r1`, `log_t0`, `mine_t1`, `seal_t1`, `point_t1`, `pupil_t1`, `rank_t2`, `rock_t2`, `date_t0`, `block_t0`, `pitch_t2`, `miss_t0`, `rank_r1`, `anchor_r5`, `project_r3`, `revolution_t2`, `ruler_t2`). Pete chose to leave even the cut-only cases (`concentration_t6`, `bolt_t2`) for the rewrite. STICK drafts written this session (pin the tail, carrot, dog stay, spider web, fridge magnet) were not approved; reuse them only if Pete wants.
- FIELD: cut `field_t01` (Europeans / fútbol) and `field_t04` (guerrilla warfare; not in the audit, found in review). Three traps left, no replacement. Checks: `content:quality` 0 structural / 0 launch blockers; `test:content-runtime` passes; 20,000 simulated hunts dealt all 2,517 visible cards, each FIELD trap about 230 times, no retired id. Workbook `POLYWORDS_CANONICAL_RECONCILED_2026-11-11_FACT_FIXES.xlsx` updated in place (2 Tiles rows deleted, 2 CUT Change Log rows, Word Tracker FIELD 12 + 3); matches the game id for id.
- Word Tracker is stale for words cut earlier (e.g. FIGURE shows 8 traps, FINE 5); only FIELD was corrected. Pete to decide whether to resync the counts.
- DIRECT (Pete, 2026-11-12): cut `direct_t00`; `direct_t02` replaced by `direct_t04` (boss, Pete's wording); REAL `direct_r02` replaced by `direct_r04` (cop directing traffic). `t01` shortcut kept (Pete: a shortcut is not a direct route) and `t03` filibuster kept. 4 REALs + 3 traps. Checks: 0 blockers, runtime tests pass, 20,000 hunts dealt all 2,516 cards, each DIRECT card about 1,240 times, no retired id. Workbook updated in place (rows edited with fresh ids, `t00` row deleted, 3 Change Log rows, Word Tracker DIRECT 4 + 3), id for id.
- Trap-writing lesson (Pete, 2026-11-12): a trap must tempt the headword ITSELF. Rejected drafts: baiting through a compound that contains the headword (direct deposit, direct sunlight, direct current, carrot-and-stick), person nouns that trap the derived form (producer, choreographer trap DIRECTOR, not DIRECT), and flipping a REAL's scene (scenic route, local train). Pete's "opposites" means a counterpart word in the same family (a FALL card on SPRING); `docs/CONTENT_WRITING_STANDARD.md` Traps updated.
- DRAFT (Pete, 2026-11-12): cut `draft_t01`, `draft_t03`, `draft_t04`, `draft_t07` (t07 and t01 found in review, checked against Merriam-Webster). 9 REALs + 4 traps (`t00` print run, `t02` recruiters, `t05` redeployment, `t06` call-up). Checks: 0 blockers, runtime tests pass, 20,000 hunts dealt all 2,512 cards, no retired id. Workbook updated in place, id for id.
- DIE (Pete, 2026-11-12): cut `die_t01`; `die_t03` replaced by `die_t05` (opossum plays dead). 6 REALs + 3 traps. Checks: 0 blockers, runtime tests pass, 20,000 hunts dealt all 2,511 cards, no retired id. Workbook updated, id for id.
- BOUND (Pete, 2026-11-12): all three traps replaced with counterpart traps built from Pete's angles (bachelor life / ball and chain; impossible even with all the time in the world; loose cookbook pages); REAL `bound_r3` replaced by the bus card `bound_r6`. Pete knowingly accepted `bound_t6` as the flip of `bound_r2`'s meaning. 6 REALs + 3 traps. Checks: 0 blockers, runtime tests pass, 20,000 hunts dealt all 2,511 cards, no retired id. Workbook updated, id for id.
- NEXT: CLIP `clip_t0`, CHEST `chest_t4`, FORGE `forge_t2`; boss pairs WAKE, STRIKE, STOCK; then sections 4-7, newer words only.

## 2026-11-12 (afternoon): Daily clue length cap

- Tester bug (build 18, Daily #154): BOLT's lightning clue and BLOCK's city clue were drawn as tiny unreadable text. Cause: 13 clues in the 50 expansion puzzles did not fit the plank in two lines even at the 16 pt floor, and iOS's own auto-shrink squeezed them. The old fit test only covered the legacy pool. BLOCK's city clue fits on paper; on the tester's phone it most likely overflowed from her system text settings on build 18 (before `7580264`). Not yet proven for Bold Text.
- Fixed (`92913b6`, `fd39236`, not pushed at time of writing): Pete approved trims of all 13 clues (BRIDGE got two new clues: grandma card club; cars crossing over a river or highway); the fit test covers `APPROVED_DAILY_POOL`; `npm run daily:fit` checker; the 46-character cap (`DAILY_CLUE_CHAR_CAP`) in `docs/DAILY_CONTENT_WRITING_STANDARD.md`; `DailyGate.tsx` no longer uses `adjustsFontSizeToFit`; DEV `PICK PUZZLE` plays any puzzle as round 1. Full `npm test` passed.
- Daily workbook (`POLYWORDS_Daily_Challenge_118_LOCKED_2026-10-25.xlsx`) left with the old wording of the 13 clues (Pete, 2026-11-12: the game is the source; no workbook update needed).
- TO CHECK on POLYWORDS DEV: PICK PUZZLE > BLOCK with Bold Text and max Text Size; BOLT and BRIDGE to see the new clues on the plank.
- Do not send build 21 to new testers: it predates this fix. Next TestFlight build carries it.
- CLIP, CHEST, FORGE (Pete, 2026-11-12): `clip_t0` (tie clip) and `chest_t4` (seatbelt) cut; `forge_t2` (fake bill: forge = counterfeit) replaced by `forge_t5` "WHAT A NOTARY DOES WHILE YOU SIGN". Pete's rule from now on: only flagged cards change; unflagged ones are not touched without his say. Also from now on: before any rewrite, show EVERY card the word already has (REALs and traps, with ids) and mark each as keep / remove / new, so nothing duplicates an existing handle. Checks: content:quality 0 blockers, test:content-runtime and full npm test pass. Workbook `POLYWORDS_CANONICAL_RECONCILED_2026-11-11_FACT_FIXES.xlsx` updated in place (2 Tiles rows deleted, 1 SWAP, 3 Change Log rows, Word Tracker CLIP and CHEST traps 4), id for id.
- WAKE Boss pair `wake_h02` (Pete, 2026-11-12): TRAP "WHAT CPR IS MEANT TO DO WHEN YOU STOP BREATHING" (reviving, same as the medic REAL) replaced by "WHAT THE BABY DOES AFTER THE LULLABY" (falls asleep; Pete picked it for the pull). Pair id KEPT (saved Haunts store `hiddenPairId`). Workbook Boss Words row 246 and Hidden Pair Registry updated, Change Log row added. 0 blockers.
- STRIKE Boss pairs (Pete, 2026-11-12): `strike_h00` TRAP "PICKAXE SPARKS ON BARE GRANITE" (true) -> "WHAT INVADERS DO WHEN THEY CAMP OUTSIDE THE CASTLE WALLS" (siege); `strike_h02` TRAP "HOW YOU LIGHT A LIGHTER" (arguable: MW strike = ignite by friction, and `strike_r3` is a match) -> "WHAT RESIDENTS WITH PICKET SIGNS OUTSIDE CITY HALL ARE DOING" (protesting; residents, not employees, so not a strike). Pair ids kept. STRIKE lesson: any attack, fight or deal is a strike (MW: military attack, blow with fangs/claws, make and ratify terms); Pete rejected weak-pull drafts for the gauntlet and any courtroom, judge or boxing scene (the bank is full of them). Before drafting, search the WHOLE bank for the handle (Pete caught BALL's walk, FLOOR's gutter ball and WATCH's alarm clock).
- Daily clue cap DEVICE-CHECKED (Pete, 2026-11-12): today's Daily plus BLOCK and STAMP via PICK PUZZLE at max Text Size with Bold Text; every clue fits, no errors. Closes the TO CHECK line above.
- STOCK Boss pairs (Pete, 2026-11-12): `stock_h02` TRAP "GRANDMA'S BIRTHDAY GIFT THAT TOOK A DECADE TO DOUBLE" (arguable: gifted stock doubles; and savings bonds take 20 years) -> "WHAT YOU BUY WHEN YOU LEND THE GOVERNMENT MONEY" (a bond). `stock_h03` REAL reworded at Pete's request -> "WHAT LOCKED THE THIEF'S FEET WHILE THE VILLAGE THREW ROTTEN TOMATOES" (MW: the stocks lock the feet, or feet and hands; head-and-hands is the pillory). Pair ids kept. Boss-pair list from audit section 3 is now done except EXCHANGE `exchange_h04` and COURT `court_h03` (old July-era words, left for the rewrite) and battery/check (done 2026-11-11).
- WORKBOOK SYNC (2026-11-12, Pete asked for everything exact): current canonical workbook is `POLYWORDS_CANONICAL_RECONCILED_2026-11-12.xlsx` in Pete's DOWNLOADS folder (`C:\Users\pdiba\Downloads`). Pete's rule (2026-11-12): the Downloads copy is the master he uses; all workbook updates go there. An identical copy sits in his Claude Projects POLYWORDS folder but is not maintained (the 11-11 FACT_FIXES file there is left as it was). Checked against `huntData.json`: all 253 words, 2,509 cards and 75 hidden pairs match id for id and word for word (normal words in Tiles; the 25 Boss words' cards in Boss Words (Production)); Hidden Pair Registry matches; every Word Tracker count matches. Fixed: Word Tracker FACE 8+3, FIGURE 7+5, FINE 7+3, DRIVE 15+9 (stale after the cuts); 6 old BOSS rows in Tiles (COURT, HORN, IRON) given their pair ids, two stale texts synced (court_h01 trap, iron_h00 trap). BOLT's old CUT boss row kept as history.
- PINNED BOSS built (Pete, 2026-11-12; his Hunt-runs topic): the Boss stays until the player reaches it; details in CLAUDE.md Hunt Architecture. Findings first: losing never replayed the same Hunt (every Hunt is freshly generated), ordinary words already rotate (last 30 reached words go to the back of the line), but the Boss was random every Hunt, so players who die before round 10 never saw the same Boss twice. Code, tests (`pinnedBoss.test.ts`), typecheck and full npm test pass. DEVICE-CHECKED by Pete 2026-11-12 on POLYWORDS DEV: quit at the Boss, came back, same Boss. Polly lines (Pete, 2026-11-12): the pin stays Polly's secret (players don't know the Boss is held, so no "same word" lines). Built: start-of-Hunt dare every Hunt except the FINE tutorial ("Last round’s for the crown." / "Final round’s for the boss. And I’m the boss." / "Got a surprise hidden in the wall for you. Last round."); round-10 Boss entry pool adds "Took you long enough." / "I hid the crown in here somewhere." / "The crown is only for the worthy."; nothing at the gauntlet start. Tests, tsc, full npm test pass; device-checked by Pete 2026-11-12 ("everything lands perfect").
- SECTION 4 batch 1 (Pete, 2026-11-12 evening): cards #1-#8 of the review sheet done. EXHAUST t00/t01 cut + new `exhaust_t04` (intake); FOSTER `foster_t1` -> `foster_t4` (rescue brag); FOUL t1, FORK t0, FOIL t3, FLOOR t5, FLAT t3 cut. content:quality 0/0, full npm test clean, workbook updated. Pete's working rule: review 2-3 words, then apply them together. Next: #9 LIGHT (`light_t91`, `light_t93`, `light_t95`).
- SECTION 4 batch 2 (Pete, 2026-11-12 evening): review cards #9-#13 done (LIGHT x3, DUMP, CUT) plus `dump_t02` raised by Claude. Details in CLAUDE.md retired ids. content:quality 0/0, full npm test clean, workbook updated. Next: CAPITAL (pinned in huntCanonicalization.test.mjs), BRIGHT, PEN, LINE, EXPLOIT, then the 15 weaker flags.
- SECTION 4 batch 3 (Pete, 2026-11-12 evening): #14 CURE `cure_t04` KEPT, #15 CUE (`cue_t02` KEPT; t01 and t04 cut), #16-17 COPY (doppelgänger to REAL `copy_r07`, clone card -> museum `copy_t05`). Details in CLAUDE.md. Clean tests. Next: #18 CAPITAL (`capital_t91`, pinned in huntCanonicalization.test.mjs), BRIGHT, PEN, LINE, EXPLOIT, then the 15 weaker flags.
- CAPITAL moved to the old-words REWRITE list (Pete, 2026-11-12; it is not one of the 75 but its cards are short, from the 2026-10-05 audit). Rewrite must: restore REAL `capital_r3` "HIGHEST FORM OF PUNISHMENT" (Pete confirmed it stays on 2026-07-10, Change Log with MW/Collins/Britannica; dropped with no recorded reason when the Oct 5 audit override `e7c395f` rebuilt CAPITAL, carried into the bank by `f356433`; the id is free to restore), and replace trap `capital_t91` (initials: the first letters of your name ARE capitals, true). CAPITAL wordType goes Triple -> Quadruple then; `huntCanonicalization.test.mjs` pins the CAPITAL cards and its wordType.
- SECTION 4 batch 4 (Pete, 2026-11-12 evening): CAPITAL to the rewrite list; BRIGHT t2, PEN t3, LINE t6 cut. Clean tests. Next: #22 EXPLOIT (`exploit_t00`), then the 15 weaker flags, then section 5 (REALs that may read as false), 6, 7, then the dropped-card audit.
- SECTION 4 batch 5 (Pete, 2026-11-12 evening): #22 EXPLOIT and weak flags #23-26 (BOTTOM, CEILING, CHANNEL x2) done; details in CLAUDE.md. Pete's working test for weak flags: if nobody actually talks that way, keep it, even when a dictionary allows it.
- SECTION 4 batch 6 (Pete, 2026-11-12 evening): weak flags #27-32 kept; HOLD `hold_t4` cut.
- SECTION 4 DONE (Pete, 2026-11-12, 21:52): batch 7 cut `jack_t6` and REAL `kind_r3`; IRON, KIND t3 and both PALM flags kept. All 37 review-sheet cards ruled. Next: section 5 of `Claude outputs/HUNT_FAIRNESS_AUDIT_2026-11-11.md` (REALs that may read as false; `kind_r3` was one), then 6 and 7, newer words only; then the dropped-card audit (TODO below).
- SECTIONS 5-7 DONE (Pete, 2026-11-12, 22:51): all 24 items on `POLYWORDS_SECTIONS_5-7_REVIEW_2026-11-12.md` ruled and applied (details in CLAUDE.md). Items 21 (DUST/POWDER) and 22 (CURE/WELL): no change on the newer side; `powder_t1` and `well_r1` added to the old-words rewrite list.
- NEXT: the dropped-card audit (TODO below), then the old-words REWRITE (75 July words + CAPITAL; its starting checklist includes the skipped audit flags, `powder_t1`, `well_r1`, CAPITAL's lost `capital_r3`).
- HUNT VARIETY + LENGTH (War Room review 2026-11-12, no code changed; simulations ran the real generator and engine). VARIETY: gpsTag locks words to rounds (confidence 24 words in rounds 1-2, flow 52 in 3-4, tension 82 in 5-7, panic 70 in 8-9, boss 25 in 10), so a player who dies in round 3 sees 44 of 253 words in 20 Hunts and never a tension or panic word (BUTT is tension: 0 of 200 such players saw it). This breaks GOLDEN_PACING_SYSTEM line 37 (fallbacks must not make tagged content unreachable). Ceiling: a round-3 player sees only 3 words per Hunt. Options simulated: A (rounds 1-4 from any easy/medium word) 44->58 but rounds 1-2 become 65% medium; B (fresh-first borrowing) changed nothing; C RECOMMENDED (rounds 1-2 from every easy non-boss word, 50 instead of 24; rounds 3-4 from flow plus medium tension/panic) 44->53 at round 3, 75->82 at round 5, panic words now seen early, rounds 1-2 stay 100% easy. LENGTH: boss reach, veteran no Mercy, 8/9/10 rounds: 75% accuracy 18/11/6%, 80% 39/31/22%, 85% 70/62/51%, 90% 92/89/86%; Hunts 4-10 (Mercy 2) at 80%: 67/56/43%. Under 70% accuracy players die by round 3-5 at any length. Pete leans keep 10; he wants real tester data first: build 18 has Settings > Playtest Data > Share Debug Stats (local tally incl. the round each Hunt ended). Not ruled.
- STRANGER TESTERS (Pete, 2026-11-12): tomorrow, after Option C is built and device-checked, also polish the first 30 seconds (first Hunt, Polly's intro) to be more dynamic, then open a TestFlight public link to testers he doesn't know (friends can't keep testing). Already done by Pete: an External Testing group (his friends) with an approved TestFlight build, so Beta App Review is behind him. Still to work out: how to find strangers and get them in (likely a capped public link), plus and a 'What to Test' note asking testers to send Settings > Playtest Data > Share Debug Stats, which also settles 8/9/10 rounds. Telemetry is local only, so data arrives only when a tester shares it.
- TODO after section 4 (Pete, 2026-11-12): audit for cards dropped by accident. Compare every mask id/phrase that ever existed in `assets/data/huntData.json` history (and the audit override files) against the current bank; list every card that disappeared without a recorded reason (Change Log, CLAUDE.md retired ids, commit message) for Pete to rule on. Start with the 2026-10-05 audit commits (`e7c395f`, `2ecfd07`, `f356433`). Pete suspects more than CAPITAL's punishment card.
- DONE (superseded): sections 4-7 of `Claude outputs/HUNT_FAIRNESS_AUDIT_2026-11-11.md` for newer words were finished 2026-11-12 (see SECTION 4 DONE and SECTIONS 5-7 DONE above). 17 section-4 cards on old July words are left for the old-words rewrite.
- HUNT WORD PICKING BY DIFFICULTY (Pete, 2026-11-13; replaces Option C, which he approved first, with the full version). Ordinary rounds now draw words by difficulty, not gpsTag: rounds 1-2 easy, 3-4 easy+medium, 5-7 medium+hard (+mastered returns), 8-9 hard (+mastered returns). Boss, pin, Haunt slot, FINE and mastered-return rounds unchanged. BLUFF (the only hard Confidence word; Pete first sent it to rounds 3-4 under Option C) now plays in rounds 5-9 with the other hard words. Sim, 20 Hunts x 200 players: words seen by round-3 players 44 -> 53 (every easy and medium word reachable, no hard by design), round-5 75 -> 83 with 0 never seen (was 70), round-7 103 -> 112 with 0 never seen (was 61), Boss-reachers 143 -> 146 (hard words 24 -> 37, medium 79 -> 72). Rounds 1-2 100% easy (was 96%). Files: `app/game/huntGenerator.ts`, new `app/game/huntReachability.test.ts` (in `npm test`; fails on the old generator), `docs/GOLDEN_PACING_SYSTEM.md`. Full `npm test` and tsc clean. NOT yet device-checked or committed. Card rotation inside a word was checked: up to 5 of a word's cards are shuffled each time it plays (at least one REAL, one trap), so every card comes up over time.
- SPELLING (Pete, 2026-11-13): VS Code's cSpell flagged 26 words in `huntData.json`; 25 are names, slang or real words (GUMP, EVEL Knievel, WALKIE-TALKIE, EWWWWWWW on GROSS is intentional, etc.). The one real misspelling, `stick_r3` SLAPSHOT, is now SLAP SHOT (id kept). content:quality 0 blockers, test:content-runtime passes. Workbook: `POLYWORDS_CANONICAL_RECONCILED_2026-11-13.xlsx` in Downloads is now the CURRENT canonical (Tiles C318 + Change Log row; the 11-12 file is left as it was). cSpell only flags unknown words, so a real word used wrongly would not show up.
- Word picking by difficulty: device-checked by Pete 2026-11-13 (new words such as BUTT early; ENGAGED came back as a Haunt as before).
- DROPPED-CARD AUDIT DONE (2026-11-13). Sources: every huntData.json version in git (85, from June) and 135 Hunt workbooks in Downloads. Scope: from Pete's 2026-08-07 workbook import (which replaced the whole bank on purpose) to now. Every disappearance since then is recorded (CLAUDE.md retired ids, commit messages, workbook Change Log / Audit Review 2026-10-05 Pete-locked rows) EXCEPT: `light_r4` REAL "BLUE, BUT NOT THE DARK ONE" (pale-color sense; dropped 2026-10-05 `f356433`; the workbook sync wrongly calls it a renumber to light_r7, which is the diet-beer card; LIGHT has no pale-color REAL now); `foot_r11` REAL "WHAT THE GAME IS ONCE THE ACTION HAS STARTED" (afoot; dropped 2026-10-01 `76355e9`, no reason; note the answer is AFOOT, not FOOT); `fast_r03` REAL (first meal breaks; same sense still on `fast_r04`); `concentration_t3` TRAP "STRAIGHT FROM THE ORANGE, NOTHING ADDED" (2026-10-05, CONCENTRATION is on the rewrite list); `capital_r3` (known, on the rewrite list). LOCKED batch workbooks (newest per word, 133 words have one): only 4 locked tiles never reached the game and all 4 are explained (KIND and LINE in the 11-03 Change Log; NAIL's two REALs rewritten, same senses live). Hidden pairs: none lost. RULED by Pete 2026-11-13: light_r4 and foot_r11 were his own removals (stay out; record gap only); fast_r03 stays out because the card he chose to keep is `fast_r04` "WHAT BREAKFAST BREAKS", which is live. Nothing to restore.
- QUESTION-WORD CHECK (Pete, 2026-11-13): no card ever lost its WHAT/WHERE/WHO. Every current card was compared with every git version and every workbook tile; nothing matched a question-form original. Statement cards were written that way: the 76 rewrite-list words are 16% question cards (avg 5.9 words); the other 177 words 59% (avg 8.5), but 37 of those are under 30% question cards (322 cards), e.g. BATTERY, BOUND, BOWL, CAPE, CAST, CHECK, CRAFT, CRICKET, DIGEST, DUCK, EXTRACT, FOSTER, KERNEL, TIRE. Statement cards are not wrong by rule; whether those 37 join the rewrite is Pete's call.
- CONTENT WRITING BIBLE (Pete, 2026-11-13): `docs/CONTENT_WRITING_BIBLE.md` added as the master writing document, amended to his rulings (several REALs per meaning allowed; sound-alikes only when genuinely clever; traps never repeat a REAL's scene, exception only with his OK; his 16 binding trap rules in Section 16A). CLAUDE.md source map and CONTENT_WRITING_STANDARD.md point to it.
- OLD-WORDS REWRITE in progress (2026-11-13): only the 76 (75 July words + CAPITAL); Pete ruled the 37 statement-heavy newer words stay as they are (statement or question doesn't matter; masking/trapping does). Only flagged cards change; old traps are rechecked against "trap the word, not the situation" (most fail). Applied every 3 words. BATCH 1 APPLIED: ABSTRACT, ADDRESS, ANCHOR (ids in CLAUDE.md retired list); content:quality 0 blockers, full npm test clean; workbook `POLYWORDS_CANONICAL_RECONCILED_2026-11-13.xlsx` (Downloads) updated and matched id for id. NOT yet device-checked. PLOT needs a new trap when reached (its coordinates handle moved to ADDRESS's Mayday trap). SCOPE WIDENED (Pete, 2026-11-13): the workbook's first, non-alphabetical Tiles block (94 original words, BANK ... IRON) is the definitive original set; the style-based list of 76 matched 74 of them (plus ANCHOR and BACK, written 2026-07-23 in the short style). Pete added the 20 first-block words the style test missed: ARMS BOUND BOWL CRAFT DUCK GRACE HORN IRON LIGHT MOLD MOUSE NAIL PALM PEN PLANE SENTENCE SINK TIRE TRAIN TRIP. Total 96. Not a full rewrite of each: only what needs cutting or rewriting. BATCH 2 APPLIED (2026-11-13): ARMS, ARROW, ARTICULATE (ids in CLAUDE.md); content:quality 0 blockers, full npm test clean, workbook (11-13, Downloads) updated and matched id for id for all six rewritten words. History check: ARROW never had a Cupid card; a July 5 draft "ROBIN HOOD SENDS THIS FIRST" was replaced before the Aug 7 import. Pete's phrase rule: a phrase/idiom can be a REAL when it is pop-culture, funny or clever enough ("up in arms" was not); recorded in the Bible, Section 19. BATCH 3 APPLIED (2026-11-13): BACK, BALANCE, BAND; 0 blockers, full npm test clean, workbook matched id for id for all nine rewritten words. AUG 7 FINDING (Pete asked): commit `f593a24` replaced the old 400-word bank with Pete's 150-word workbook ("placeholder test corpus", his call); 164 old words never returned and 1,911 old cards on words still in the game never came back in any wording (701 on the 96 rewrite words; 1,186 came from the 2026-07-05 "Hunt rewrite workflow and drafts" checkpoint, e.g. BALANCE "WORK PHONE STAYS FACE-DOWN AT DINNER"). Full list: `POLYWORDS_AUG7_DROPPED_CARDS_2026-11-13.xlsx` in Pete's Downloads (Summary, Lost cards, Words not in game). From BAND on, each word's lost Aug 7 cards are shown during its review. BANK APPLIED on its own (2026-11-13, ids in CLAUDE.md): 6 REALs / 5 traps, 0 blockers, full npm test clean. JUNE 29 FINDING (Pete asked): BARK's ship REAL "THREE MASTS BEFORE STEAM" was in the game until the 2026-07-05 drafts commit `4c57cfb` swapped it for brisket, and Haunt Tiles v2 (Jul 19) already lacked it, so Aug 7 never had it. Meanings were lost in the Jun 29 -> Jul 19 window, not only on Aug 7. 25 surviving words have fewer REALs now than on Jun 29 (BANK BARK BAT BATTERY BOLT CAN CEILING CELL CHANNEL CHARACTER CHECK CRAFT DATE ENGAGED EXCHANGE HAMPER IRON KERNEL MINE PITCH POINT POT RING ROCK STRIKE; some are Pete's own later cuts). Every REAL meaning from 9 sources per word: `POLYWORDS_ALL_REAL_MEANINGS_EVER_2026-11-13.xlsx` (Downloads). BARK in progress: Pete cut the smoke-ring and candy-cane drafts, cat hiss maybe, added a tree-rings trap; ship wording, brisket and peppermint REALs not yet ruled. AFTER-AUG-7 CHECK: 211 cards added since Aug 7 are gone and 210 are recorded (only `corner_t4` pool pockets was not; the Oct 5 audit sheet mislabels it as a boxer-stool trap). 121 cards were reworded in place under the same id, some to a different meaning (e.g. BUTT rifle butt -> pork butt): `POLYWORDS_AFTER_AUG7_CHANGES_2026-11-13.xlsx` (Downloads). The 164 L-Y words are out because Pete had not reached them in his rewrite; most of the old cards were bad but not all; they are a separate job after the 96. METHOD AGREED: for each word Claude shows the meanings missing today versus the June 29 game, every workbook and the in-place rewrites, and Pete rules. GAP CHECK DONE for ABSTRACT through BANK (applied, see CLAUDE.md); also four LOCKED-never-in-game cards resolved. BATCH 4 APPLIED (2026-11-13): BANK, BARK, BASS; 0 blockers, full npm test clean, workbook matched id for id. WORKFLOW CHANGE (Pete): before applying any batch, show the final card list (kept / new / cut / out) and apply only after Pete approves. Next: BAT (with its gap check; BAT had 4 REALs on Jun 29, 3 today). Not yet read as sources: Desktop Word files huntData_FULL_REWRITE_PROPOSED.docx, NEWREALS.docx, Hdata.docx.
- NEXT (Pete, 2026-11-13): phone-check the word picking, commit; then the old-words REWRITE (75 July words + CAPITAL); then first-30-seconds polish and stranger testers.

## 2026-11-14: repo cleanup (Pete: "don't delete anything we use or that could break something")

- **Git housekeeping (local only, not a commit):** 396 half-written temp objects (12 MB) and 48 index files with no pack were MOVED (not deleted) from `.git/objects` to `C:\Users\pdiba\polywords-backups\git-junk-2026-11-14`. `git fsck` clean before and after; the garbage warnings are gone. Nothing reachable was touched; no `git gc`/prune was run, so unreachable objects (old dropped stashes) are still there.
- **Branch `repo-cleanup` (needs Pete's OK to merge):** removed a stray tracked `FETCH_HEAD` (0 bytes), `assets/brand/desktop.ini` (Windows folder file), the two root dev screenshots `vault-spine-concentration-iphone-{preview,test}.png`, and 8 code files nothing imports, all from retired features: `app/game/ranks.ts` (rank retired), `app/components/ScoreFloat.tsx`, `StreakDisplay.tsx`, `ui/BrandWordmark.tsx` (wordmark is a PNG), `app/constants/animations.ts`, `app/logic/pollyBudget.ts`, `app/ui/pwDesignSystem.ts`, `pwVaultMaterials.ts`. All recoverable from git history. Added two passing tests that `npm test` never ran: `app/game/rematchOutcomeDevPreview.test.ts`, `app/ui/spineVariants.test.ts`. Checks: tsc clean, full `npm test` passes, content:quality 0 blockers, `npx expo export --platform ios` bundles.
- **Deliberately left in place:** unreferenced art and sounds (about 54 MB; Metro bundles only required files, so they do not grow the app; several are Pete's keeps in CLAUDE.md: recess stones, StoneWall, wall veins, empty plaques, `polybook_crown.png`, the unplaced laughs, `quill.glb` 28 MB); the parked Polly rig/animation code (`usePollyAnimator`, `PollyRig`, `pollyRigParts`, `pollyPerformances`, `PollyActor`, `PollySprite`, `pollyAnimations`, the flight-landing prototypes); `app/ui/pwBrandAssets.ts` (used by the brand icon script); all packages (the six not named in code are needed by other packages); 88 unused imports/variables inside files (mostly MaskBoard and other gameplay files; low value, not worth touching gameplay code); the 8 stashes, the `poly-words-build16` worktree and all 20 local branches (9 already merged into play-screen-overhaul: `claude/face-rig-presets`, `claude/face-rig-sprites`, `claude/polly-clips-test`, `daily-castle-test`, two `freebuff/thread-*`, `home-terrace`, `main`, `onboarding-wip`).
- **Flag for launch (licences):** `assets/fonts/Buggie-LICENSE.txt` is EMPTY (0 bytes) but the Buggie font is used (`App.tsx`, `fonts.ts` "hand"). Its licence is not recorded anywhere in the repo.
- **NEXT (Pete, 2026-11-14, end of day):** (1) old-words rewrite: BAT, BEAM and BEAR were rewritten and applied to `assets/data/huntData.json` and the workbook on 2026-11-14 (the earlier BAT proposal with `bat_r4`-`r6` / `bat_t9`-`t11` was superseded and never applied; see the retired-ids bullet in CLAUDE.md). `npm run content:quality` passed; the change is NOT committed (Pete commits). The rewrite resumes at BLADE, the next Group A word (order: Group A, B with RANK, D, FLY last). (2) Pete's phone check of the Daily bubbles, then a new TestFlight build (friends are still on build 18). (3) Stranger testers, with a "What to Test" note asking for Settings > Playtest Data > Share Debug Stats.
