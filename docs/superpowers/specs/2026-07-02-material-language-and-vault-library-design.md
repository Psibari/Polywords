# POLYWORDS Material Language + Vault Library — Design

**Date:** 2026-07-02 · **Branch:** `play-screen-overhaul` · **Status:** Approved design, pre-plan

## Goal

Unify the whole app around the book + cards material world the play screen already
speaks. One shared material language (spec'd once, in code as tokens + components),
then applied screen by screen. This spec covers the language, the shared components,
and the first consumer: the Vault rebuilt as a real library of reclaimed words.
Results and Home are documented consumers but OUT of this spec's build scope.

## Decisions (settled in brainstorming)

1. **Language first, then Vault.** The Vault is the biggest thematic win — it is the
   emotional payoff of the loop (words reclaimed from Polly) and currently reads as a
   settings menu.
2. **Real shelves + spines.** Mastered words are book spines standing on shelves,
   foil-stamped titles reading down the spine. Not themed cards, not a hybrid.
3. **Code-drawn, the HeroBook way.** SVG + gradients + tokens (react-native-svg is the
   established pattern). No new binary assets.
4. **Approach A architecture.** Extend `pwTheme.ts` / `pwMaterials.ts` with the material
   vocabulary; add shared UI components; screens consume tokens + components. No theme
   provider, no per-screen bespoke styling.

## Audit that motivated this (2026-07-02)

- Game + Daily: fully in the material world (HeroBook, deck, boss chamber, Polly
  visits, foil hero word).
- Home: half-themed — hero background is right, buttons/panels are generic rounded
  rectangles.
- Vault: off-theme — flat `#1A1830`, plain dark cards, no book materiality.
- Results: least themed and off-palette — raw `#FFD700` and a violet
  (`rgba(139,92,246,…)`, `rgba(123,47,190,…)`) that exist nowhere in the system.

## The material language

Every visible surface in POLYWORDS is one of three named materials, defined in
`pwMaterials.ts`. The BOOK vocabulary largely exists already as `heroBookMaterial`
(cover purples `#191541`/`#2A1C5C`/`#120F32`, hinge `#141038`, dark parchment
`#9A8E7A`/`#887868`, `goldTrim #F5C842`, `goldHairline`, deep amber `#C8920E`) — this
spec formalizes and extends it; it invents no new hues.

### BOOK — anything owned, earned, or sacred

- Leather: the three cover purples (gradient top→bot).
- Gold tooling: 2px trim + 1px hairline (`goldTrim` / `goldHairline`).
- Parchment insets: the dark `pagesCream` family. Never near-white (existing lock).
- **Foil lettering:** any word displayed as a trophy wears the three-layer foil stamp
  now on the hero word — dark deboss below (+4px, 72% black), warm `#FFF7D6`
  catch-light rim above (−2.5px), gold fill with tight 1px amber edge (radius 2).
  Never a wide zero-offset glow.

### CARD — anything in play or in hand

The existing tile/deck family (`cardMaterial`, `deckBackMaterial`, warm gold→rose
rims), declared part of the language as-is.

### STAGE — the room the drama happens in

Dark backdrop (`bgDeep`), the 3-stop vignette gradient recipe, purple ambient glow,
and a warm light pool (see Warmth clause). Backgrounds only — STAGE is never a panel
material.

### Warmth clause — the world is candle-lit, not void

Diagnosis (2026-07-02): ~90% of pixels sat in the cold violet-navy family (`bgDeep`,
cover purples, `surfaceDeep`, deck backs); gold was trim-only. A library at midnight
with the lights off. The fix is a rule, not a new hue — the warm family already
exists: parchment `#9A8E7A`/`#887868`, wood `#6A5A48`, deep amber `#C8920E`, the
deck's copper-rose rims.

1. **Every room gets a candle.** STAGE includes a `candleGlow` token — a low-alpha
   warm gold/amber radial pool placed somewhere meaningful on every screen (on the
   bookcase in the Vault, on the book on the play screen). Purple is the night air;
   the light says someone lives here.
2. **The midground goes warm.** Cold purple is reserved for backdrop and leather
   only. Shelf rails, bookcase backboards, parchment insets, seals, and tooling
   shadows come from the warm family. Rule of thumb: no screen where more than ~70%
   of visible surface sits in the cold purple family.
3. **Amber is promoted.** `#C8920E` graduates from pin-detail to a real tone: spine
   bands, bookplate seals, the dark half of gold gradients.

### Binding rules

1. Every hex on a screen traces to `pwTheme`/`pwMaterials`. No inline hexes. (This
   outlaws Results' `#FFD700` and the stray violets; they are cleaned when that screen
   is converted.)
2. Trophy words always wear the foil (`FoilWord`).
3. Parchment stays dark.
4. Polly Green `#4CAF50` stays Polly-only.
5. Max 2 gold focus elements per screen (existing lock).

## Shared components (new, `app/components/ui/`)

### `FoilWord.tsx` — the identity glue

The three-layer foil stamp extracted from MaskBoard into one component:
`<FoilWord word size … />` renders deboss + catch-light + gold fill identically
everywhere. MaskBoard swaps its three inline `Text` layers for it — one surgical
warroom edit, same rendered output, zero visual change (device-compared). Consumers:
hero word (now), Vault spine titles (this spec), Results best-word and Daily reveal
(future).

### `BookSpine.tsx` — one reclaimed word as a standing book

- SVG leather slab, cover-purple gradient, gold tooling bands top + bottom.
- Title: rotated `FoilWord` reading down the spine.
- Per-word variety, deterministic from the word string (same word always renders the
  same): 2–3 spine widths, ±1° lean.
- **Ghost variant:** translucent, purple-tinted, no foil — faded `lavender` title, and
  a small feather mark at the spine base (Polly's claim tag; see Polly rules).

### `Bookcase.tsx` — the shelf system

- Shelf rails AND the bookcase's inside backboard in the warm wood family
  (`#6A5A48`, darkened variants), gold hairline edges — purple leather spines stand
  against warm wood, never purple-on-purple (Warmth clause).
- Takes spine data, flows spines left→right across shelves, wraps, scrolls
  vertically. Newest reclaim stands last — the shelf visibly grows as you play.
- Empty shelf space is honest: sparse shelves early on show what's left to reclaim.

## Vault screen design

Top to bottom:

1. **Stage:** STAGE material — `bgDeep`, 3-stop vignette, faint purple ambient glow
   low in the room, and the `candleGlow` warm pool centered on the bookcase. The
   bookcase sits in a candle-lit study, same air as the play screen.
2. **Header:** archive language, current title kept; counts strip beneath in label
   type — `14 RECLAIMED · 3 HAUNTED`. The existing rank/tier mark becomes a
   **bookplate**: parchment inset, gold tooling, tier color as its seal (BOOK
   material, replaces the flat circle).
3. **Bookcase (hero, ~75% of screen):** mastered words as foil-titled spines.
4. **Haunted shelf (bottom):** ghost words on their own shelf — translucent purple
   spines, faded lavender titles, feather claim tags, hairline label `STILL HAUNTED`.
   In the bookcase but visibly not yours yet. Archive language only; no cage/prison
   language.
5. **Tap a spine:** it slides up out of the row (translateY, native driver) and a
   CARD-material detail panel opens over the stage — word foil-stamped at top, then
   whatever the store already records for it (reclaimed meanings on parchment lines,
   haunt history; dates only if already stored — this spec adds no data fields). Tap
   away to slide it back.
6. **Empty state:** honest empty shelves + one line: "Your first reclaimed word will
   stand here."
7. **No tabs.** The old four-tab Vault (Mastered / Ghosts / Hidden / Ranks) collapses
   into the one library screen: mastered + ghost shelves replace the first two;
   **Hidden Meanings** fold in as a small gold pin on spines whose word has a hidden
   meaning found (detail panel shows the meaning); **Ranks** fold into the bookplate —
   it shows the tier seal, tapping it opens the rank ladder in a CARD-material panel.

## Polly in the language

Polly is injected as fingerprints, not decoration:

1. **Body on Stage screens only, via the visit/perch system.** Game ✓, Daily ✓.
   Next consumers (future specs): Results gloat (fly in laughing on a loss, sulk on a
   great run — laugh SFX already plays there), then a Home idle perch (she watches you
   choose to challenge her).
2. **Her hold is purple + a feather.** Ghost spines' translucent purple is her grip;
   the feather mark is her claim tag. Marks appear only AFTER judgment — trap tiles in
   play are never marked (no-tells lock untouchable).
3. **The Vault is the one room she cannot enter.** No Polly presence on the Vault
   screen, by design — every other screen has her shadow; the archive has none.
4. **Polly Green is never diluted.** The only green in the app is on her body; any
   flash of green IS her.

## Out of scope (future specs consuming this language)

- Results screen conversion (palette-drift cleanup, bookplate/colophon layout, Polly
  gloat visit).
- Home screen conversion (BOOK/CARD panels, PLAY as opening the book, Polly idle
  perch).
- Daily already conforms; no changes.

## Constraints

- All existing CLAUDE.md locks apply (palette, swipe grammar, cut list, typography).
- `MaskBoard.tsx` warroom-gated: its only change is the `FoilWord` swap, surgical.
- Reanimated stays locked to SwipeMask. RN `Animated`, native driver, transforms +
  opacity only; `setTimeout` between phases.
- No new binary assets; SVG + tokens only.
- Vault data model unchanged — this is presentation only; mastered/ghost data comes
  from the existing store/progress structures VaultScreen already reads.

## Testing & verification

- `FoilWord` swap in MaskBoard: before/after device screenshots must match (same
  treatment, componentized).
- Spine determinism: pure helper (width/lean from word string) gets a plain assert
  test like `pollyVisitPolicy.test.ts` (run via `npx tsx`, RN-free).
- Per patch: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short`.
- Device pass (Expo Go) before visual commits: bookcase with a mid-size collection,
  ghost shelf, spine tap open/close, empty state, scroll behavior. Tag
  `v0.working-YYYYMMDD` after device confirmation.
