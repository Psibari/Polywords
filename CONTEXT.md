# POLYWORDS Current Context

Updated 2026-09-30. This file is current state + next work only. `CLAUDE.md` owns durable
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
- **Polybook:** Polly's diary on the internal Vault route. It opens directly into the book.
  The stale archive intro overlay is gone. Meanings/traps/hidden pairs never appear there.
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

1. **Hunt Results visual audit.** Device-review the current screen and change only proven
   readability, hierarchy, or material problems.
2. **Real-device release journeys.** Cold start, rapid navigation, background/foreground
   recovery, persistence, every Polly laugh/animation, performance, sound-off, and small phone.
3. **Boss-capable content.** Author more words with three fair hidden pairs.
4. **Banished record decision.** Decide whether a cleared Haunt gets permanent history.
5. **Cold-start gauntlet audio.** Listen for late first-use `stoneRumble`; warm earlier only
   if audible.
6. **Navigation.** Home still cannot reach Polybook directly.
7. **Technical polish backlog.** Haptic gateway stragglers, TestFlight-visible audio failures,
   remaining Polly sprite cleanup, Polybook writing depth, privacy policy/support contact.

## Deferred / Do Not Reopen Yet

- Daily answer-stone initial pop-in before the punch-out.
- Decorative trim passes on already-approved screens.
- Re-skinning Boss/Haunt outcomes, Polybook pages, Hunt decisions, or Daily stone blocks merely
  to make them look alike.
- Deleting the old Lexicon rollback path; that remains a separate Pete decision.

## Protection

Preserve every stash and unrelated worktree change. Pete's local art is his; do not touch
untracked/local art without approval. No branch merges without Pete's approval.
