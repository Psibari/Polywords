# Home Screen — Polly's Threshold — Design

**Date:** 2026-07-03 · **Branch:** `play-screen-overhaul` · **Status:** Approved design, pre-plan

## Goal

Convert the Home screen into the material language and make it Polly's world. The
fiction: opening the app puts you at the edge of HER domain — the torch-lit temple
threshold — with Polly perched live, watching you decide to challenge her. This is
the Home conversion the material-language spec
(`2026-07-02-material-language-and-vault-library-design.md`) listed as a future
consumer.

## Decisions (settled in brainstorming, 2026-07-03)

1. **Concept: Polly's threshold.** Home is her territory, not the player's room and
   not a marquee. PLAY becomes a dare — `CHALLENGE POLLY`.
2. **Polly: watcher + greeting.** One fly-in per app session, one greeting line,
   then silent menace. No ongoing heckling, no state-aware lines (candidates for a
   future spec).
3. **Full-bleed, no dock.** BottomNav is removed from Home only — Home IS the hub.
   Other screens keep their nav untouched.
4. **Locked "Continue Run" card: cut** (YAGNI; restore when the feature exists).
5. **Background art stays.** `assets/home/home-hero-bg.png` (torch-lit temple
   threshold) is on-theme and already satisfies the Warmth clause via its torches.
6. **Title: baseline now, logotype later.** The logo PNG is dropped. POLYWORDS
   renders as scaled-up foil type (display font + three-layer foil treatment) as an
   explicit BASELINE. A bespoke logotype (custom SVG lettering, feather flourish,
   tooling frame…) is its own future design session; it must not block this ship.

## Composition (top to bottom)

```text
┌────────────────────────────┐
│   POLYWORDS  (foil type)   │ ← baseline wordmark, high
│   Polly stole the meanings.│ ← one line, no box/plate
│   Take them back.          │
│                            │
│  ╭─"Back again?"           │
│  🦜 Polly on a ruin ledge  │ ← LEFT side, mid-height,
│ ▓▓ (ledge rooted off-      │   faces right (left = her
│ ▓▓  screen left)           │   zone, play-screen grammar)
│                            │
│      open torch-lit plaza  │
│                            │
│  ╔══════════════════════╗  │
│  ║   CHALLENGE POLLY    ║  │ ← the gold dare (was PLAY)
│  ╚══════════════════════╝  │
│  ┌─ DAILY ──┐ ┌─ VAULT ─┐  │ ← CARD-material doors
│  └──────────┘ └─────────┘  │
│              settings ·    │ ← quiet hairline text
└────────────────────────────┘
```

### Stage

- `home-hero-bg.png` full-bleed edge to edge (dock gone; content respects safe area).
- Standard `stageMaterial` 3-stop vignette recipe over it — darker top and bottom,
  open in the middle where the plaza reads through. Replaces the two bespoke
  gradient overlays in the current file.
- No extra candle glow needed: the art's torches ARE the candle (Warmth clause met).

### Title block

- **POLYWORDS** in foil type: display font, sized to screen width, wearing the
  three-layer foil stamp (dark deboss below, warm catch-light above, gold fill with
  tight amber edge) — rendered via `FoilWord` if its size range allows, otherwise
  the same three-layer recipe inline with foil tokens. Marked in code as the
  baseline wordmark (comment pointing at the future logotype session).
- Tagline directly on the scene with a deboss text shadow, no panel:
  `Polly stole the meanings. Take them back.`
- **Cut:** the copy-plate box, the `WORDS HAVE MEANING...SSSSS` slogan line, the
  floating "Polly" placeholder text, the logo PNG usage.

### Polly (left, mid-height)

- Perches on a small SVG stone ledge in the warm stone/wood family, rooted off the
  left edge (same trick as the Daily branch) — she sits in the scene, not on it.
- Faces right into the plaza. Left side keeps the established grammar: left is
  Polly's zone.
- Mid-height, clear of the title above and the dare/doors below.

### The dare

- `CHALLENGE POLLY` — the gold button re-tooled in BOOK vocabulary: gold face,
  amber (`PW` amber `#C8920E`) bottom edge, gold hairline rim. Keeps the existing
  slow pulse (scale 1→1.018, native driver). Subcopy cut. Fires `startGame()` →
  `Game`, unchanged.

### The doors

- Daily + Vault as two side-by-side cards on `cardMaterial` (CARD tokens), replacing
  the bespoke rounded rectangles. Dot "mode icons" cut.
- Daily: `DAILY_TITLE` / `DAILY_PROMISE` (from `pwDailyMaterials`), gold trim at
  hairline strength only.
- Vault: `WORD VAULT` / `Reclaimed meanings.`, purple leather trim.
- **Gold budget (max 2):** wordmark foil + CHALLENGE POLLY. Everything else gold
  stays hairline.

### Settings

- One quiet hairline text link (`SETTINGS`, label type, low opacity), bottom-right
  under the doors → existing Settings screen.

## Polly behavior

Reuses the shipped whole-image perch system (see `PollyDailyPerch.tsx`); no rig.

- **Entrance:** on first Home mount per app session she flies in (fly pose → idle
  swap ~650ms, spring settle). Returning to Home in the same session: already
  perched, no re-entrance. Tracked with a module-level flag, not persisted state.
- **Alive but quiet:** offset-period breathe (translateY) + sway (translateX)
  loops, native driver, identical recipe to the Daily perch.
- **One greeting:** after she settles, a speech bubble fades in with one line from
  a new `HOME_GREETING_LINES` pool (rotating per open). Bubble holds ~4s, fades.
  Silent after. Lines are authored in the dialogue bank following Polly voice rules
  ("Back again?" / "Miss me?" territory).
- **Pose:** idle only. No reaction poses on Home; navigation happens immediately on
  press. Her menace here is stillness.

## Files

- `app/screens/HomeScreen.tsx` — rebuilt in place. All inline hexes migrate to
  `pwTheme` / `pwMaterials` tokens (binding rule #1). `BottomNav` import removed
  (Home only).
- `app/components/PollyHomePerch.tsx` — NEW, thin sibling of `PollyDailyPerch`:
  shared `POLLY_POSES`, fly-in + breathe/sway, greeting bubble, SVG stone ledge.
  No reaction wiring, no SFX on entrance (Home should not squawk on every open).
- `HOME_GREETING_LINES` — NEW pool in `app/ui/pwHomeMaterials.ts` (new file,
  sibling of `pwDailyMaterials.ts`, same pattern: screen copy + line pools live
  beside the screen's material constants). Lines also recorded in
  `docs/POLLY_DIALOGUE_BANK.md`.
- Tokens: any value the screen needs that doesn't exist yet (e.g. ledge stone) is
  added to `pwMaterials.ts`, not inlined.

## Out of scope

- Bespoke POLYWORDS logotype (own design session).
- State-aware / ongoing Polly dialogue on Home.
- Continue Run (returns with the feature, in CARD material).
- Any change to BottomNav on other screens, or to Settings itself.

## Constraints

- All CLAUDE.md locks apply (palette, max 2 gold focus elements, Polly Green is
  Polly-only, typography, cut list).
- RN `Animated` only, native driver, transforms + opacity; `setTimeout` between
  phases. Reanimated stays locked to SwipeMask.
- No new binary assets (one is REMOVED from use: the logo PNG; file stays in repo).
- `MaskBoard.tsx` / `SwipeMask.tsx` untouched.

## Testing & verification

- Per patch: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short`.
- Device pass (Expo Go) before visual commits: fly-in entrance, greeting bubble
  timing, no re-entrance on Home→Vault→Home, both doors navigate, CHALLENGE POLLY
  starts a run, settings link, small-screen fit (wordmark scaling, Polly clear of
  title and buttons). Tag `v0.working-YYYYMMDD` after device confirmation.
