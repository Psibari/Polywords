# Home Polly Stacking + Vault Atmosphere — Design

## Why

Device screenshots (2026-07-10) showed two problems: on Home, the "ENTER THE HUNT"
book card clips Polly's lower body instead of her perching in front of it; on Vault,
the screen reads flat — no depth behind the bookcase, unlike every other screen.

## A. Home — fix Polly/book z-order

`PollyHomePerch.tsx` root `View` hardcodes `zIndex: 1`; `HomeScreen.tsx`'s `safeArea`
(wraps the book) hardcodes `zIndex: 3` — both local, ad-hoc, unrelated to the
Play-screen `PW.z` scale. Polly is guaranteed to render behind the book regardless
of position. Fix: bump `PollyHomePerch`'s root to `zIndex: 4`. No layout change.
Size of the book card is reassessed only if it still feels dominant once she's
properly visible in front of it (user call, post-fix).

## B. Vault — atmosphere via existing tokens, no new asset

Correction after re-reading the file: `VaultScreen.tsx` already applies
`stageMaterial.vignette`. The real gap is that the vignette is a near-monochrome
dark-gray gradient — it darkens/frames a background image well (Home), but over a
flat solid base it adds no real depth since there's no underlying texture to
modulate. The one color/light element that exists, `candlePool`, uses
`stageMaterial.candleGlow` at 9% alpha — too subtle to read as a light source.
`candleGlow` is used only here (confirmed); `purpleAmbient` is defined but unused
anywhere.

Fix, ordered bottom-to-top, `pointerEvents="none"`, inserted before the existing
vignette:

1. `stageMaterial.purpleAmbient` full-screen wash — first real color variation over
   the flat base.
2. Existing `candlePool` (unchanged), plus one smaller, brighter inner circle at the
   same center to give it an actual hot core instead of one flat soft blob.

Existing vignette and `candlePool` position stay as-is otherwise. `Bookcase.tsx` is
untouched — its wood/shelf/rail detail is already there; the gap is the empty room
around it, not the shelf itself.

## Scope boundaries

No new image assets, no new design tokens, no changes to `Bookcase.tsx`,
`BookSpine.tsx`, or bookplate/rank-modal styling. Two small, independent patches —
committed separately.
