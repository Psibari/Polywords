# Boss Outcome Result Plaques

`masterresult.png` and `hauntedresult.png` are the original supplied production art
(approved 2026-08-31) — kept for provenance, not wired into the app.

`mastered-result-plaque.png` and `haunted-result-plaque.png` are the wired assets: the
same two images mechanically cropped to their own visible (non-transparent) alpha
bounds, plus a small margin. No redraw, recolor, or content change — the source
canvases carry very different amounts of transparent padding (Mastered's visible art
is roughly 40% of its canvas width; Haunted's fills nearly all of its canvas), so
sizing either at its raw canvas dimensions made them read as wildly different sizes
on screen even at the same declared render width. Cropping first, then rendering both
at a shared width via `contentFit`/`resizeMode: 'contain'` with each crop's own
measured aspect ratio, is what actually gets them to the "same visual width, correct
relative proportions, never stretched" result `MaskBoard.tsx`'s `MasteredOutcomeOverlay`/
`HauntedOutcomeOverlay` (`isBoss` branch) rely on.

| File | Canvas | Visible-content crop | Aspect (crop) |
| --- | --- | --- | --- |
| masterresult.png | 1656×950 | — | — |
| mastered-result-plaque.png | — | 681×567 | 1.201 |
| hauntedresult.png | 1327×1186 | — | — |
| haunted-result-plaque.png | — | 1263×954 | 1.324 |
