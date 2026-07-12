# POLYWORDS Daily Challenge — Quill & Scroll Clue Panel — Design

**Date:** 2026-07-11 · **Branch:** `play-screen-overhaul` · **Status:** Approved design, pre-plan

## Goal

Replace the Daily Challenge's clue panel (`ClueVault` in `DailyChallengeScreen.tsx`) with a
quill-and-scroll desk motif that ties directly to the Gold Feather prize: the clue panel
becomes a parchment scroll that rolls open to show clues, and a gold feather quill sits
fixed in an inkwell on it for the whole session — the visible promise of what you're playing
for. On winning round 5, the feather lifts free and glows as the payoff, right before the cut
to results.

This spec covers the clue panel only. It does not touch the results screen, which is
separately flagged as needing its own redesign (generic Polly image + static feather sticker)
and will be brainstormed as its own follow-up spec.

## Decisions (settled in brainstorming, including two visual-companion mockup rounds)

1. **Permanent, not win-only.** The scroll is the clue panel's look for all 5 rounds, not a
   special state that only appears on winning.
2. **No desk surface.** Rejected after the first mockup round — the scroll fills the panel
   exactly like today's card (same rounded-rect footprint, same clue-reading area), not a
   floor scene with a wood desk plane under it.
3. **Horizontal unroll.** Matches the reference photos: the scroll opens left-to-right, not
   as a vertical hanging banner.
4. **Quill is a fixed emblem, not a scene.** Big, gold-colored (not the reference photos'
   cream/white — this is the actual Gold Feather prize color), perched in a small inkwell as
   a corner emblem. It represents "what you're playing for," not a desk illustration.
5. **Header row kept, feather badge dropped.** The existing title/rule label
   (`DAILY_CLUE_TITLE` / `DAILY_CLUE_RULE`) stays. The separate "GOLD FEATHER" badge with its
   own feather icon is removed — redundant now that the quill itself carries that meaning.
6. **Quick roll, no per-round ceremony.** Round transitions are a fast roll-closed/roll-open,
   matching today's transition pace (~400ms) — explicitly not a slow theatrical flourish every
   round. The user's words: "I don't want it to have some ceremonies. It's a daily challenge."
7. **One ceremony, reserved for the win.** The gold feather lifts free of the inkwell with a
   gold glow flare at the instant round 5's correct claim resolves, on the clue panel itself,
   before the screen cuts to the results overlay. On a loss, nothing happens to the quill —
   no animation, no special state. This is the only ceremony in the whole design, and it is
   asymmetric on purpose (win gets a moment, loss doesn't).
8. **Craft level matches `HeroBook.tsx`.** Explicit success criterion, not just a preference —
   see "Craft level" below.

## Component & file plan

New component: `app/components/ui/QuillScrollPanel.tsx` (SVG-drawn, `react-native-svg`, no
new binary assets — same pattern as `HeroBook.tsx` and the material-language spec's
`BookSpine.tsx`). It renders:

- The scroll body (parchment fill + rolled end caps + gold hairline trim).
- The quill + inkwell corner emblem.
- A `revealedCount` clue-reveal slot that the existing `ClueVault` sequential-fade logic
  renders into (clue 1/2/3 fade-in behavior is unchanged, just re-parented onto the new
  parchment surface instead of the current `cvClueStage` inset).
- A `phase` prop: `'open' | 'rolling' | 'payoff'` driving which of the three states below is
  active.

`DailyChallengeScreen.tsx` swaps its inline `ClueVault` function for `QuillScrollPanel`,
keeping all surrounding logic (round change effects, clue timer, claim handling, intake
animation wiring) as-is — this is a container swap, not an engine change.

## Visual composition

- **Scroll:** dark aged parchment (`#A8A090` family — the same lock already used for
  HeroBook's page block, "never near-white cream"), rolled cylinder caps visible at both
  edges so it reads as an actual rolled scroll, gold hairline border consistent with
  `dailyClueVaultMaterial`'s existing gold tokens. Fills the panel's full existing footprint
  — no desk plane, no wasted vertical space versus today's card.
- **Clue text:** sits directly on the parchment in a dark ink tone (replacing the current
  cream-on-dark-inset treatment), same size/weight goals as today (large enough to read at a
  glance, per the Daily spec's existing requirement).
- **Header:** title/rule label kept as today; feather badge removed.
- **Quill + inkwell:** corner emblem (top-right, slightly overlapping the panel edge), gold
  gradient feather (`#F9DA7A → #F5C842 → #C8920E`), dark inkwell base with a thin gold rim
  highlight. Fixed position and appearance in every round regardless of that round's
  win/loss — it only changes once, at the very end.

## Round transition — "the roll"

- Quick roll-closed then roll-open between rounds, matching the existing ~400ms pace (not a
  slower flourish).
- Built with the same technique already used in this file for `vaultX`/`intakeScale`: RN
  `Animated`, native driver, transform (`scaleX` anchored via paired `translateX`) + opacity
  only. No Reanimated (locked to `SwipeMask.tsx` only), no mixed drivers on one `Animated.Value`,
  phases sequenced with `setTimeout`, not `.start()` callbacks — all existing project rules.
- The quill + inkwell do not participate in the roll animation — they are the fixed anchor
  the scroll rolls against.

## Win payoff — "the ceremony"

- Fires exactly once per Daily session: the instant round 5's correct claim resolves (same
  hook point as today's `handleCorrectExitComplete`/intake sequence), before the transition
  into `ResultsOverlay`.
- The feather visibly lifts free of the inkwell with a gold glow flare, on the clue panel.
- On a loss (second Chance lost, at any round), nothing happens to the quill — it simply
  stays as it always has. No animation is built for this case; it is the default state doing
  nothing extra.

## Craft level

The visual-companion mockups used during brainstorming were div/path scaffolding for
proportion, color, and mechanic feedback only — explicitly not a preview of build fidelity.
The actual component must match `HeroBook.tsx`'s craft level: layered gradients (not flat
fills), a feather curve refined against the reference photos provided during brainstorming,
and gold-tooling-consistent trim detail on the scroll edges. This is a build acceptance
criterion, not a nice-to-have.

## Out of scope

- Results screen redesign — flagged by the user as generic and in need of its own pass;
  queued as the next brainstorm/spec, not part of this build.
- Candidate answer-card grid (`DailyAnswerCard.tsx`), HUD, Polly perch — unchanged.
- `SwipeMask.tsx` / `MaskBoard.tsx` — unchanged; Daily does not use either.
- Sequential 3-clue reveal timing/rules (`DAILY_CHALLENGE_SPEC.md`) — unchanged, only its
  container's visual presentation changes.

## Constraints

- All existing CLAUDE.md locks apply (palette, dark-parchment-never-cream rule, max 2 gold
  focus elements, animation driver rules, Reanimated scoping).
- No new binary image assets — SVG + existing token families only.
- Daily's UP-only control rule, Chances, and clue-reveal timing are unchanged — this spec is
  presentation-only for the clue panel container.

## Testing & verification

- `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short` after each patch.
- Device pass (Expo Go) before visual commits: clue reveal on parchment (all 3 clues), quick
  roll between rounds, round-5 win payoff (feather lift + glow), a loss round (confirm no
  stray animation fires on the quill). Tag `v0.working-YYYYMMDD` after device confirmation.
