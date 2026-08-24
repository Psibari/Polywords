---
name: POLYWORDS
description: A nocturnal, hand-bound word-recognition game where a smug trickster lays traps
colors:
  gold: "#F5C842"
  gold-dark: "#8F6F18"
  foil-light: "#FFF7D6"
  purple: "#7B2D8B"
  lavender: "#B98ADE"
  rose: "#9B2D6B"
  background: "#1A1830"
  background-deep: "#0B0920"
  surface: "#0F0D2A"
  surface-raised: "#211B4A"
  white: "#FFFFFF"
  polly-green: "#4CAF50"
  wrong-red: "#CC2200"
typography:
  display:
    fontFamily: "BebasNeue-Regular"
    fontWeight: 400
  ui:
    fontFamily: "BarlowCondensed-Bold"
    fontWeight: 700
rounded:
  sm: "4px"
  md: "8px"
  panel: "14px"
  card: "26px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
---

# POLYWORDS Design System

## Direction

The world is a premium, tactile, nocturnal bindery: deep purple and near-black surfaces,
painted stone, authored book/scroll objects, and scarce gilt accents. It should feel clever,
crafted, and faintly dangerous—not flat, pastel, generic, or childish.

Live tokens and materials under `app/ui/` are authoritative. This file defines the durable
design contract, not exact component measurements.

## Hierarchy and Materials

1. Current hero word or clue.
2. Active card/tile decision.
3. Physical destination object: Polybook, scroll, or Vault.
4. HUD/status.
5. Polly visit or celebration.

Use authored silhouettes and painted textures for signature objects. Supporting panels may
use rounded rectangles, but must not visually compete with the play object. Depth comes from
layered shadow, rim light, and physical motion; pressed cards lift rather than merely darken.

## Color

- Gold means earned focus, commitment, or reward. Use it as trim, foil, glow, or a small
  badge—not a large decorative fill.
- Purple/near-black form the world. Rose/lavender support traps, ghosts, and secondary focus.
- Polly green belongs to Polly. Wrong red belongs to wrong feedback.
- No orange UI, pink/magenta, green outside Polly, or red outside wrong feedback.
- Ordinary cards remain visually neutral until the player commits.

## Type

- Bebas Neue: hero words, major numbers, and display headlines.
- Barlow Condensed: UI, tiles, clues, labels, and Polly bubbles.
- UI is generally uppercase; Polly speaks in natural case.
- Do not add a third runtime font without explicit approval.

## Layout and Motion

- Portrait-first, thumb-readable, safe-area aware, and usable on small phones.
- Active gameplay is nav-free and protects the vertical UP lane.
- Motion must explain causality and preserve object continuity. Reward ceremony must never
  expose stale state or accept input early.
- Reduced-motion paths keep the same state order with shorter/quieter movement.
- Test shadows, clipping, text fit, and gesture ownership on both iOS and Android.

## Signature Objects

- **Polybook:** player-owned Hunt intake object; never label it as Polly's Vault.
- **Mask cards:** neutral painted face before commitment; outcome color appears afterward.
- **Boss gauntlet:** three face-down cards chosen, opened, then judged independently.
- **Daily scroll:** one fixed ornate rod plus a matching moving rod/reward face; submitted card
  lands on parchment before being covered.
- **Vault:** reclaimed archive with no Polly presence.

Do not redesign `MaskBoard.tsx`, `SwipeMask.tsx`, or the signature objects by convention;
inspect the live render path and get an approved direction first.
