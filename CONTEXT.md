# POLYWORDS Current Context

Updated August 7, 2026. Active branch: `play-screen-overhaul`.

## Current Build

HEAD: 39b202c. Tags: v0.working-20260722-hudchips, -vaultcopy, -economy1,
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
  not just schema-valid. **Not committed** — sitting in the working tree pending Pete's
  review.
- Added `xlsx` as a devDependency for the two new tools.

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
- Music/SFX going permanently silent after a native audio-server hiccup ("Server was dead"/"Session lookup failed"/"Session activation failed"): FIXED 2026-08-06, commit `9ff2242`. MusicEngine.ts and sfx.ts now rebuild the broken player/pool (bounded to 2 attempts) on a play()-error, not just on load-timeout. Confirmed recovering from real device failures for music; the SFX play()-error path is implemented and typechecked but not yet seen self-healing from an actual on-device failure — worth a device pass with `npx expo start -c` next time you're on-device anyway.
- Glitchy staggered startup: FIXED 2026-08-06, commit `39b202c` — subsystems now coordinate readiness instead of racing.
- Unchased: `[MusicEngine] failed to play boss track — Session activation failed` warning, seen once on a boss-track switch. Not reproduced since; no fix attempted.

## Active Runtime Boundaries

- Live content: `assets/data/huntData.json` — real 150-word working list as of 2026-08-07 (see Session log above), not the old test corpus.
- Editorial master: `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` — STALE (last touched Jul 16); Pete's 2026-08-06 workbook (`POLYWORDS_content_data_2026-08-06_ARMS_NAIL_COMPLETE_LOCKED.xlsx`, currently in Downloads) is the one actually live in the game now and should replace this tracked file — not yet done.
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
