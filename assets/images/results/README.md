# Result Plaques

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

`banished.png` is the supplied Returning Haunt success ("banish") art (added
2026-09-05), a cracked-frame plaque distinct from the two boss transformation
plaques above — it is not gated on `isBoss`, since a Returning Haunt is never
boss UI (see `MasteredOutcomeOverlay`'s `isBanished` branch in `MaskBoard.tsx`).
`banished-result-plaque.png` is its wired crop, same convention as above:
alpha-bounds crop plus a 10px margin, computed programmatically (`pngjs`), no
redraw or recolor.

| File | Canvas | Visible-content crop | Aspect (crop) |
| --- | --- | --- | --- |
| banished.png | 1254×871 | — | — |
| banished-result-plaque.png | — | 705×553 | 1.275 |

## Lettered plaques (2026-10-30)

The Results plaques carry their headline carved into the art, since MASTERED / HAUNTED / BANISHED
never change. Only the round's word is live text (`PlaqueText`, Bebas, carved material).

| File | Used by | Notes |
| --- | --- | --- |
| mastered-result-plaque-lettered.png | Results MASTERED plaque (MaskBoard) | 1362x1134 (the 681x567 crop at 2x), MASTERED in Cinzel Black |
| banished-result-plaque-lettered.png | Results BANISHED plaque (MaskBoard) | 1410x1106 (the 705x553 crop at 2x), BANISHED in Caesar Dressing, chipped and cracked |
| haunted-result-plaque-lettered.png | Results HAUNTED plaque (MaskBoard) | 1263x954, HAUNTED in Caesar Dressing |
| king-result-plaque.png | KING plaque (RematchOutcomePlaque) | KING in Cinzel Black baked in (the one file overwritten in place) |

`mastered-result-plaque.png` stays an EMPTY frame on purpose: the rematch plaque draws a live MASTER
on it, which animates into BUSTER (and shrinks into KING). `haunted-result-plaque.png` and
`banished-result-plaque.png` (empty, cleaned frames) are no longer referenced by the app; they are kept
as the clean source the lettered versions were made from.
