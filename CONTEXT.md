# POLYWORDS Current Context

Updated August 7, 2026. Active branch: `play-screen-overhaul`.

## Current Build

HEAD: 8e0b1a5. Tags: v0.working-20260722-hudchips, -vaultcopy, -economy1,
v0.working-20260723-music, -lossfx, -routec1, -routec2.

## Session — 2026-08-07

Full audit pass, then a full content replace at Pete's explicit direction:

- Audit found `9ff2242` (music/SFX self-heal on native audio failures) and `39b202c`
  (startup readiness coordination) had already fixed the two bugs this file's "Open Bugs"
  section still listed as open — see corrected section below.
- Pete supplied a new editorial workbook (150 words: 142 regular + 18 boss candidates,
  including a recovery/consolidation audit trail). Built `tools/content/import-workbook.mjs`
  (staging/diff tool) and `tools/content/build-hunt-data.mjs` (the real replace) to parse
  it — two sheets (`Tiles`, `Boss Words (Production)`) with non-contiguous duplicate row
  blocks per word, requiring last-write-wins dedup by phrase text.
- Pete's call: gut `assets/data/huntData.json` completely and replace it with only this
  150-word set — see `CLAUDE.md` Content Boundary for the full breakdown (14 boss-ready,
  2 demoted-from-boss-by-Pete words correctly shipped as regular-only, `gpsTag`/
  `difficulty` placeholder-assigned since the workbook has neither).
  tsc clean, full test suite green, `generateHunt` smoke-tested across all 4 session
  lengths (8/10/12/15) plus mastered-word and ghost-word scenarios — confirmed playable,
  not just schema-valid. Committed as `f593a24` and pushed.
- Added `xlsx` as a devDependency for the two new tools.
- `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` swapped for
  `POLYWORDS_content_data_2026-08-06_ARMS_NAIL_COMPLETE_LOCKED.xlsx` as the tracked
  editorial master — verified byte-identical `huntData.json`/`build-report.json`
  regeneration before the swap. Committed as `936c50c` and pushed.
- Device test (`npx expo start -c`) requested specifically to verify the SFX
  play()-error self-heal path from `9ff2242` on a real failure. Found two things,
  both fixed and device-confirmed, commit `4e86b0c`:
  - Music self-heal confirmed working as designed: a real `Session activation failed`
    error hit the hunt track mid-session and recovered by rebuild attempt 2 — closes the
    "not yet seen self-healing on-device" gap `9ff2242` left open, and answers the
    "Unchased" boss-track warning below (same error class, same recovery path).
  - SFX self-heal had a real gap, not just an unconfirmed one: `pressHoldStart` and
    `tileSwipe` exhausted both rebuild attempts and went permanently silent for the rest
    of the session, because `sfx.ts`'s retry budget (50ms x 4 = 200ms total) was never
    revisited when `9ff2242` added the bounded rebuild for exactly this "slow cold
    launch" failure mode — it was still sized for the ordinary already-preloaded case.
    Fixed by giving `sfx.ts` the same ascending backoff ladder (`[60, 150, 300, 600,
    1200]`, ~4.6s across 2 rebuilds) `MusicEngine.ts` already proved works.
  - Separately, Pete noticed a consistent 1-3s delay before hunt music starts on first
    Hunt entry after a reload. Confirmed via `ffmpeg` that `hunt_suspense_loop.mp3` has
    no leading silence — the delay was architectural: nothing preloads any track before
    `GameScreen`'s own `startMusic('hunt')` call, which only fires the instant Hunt is
    entered. Added `preloadHuntTrack()` (`MusicEngine.ts`), called from `App.tsx` right
    after boot checks finish, so the track warms silently in the background during Home
    idle time instead of loading cold at the door of Hunt.
  - SFX preloading (`preloadSfx()`) had this same lazy-first-entry pattern —
    GameScreen/DailyChallengeScreen only called it on their own mount. Fixed same
    session, commit `086c300`: called from `App.tsx` alongside `preloadHuntTrack()`.
    `preloadSfx()` is idempotent per sound, so the existing mount-time calls stay as
    harmless no-ops.
- First gpsTag/difficulty editorial pacing pass, commit `7290f90`: 91 of the 136 non-boss
  words moved off the round-robin/medium placeholder, each read against its actual
  REAL/trap content per the phase table in `docs/GOLDEN_PACING_SYSTEM.md`. Landed in
  `tools/content/pacing-overrides.json` (new, git-tracked) and merged in by
  `build-hunt-data.mjs` ahead of the placeholder fallback, so a future workbook rebuild
  won't silently wipe it. 45 words held back as genuinely uncertain — several because a
  trap reads as restating its REAL rather than contrasting it (a fairness question, not
  just pacing), see the CSV sent to Pete for the full list with per-word reasoning and a
  confidence flag. Applying the pass exposed a real crash risk: `huntGenerator.ts`'s
  `tension`/`panic` phase fallback chains couldn't reach the `confidence` pool as a last
  resort, so a heavily-mastered late-game player could exhaust two adjacent phase pools at
  once and crash instead of degrading gracefully. Fixed in the same commit — every phase's
  fallback chain now reaches every pool as an absolute last resort (own-pool preference
  preserved first). Verified with a before/after stress test: the same scenario crashed on
  the prior fallback chain, passes now. tsc clean, full test suite green, `generateHunt`
  smoke-tested across all 4 session lengths plus the exhaustion stress case.
- Placeholder-stability fix, commit `a2ce6b7`: Pete caught that the 45 held-back words
  weren't actually untouched — the round-robin placeholder walked a shared cursor down the
  sorted word list, skipping override words, so pulling 91 words out of that rotation
  shifted which arbitrary phase the *remaining* placeholder words landed on (confirmed:
  35 of 45 got a different, equally meaningless gpsTag). Fixed by hashing each word's own
  spelling into its placeholder instead of using shared position — a word's placeholder can
  no longer move just because some other word gets reviewed. Verified live (added a test
  override, rebuilt, confirmed zero drift elsewhere) and re-confirmed the REAL/TRAP mask
  data itself was untouched throughout, byte-identical across all 150 words both before
  this fix and before the original 91-word pass.
- `0a0099e` — the 37 words held back as "low confidence" turned out not to be a real
  concern on review: each one's trap is a correctly-labeled, genuinely sharp near-miss of
  its REAL, exactly what a harder word is supposed to look like, not a fairness problem.
  Folded in with their original analysis. 128 of 136 non-boss words now have real
  gpsTag/difficulty.
- `bfbd2f2` — went through the last 8 flagged words with Pete directly. TRAIN, TRIP, RING,
  PLUG, TIRE resolved the same way as the 37 above (Pete: traps don't need to oppose the
  REAL, they just need to trap the word — matches `CONTENT_WRITING_STANDARD.md`'s
  "guilty-close, legally wrong" definition exactly). POUND reviewed and left as-is. BULB
  and DATE had genuine content issues, fixed directly in the workbook (not just
  `huntData.json`, so it survives a rebuild): BULB's "the vegetable that makes you cry"
  trap cut (onions are literal bulbs, not a fair trap); DATE's "wrinkled purple fruit from
  the tree" trap (a fig near-miss, not a color mistake — the workbook's hidden "target
  word"/"trap family" columns, which don't make it into `huntData.json`, confirmed both
  were written on purpose) rewritten to "a one-night stand."
- `8e0b1a5` — gpsTag/difficulty applied for the final 8 words. **The pacing pass is
  complete: all 136 non-boss words have real, hand-reviewed `gpsTag`/`difficulty`, zero
  left on the round-robin/medium placeholder.** Only the 14 boss words' `difficulty` still
  falls back to placeholder where the workbook has no signal — that was never in scope for
  this pass.

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
- Route C phase 2 (tag v0.working-20260723-routec2): 3-tile hidden gauntlet wired into MaskBoard. One tile per hidden pair (up to 3), independent coin flip per tile (12.5% guess-through vs the old 50%). Returning Haunt re-tests the exact pair that beat the player last run, read off the ghost. Presentation is a placeholder ("N OF M" counter, existing tile framing) — phase 3+ is now scoped by `docs/BOSS_ROUND_SPEC.md`, not HUNT_POLLY_REBUILD_PLAN's old phase numbering.

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

## Deferred — Pre-Launch Accessibility/Polish Pass (found 2026-08-09)

Not urgent, explicitly deferred by Pete (not near launch) — batch these together for one
pass later rather than fixing piecemeal. Found via a ui-ux-pro-max checklist audit of the
Hunt session + boss round.

1. Reduce Motion is inconsistently honored in `MaskBoard.tsx` — most animations there
   correctly check it, but three don't: `triggerBoardShake` (~419-427, fires unconditionally
   on boss entrance and boss-haunted), the per-word deck-entrance cascade (~989-1052,
   including `bookSlideX`), and the non-boss word "lock pulse" (~1142-1156). Needs a
   warroom pass (MaskBoard.tsx is gated).
2. MASTERED/HAUNTED outcome overlay's dismiss tap (`MasteredOutcomeOverlay` ~190-200,
   `HauntedOutcomeOverlay` ~252-270) ignores taps for up to 1200ms after mount with zero
   visual/accessibility indication it's not yet interactive. Same file, same gate.
3. Several real (non-decorative) text elements are under this project's own documented
   14px legibility floor: `vaultLabel` 9px (MaskBoard.tsx ~1919-1929), boss stakes kicker
   11px (`FONT_SIZES.hudLabel`, MaskBoard.tsx ~1845-1879), outcome "CONTINUE" label 11px
   (MaskBoard.tsx ~2187-2194), card era badge 10px (`FONT_SIZES.ghostSubLabel`,
   SwipeMask.tsx ~960-964).
4. Boss gauntlet swipe threshold (`HUNT_SWIPE_THRESHOLD = 40`, huntSwipeDirection.ts:3)
   is thin for what CLAUDE.md calls an irrevocable action. Lower-confidence finding, worth
   a second look rather than an automatic fix.
5. Boss stakes badge text has no `numberOfLines`/`adjustsFontSizeToFit` safeguard
   (MaskBoard.tsx ~1857-1879) — could wrap at large system text sizes and overlap the book
   below it. Low urgency.

## Active Runtime Boundaries

- Live content: `assets/data/huntData.json` — real 150-word working list as of 2026-08-07 (see Session log above), not the old test corpus.
- Editorial master: `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` — now Pete's 2026-08-06
  workbook (`POLYWORDS_content_data_2026-08-06_ARMS_NAIL_COMPLETE_LOCKED.xlsx`), swapped in
  2026-08-07 (`936c50c`).
- Dormant V2 export: `assets/data/huntData.v2.json`.
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
