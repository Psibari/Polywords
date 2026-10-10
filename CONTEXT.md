# POLYWORDS Current Context

Updated 2026-10-09. Current state + next work only. `CLAUDE.md` owns durable architecture;
focused rules live in `docs/`; runtime code/data outrank docs.

## Branches

| Branch | Role |
| --- | --- |
| `play-screen-overhaul` | Main working branch. |
| `daily-castle-test` | Finished and merged. Do not work on it. |
| `onboarding-wip` | Finished and merged. Do not work on it. |
| `main` | Stale. Never merge into it without Pete's approval. |
| `gh-pages` | Live public website (GitHub Pages). Orphan branch, no shared history with game code. Never merge into or out of it. |

Phone testing uses the local checkout, not GitHub. Pull `play-screen-overhaul` before Expo testing.

## Current State

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
- **Daily castle:** device-approved and locked. Do not reopen the castle art for the deferred
  answer-stone entrance issue.
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
- **TestFlight:** build/submit/install works end to end. Store name remains
  `POLYWORDS: Hunt or Be Trapped`; iPad support is off.
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
3. More easy (tier 1) Daily words: only 14 exist (as of 2026-10-06) and two of five daily
   rounds use tier 1, so each easy word repeats about weekly. Writing is Pete's.
4. Store listing: screenshots and description.
5. Free vs paid: Pete's decision.
6. Android device testing beyond one phone.
7. Buy polywords.app, then custom domain + share-link switch.

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

## Do Not Work On Yet

- **Home polish pass:** the Home route plate still says `WORD VAULT`, but the product is now
  POLYBOOK. When this is scheduled, change the route label to `POLYBOOK` and review/polish the
  other Home route plates and surrounding Home presentation in the same focused pass rather than
  making a one-off label edit now.
- New Polly art or WEBP restoration before the articulation inventory.
- Production Home life-profile animation before the DEV Neutral proof.
- Crown/Polybook progression, additional relationship states, or Polybook interior changes.
  The permanent Polly turn is approved in principle but unbuilt (lines unwritten).
- Changes to the device-approved `BROW_FOLLOW = 0.33`.
- Daily answer-stone initial pop-in or decorative passes on approved screens.
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
