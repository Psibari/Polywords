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

**Current visual state (June 28 evening):**
Play screen design overhaul complete for this sprint.
- HUD: single flat strip, chainMultiplier, gold fill bar progress
- Background: two-zone LinearGradient overlay
- HeroBook: flat rect cover, top spine/hinge, dark parchment pages, POLLY'S VAULT label on hinge
- Book intake (Pass 2): tile travels to book, book opens on arrival via onNearTarget handoff
- intakeY = wordScreenY + 73 (calibrated for coverHeight 162)
- gridWrap paddingTop: 88
- Swipe cues fade at stepIndex >= 3
- Red flash: 0.32 opacity, 55ms
- Tile inner face: #1C1548
- Tile width: 290px max (card not panel). backingCardWidth matches.
- HUD gold hairline bottom border.
- Page block pagesCreamBot: #8A7A68.
- Score letterSpacing: 2.

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
- Each Daily round restores the right-side Clue Vault entrance and staggered left/right answer-card entrances without mixing entry motion into drag translation.
- Daily win/loss results keep Polly and the Gold Feather reward in a compact, scroll-safe visual stack.
- Hunt wrong swipes now preserve mask ID and UP/RIGHT direction, and fatal wrong swipes finalize the current WordResult before Results.
- Hunt-side Gold Feather consumption/revival is quarantined because revival was unsafe with the current MaskBoard tile lifecycle and Results accounting.
- Hunt Gold Feather spend will be rebuilt later only after a safe resume-state design is approved.

---

## On the horizon (priority order)

1. **IMMEDIATE NEXT:** Wrong swipe buzzer + haptic + Polly <300ms (trinity not fully wired)
2. Correct claim SFX (audio asset needed)
3. Score floats + mastery shards → FXLayer
4. Swipe cues: RIGHT cue fine-tune if needed
5. Polly persistent anchor audit (pollyVisible stays true between events — investigate usePollyAnimator)
6. HeroBook proportions review on device after full session
7. Onboarding / first-run experience

Full Hero Word-Book spec: `docs/HERO_WORD_BOOK_SYSTEM.md`.
Daily Challenge full spec: `docs/DAILY_CHALLENGE_SPEC.md`.
Patch history: `CHANGELOG.md`.
Canonical workflow: `docs/WORKFLOW.md`.
