---
name: POLYWORDS
description: A hand-bound, gilt-edged word-recognition game where a trickster keeps the words she's trapped
colors:
  trophy-gold: "#F5C842"
  trophy-gold-soft: "rgba(245,200,66,0.58)"
  trophy-gold-dark: "#8F6F18"
  trophy-gold-glow: "rgba(245,200,66,0.30)"
  amber: "#C8920E"
  foil-light: "#FFF7D6"
  midnight-bindery-purple: "#7B2D8B"
  midnight-bindery-purple-soft: "rgba(123,45,139,0.46)"
  lavender: "#B98ADE"
  rose: "#9B2D6B"
  book-cover-purple: "#191541"
  book-cover-purple-top: "#2A1C5C"
  book-cover-purple-bot: "#120F32"
  bg: "#1A1830"
  bg-deep: "#0B0920"
  surface-deep: "#0F0D2A"
  surface-base: "#17143A"
  surface-raised: "#211B4A"
  card-face: "#0F0D2A"
  card-face-pressed: "#18133A"
  card-rim: "rgba(245,200,66,0.34)"
  card-rim-strong: "rgba(245,200,66,0.68)"
  white: "#FFFFFF"
  soft-white: "rgba(255,255,255,0.88)"
  muted-white: "rgba(255,255,255,0.66)"
  faint-white: "rgba(255,255,255,0.34)"
  correct-green: "#4CAF50"
  wrong-red: "#CC2200"
  library-wood: "#6A5A48"
  library-wood-dark: "#4A3E30"
typography:
  display:
    fontFamily: "BebasNeue-Regular"
    fontSize: "96px"
    fontWeight: 400
    lineHeight: "104px"
    letterSpacing: "2px"
  title:
    fontFamily: "BebasNeue-Regular"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: "1.1"
    letterSpacing: "1px"
  body:
    fontFamily: "BarlowCondensed-Bold"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "28px"
    letterSpacing: "normal"
  label:
    fontFamily: "BarlowCondensed-Bold"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "18px"
    letterSpacing: "0.9px"
rounded:
  sm: "4px"
  md: "8px"
  lg: "14px"
  xl: "20px"
  card: "26px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  screenX: "14px"
  cardPadX: "18px"
  cardPadY: "16px"
components:
  card-tile:
    backgroundColor: "{colors.card-face}"
    rounded: "{rounded.card}"
    padding: "16px 18px"
  card-tile-pressed:
    backgroundColor: "{colors.card-face-pressed}"
    rounded: "{rounded.card}"
    padding: "16px 18px"
  panel:
    backgroundColor: "{colors.surface-deep}"
    rounded: "{rounded.lg}"
  hero-plaque:
    backgroundColor: "{colors.bg-deep}"
    rounded: "{rounded.md}"
  affordance-up:
    textColor: "{colors.trophy-gold}"
    typography: "{typography.label}"
  affordance-right:
    textColor: "{colors.lavender}"
    typography: "{typography.label}"
---

# Design System: POLYWORDS

## Overview

**Creative North Star: "The Occult Bindery"**

POLYWORDS is a hand-bound, gilt-edged library where a trickster keeps the words
she's trapped. Every surface is built to feel tactile and crafted rather than
flat and app-like: hand-drawn SVG book geometry, foil-stamped gold lettering,
leather-spined volumes standing on a warm wood shelf. The mood is expert,
premium, literary, and faintly dangerous — a spellbook's worth of confidence,
not a children's storybook's warmth. Density stays generous and uncluttered:
one hero word, one active decision, a HUD kept quiet until it needs to speak.

The world commits to a single nocturnal palette — deep purples and near-blacks
lit by scarce, hard-won gold — and never breaks it for a friendlier or brighter
alternate mode. Confirmed rejections: no orange anywhere in the UI, no
pink/magenta, no green outside Polly's own signature color, no red outside
wrong-swipe feedback. The bindery is dark, warm-lit, and a little haunted; nothing
in it should read as cheerful pastel-app default.

**Key Characteristics:**
- Nocturnal purple-and-near-black base, lit by scarce trophy gold, never bright or pastel.
- Hand-drawn, book-object signature pieces (HeroBook, BookSpine) rather than generic card chrome.
- Two type families only: a tall condensed display face for the word itself, a bold condensed face for everything else, almost always uppercase.
- Depth read through layered shadow + glow, not flat material design.
- Ordinary tiles are deliberately anonymous until the swipe commits — the palette never leaks which tile is safe.

## Colors

A single dark, warm-lit world: near-black purple grounds, one scarce gold accent, and a rose/lavender family reserved for Polly and trap consequences.

### Primary
- **Trophy Gold** (#F5C842): the reward color — foil lettering, tile rims once committed, HUD focus, the mastery glow. Never a fill color, always a trim, glow, or accent.
- **Trophy Gold Dark** (#8F6F18) / **Amber** (#C8920E): deeper gold used for hairlines, pins, and secondary trim where full-brightness gold would overpower.
- **Foil Light** (#FFF7D6): the catch-light on foil-stamped lettering — a near-white warm highlight, never a background.

### Secondary
- **Midnight Bindery Purple** (#7B2D8B) and its cover-leather family (#191541 → #2A1C5C → #120F32): the book's material color — covers, spines, ambient glow, purple-family shadows.
- **Lavender** (#B98ADE): the RIGHT-swipe affordance color and the ghost/haunted-word tint in the Vault library.

### Tertiary
- **Rose** (#9B2D6B): Polly's trap-consequence color — shard-break FX, ghost accents, haunted labeling. Reads as a bruise against the purple family, not a competing brand color.

### Neutral
- **Background** (#1A1830) / **Background Deep** (#0B0920): the room the drama happens in — vignette base, never a panel color.
- **Surface Deep** (#0F0D2A) / **Surface Base** (#17143A) / **Surface Raised** (#211B4A): panel and card-face layering, darkest to lightest.
- **White family**: pure white (#FFFFFF) for hero text only; soft white (88%), muted white (66%), and faint white (34%) step down for secondary and tertiary text.
- **Correct Green** (#4CAF50): reserved exclusively for Polly's own signature color and correct feedback — never a general-purpose UI green.
- **Wrong Red** (#CC2200): reserved exclusively for wrong-swipe feedback.

### Named Rules
**The Scarce Gold Rule.** Trophy Gold reads as won, not decorative. It appears as trim, glow, and committed-state accent — never as a fill covering more than a hairline or a small badge.

**The Four Colors You Don't Touch Rule.** No orange UI, no pink/magenta, no green outside Polly's Correct Green, no red outside Wrong Red. These are locked at the product level, not a stylistic default.

## Typography

**Display Font:** BebasNeue-Regular
**Body/Label Font:** BarlowCondensed-Bold

**Character:** A tall, condensed all-caps display face carries the one word that matters; a bold condensed workhorse face carries every supporting label, HUD number, and tile in mostly-uppercase form. The pairing reads as engraved-and-stamped, not soft or rounded.

### Hierarchy
- **Display** (400, 96px/104px, letter-spacing 2px): the hero word itself. The single largest, most important text on any screen; boss word variants scale up to 114px.
- **Title** (400, 48px, ~1.1 line-height): brand title and other one-off large statements (results headlines, Vault plaques).
- **Body** (700, 22px/28px): clue/definition text — the longest-form reading on any screen, still condensed and bold rather than a neutral body face.
- **Label** (700, 14px/18px, letter-spacing 0.9px, uppercase): HUD chips, tile copy, badges, Polly bubble chrome, affordance text (UP/RIGHT). This is the workhorse size; most on-screen text is this role.

### Named Rules
**The Two-Voice Rule.** Only two type families exist anywhere in the product — Bebas Neue for the hero display role, Barlow Condensed Bold for everything else. A third family is a regression, not a variation.

**The Uppercase-Except-Polly Rule.** Label-role text is uppercase by convention (HUD, badges, stamps, tile copy) — except Polly's own dialogue, which stays in natural case to read as speech, not signage.

## Layout

Single-column, portrait mobile layout throughout. Screen-edge gutter is 14px (`screenX`); card interior padding is 18px horizontal / 16px vertical. The spacing scale steps 4 → 8 → 12 → 16 → 24 → 32px, used for rhythm between HUD elements, tile stacks, and panel interiors. The HeroBook sits pinned at the top of active-play screens as a persistent frame; a numbered round-chip HUD row sits below it; the bottom nav is a fixed tab bar (Home/Play/Vault/Settings) that disappears during active gameplay, which stays nav-free.

## Elevation & Depth

Layered and tactile, not flat. Every raised surface (cards, panels, the HeroBook cover) carries a platform-tuned shadow — real `shadowOffset/shadowOpacity/shadowRadius` on iOS, `elevation` on Android — rather than a single cross-platform shadow value. Depth escalates on interaction: a resting card's `card` shadow swaps to a taller, softer `cardLifted` shadow on press/lift, paired with a brightened rim rather than a color darken alone.

### Shadow Vocabulary
- **card** (iOS: offset 0/12, opacity 0.26, radius 18 · Android: elevation 10): resting state for tiles, the HeroBook, the deck back.
- **cardLifted** (iOS: offset 0/18, opacity 0.34, radius 24 · Android: elevation 16): pressed/committed/active state — taller, softer, more present.
- **panel** (iOS: offset 0/10, opacity 0.30, radius 20 · Android: elevation 12): surface panels, plaques, the bookcase.
- **glowGold** (iOS: color #F5C842, opacity 0.46, radius 14 · Android: elevation 8): the mastery/reward glow — the one shadow that carries color instead of black.

### Named Rules
**The Press-Lift Rule.** A pressed or committed card never just darkens — it swaps its whole shadow token (`card` → `cardLifted`) and brightens its rim border. Depth change communicates state change.

## Shapes

Two shape languages coexist deliberately. Most UI (tiles, panels, plaques, chips) uses a soft rounded-rectangle scale: 4px (hairline elements) → 8px → 14px → 20px → 26px (the signature large tile/card radius) → a full pill at 999px for badges and round controls. The HeroBook and BookSpine are the exception: their silhouettes are hand-drawn SVG paths (rounded book-cover corners, flared page-block base, leather-slab spines), not radius tokens — treat their geometry as authored illustration, not a scalable shape rule.

## Components

### Cards / Tiles (MaskBoard)
- **Corner Style:** 26px radius (`rounded.card`), the system's signature large-card radius.
- **Background:** `card-face` (#0F0D2A) at rest, `card-face-pressed` (#18133A) once committed.
- **Border:** 1.5px `card-rim` (gold at 34% opacity), brightening to `card-rim-strong` (68%) on commit.
- **Internal Padding:** 18px horizontal / 16px vertical.
- **Distinctive detail:** a 1px top highlight line and a 3px bottom-edge accent inset from the card edges — not a full border, just top/bottom emphasis lines.
- **Shadow Strategy:** `card` at rest → `cardLifted` on commit (see Elevation).
- Ordinary tiles share this one neutral treatment until the swipe commits — no color or shadow cue may leak a tile's REAL/trap status early.

### HeroBook (signature component, warroom-gated)
The book that opens to swallow or reveal each word — the product's single most distinctive visual object. Hand-drawn in SVG: a purple leather cover (gradient #2A1C5C → #7B2D8B family → #120F32) with 3px gold trim stroke and inset hairline, a gold-tooled spine band with three raised binding hubs, and a cream page block (warm tan gradient, not white) that flares wider at its base so the book reads as a bound volume, not a flat banner. The cover swings open on a perspective rotateX transform with a slight overshoot-and-settle on close. `HeroBook.tsx` and `SwipeMask.tsx` require a warroom pass before editing — do not restyle by convention alone.

### BookSpine (Vault library)
Reclaimed words stand as leather-spined books on a warm wood shelf. Mastered spines: leather gradient in the cover-purple family, gold tooling bands top and tail, foil-stamped title reading down the spine (via `FoilWord`). Ghost/haunted spines: translucent purple leather, faded lavender title, purple-tinted grip overlay — Polly's visible claim on a word the player hasn't reclaimed yet.

### Panels / Plaques
- **Corner Style:** 14px (`panel`) or 8px (`hero-plaque`).
- **Background:** `surface-deep` (#0F0D2A) or `bg-deep` (#0B0920).
- **Border:** 1–2px, gold-soft or purple-soft depending on context.
- **Shadow Strategy:** `panel` shadow token; the hero plaque additionally carries a purple `underGlow` at low opacity beneath it.

### Affordance Labels (UP / RIGHT)
- **Style:** bold uppercase Barlow Condensed, 14px, letter-spacing 0.9px, ~72–74% opacity with a soft black text-shadow for legibility over art.
- **UP (claim a REAL):** Trophy Gold.
- **RIGHT (reject a trap):** Lavender.
- These two colors are the only place gold and lavender are used as direct interactive-label colors rather than trim/glow.

### Shard / Trail FX (signature motion-color system)
Swipe outcomes resolve into a small particle system, not a static flash: trap rejection breaks a tile into purple/rose gem shards on a leftward scatter cone; mastery bursts purple/rose bars; a claimed REAL leaves a short gold sparkle trail toward the HeroBook. Color choice is semantic — gold only appears in the claim trail, purple/rose only in trap and mastery breaks.

## Do's and Don'ts

### Do:
- **Do** keep Trophy Gold scarce — trim, glow, and committed-state accent, never a fill.
- **Do** use Bebas Neue only for the display/hero-word role; Barlow Condensed Bold for everything else, uppercase by default except Polly's own dialogue.
- **Do** swap the whole shadow token (not just darken color) when a card moves from resting to pressed/lifted/committed.
- **Do** treat HeroBook and BookSpine geometry as authored illustration — extend the pattern language, don't flatten it into generic rounded-rect cards.
- **Do** get a warroom pass before editing `MaskBoard.tsx` or `SwipeMask.tsx`.

### Don't:
- **Don't** introduce orange UI, pink/magenta, or green outside Polly's Correct Green, or red outside Wrong Red — these are locked product-level rejections.
- **Don't** let an ordinary tile's color, shadow, or motion hint at its REAL/trap status before the swipe commits.
- **Don't** give POLYWORDS a bright, flat, or pastel alternate mode — the nocturnal palette is the only mode.
- **Don't** invent a third type family; the Two-Voice Rule is absolute.
- **Don't** use rose/purple shard FX for a claimed REAL, or gold trail FX for a trap break — the FX palette is semantically tied to outcome, not decorative.
