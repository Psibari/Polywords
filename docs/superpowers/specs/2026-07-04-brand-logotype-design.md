# POLYWORDS Brand Logotype — Design Spec

**Date:** 2026-07-04 · **Branch:** `play-screen-overhaul` · **Status:** Approved design, pre-plan

## Context

The Home screen currently renders "POLYWORDS" through `FoilWord.tsx` — plain
system text (`BebasNeue-Regular`) with a 3-layer gold-foil illusion (deboss /
catchlight / fill). `CLAUDE.md` flagged a bespoke logotype as a deliberately
deferred "own future session" item. This spec is that session.

Scope, per user direction: **full brand system** — app icon, splash, and the
in-app wordmark lockup (Home screen, and anywhere else "POLYWORDS" needs to
read as a brand mark rather than plain UI text).

## Decisions

### Typeface

New dedicated typeface: **Rammetto One** (Google Fonts, SIL Open Font
License, free to bundle). Used *only* for the brand logotype — no other
in-app text. This preserves the existing "one font, one job" discipline
(`BebasNeue-Regular` = hero/boss word, `BarlowCondensed-Bold` = all UI,
`LilitaOne-Regular` = Polly's speech only). None of the four existing fonts
are reused for the logo — they were deliberately narrowed to those roles
already, and repurposing any of them for the brand mark would undo that.

### Color logic — two-tone by word

- **POLY** (and the "P" in the app-icon monogram): purple family.
  Gradient `#B96FC7 → #7B2D8B → #5C1F68`.
- **WORDS** (and the "W" in the app-icon monogram): gold family.
  Gradient `#FFEBA8 → #F5C842 → #C98A1F`.

### Letterform treatment (shared recipe, every brand asset)

Applied identically to the wordmark and the app-icon monogram — this is the
one thing that must stay pixel-for-pixel consistent across assets:

1. **Shadow duplicate**: same glyph, offset down-right, flat-filled in a
   darker shade of the *opposite* color family (gold letters get a
   purple-dark shadow, purple letters get a gold-dark shadow). This is the
   same extrusion trick already used for the in-game hero word
   (`Bungee Shade` extrusion + `BebasNeue-Regular` face) — cross-tinted here
   instead of same-family.
2. **White outer ring**: thick white stroke, `paint-order: stroke fill`.
3. **Accent inner ring**: thinner stroke in the *opposite* family's base
   color (gold ring on purple letters, purple ring on gold letters).
4. **Fill**: the letter's own gradient on top, no stroke.

All offsets and stroke widths must scale proportionally to font size, not be
fixed pixel values — same approach `FoilWord.tsx` already uses (e.g.
`debossY = fontSize * (4/96)`). This asset renders at multiple sizes (app
icon glyphs ~90–100px, wordmark letters ~46px, plus whatever a future splash
use needs), so the recipe must hold visual proportion at any of them. Ratios
should be derived from the mockups at their reference sizes rather than
copied as literal px.

### Background

Radial purple gradient, light orchid center fading to near-black purple edge
(`#9B5FC9 → #5B2470 → #241338`) — replaces flat `#1A1830` for logo assets
specifically (both the app icon and the wordmark lockup's badge). This is a
scoped exception: it does not change the in-game screen background, which
stays the flat `#1A1830` `Background` token everywhere else.

### Wordmark lockup (Home screen, splash, marketing)

- "POLY" and "WORDS" sit on a gentle upward arc baseline.
- A feather icon (the in-game life/attempt currency, not a generic
  magnifying-glass or search icon) sits between the two words as the sole
  icon element in this composition.
- No baked-in tagline. Home's existing rotating `HOME_TAGLINE` copy system
  stays separate and untouched.
- Polly does **not** appear in this lockup. She remains everywhere else in
  the game (Home/Daily/Results perches, pose art) — dropping her from the
  static logo mark is a deliberate simplification, not a contradiction of her
  importance elsewhere.

### App icon

- Square source canvas — the OS applies its own rounded-square/circle mask,
  so the source image must **not** pre-round its own corners.
- "P" and "W" monogram only, no feather, no other text (small icon sizes
  can't carry readable multi-word text).
- P upper-left (larger), W lower-right, overlapping diagonally.

### Palette rule change (already committed to `CLAUDE.md`, 2026-07-04)

During this session, "Polly Green is Polly only, never UI chrome" was
repealed as an early-project callout rather than a real constraint — Polly
now keeps her natural green in brand assets and in-game UI where it fits.
This change is independent of the final decision to drop her from the logo
mark itself; it stands as a general amendment. `CLAUDE.md`'s palette table
and permanent Cut List were both updated to reflect this.

## Engineering notes

- The wordmark's curved baseline, per-letter gradients, and layered
  stroke/shadow treatment cannot be built with React Native's plain `Text`
  component. It needs `react-native-svg` (`Svg`, `Defs`,
  `LinearGradient`/`RadialGradient`, `Path`, `Text`, `TextPath`) — already a
  project dependency (used in `HeroBook.tsx`), no new dependency required.
- New font file (`RammettoOne-Regular.ttf`) needs to be added to the
  project's font assets and loaded the same way the existing four are
  loaded, with a new single-purpose entry in `app/constants/fonts.ts`
  (e.g. `FONTS.brand = 'RammettoOne-Regular'`, commented "logotype only").
- The app icon is a static asset (`app.json` `icon` / `adaptive-icon` /
  splash fields), not a runtime-rendered component. It needs to be
  rasterized to PNG at the required sizes from the same SVG source used for
  the in-app lockup, to guarantee the two stay visually identical.

## Explicitly out of scope

- Marketing/store-listing hero art beyond the icon + wordmark lockup
  themselves.
- Any change to Polly's existing perch/pose art system.
- Any change to the in-game (non-logo) `Background` token or general
  palette usage beyond the Polly Green rule change already applied.
