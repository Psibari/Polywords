# POLYWORDS — Polly in Daily: Stage Layout + Menacing Motion

### Date: 2026-07-02 · Status: Approved for planning

Refinement of the living-rig landing (`2026-07-02-polly-performance-layer-design.md`).
On device, two problems surfaced: (1) full-size Polly overlaps an answer tile, and
(2) her motion reads as "chewing-gum jaw + eyes only" — subtle *and* goofy.

## Decisions

### A. Layout — compact board + Polly's stage

- Keep Polly **full size** (her turf; do not shrink — she'd read as trivial).
- Compress the answer board into the upper area: shorter answer cards + tighter
  gaps (the cards are oversized for single short words, so no legibility loss),
  and lift it so its bottom-right clears her.
- Polly stands **full-size on the bottom-right stage** (chamber floor), fully
  visible, never over a tile (spec rule: must not obstruct tiles). Left of her is
  open stage.
- Structure: HUD → clues → compact 6-card board (top ~65%) → Polly stage (bottom).
- Exact card heights/offsets are device-tuned; the change is directional.

### B. Motion — menacing stillness, sharp punctuation

Direction: **subtle & menacing** — a watchful predator, not a bouncy mascot.

- **Idle:** quiet and *deliberate*. Slow breath + an occasional slow head-cock
  toward the player and a narrow-eyed watch (reuse a partial, held eye-narrow).
  No busy twitching.
- **Reactions are sharp, not bouncy:**
  - **Wrong (smug):** slow cold head-cock + narrowed eyes + one hard beak-snap on
    `pollySqwawkShort`.
  - **Out of lives (laugh):** a single hard head-throw on `pollySqwawkLaugh`, then
    snaps back to still. A bark, not a giggle.
  - **Win (shocked):** fast flinch/recoil (composure cracks a beat), then re-settle.
- **Remove the continuous talk-flap.** The looping beak flap read as goofy and
  fought the menace. Replace with a **single sharp beak-snap synced to the SFX**;
  otherwise she stays still while the bubble reads. Stillness carries the threat.

## Files touched

- `app/components/DailyAnswerCard.tsx` — shorter card height.
- `app/screens/DailyChallengeScreen.tsx` — compact grid gaps / board padding, lift
  board so bottom-right clears Polly; Polly stage sizing/anchor if needed.
- `app/components/PollyDailyPerch.tsx` — drop the continuous `speaking` flap; fire a
  one-shot beak-snap with the reaction/SFX; keep bubble/slide/dismiss; full-size
  anchor bottom-right.
- `app/animations/pollyPerformances.ts` — re-tune: watchful idle (slow head-cock +
  held eye-narrow), sharp reaction beats, `talk` becomes a single snap not a loop.
- `app/components/PollyRig.tsx` — interpolation ranges for sharper, more readable
  motion; add an `eyeNarrow` driver (partial held blink) if needed.

## Scope / non-goals

- Daily only. No new art. No Reanimated, no new deps.
- Hunt fly-in/out and the Hunt trigger map remain a later pass.

## Testing

- `npx.cmd tsc --noEmit` green + `git diff --check` + `git status --short` per patch.
- Feel (menace, sharpness, no blocking) validated on device by the user.

---

*Polly Daily stage + menace design · POLYWORDS · 2026-07-02*
