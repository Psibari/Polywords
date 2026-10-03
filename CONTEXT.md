# POLYWORDS Current Context

Updated 2026-10-03. This file is current state + next work only. `CLAUDE.md` owns durable
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
- **Polybook:** the portrait Living Journal interior is now device-approved and locked.
  - The live shell is a closed physical Polybook opening to one large portrait page with a
    visible `< COVER` return control.
  - Open navigation is **TODAY / JOURNAL / MASTERY**. The fixed MASTERY label replaced the
    player-name ribbon so legal long names never have to shrink into unreadable tab text.
  - The three forked ribbons sit at the bottom of the book. Their straight top section is masked
    so they read as bookmarks tucked beneath the bottom page edge rather than pasted on top.
    This treatment is device-approved; do not reopen it without a demonstrated regression.
  - TODAY is locked after phone review across all five rivalry states and authored entries:
    approved heavier handwriting, dark neutral ink, 9px mood bar with restrained glow and one
    entrance pulse, and the open-art readiness gate.
  - JOURNAL is locked: authored chronological entries paginate by physical page, keep logical
    entries intact, support arrows + horizontal swipe, use the readable enlarged PAGE X OF Y
    counter, and have no stats footer. DEV FULL may repeat real rows only to stress pagination.
  - MASTERY is locked: live player name stays inside the page; purple crown artifacts use the
    approved three-column collection with no redundant word labels. Overflow uses the shared
    page-turn architecture at 12 crowns per page; the pager stays hidden on a one-page collection.
  - Crown accumulation still needs future meaning through earned Polybook access/unlocks. Design
    that progression separately; do not disturb the locked interior while doing it.
  - Closed-cover art follow-up remains deferred: remove/replace its old side-ribbon treatment
    with bottom ribbons when that artwork is addressed.
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

1. **Polybook mastery progression.** Define what accumulating crowns reveals or unlocks inside
   Polly's book without turning mastery into a currency dashboard.
2. **Polybook closed-cover art cleanup.** Replace the old side-ribbon treatment with the approved
   bottom-ribbon language when the cover art is next touched.
3. **Real-device release journeys.** Cold start, rapid navigation, background/foreground
   recovery, persistence, Polly animation/audio, sound-off, and small-phone coverage.
4. **Boss-capable content.** Author more words with three fair hidden pairs.
5. **Banished record decision.** Decide whether a cleared Haunt gets permanent history.

## Deferred / Do Not Reopen Yet

- Daily answer-stone initial pop-in before the punch-out.
- Decorative trim passes on already-approved screens.
- Re-skinning Boss/Haunt outcomes, Polybook pages, Hunt decisions, or Daily stone blocks merely
  to make them look alike.
- Deleting the old Lexicon rollback path; that remains a separate Pete decision.

## Protection

Preserve every stash and unrelated worktree change. Pete's local art is his; do not touch
untracked/local art without approval. No branch merges without Pete's approval.
