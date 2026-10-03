# POLYWORDS Current Context

Updated 2026-10-02. This file is current state + next work only. `CLAUDE.md` owns durable
architecture; focused rules live in `docs/`; code/data outrank both.

## Branches

| Branch | Role |
| --- | --- |
| `play-screen-overhaul` | Main working branch. |
| `daily-castle-test` | Finished and merged. Do not work on it. |
| `onboarding-wip` | Finished and merged. Do not work on it. |
| `main` | Stale. Never merge into it without Pete's approval. |

Phone testing uses the local checkout, not GitHub. Pull the branch before Expo testing.

## Current State

- **Core Hunt:** UP claims a REAL; RIGHT rejects a trap. Polly's Word ends the arc; failed
  boss words can return as Haunts. Boss outcome and the swipe grammar remain protected.
- **First-run onboarding:** merged, device-approved, and locked. FINE teaches recognition on
  the real board; HUD lessons teach feathers, momentum, a broken run, and Hunt progress.
- **Daily castle:** locked on device. Gate/clues, tunnel, answer wall/blocks, gold hit, floor
  coins, and the gold-coin finale stay as approved. The deferred answer-stone entrance issue
  remains deferred; do not reopen the castle art to solve it.
- **Polybook:** active redesign work is now the main product focus. The old miniature two-page
  spread is retired. The live direction is a closed physical Polybook hub opening to one large
  portrait page, with physical forked ribbons for TODAY, JOURNAL, and BUTTERZ.
  - The open-book shell, bottom ribbons, page safe area, and visible `< COVER` return control
    are implemented and device-tested in progress.
  - TODAY uses the five rivalry states and the ten-entry authored pools. DEV controls can cycle
    TODAY entries/states and JOURNAL test content.
  - The colored-handwriting experiment is rejected. Polly's entry returns to one dark readable
    ink; mood moves to a stronger accent bar under TODAY. AMUSED uses Polly green. No brown.
    Other mood-bar colors remain unapproved.
  - Buggie is too thin on a physical phone for the journal body. A replacement handwriting font
    is being selected; do not lock TODAY typography until it passes device readability.
  - BUTTERZ is the mastery page. It shows crowns without redundant word labels such as ROUND.
    Crowns need future meaning through earned Polybook access/unlocks; do not build that economy
    during the current typography pass.
  - Closed-cover art follow-up: remove the side ribbons from the closed-book art and place the
    section ribbons at the bottom. This is noted work, not a reason to interrupt the font pass.
- **Visual consistency pass:** the governing rule is now **shared grammar, not identical
  skins** (`DESIGN.md`).
  - Daily Entry uses the dark utility-panel family and is locked.
  - Daily Results was tested with that family, looked worse, and was restored. Keep it.
  - Settings content cards use the dark utility material; background/header/nav stay as-is.
  - Boss intro and mid-Hunt exit confirmation were reviewed and kept as-is.
  - First-run HUD spotlight remains its own teaching system.
  - Returning Haunt intro copy is locked: GUESS WHO'S BACK? / another win / BANISHED vs
    STILL HAUNTED / DON'T GIVE A PARROT ANOTHER WIN. A Settings dev preview can open it.
- **Results:** Hunt Results is the last major visual surface still awaiting a focused
  keep/change audit. Do not assume it needs redesign.
- **Polly:** face rig is live on Home, Daily, and Results while settled; Hunt visits remain
  pose art. Dialogue rules live in `docs/POLLY_DIALOGUE_BANK.md`.
- **TestFlight:** build/submit/install works end to end. Store name remains
  "POLYWORDS: Hunt or Be Trapped"; iPad support is off.

## Current Product Rulings

- Recognition over vocabulary instruction.
- Rank and score are player-facing nowhere.
- A book is a word; mastery comes from the Boss gauntlet, not score.
- Haunted words return; a successful rematch banishes the active Haunt.
- Daily is deterministic, five rounds, UP-only, two lives, one attempt per date.
- Gold is scarce and meaningful; ordinary choices stay neutral before commitment.
- Visual consistency requires a player-facing benefit, not cosmetic sameness.

## Next Work

1. **Polybook TODAY readability.** Select and license-check a heavier handwritten font, restore
   dark body ink, and device-test the thicker mood bar under TODAY. AMUSED = Polly green.
2. **Polybook JOURNAL.** Bring the approved authored journal/work-log material into the new
   portrait-page system and verify real-phone readability with the selected font.
3. **Polybook BUTTERZ.** Finish the mastery-page composition without turning it into a stats
   dashboard; crowns are artifacts whose longer-term unlock value is designed later.
4. **Polybook shell/art cleanup.** Update the closed-cover ribbon art after the page typography
   is stable.
5. **Real-device release journeys.** Cold start, rapid navigation, background/foreground
   recovery, persistence, Polly animation/audio, sound-off, and small-phone coverage.
6. **Boss-capable content.** Author more words with three fair hidden pairs.
7. **Banished record decision.** Decide whether a cleared Haunt gets permanent history.

## Deferred / Do Not Reopen Yet

- Daily answer-stone initial pop-in before the punch-out.
- Decorative trim passes on already-approved screens.
- Re-skinning Boss/Haunt outcomes, Polybook pages, Hunt decisions, or Daily stone blocks merely
  to make them look alike.
- Deleting the old Lexicon rollback path; that remains a separate Pete decision.

## Protection

Preserve every stash and unrelated worktree change. Pete's local art is his; do not touch
untracked/local art without approval. No branch merges without Pete's approval.
