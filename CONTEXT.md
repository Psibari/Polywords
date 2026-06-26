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

**Daily Challenge:** `DailyChallengeScreen.tsx` is now the real UP-only screen shell behind quarantined navigation. It uses the real store/engine state, six-card two-column board, timed Clue Vault, persistent Polly reactions, Daily materials, and explicit win/loss overlay. Navigation remains disabled pending device sanity approval; Gold Feather inventory/spend is not implemented. `docs/DAILY_CHALLENGE_SPEC.md` remains the source of truth.

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

---

## Next Implementation Order

1. Daily Challenge visual redesign (spec: `docs/DAILY_CHALLENGE_SPEC.md`).
2. Hero Word-Book Pass 1 — cover swing entrance/exit.
3. Correct UP book intake — SwipeMask handoff required (see parked stash).
4. Wrong swipe buzzer + haptic + red flash.

Full Hero Word-Book spec: `docs/HERO_WORD_BOOK_SYSTEM.md`.
Daily Challenge full spec: `docs/DAILY_CHALLENGE_SPEC.md`.
Patch history: `CHANGELOG.md`.
Canonical workflow: `docs/WORKFLOW.md`.
