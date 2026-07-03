# Results Screen — The Hunt Ledger — Design

**Date:** 2026-07-03 · **Branch:** `play-screen-overhaul` · **Status:** Approved design, pre-plan

## Goal

Convert the Results screen to the material language and fix the "two screens"
problem: today a 1.4–1.8s hold screen (big headline on flat `#1A1040`) is followed
by a separate results screen that repeats the same headline, plus a third
"YOU BEAT POLLY" banner. Fold everything into ONE continuous scene — the Hunt
Ledger — with Polly's outcome-matched gloat visit. This is the Results conversion
the material-language spec (`2026-07-02-material-language-and-vault-library-design.md`)
listed as a future consumer.

## Decisions (settled in brainstorming, 2026-07-03)

1. **One scene.** Hold screen deleted; verdict stamping in IS the ceremony.
   Headline appears exactly once; the beat-Polly banner is cut.
2. **Fiction: the Hunt Ledger.** The run's record, written where the hunt ended —
   the play screen's stage stays visible behind it.
3. **Polly: outcome-matched visit.** Body on stage per the material spec's Polly
   rules; pose + one line matched to outcome; laugh SFX unchanged.
4. **Presentation only.** Engine, store, scoring, `recordRunComplete`,
   `ghostRevenge` data — untouched.

## Scene & ceremony

- ResultsScreen renders inside GameScreen (replacing GameContent when `isDone`),
  so it drops its opaque background entirely — the game's stage (background +
  vignette) shows through. No new backdrop work.
- **Ceremony timing** (RN Animated, native driver, transforms/opacity only,
  `setTimeout` between phases):
  1. On mount: verdict block stamps in immediately with the existing spring
     (scale 0.8→1, translateY). Verdict + rank + score + perfect count + best.
  2. ~700ms later: ledger panel, ghost/trap cards, and buttons fade/slide in
     (opacity 0→1, translateY 24→0).
  3. ~600ms after the verdict: Polly flies in (see Polly section).
- Verdict copy (once, top): `YOU BEAT POLLY` (score ≥ 15000) /
  `POLLY HUNT COMPLETE` / `POLLY CLIPPED YOUR RUN.` (game over). Beat-Polly
  subline: `Thought so.` (never-change line, system text). Game-over subline:
  `Out of feathers.`
- Verdict wears the foil treatment (`FoilWord` or the three-layer recipe at
  headline size). Grade subline (`CLEAN RUN` / `CLOSE.` / `MEANINGS MISSED.` /
  `RATTLED.`) beneath in label type.

## Layout (top to bottom)

```text
┌────────────────────────────┐
│    YOU BEAT POLLY (foil)   │ ← stamps in first, ~700ms alone
│      Thought so.           │
│   RANK S · 18,240 pts      │
│   ×6 best combo · 7/9      │
│         NEW BEST           │
│  ┌───────────────────────┐ │
│  │ LEDGER (parchment)    │ │ ← BOOK panel, ruled lines
│  │ LIGHT ····· Perfect ✓ │ │
│  │ BARK ······· 2/3      │ │
│  └───────────────────────┘ │
│  [ghost/trap CARD panels]  │
│  ╔══════════════════════╗  │
│  ║     RUN IT BACK      ║  │ ← gold dare (locked copy)
│  ╚══════════════════════╝  │
│         HOME               │ ← quiet hairline link
│  ╭─"Fine. Keep the word."  │
│  🦜 Polly, bottom-left     │
└────────────────────────────┘
```

## Content retheme

- **Ledger panel (word results):** ruled lines on dark parchment
  (`heroBookMaterial.pagesCream` family, `pagesLine` rules) inside a BOOK panel
  (leather rim + gold hairline). Word in display type (ink-dark on parchment),
  result right-aligned in ink-dark; `Boss ✓` and `Perfect ✓` marks in deep amber
  (`#C8920E` reads as ink-gold on parchment; foil-light would not). The
  per-row `🔒` is CUT (hidden-meanings leftover; that system is on the permanent
  cut list).
- **Ghost revenge cards** (`Haunt broken` / `Still haunting you`): CARD-material
  panels; the haunting variant uses the Vault's ghost tokens
  (`libraryMaterial.ghostLeather`/`ghostTint`/`ghostTitle`) so her grip reads the
  same app-wide. Emojis (🔥 👻) cut.
- **Meaning-missed card + trap card:** CARD material; trap card trims purple/rose
  (trap identity). Copy unchanged.
- **RUN IT BACK:** locked label kept; restyled as the Home dare (BOOK gold face,
  amber bottom edge, gold hairline rim). Its current shadow-opacity animation
  runs `useNativeDriver: false` on a shadow prop (off-rules) — replaced by the
  Home dare's native scale pulse (1→1.018).
- **HOME:** quiet hairline text link (Home settings-link treatment).
- **NEW BEST / prev best / rank letters:** amber & foil-light & white tokens.

## Palette purge (binding rule #1)

Every inline hex goes through tokens. Specifically outlawed here: `#FFD700`,
`#7B2FBE`, `rgba(139,92,246,…)`, `rgba(123,47,190,…)`, `#1A1040`, and **Polly
Green on UI text** — `CLEAN RUN` and the old hold line lose `#4CAF50` (green is
her body only). Grade colors become gold-family / lavender / white.

**Gold budget (max 2):** verdict foil + RUN IT BACK.

## Legibility clause (standing rule)

Floor 14px — today's 12–13px rows, sublines, and links size up. Target scale
(tune on device): verdict 44–48 · grade subline 15 · rank letter 30 · score line
17 · ledger word 18 / result 15 · card copy 15 · buttons per Home dare (30–34) ·
HOME link 14. Sizes land as tokens in `pwResultsMaterials.ts`, never inline.

## Polly — outcome-matched visit

- New `app/components/PollyResultsPerch.tsx`, thin sibling of `PollyHomePerch`:
  fresh on every mount (no session flag), flies in bottom-left ~600ms after the
  verdict stamps, breathe/sway loops, ONE bubble line, then still. Whole-image
  motion, `pointerEvents: 'none'`.
- **Poses by outcome:** loss (`gameOver`) → `laugh`, visually synced with the
  laugh SFX that ALREADY plays on Results mount (no SFX changes) · beat-Polly →
  `shocked` (her sulk) · ordinary complete → `idle`.
- **Her line:** the existing `derivePollyLine` logic moves to
  `pwResultsMaterials.ts` and feeds her speech bubble instead of the old floating
  gold text line. Loss runs (which currently return null) get one gloat line
  added to the pool, recorded in `docs/POLLY_DIALOGUE_BANK.md` (voice rules:
  short, mean about the run not the player, mixed case).
- Scroll content gets bottom padding so RUN IT BACK / HOME clear her at full
  scroll.
- **Perch consolidation is a noted follow-up, not this spec:** Daily/Home/Results
  perches share a pattern; extracting a base component would touch the shipped,
  device-confirmed `PollyDailyPerch` and force a Daily re-verify.

## Files

- `app/screens/ResultsScreen.tsx` — rebuilt in place: hold-screen branch deleted,
  banner deleted, all hexes → tokens. Props (`onRestart`, `onHome`) and store
  reads (`recordRunComplete`, `ghostRevenge`, `progress`) unchanged.
- `app/ui/pwResultsMaterials.ts` — NEW: type-scale + color tokens, verdict/grade
  copy, `deriveResultsPollyLine` (moved logic + loss line).
- `app/components/PollyResultsPerch.tsx` — NEW perch sibling.
- `docs/POLLY_DIALOGUE_BANK.md` — add the loss gloat line under a Results note.

## Out of scope

- Perch base-component consolidation (follow-up).
- Any engine/store/scoring change; rank thresholds and grade logic keep their
  current numbers (colors only change).
- Daily Challenge results (already conforms).

## Constraints

- All CLAUDE.md locks (palette, max 2 gold, Polly Green Polly-only, swipe
  grammar untouched, `RUN IT BACK` and `Thought so.` copy locked).
- RN `Animated`, native driver, transforms + opacity only, `setTimeout` between
  phases; Reanimated stays in SwipeMask. No new binary assets.
- `MaskBoard.tsx` / `SwipeMask.tsx` / GameScreen structure untouched (ResultsScreen
  keeps its mount point and props).

## Testing & verification

- Per patch: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short`.
- Device pass (Expo Go) before the visual commit, all three outcomes:
  1. Loss run: verdict + Polly laughing synced to the laugh SFX, gloat bubble.
  2. Beat-Polly run: foil verdict, `Thought so.`, shocked sulk, `Fine. Keep the
     word.`
  3. Ordinary complete: idle watcher + line; ledger rows correct; ghost/trap
     cards render when present.
  - Ledger scrolls; RUN IT BACK and HOME work and clear Polly; no green UI text;
    nothing under 14px. Tag `v0.working-YYYYMMDD` after confirmation.
