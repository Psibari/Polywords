# POLYWORDS — CONTEXT.md
### Session briefing · June 2026

Read this at the start of any session. Full canonical detail lives in `CLAUDE.md`.

---

## What POLYWORDS Is

Polly is the Master of Words. She holds the word vault and set every trap. The player challenges her one word at a time. Every run is a HUNT: 10 rounds, GPS difficulty arc, boss at Round 10. North star: *"Wait… what? … Oh. Right."*

App shell: Home (lobby) · Play (arena) · Vault (player archive) · Settings. Bottom nav shows outside gameplay only.

---

## Current Build State

**Active branch:** `play-screen-overhaul` (never merge to main).
**Known-good tag:** `v0.working-20260621`
**tsc:** exits 0.

**Daily Challenge:** The Daily route and Home entry are enabled for device sanity testing, connecting the real engine/store state to the UP-only screen, six-card board, timed Clue Vault, Polly reactions, and win/loss overlay. `docs/DAILY_CHALLENGE_SPEC.md` remains the source of truth.

**Active stashes — reference by NAME only, never index, never pop/drop/clear:**
- `wip hud material pass needs feather asset`
- `wip haunt loop type scaffolding`
- `wip intake sliver not approved — needs SwipeMask handoff`

---

## What's Implemented

- Session length: 10 rounds. Boss always Round 10 (index 9).
- Arc generator live in `huntGenerator.ts`: `SESSION_LENGTH` + `GPS_ARCS` table. `buildPhasePlan` / `rolesFromPlan` / `hapticsFromPlan` replace hardcoded arrays.
- Haunt slot: index 7 (Round 8).
- Visual token system: `app/ui/pwTheme.ts` + `app/ui/pwMaterials.ts`.
- Hero plaque, tile card, deck stack: all on tokenized materials.
- Gameplay Polly: left-only at `POLLY_GAMEPLAY_SIZE=210`. Right side reserved for SWIPE RIGHT TO REJECT.
- Swipe affordances shipped (P5B).
- HUD: quiet control strip, feather Image assets live (`feather-life-filled/empty.png`).
- `tile_swipe.mp3` = sword whoosh. `press_hold_start.mp3` = card pickup.
- Polly sprite system: 10 individual PNGs, `PollySprite.tsx` + `usePollyAnimator.ts` fly-up arc.
- Daily Challenge: Fully rewritten. 6-card grid, clue timer, round transition ceremony, PollyDailyPerch idle cycle, story share text, results overlay. Daily Gold Feather reward/storage remains.
- `DailyAnswerCard` now owns Daily tile press/grip, free X/Y drag, snap-back, and UP-only claim control.
- `DailyChallengeScreen` no longer owns raw candidate gesture code; Hunt `SwipeMask` remains untouched.
- Hunt-side Gold Feather consumption/revival is quarantined because revival was unsafe with the current MaskBoard tile lifecycle and Results accounting.
- Hunt Gold Feather spend will be rebuilt later only after a safe resume-state design is approved.

---

## Next Implementation Order

1. Hero Word-Book Pass 1 — cover swing entrance/exit.
2. Correct UP book intake — SwipeMask handoff required (see parked stash).
3. Wrong swipe buzzer + haptic + red flash.

Full Hero Word-Book spec: `docs/HERO_WORD_BOOK_SYSTEM.md`.
Daily Challenge full spec: `docs/DAILY_CHALLENGE_SPEC.md`.
Patch history: `CHANGELOG.md`.
Canonical workflow: `docs/WORKFLOW.md`.
