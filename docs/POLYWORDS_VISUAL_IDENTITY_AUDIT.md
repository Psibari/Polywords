# POLYWORDS Visual Identity Audit

**Date:** 2026-10-01  
**Branch audited:** `play-screen-overhaul`  
**Status:** Product-director audit. This document records observed live state, conflicts, and the proposed visual identity standard. It does **not** authorize a global restyle.

## Why this exists

POLYWORDS has accumulated strong visual decisions across Home, Hunt, Daily, Results, Settings, Polly, and the Polybook. Some differences are intentional physical-world identity; others are historical residue. The goal is not to make every screen look alike. The goal is to make every new decision answerable without guessing.

The governing rule remains:

> **Consistency means shared grammar, not identical skins.**

A surface may look different because it is a different physical object or gameplay system. It should not look different because an old font, logo, color, or component happened to survive.

---

# Executive finding

The live app is more coherent than the asset folders suggest.

The current runtime has a clear three-role typography system:

1. **Bebas Neue** — display / hero word face.
2. **Barlow Condensed Bold** — functional game and UI face.
3. **Buggie** — Polly's handwriting in the Polybook only.

The Home POLYWORDS masthead is a **baked image lockup**, not live text. The repo does **not** establish Luckiest Guy as its source font. Pete's recollection that the source artwork began from Luckiest Guy may be correct, especially because the final mark was substantially edited outside the app, but the current repo can only prove the pixels, not the originating typeface.

That distinction matters: **the POLYWORDS logo is now an authored logo asset, not a font treatment.** New branded words should not attempt to reconstruct the logo by guessing its original font.

For the Polybook cover, the correct direction is therefore:
- it must visibly say **POLYBOOK**;
- it should belong to the POLYWORDS brand family;
- it should not pretend to be the exact POLYWORDS logo;
- the lettering treatment should be deliberately designed from the approved brand language, with the final type choice approved visually rather than inferred from a possibly modified source font.

---

# Evidence hierarchy used

This audit follows the project authority rule:

1. Current live render path and runtime code.
2. Current `app/ui/` tokens/materials.
3. Device-approved screenshots and product rulings.
4. `DESIGN.md`.
5. Older docs, dormant assets, and historical implementation notes.

Where these conflict, the live branch wins for describing what ships.

---

# 1. Logo and wordmark audit

## LIVE / AUTHORITATIVE

### Home masthead

**Render path:** `HomeScreen.tsx` → `HomeWordmark.tsx`

The current Home masthead renders:

- `assets/images/brand/home-title-lockup.png`
- `assets/images/brand/home-title-tagline.png`

`HomeWordmark.tsx` explicitly describes both as baked pixels cropped from the approved title-reveal render. The tagline's hand-drawn font is specifically noted as not bundled with the app.

**Ruling:** the live POLYWORDS Home mark is an **authored image lockup**. Its exact final letterforms, edits, extrusion, outline, spacing, curvature, and treatment are the brand reference. Do not replace it with live text merely because a similar font can be found.

## PRESENT BUT NOT CURRENTLY AUTHORITATIVE

The same brand directory also contains:

- `home-wordmark.png`
- `wordmark.png`

They are not the current Home render path.

**Classification:** LEGACY / ALTERNATE until a current consumer proves otherwise.

## DORMANT / STALE BRAND SYSTEM

`app/ui/pwBrandAssets.ts` contains an older SVG brand system based on `RammettoOne-Regular`, including a PW monogram and POLYWORDS wordmark SVGs.

Problems:
- `RammettoOne-Regular.ttf` exists in `assets/fonts/`, but App.tsx does not load it.
- The file says to keep it in sync with `FONTS.logotype`, but the current `FONTS` object has no `logotype` key.
- The live Home screen does not use this SVG wordmark path.

**Classification:** LEGACY / DORMANT. Do not use as the source of truth for new branding without an explicit revival decision.

## LUCKIEST GUY STATUS

No current `Luckiest Guy` font asset, runtime registration, or live font-family reference was found on `play-screen-overhaul`.

This does **not** prove the approved logo was never based on Luckiest Guy. The live logo is baked artwork and may contain substantial external edits that the repo cannot reverse-engineer.

**Classification:** SOURCE HISTORY UNVERIFIED IN REPO.

**Product rule:** treat the approved POLYWORDS masthead pixels as the canonical logo. Treat “Luckiest Guy” as a likely source/design-history note until the original editable logo source confirms it.

---

# 2. Runtime typography audit

## LIVE FONTS LOADED BY APP.TSX

Only these three font families are registered at runtime:

| Role | Runtime font | Current authority |
| --- | --- | --- |
| Display / hero | `BebasNeue-Regular` | `FONTS.wordDisplay`, `bossWord`, `heroFace` |
| UI / gameplay | `BarlowCondensed-Bold` | `FONTS.ui`, `hud`, `tileCopy`, `label`, `brand` |
| Polly handwriting | `Buggie-Regular` | `FONTS.hand` |

## FONT FILES PRESENT BUT NOT LOADED

The font directory also contains:

- `BungeeShade-Regular.ttf`
- `LilitaOne-Regular.ttf`
- `RammettoOne-Regular.ttf`

They are not registered by the current `App.tsx`.

**Classification:** LEGACY / UNUSED AT RUNTIME unless another native mechanism is later proven to load them.

## PROPOSED ROLE STANDARD

### A. Authored logo
The approved POLYWORDS image lockup.

Use for:
- primary POLYWORDS brand presentation;
- marketing or signature placements where the actual logo is required.

Do not substitute a runtime font for the logo.

### B. Display face — Bebas Neue
Use for:
- hero/head words;
- major display headlines;
- major numbers where the current design system calls for display typography.

Do not use merely to make something “feel branded.”

### C. UI face — Barlow Condensed Bold
Use for:
- navigation;
- labels;
- buttons;
- section titles;
- dates;
- counters;
- clues and functional copy where currently established;
- supporting screen titles.

This is the workhorse.

### D. Polly handwriting — Buggie
Use only when the fiction says **Polly physically wrote the words**.

Use for:
- Polybook diary entries;
- future handwritten notes, corrections, arrows, captions, or player/Polly correspondence if the writing is meant to exist on the page.

Do not use for:
- navigation;
- tabs;
- buttons;
- screen headers;
- system labels;
- generic “cute” flavor.

### E. Playable typography
Gameplay readability and decision clarity outrank brand mimicry. Existing Hunt/Daily typography remains governed by its live system and device-approved surfaces.

---

# 3. Typography conflict found

`DESIGN.md` currently says:

> Do not add a third runtime font without explicit approval.

The current runtime already has a third font, `Buggie-Regular`, deliberately scoped to Polly's handwriting.

This is not a product defect. It is a documentation mismatch created after the Polybook handwriting system was approved.

**Proposed correction:** the durable rule should become:

> Runtime typography uses two core families — Bebas Neue and Barlow Condensed — plus Buggie as the single approved character-handwriting exception. Additional runtime fonts require explicit approval.

Do not change `DESIGN.md` until Pete approves this audit.

---

# 4. Color audit

## CURRENT CORE PALETTE

The strongest agreement across `AGENTS.md`, `DESIGN.md`, `pwTheme.ts`, and live screens is:

| Role | Color |
| --- | --- |
| World background | `#1A1830` |
| Deep background | `#0B0920` |
| Deep surface | `#0F0D2A` |
| Raised surface | `#211B4A` |
| Gold | `#F5C842` |
| Dark gold | `#8F6F18` |
| Foil light | `#FFF7D6` |
| Purple | `#7B2D8B` |
| Lavender | `#B98ADE` |
| Rose | `#9B2D6B` |
| Polly green | `#4CAF50` |
| Wrong red | `#CC2200` |
| White | `#FFFFFF` |

## SEMANTIC RULES — KEEP

- Gold is scarce and meaningful.
- Purple / near-black form the world.
- Polly green belongs to Polly.
- Wrong red belongs to wrong feedback.
- Ordinary choices remain neutral before commitment.
- No screen earns consistency points merely by becoming more purple or more gold.

## AMBER NOTE

`pwTheme.ts` contains `amber: #C8920E` and Home uses it as part of gold material shading. Older prose saying “no orange UI” should be read semantically: do not introduce orange as an independent UI accent. Warm amber inside a gold material gradient is acceptable.

---

# 5. Material and surface-family audit

The current surface-family doctrine is strong and should remain the organizing system.

## LOCKED / HEALTHY FAMILIES

### Utility panels
Dark indigo / near-black supporting surfaces.

Examples:
- Settings content cards.
- Daily Entry.

### Action plates
Physical controls where tactility improves the action.

Examples:
- Home route plates.

### Decision objects
Objects the player commits through.

Examples:
- Hunt masks.
- Daily answer stones.
- Boss sealed bricks.

They remain neutral before commitment.

### Signature objects
Authored objects with their own physical identity.

Examples:
- Home book.
- Hunt book/object language.
- Daily castle.
- Polybook.

These should share material grammar, not identical skins.

### Outcome ceremony
Special seals, plaques, stone, and earned visual treatment.

Gold can be stronger here because the player earned the moment.

### Book/page surfaces
Paper, bindings, page edges, leather/cloth, ink.

The Polybook belongs here and should not be flattened into a generic dark panel.

---

# 6. POLYBOOK-specific ruling from this audit

The structural prototype is approved enough to proceed to art, but its final art must be built from the identity rules above.

## CLOSED COVER

Must:
- read **POLYBOOK** clearly;
- use deep POLYWORDS purple as the dominant cover material;
- visibly belong to the same world as the Home book without being the same book;
- use restrained gold hardware/accents;
- carry a Polly ownership mark, preferably a crowned Polly crest/profile rather than a generic PW monogram;
- show the ribbon system as physical bookmarks emerging from the page block;
- preserve the approved smaller closed-book footprint.

Must not:
- become a medieval spellbook;
- become a generic fantasy tome;
- copy the Home book's buttons;
- use giant PW letters as the primary identity;
- cover every edge in gold;
- guess at the POLYWORDS logo font and call the result canonical.

## POLYBOOK TITLE TREATMENT

The title should visually harmonize with the approved POLYWORDS logo, but it is a **new title treatment**, not a fake extension of the logo asset.

The design pass should test:
1. a carefully styled Luckiest Guy-based POLYBOOK treatment **if Pete's editable source confirms that lineage**, versus
2. a custom drawn/edited POLYBOOK treatment derived visually from the approved logo's proportions, weight, bevel/extrusion, and gold treatment.

The winner is chosen on actual phone-size visual fit, not font pedigree.

## OPEN BOOK

Must preserve the current prototype's large usable writing area.

Physical layers should read:
1. purple cover/backing;
2. binding/spine;
3. page block;
4. warm paper;
5. dynamic code-driven content.

Do not bake TODAY, JOURNAL, BEATEN, dates, seals, Polly writing, or doodles into the base page artwork.

## RIBBONS

Reusable physical ribbon asset(s), with labels in code.

Current sections:
- TODAY
- JOURNAL
- BEATEN

Future sections may appear dynamically. The book art must leave a usable continuous edge rather than painting permanent tab slots.

---

# 7. What matches today

These are coherent and should be treated as reference-quality unless new evidence reopens them:

- Deep nocturnal purple world.
- Scarce meaningful gold.
- Barlow Condensed functional UI language.
- Bebas Neue display/hero language.
- Polly handwriting as a fictional authored layer, not generic UI.
- Tactile physical objects instead of one universal card skin.
- Home book as a signature object.
- Daily castle as its own signature object.
- Hunt masks / Boss bricks retaining their own decision grammar.
- Polybook paper/book material remaining distinct from utility panels.
- Real-device testing as the final authority for scale, clipping, hierarchy, and legibility.

---

# 8. What does not currently match / needs cleanup

## Documentation drift
- `DESIGN.md` still describes only two runtime fonts and forbids a third, while Buggie is now an approved live exception.
- Older docs and changelog entries describe historical Bungee/Rammetto/Lilita typography that is no longer the live runtime.

## Dormant brand implementation
- `pwBrandAssets.ts` references Rammetto and a nonexistent `FONTS.logotype` contract.
- It should not guide new art unless deliberately revived.

## Duplicate brand assets
- The brand folder contains multiple wordmark PNGs, but the current Home render uses only the approved title lockup + tagline pair.
- Do not delete alternates during this audit. Mark first; clean only in a separate approved maintenance pass.

## Logo source ambiguity
- The repo preserves the final pixels but not enough editable-source metadata to prove the original font lineage.
- Future brand work should preserve a small source note when an external editor materially changes a font-based mark.

---

# 9. Proposed durable visual identity rules

These are the rules this audit recommends locking after review.

1. **The approved POLYWORDS image lockup is the logo.** A font is not the logo.
2. **Two core runtime type families:** Bebas Neue for display; Barlow Condensed Bold for UI/gameplay.
3. **One approved character exception:** Buggie for Polly's physical handwriting only.
4. **New fonts require explicit approval and a defined semantic role.**
5. **Gold is semantic, not decorative filler.**
6. **Green is Polly; red is wrong feedback.**
7. **Shared grammar, not identical skins.**
8. **Signature objects may differ physically but must share world materials, hierarchy, and interaction quality.**
9. **Authored art beats generic UI for identity-bearing objects; readable code-driven text beats baked text for dynamic content.**
10. **Phone-size device evidence outranks desktop/mockup beauty.**
11. **Do not reconstruct an authored logo from a guessed font.**
12. **Every new branded asset should document its source treatment so future work does not have to perform typography archaeology again.**

---

# 10. Decision-state inventory

## LOCKED / PRESERVE
- Approved Home POLYWORDS masthead pixels.
- Core palette and semantic color roles.
- Shared-grammar-not-identical-skins doctrine.
- Bebas Neue display role.
- Barlow Condensed Bold UI/gameplay role.
- Buggie Polly-handwriting role.
- Existing device-approved signature objects unless specifically reopened.

## CURRENT / AUTHORITATIVE
- `HomeWordmark.tsx` + `home-title-lockup.png` + `home-title-tagline.png`.
- `app/constants/fonts.ts`.
- `App.tsx` runtime font registration.
- `app/ui/pwTheme.ts`.
- `DESIGN.md`, except for the identified third-font mismatch.

## EXPERIMENTAL / REOPENED
- Final Polybook cover art.
- Final Polybook open-book art.
- Polybook ribbon art/states.
- POLYBOOK cover title treatment.
- Future interactive/player correspondence sections.

## LEGACY / DO NOT USE AS NEW AUTHORITY
- Unloaded Bungee Shade, Lilita One, and Rammetto One font files.
- Dormant Rammetto-based `pwBrandAssets.ts` wordmark system.
- Alternate brand PNGs not used by the current Home render path.
- Historical docs that conflict with current runtime.

---

# 11. Most valuable next action

**Design the Polybook closed/open art pair using this audited system, beginning from the approved device geometry rather than from a free-form illustration.**

The art should now be judged against a known brand system instead of “does this sort of look like POLYWORDS?”

# 12. Next three actions

1. **Approve or amend this audit's typography/brand rulings**, especially the distinction between the authored POLYWORDS logo and its possible Luckiest Guy source history.
2. **Create the base Polybook art system:** closed shell, matching open shell, reusable forked ribbon. No final personality decoration yet.
3. **Composite those assets into the current prototype and device-test them** before adding crest, doodles, interactive correspondence, locks, or opening animation polish.

# 13. Do not work on yet

- Global font replacement.
- Rebuilding the POLYWORDS logo as live text.
- Deleting legacy fonts/assets.
- Reskinning already approved Home, Hunt, Daily, Results, or Settings surfaces merely for uniformity.
- Polybook doodle production.
- Player-to-Polly messaging.
- Locked/monetized Polybook sections.
- Final opening animation.
- Broad component refactors.

# 14. Acceptance and verification

This audit is successful when:

- A designer can identify the authoritative POLYWORDS logo without guessing.
- Every live runtime font has one defined role.
- Legacy fonts/assets are clearly separated from live authority.
- Color roles are semantic and documented.
- New signature objects can differ physically without drifting out of the world.
- The Polybook brief can specify title, cover, paper, ribbons, crest, and typography without contradicting the live app.
- Future visual reviews can classify a mismatch as typography, hierarchy, material, color semantics, or intentional surface identity rather than “it just doesn't match.”

Before any cleanup or global code change, verify the proposed rules against current device screenshots and update `DESIGN.md` only after Pete approves the rulings.

---

## Why this order wins

The Polybook is the first major new signature object being designed after the game accumulated several generations of visual work. Locking the grammar now prevents us from designing the Polybook against stale fonts or dormant logo systems, then discovering the inconsistency after expensive art is finished.

It also avoids the opposite mistake: flattening strong, device-approved surfaces into one uniform skin. The audit gives POLYWORDS a vocabulary for **coherence without sameness**, which is the visual problem the game actually has.
