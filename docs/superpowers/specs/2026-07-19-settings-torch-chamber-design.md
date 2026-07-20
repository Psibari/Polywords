# Settings Screen — Torch Chamber Redesign

## Why

Settings ([SettingsScreen.tsx](../../../app/screens/SettingsScreen.tsx)) got its
functional migration in `2026-07-10-settings-screen-design.md` (design tokens, real
data, working toggles) but never got an identity pass. It still reads as a generic
rounded-card settings list — the only screen in the app without an authored material
world of its own (Home has HeroBook, Vault has the bookcase, Daily has the quill/
scroll treatment). This pass gives it one: a torch-lit stone chamber the player steps
into to configure their gear before a Hunt.

Explicitly visual only. No changes to toggle logic, persisted state, navigation, or
the Reset Progress confirmation flow.

## Concept

Jungle was the starting idea but is dropped as literal content — `CLAUDE.md`'s
visual locks forbid green UI outside Polly's character art and forbid orange UI.
What survives is the *torch-lit ruins* mood: warm gold flame-light against cold dark
stone. This reads as "adventurer's basecamp before a Hunt," which fits the game's
expedition framing without touching either locked rule. Everything below stays
inside the existing 8-color locked palette (`PW.color.*`) — no new hues.

## New material module: `chamberMaterial`

Add a new export to `app/ui/pwMaterials.ts`, following the existing pattern of
`libraryMaterial` (Vault's wood/leather world) and `heroBookMaterial` (Home's book):

```ts
export const chamberMaterial = {
  stoneShade: 'rgba(6,4,22,0.55)',      // overlay tint atop the background image
  plaqueFace: PW.color.cardFace,         // reuse existing card face, not a new color
  plaqueRim: PW.color.cardRim,
  plaqueRimStrong: PW.color.cardRimStrong,
  torchGlowCore: PW.color.goldGlow,
  torchGlowEdge: 'rgba(245,200,66,0.0)', // fades to transparent, not a new color
  emberAccent: PW.color.rose,            // danger/warning plaques read as ember-lit
} as const;
```

No hex literals outside the two rgba derivations above (both are existing colors at
new alpha values, same convention `libraryMaterial.ghostTint` already uses for
`purpleSoft`-family derivations).

## Background asset & atmosphere layer

- New image asset: `assets/images/settings/chamber-dark-mobile.png` — a stone
  corridor/chamber interior with torches mounted on the walls, fixed aspect ratio,
  same delivery pattern as `assets/images/vault/bookcase-dark-mobile.png` (user
  supplies/generates the art; Claude integrates it).
- Rendered via `ImageBackground` full-bleed behind the `ScrollView`, replacing the
  current flat `stageMaterial.vignette` + `stageMaterial.purpleAmbient` wash (those
  two `LinearGradient`/`View` layers are removed from `SettingsScreen.tsx`, not kept
  underneath — the image supplies the depth instead).
- `chamberMaterial.stoneShade` sits in a single `View` overlay atop the image for
  text-contrast, replacing today's `ambientWash` style.
- A `torchGlow` layer (one or more small radial-gradient `View`s via
  `expo-linear-gradient`, colored `chamberMaterial.torchGlowCore` →
  `torchGlowEdge`) sits above the shade, positioned at the wall-mounted torches in
  the art. **Positions are measured against the actual delivered image once
  supplied — not guessed** — same lesson as
  `feedback_measure_dont_guess_visual_sizing` (Playwright/on-device check of the
  real image, not eyeballed coordinates).

## Header

Replace the current single `headerGlow` ring (a plain gold-bordered circle) with two
smaller torch-glow accents flanking the title, reusing the same `torchGlow` gradient
treatment as the background layer — consistent light source, not a separate effect.

## Section cards → stone plaques

Every section card (`Game`, `Account`, `About`, `Danger / Reset`, and the profile
card) restyles from the current flat rounded rectangle to a carved-stone-plaque
treatment, built from `chamberMaterial` + existing `PW.shadow.panel`:

- `plaqueFace` background (unchanged color, already dark enough to read as stone).
- `plaqueRim` border, `plaqueRimStrong` on the pressed state (same rim-brightens-
  on-press pattern `cardMaterial.pressed` already uses elsewhere).
- A thin top-edge highlight (reuse `cardMaterial.topHighlight`'s technique — a 1px
  `PW.color.cardInner` line near the top) to read as a beveled carved edge.
- Rows, toggles, and placeholder rows inside keep their exact current structure and
  behavior — only the containing plaque and its borders change. The gold "on" toggle
  state already reads as warm/lit metal; no change needed there.
- `Danger / Reset` keeps its rose border but reframes as `emberAccent` — a
  warning plaque lit by red embers rather than a generic destructive-red card. Still
  the same rose hex, no new color.

## Animation & accessibility

- Torch flicker: `Animated.Value` driving `opacity` only (native driver, per the
  standing animation lock — no color/layout properties on the same driver).
  Gentle, slow pulse — not a strobe.
- Reduced motion: flicker freezes to a static mid-opacity glow, same
  `reduced-motion disables ambient motion` pattern already used for Home/Hunt/Daily
  Polly ambient effects.

## Scope boundaries

- No changes to `useGameStore.ts`, `sfx.ts`, toggle behavior, or the Reset Progress
  alert/confirmation flow.
- No changes to `VaultScreen.tsx`, `HomeScreen.tsx`, `DailyChallengeScreen.tsx`,
  `BottomNav.tsx`, `MaskBoard.tsx`, or `SwipeMask.tsx`.
- New: `assets/images/settings/chamber-dark-mobile.png` (asset, supplied
  separately), `chamberMaterial` export in `pwMaterials.ts`.
- Modified: `SettingsScreen.tsx` only.
- Blocked on: the chamber background image itself. Torch-glow overlay positions
  cannot be finalized until that asset exists — implementation can build the plaque/
  header/card restyle against a placeholder fill first, then wire the real image and
  measure torch positions once it's supplied.
