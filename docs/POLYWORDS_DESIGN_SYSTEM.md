# POLYWORDS Design System

## Purpose

This design system defines the premium POLYWORDS visual language, tokens, and materials used across the app. It is intended to keep UI consistent, maintain the book-and-library material world, and preserve the brand palette and motion grammar.

## Structure

- `app/ui/pwTheme.ts` — core color, spacing, radius, typography, motion, z-index, and shadows.
- `app/ui/pwMaterials.ts` — material vocabularies for cards, book surfaces, foil, library shelves, and stage backgrounds.
- `app/ui/pwEffects.ts` — particle and motion effect tokens.
- `app/ui/pwDesignSystem.ts` — premium wrapper that exposes the brand, palette, typography, spacing, materials, and effect vocabulary.

## Brand language

- Premium, expert, literary, and tactile.
- POLYWORDS is a semantic combat arena with a bookish, handcrafted library atmosphere.
- Visual style is dark, richly layered, and warmed by gold and amber light.
- Only Polly uses green (`#4CAF50`).
- Max 2 gold focus elements per screen.

## Palette tokens

- `PW.color.bg` — primary background.
- `PW.color.bgDeep` — deep room and stage surface.
- `PW.color.surfaceDeep` — deep panel surface.
- `PW.color.surfaceBase` — standard surface material.
- `PW.color.cardFace` — card face.
- `PW.color.gold` — hero accent and rewards.
- `PW.color.amber` — warm secondary accent.
- `PW.color.purple` / `PW.color.lavender` — leather and ambient purple family.
- `PW.color.white` / `PW.color.softWhite` / `PW.color.mutedWhite` — text hierarchy.
- `PW.color.correct` / `PW.color.wrong` — semantic feedback only.

## Material vocabulary

- `heroBookMaterial` — book cover leather, pages, trim, and tooling.
- `cardMaterial` — interactive card surfaces, press states, and edge highlights.
- `foilMaterial` — foil text and trophy word rendering.
- `libraryMaterial` — bookcase wood, spine leather, ghost variants, and warm shelves.
- `stageMaterial` — dramatic background, vignette, ambient glow, and candle light.

## Typography

- `PW.font.heroWord` — hero word display.
- `PW.font.clue` / `PW.font.clueSmall` — clue and supporting text.
- `PW.font.label` — labels, affordances, and small UI copy.
- `PW.font.hud` — HUD text.

## Spacing and radius

- `PW.space` defines the app's internal rhythm: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, plus card and screen padding.
- `PW.radius` defines rounded corners at card, panel, and pill scale.

## Motion and layering

- `PW.motion` defines the animation timing system used across the app.
- `PW.z` defines surface stacking order.
- `PW.shadow` captures the premium glow and panel depths.

## Usage guidance

- Always trace colors to `PW.color.*`.
- Use material exports in `app/ui/pwMaterials.ts` for visual language surfaces.
- Avoid inline hex values in screens and components.
- Keep hero words and trophy text in `foilMaterial` / `FoilWord`.
- Use `stageMaterial` for backgrounds only, not panels.
- Preserve the existing swipe grammar and visual rules from `CLAUDE.md`.

## Notes

- This system is intentionally code-first: tokens live in `app/ui`, not external design tools.
- The wrapper in `app/ui/pwDesignSystem.ts` makes the theme easy to consume by future app screens and tools.
