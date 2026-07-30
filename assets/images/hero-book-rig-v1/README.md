# Hero Book Rig V1

This rig keeps the production crop's 1154 x 830 framing across every layer so
the PNGs can be stacked without per-asset layout offsets.

## Layers

- `book-base.png` — stationary page block, back cover, bookmark, and spine
- `cover-outer.png` — outside face of the moving front cover
- `cover-inner.png` — inside face shown after the cover passes 90 degrees

All three production PNGs use transparency. The cover hinge is at 10.6024% of the
cropped canvas height (`y = 88`, corresponding to `y = 208` in the source artwork).

## React Native

`app/components/ui/HeroBook.tsx` owns the production rig. It preserves the existing
Hunt contract:

- `coverRotateX` drives the cover around the image-aligned hinge
- `intakeOpacity` and `intakeScaleY` drive the intake glow
- `children` remain attached to the moving outer cover

`MaskBoard.tsx` continues to own the animation timing and hero-word content.
