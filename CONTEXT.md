# POLYWORDS — CONTEXT.md
### Session briefing · June 30, 2026

Read this at the start of any session. Full canonical detail lives in `CLAUDE.md`.

---

## What POLYWORDS Is

Polly is the Master of Words. She holds the word vault and set every trap. The player challenges her one word at a time. Every run is a HUNT: 10 rounds, GPS difficulty arc, boss at Round 10. North star: *"Wait… what? … Oh. Right."*

App shell: Home (lobby) · Play (arena) · Vault (player archive) · Settings. Bottom nav shows outside gameplay only.

---

## Current Build State

**Active branch:** `play-screen-overhaul` (never merge to main).
**Latest clean commit:** `c4a6c31`
**Known-good tag:** `v0.working-20260630b`
**Checkpoint feel:** Ghost Haunt Return Loop V1 with Results copy cleanup.
**Ghost loop checkpoint:** `badc9f0` / `v0.working-20260630a`.
**Copy cleanup checkpoint:** `c4a6c31` / `v0.working-20260630b`.
**tsc:** exits 0.

**Daily Challenge:** The Daily route and Home entry are enabled for device sanity testing, connecting the real engine/store state to the UP-only screen, six-card board, timed Clue Vault, Polly reactions, and win/loss overlay. `docs/DAILY_CHALLENGE_SPEC.md` remains the source of truth.

**Current visual state (June 30):**
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
- Correct REAL UP shows a compact readable gold `+points` badge.
- Correct TRAP RIGHT shows a compact readable rose `+points` badge.
- Wrong swipes show no score badge.
- Score badge V2: minWidth 64, padding 11×5, radius 10, dark rgba(15,13,42,0.92) backing, 1px matching border, font 26, duration 940ms, tight black text shadow.
- Fixed cause: REAL used left:0 + right:0, stretching the badge into a wide bar.
- Round 10 uses the boss-only final chamber background.
- The dev-only `BOSS` shortcut jumps directly to the real index 9 boss step.
- Boss word intro is clean and stable; duplicate text, shake, sweep, underline, and shockwave/ring clutter are removed.
- The long-word fit experiment was reverted and is not active.
- Polly Rig device sizing uses one shared 210px outer canvas with a 1.45 inner scale to compensate for transparent source padding, placed at left 4px / bottom 16px. Both `SHOW_POLLY_DEVICE_TEST` and `SHOW_POLLY_RIG_TEST` are false, so Polly remains hidden on GameScreen; legacy MaskBoard Polly visuals remain disabled.

**Active stashes — reference by NAME only, never index, never pop/drop/clear:**
- `wip hud material pass needs feather asset`
- `wip haunt loop type scaffolding`
- `wip intake sliver not approved — needs SwipeMask handoff`

---

## What's Implemented

- Session length: 10 rounds. Boss always Round 10 (index 9).
- Arc generator live in `huntGenerator.ts`: `SESSION_LENGTH` + `GPS_ARCS` table. `buildPhasePlan` / `rolesFromPlan` / `hapticsFromPlan` replace hardcoded arrays.
- Haunt slot: index 7 (Round 8).
- Only boss words become HAUNTED; normal word failures never enter the ghost queue.
- Returning Haunts use Round 8/index 7 as `eventType: 'standard'` with `isHauntReturn: true`.
- Round 8 Haunt Returns do not activate the boss background or boss-only effects.
- Round 10/index 9 remains the separate POLLY'S WORD / `bossWord`.
- Clearing a returning Haunt shows BANISHED / HAUNT BROKEN and removes it from the queue.
- Failing a returning Haunt shows STILL HAUNTED and keeps/rotates it in the queue.
- Results copy separates ordinary missed meanings from real haunt/rematch results.
- Daily Challenge remains separate from the Hunt and Haunt Return loop.
- Visual token system: `app/ui/pwTheme.ts` + `app/ui/pwMaterials.ts`.
- Hero plaque, tile card, deck stack: all on tokenized materials.
- Gameplay Polly: left-only at `POLLY_GAMEPLAY_SIZE=210`. Right side reserved for SWIPE RIGHT TO REJECT.
- Swipe affordances shipped (P5B).
- HUD: quiet control strip, feather Image assets live (`feather-life-filled/empty.png`).
- `tile_swipe.mp3` = sword whoosh. `press_hold_start.mp3` = card pickup.
- Polly compatibility sprite system: lowercase `assets/images/polly/*.webp`, `PollySprite.tsx`, and the existing `usePollyAnimator.ts` fly-up arc.
- Daily Challenge: Fully rewritten. 6-card grid, clue timer, round transition ceremony, PollyDailyPerch idle cycle, story share text, results overlay. Daily Gold Feather reward/storage remains.
- `DailyAnswerCard` now owns Daily tile press/grip, free X/Y drag, snap-back, and UP-only claim control.
- `DailyChallengeScreen` no longer owns raw candidate gesture code; Hunt `SwipeMask` remains untouched.
- Each Daily round restores the right-side Clue Vault entrance and staggered left/right answer-card entrances without mixing entry motion into drag translation.
- Daily win/loss results keep Polly and the Gold Feather reward in a compact, scroll-safe visual stack.
- Hunt wrong swipes now preserve mask ID and UP/RIGHT direction, and fatal wrong swipes finalize the current WordResult before Results.
- Hunt-side Gold Feather consumption/revival is quarantined because revival was unsafe with the current MaskBoard tile lifecycle and Results accounting.
- Hunt Gold Feather spend will be rebuilt later only after a safe resume-state design is approved.
- Reliable SFX playback and the correct-claim vault-lock sound are complete.
- Wrong swipes fire the error haptic through the trinity path.
- Chain increases pulse the multiplier display.
- Correct REAL/TRAP score floats use compact readable badge stamps; wrong swipes show none.

---

## On the horizon (priority order)

1. Swipe cues: RIGHT cue fine-tune if needed
2. Polly persistent anchor audit (pollyVisible stays true between events — investigate usePollyAnimator)
3. HeroBook proportions review on device after full session
4. Mastery shards → FXLayer
5. Onboarding / first-run experience

Full Hero Word-Book spec: `docs/HERO_WORD_BOOK_SYSTEM.md`.
Daily Challenge full spec: `docs/DAILY_CHALLENGE_SPEC.md`.
Patch history: `CHANGELOG.md`.
Canonical workflow: `docs/WORKFLOW.md`.
