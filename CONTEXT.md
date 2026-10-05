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


## 2026-10-04 Polly relationship + animation checkpoint

- **Relationship Memory V2 is implemented and verified.** Permanent progression remains monotonic while rivalry/current form can move both directions. Durable visit timing, streak peaks, and word-specific Haunt rivalry history feed pure relationship context rather than a visible meter.
- **Relationship presentation is implemented and device-checked.** Dedicated authored pools are wired for comeback, veteran slump, return after absence, and Haunt rematch. The physical checks passed for all four beats, so this dialogue layer is treated as locked unless a regression appears.
- **Current product priority moved from crown progression to Polly's Life System.** Do not work on crown/Polybook progression until Polly's living-character animation direction is proven.
- **Life-profile logic exists but its current visual proof is not approved.** Five logical profiles remain useful: neutral, cocky, watchful, rattled, hauntFocused. Static-pose comparisons demonstrated that labels/pose swaps alone do not make Polly feel alive.
- **Existing Home animation foundation was re-audited.** `PollyHomePerch` uses `PollyPerchRig` plus `usePollyAmbientMotion`: layered Rig 2 face parts provide random blinking, brow following, beak/eye variants and crown movement; ambient motion supplies subtle whole-figure rise/drift; Home can transition into the sleeping pose after inactivity.
- **Legacy animated WEBPs are not a production animation solution.** They are sparse six-frame storyboard/reference material with rough edges/cropping and should not be repaired now. Keep them until active runtime references are systematically replaced.
- **DEV animation surfaces:** Polly Face Rig is the pixel/tuning workbench; Polly Desktop Animation Lab is the large PC inspection surface; Polly Life Profiles is a comparison surface.
- A DEV-only **ALIVE LOOP** was added to Polly Face Rig as an experiment. It layers irregular whole-figure lean/settle over the existing blink/breathe controls and can be manually run even when Reduce Motion is enabled in DEV. Production accessibility behavior was not bypassed.
- **ALIVE LOOP result: rejected as the Life solution.** On inspection it reads as a flat image tilting/rocking, not Polly articulating. Do not promote it to Home or treat it as approved animation.
- Root limitation found: Rig 2 separates face/crown parts but most of Polly's body is baked into `polly_base.png`. It cannot independently move head, wings, feet, tail, or posture enough to create convincing character performance.

### Next Polly work

**Single most valuable next step:** audit the existing separated Polly art (`assets/images/polly/rig/`, `rig2/`, `flight-rig/`, poses and clean large PNGs) to determine the minimum viable articulated Rig 3 before creating any new art.

Next three actions, in order:
1. Inventory which existing clean layers can safely supply body/head/wing/tail/feet/face/crown articulation and identify unusable rough/dormant pieces.
2. Build a DEV-only articulated Neutral prototype in the existing Polly Face Rig workbench, with real part movement rather than whole-sticker rocking.
3. Prove one 30–60 second Neutral living sequence (blink + glance/attention + weight/posture shift + settle, with irregular quiet gaps) before extending Cocky/Watchful/Rattled/Haunt Focused or wiring production Home.

**Do not work on yet:** new Polly art, WEBP restoration, crown progression, additional relationship states, Polybook changes, production Home Life-profile animation, or changes to the device-locked `BROW_FOLLOW = 0.33`.

**Acceptance:** Polly must read as a living character without dialogue/labels; movement must come from believable articulation rather than rotating the whole image; reaction and resting disposition must remain distinct; apparent size/anchor must stay stable; no clipping/alpha defects; Reduce Motion must remain authoritative in production; PC proof precedes production Home and phone verification.
