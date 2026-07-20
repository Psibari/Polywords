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
What survives is the *torch-lit ruins* mood, delivered via the commissioned
background art (`assets/images/settings/chamber-dark-mobile.png`): a vaulted stone
corridor lit by **purple flame**, not orange fire, with a crowned-parrot crest
banner hanging at the far end — this is Polly's hall, not a generic dungeon. Purple
flame reads as more distinctive than literal fire anyway, and keeps gold free to
stay the sparse focus-accent color (title text, toggle "on" state) rather than
doubling as ambient light. Everything below stays inside the existing 8-color
locked palette (`PW.color.*`) — no new hues.

## New material module: `chamberMaterial`

Add a new export to `app/ui/pwMaterials.ts`, following the existing pattern of
`libraryMaterial` (Vault's wood/leather world) and `heroBookMaterial` (Home's book):

```ts
export const chamberMaterial = {
  stoneShade: 'rgba(6,4,22,0.55)',      // overlay tint atop the background image
  plaqueFace: PW.color.cardFace,         // reuse existing card face, not a new color
  plaqueRim: PW.color.cardRim,
  plaqueRimStrong: PW.color.cardRimStrong,
  torchGlow: PW.color.lavender,          // matches the art's purple flame; used as SVG
                                          // stopColor with per-stop stopOpacity, same
                                          // convention as DailyRevealCurtain's curtainGlow
  emberAccent: PW.color.rose,            // danger/warning plaques read as ember-lit
} as const;
```

No hex literals — every value is an existing `PW.color.*` reference or an rgba
derivation of one, same convention `libraryMaterial.ghostTint` already uses for
`purpleSoft`-family derivations. Gold is deliberately *not* used for the torch
glow — it stays reserved for the title text and toggle "on" state so it keeps
reading as a focus accent rather than becoming the ambient light source.

## Background asset & atmosphere layer

- Image asset delivered and in place: `assets/images/settings/chamber-dark-mobile.png`
  — 941×1672px (aspect ratio 0.5628, i.e. `941/1672`), a stone corridor with
  purple-lit wall torches and a crowned-parrot crest banner at the far end. Same
  delivery pattern as `assets/images/vault/bookcase-dark-mobile.png`.
- Rendered via `ImageBackground` full-bleed behind the `ScrollView`, replacing the
  current flat `stageMaterial.vignette` + `stageMaterial.purpleAmbient` wash (those
  two `LinearGradient`/`View` layers are removed from `SettingsScreen.tsx`, not kept
  underneath — the image supplies the depth instead).
- `chamberMaterial.stoneShade` sits in a single `View` overlay atop the image for
  text-contrast, replacing today's `ambientWash` style.
- A `TorchGlow` component (new, `app/components/ui/TorchGlow.tsx`) renders each
  accent as an `react-native-svg` `RadialGradient` — same technique already used for
  `HeroBook`'s cover glow and `DailyRevealCurtain`'s `curtainGlow`, not
  `expo-linear-gradient` (which is linear-only and can't produce a true radial
  falloff). Each glow is `chamberMaterial.torchGlow` at `stopOpacity` fading center
  to edge. Instances sit above the shade, positioned at the wall-mounted torches in
  the art. Positions were **measured**
  against the actual pixels (brightness-cluster scan of the real PNG, not eyeballed)
  — 7 anchor points as percentages of image width/height, top-left origin:

  | Torch | left | top |
  |---|---|---|
  | Foreground L | 11.0% | 31.0% |
  | Foreground R | 89.7% | 31.0% |
  | Mid L | 29.3% | 42.2% |
  | Mid R | 70.0% | 42.2% |
  | Far L | 36.5% | 48.0% |
  | Far R | 61.5% | 48.0% |
  | Altar candle | 44.7% | 53.5% |

  Each anchor gets a small radial glow (~40-60px diameter at 1x, scaled with image
  width) centered on that point, absolutely positioned inside the same container the
  `ImageBackground` renders in so percentages stay correct at any screen width.

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
- New: `assets/images/settings/chamber-dark-mobile.png` (delivered), `chamberMaterial`
  export in `pwMaterials.ts`, `TorchGlow` component.
- Modified: `SettingsScreen.tsx` only.
- No remaining external blockers — asset is in place and measured; ready for a full
  implementation plan.
