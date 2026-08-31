# Hero Book Rig V1

Production layers share a 1154×830 transparent canvas: `book-base.png`, `cover-outer.png`,
and `cover-inner.png`. The cover hinge is y=88 (10.6024%).

`app/components/ui/HeroBook.tsx` owns stacking and cover motion; `MaskBoard.tsx` owns timing
and hero-word content. Do not change crop or hinge geometry without device verification.

## Outcome variants (banked 2026-08-31)

`mastered-gold-book-base.png` / `-cover-inner.png` / `-cover-outer.png` and
`haunted-book-base.png` / `-cover-inner.png` / `-cover-outer.png` are the final boss-outcome
rigs — approved production art, not to be recolored/redrawn/regenerated. Each set shares the
exact same 1154×830 canvas and hinge as the neutral rig (PNG-header-verified, not just
assumed), so `HeroBook`'s `variant` prop swaps sources with no geometry change. Wired into
the boss-only slam in `MaskBoard.tsx`'s `onMasteredSequence`/`onHauntedSequence`; the ordinary
(non-boss) Haunt-rematch banish/fail beat still uses the neutral rig unchanged.
