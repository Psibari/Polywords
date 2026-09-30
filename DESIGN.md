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
authored books, painted stone, castle objects, and scarce gilt accents. It should feel clever,
crafted, and faintly dangerous, never flat, generic, pastel, or childish.

Live tokens and materials under `app/ui/` are authoritative. This file defines durable visual
rules, not exact measurements.

## Consistency Rule

Consistency means **shared grammar, not identical skins**.

Surfaces share hierarchy, typography, semantic color, depth logic, and interaction quality while
keeping the physical form that gives each mode its identity. A working surface is not redesigned
merely because another screen uses a newer material.

1. **Utility panels** — supporting information and controls. Dark indigo/near-black, restrained
   depth, white copy, semantic accents only when meaningful. Current examples: Daily Entry and
   Settings content cards.
2. **Action plates** — tactile route or action controls where a physical plate improves the
   action. Do not force them onto a screen whose simpler control reads better.
3. **Decision objects** — Hunt masks, Daily stone answer blocks, and Boss sealed bricks keep
   their native physical forms and remain neutral before commitment.
4. **Signature objects** — the Hunt intake book and Daily castle keep authored art and should
   not be flattened into generic UI.
5. **Outcome ceremony** — MASTERED, HAUNTED, BANISHED, and other earned outcomes may use special
   plaques, seals, or stone. Scarcity is part of their value.
6. **Book/page surfaces** — the Polybook screen remains paper/book material, not a utility panel.

A cross-screen change needs a player-facing benefit: better readability, hierarchy, material
coherence, accessibility, or identity. "It matches another screen" is not enough.

## Hierarchy and Materials

1. Current hero word or clue.
2. Active decision object.
3. Physical destination or mode object.
4. HUD/status.
5. Polly visit or celebration.

Use authored silhouettes and painted textures for signature objects. Supporting panels may be
simple rounded surfaces when that improves legibility. Depth comes from rim light, layered
shadow, and physical motion; pressed objects should feel displaced, not merely recolored.

## Color

- Gold means earned focus, commitment, or reward. Keep it scarce.
- Purple/near-black form the world. Rose/lavender support traps, ghosts, and secondary focus.
- Polly green belongs to Polly. Wrong red belongs to wrong feedback.
- No orange UI, pink/magenta, green outside Polly, or red outside wrong feedback.
- Ordinary decisions remain visually neutral until commitment.

## Type

- Bebas Neue: hero words, major numbers, display headlines.
- Barlow Condensed: UI, tiles, clues, labels, and Polly bubbles.
- UI is generally uppercase; Polly speaks in natural case.
- Do not add a third runtime font without explicit approval.

## Layout and Motion

- Portrait-first, thumb-readable, safe-area aware, and usable on small phones.
- Active gameplay is nav-free and protects the vertical UP lane.
- Motion explains causality and preserves object continuity.
- Reward ceremony never exposes stale state or accepts input early.
- Reduced Motion keeps state order while shortening or quieting movement.
- Test shadows, clipping, text fit, gesture ownership, and stacking on real iOS/Android devices.

## Signature Objects

- **Hunt intake book:** the in-round destination object; its current spine reads POLYBOOK.
- **Hunt masks:** neutral painted face before commitment; outcome treatment follows the swipe.
- **Boss gauntlet:** sealed bricks open into the Hunt decision language.
- **Daily castle:** clues ride the gate; answers are stone blocks in the wall
  (`docs/DAILY_CHALLENGE_SPEC.md`).
- **Polybook screen (Vault route):** Polly's diary, read by the player
  (`docs/POLYBOOK.md`).

Do not redesign `MaskBoard.tsx`, `SwipeMask.tsx`, or signature objects by convention.
Inspect the live render path and get an approved direction first.
