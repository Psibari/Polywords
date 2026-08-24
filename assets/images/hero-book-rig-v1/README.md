# Hero Book Rig V1

Production layers share a 1154×830 transparent canvas: `book-base.png`, `cover-outer.png`,
and `cover-inner.png`. The cover hinge is y=88 (10.6024%).

`app/components/ui/HeroBook.tsx` owns stacking and cover motion; `MaskBoard.tsx` owns timing
and hero-word content. Do not change crop or hinge geometry without device verification.
