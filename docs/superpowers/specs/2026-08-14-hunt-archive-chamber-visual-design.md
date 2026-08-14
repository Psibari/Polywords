# POLYWORDS Hunt Archive Chamber Visual Design

Date: 2026-08-14
Branch: `play-screen-overhaul`
Status: Approved direction, pending written-spec review

## Goal

Redesign the Hunt hero book and play-screen environment so the hero book, mask cards, gameplay surface, and Polly's Hunt visits feel like one illustrated world rather than separate foreground stickers over an unrelated background.

The visual hierarchy is locked:

1. Hero word / hero book
2. Active mask card
3. Supporting environment
4. Ambient decoration

The background must display and ground the book/cards without competing with them.

## Approved Direction

Direction A: **POLYWORDS Archive Chamber**.

This is an enchanted word-vault environment, not a literal busy library, generic medieval room, starfield, or abstract wallpaper. It should feel polished, dark, intelligent, slightly magical, and adult rather than childish.

The environment should imply that the book and cards physically occupy the same scene. The book and cards should appear to rest on a shared surface/plane with believable grounding shadows and reflected light. Before interaction they should visually belong to that world; once gameplay begins they must retain clean motion/readability.

## Current Structural Constraints

The existing gameplay architecture is preserved:

- `GameScreen.tsx` owns the ambient background layer and overall Hunt/Boss scene.
- `MaskBoard.tsx` owns the hero book placement, card stack, swipe cues, and gameplay motion.
- `HeroBook.tsx` is a three-part rig: `book-base.png`, `cover-outer.png`, and `cover-inner.png`.
- The hero book cover animation, intake seam, book slide, word absorption, and card interactions must not change mechanically.
- `PollyHuntVisit.tsx` owns Polly's Hunt entrance/exit arc and speech bubble.

This pass changes visual assets, visual composition, and supporting background geometry only. Gameplay mechanics remain untouched.

## Dynamic Composition, Not Still-Image Composition

The design must be judged across the active Hunt flow, not from one screenshot.

Required states to support:

1. Round enters with the hero book visible and card stack staged below.
2. Active card lifts, swipes, and resolves while remaining visually separated from the background.
3. Book cover/intake animation remains readable against the environment.
4. Backing cards remain visually connected to the same surface.
5. Polly flies in from bottom-left, lands/reacts, displays a speech bubble to her right, then exits.
6. Boss state remains compatible with the same world family.
7. Flash/effect overlays remain readable and are not visually muddied by the background.

The background must therefore contain protected low-detail motion lanes rather than merely looking attractive in a static frame.

## Reference Coordinate System

Primary portrait reference scene:

- Width: 390
- Height: 844
- Coordinate origin: top-left

All scene geometry should be derived from this fixed scene and scaled responsively.

### Protected regions

Approximate composition zones, to be verified against runtime measurements before final asset handoff:

- HUD/chrome zone: y = 0-125
- Hero-book zone: y = 120-330
- Card/deck focus zone: y = 360-650
- Polly Hunt visit lane: y = 644-844
- Polly primary entrance/perch side: x = 0-205 in bottom lane
- Reject/right-swipe motion side must remain visually uncluttered enough to preserve card readability.

These are design anchors, not new gameplay hitboxes.

## Hero Book Redesign

### Proportion

- Preserve current playable horizontal width.
- Do **not** widen the book.
- Increase the vertical silhouette so it reads more like a substantial book/bookmark-shaped object and less like a wide plaque.
- Initial precision target: approximately 244-250 logical px tall, subject to runtime clearance verification.
- Preserve the existing hinge relationship and opening motion.

### Materials

Use the existing POLYWORDS family:

- deep aubergine / indigo leather
- subtle warm-violet surface variation
- layered cream/tan page block
- aged warm-gold trim and corner hardware
- restrained bevel highlights
- soft modeled shadows rather than hard vector outlines

Gold must read as material/foil/brass, not neon yellow.

### Tooling

Use sparse ornamental tooling around the edges rather than filling the cover with decoration. The hero word remains dominant.

### Bookmark ribbon

The ribbon is explicitly **not centered**.

- Place it off-center, preferably toward the viewer's right side of the page block unless the visual preview proves left-side placement balances better.
- It should emerge naturally from between the pages.
- It should read as one cloth bookmark ribbon with a folded/notched end.
- It must not resemble a snake tongue, forked tongue, decorative tail, or symmetrical split shape.
- Use a subtle bend/fold and small cloth-width variation so it feels like fabric.
- Ribbon color should be warm gold/ochre in the POLYWORDS reward family, subdued enough not to compete with the hero word.
- The ribbon must remain visible below the book and must not clip during cover motion or book slide.

## Shared Surface / Grounding Plane

The book and cards must appear to rest on a common environment rather than float over a background.

Create a broad, dark, softly modeled archive surface or dais that begins behind/under the hero book and continues beneath the card stack.

Characteristics:

- same painted/illustrated language as the book/cards
- low-contrast aubergine/charcoal material
- subtle warm edge catches and violet reflected light
- shallow perspective cues
- very low texture density beneath text-heavy gameplay zones
- soft contact shadows directly beneath the book and card stack
- no giant cartoon flagstones
- no thick black outlines
- no obvious tabletop front edge that would visually wall off Polly

The grounding plane should taper/dissolve into the chamber toward the bottom so Polly can enter through the lower-left lane without looking like she is flying through furniture.

## Archive Chamber Background

### General form

Replace the current flat graphic ground / obvious starfield identity with one coherent illustrated chamber.

Suggested structure:

- deep central alcove behind hero book
- softly modeled side arches or shelving masses near left/right edges
- recessed book silhouettes or vertical architectural rhythms at very low contrast
- dark ceiling/upper wall without a prominent moon
- sparse tiny magical dust/ambient points only if they do not reintroduce a starfield look
- restrained violet ambient light
- small warm-gold reflected accents near material edges

The center of the screen must be the quietest area.

### Detail falloff

Background detail should increase toward the side edges and fall away behind:

- hero word
- book intake area
- active card phrase
- Polly speech bubble

No high-contrast architectural seam may run directly behind the hero word or card copy.

## Polly Motion Lane

Current Hunt behavior places Polly on the bottom-left with a 260x260 image inside a 200px-high root lane; her speech bubble extends to the right.

The background must preserve this lane.

Requirements:

- bottom-left remains low-detail and low-contrast
- no torch, pillar, bookshelf edge, bright trim, or surface front edge behind Polly's face/body
- no high-contrast object behind the speech bubble area
- the visual surface beneath the cards must fade before it becomes a barrier through Polly's flight arc
- Polly should look like she enters the same chamber, not a separate overlay zone

Green remains reserved for Polly and must not be used as environmental accent lighting.

## Card Integration

The existing card artwork remains the primary card face unless a later dedicated card-redesign pass is explicitly approved.

For this pass:

- background lighting should echo the card highlights and rim treatment
- card contact shadows should visually connect to the grounding plane
- surrounding values must remain darker/quieter than card copy
- no environmental gold stripe should align so closely with card borders that the silhouettes merge

## Lighting Model

Use one coherent scene-lighting assumption:

- cool violet/indigo ambient fill from the chamber
- restrained warm-gold directional highlights on raised leather/metal edges
- darkest values at outer corners and behind noninteractive environment masses
- modest reflected light around the book/card surface

The book/cards must still be clearly brighter and more materially resolved than the environment.

## SVG Precision Rules

Follow `.agents/skills/svg-precision-skill/SKILL.md`:

1. Build from explicit scene specs.
2. Set width, height, and viewBox explicitly.
3. Prefer absolute coordinates and stable simple geometry.
4. Avoid fragile text inside precision SVGs.
5. Avoid exotic filters unless necessary and proven.
6. Validate generated SVGs.
7. Render PNG previews for visual review.

The SVG background should use gradients, large paths, rounded architectural shapes, and restrained texture geometry rather than hundreds of tiny decorative elements.

## Implementation Boundaries

Allowed in this pass:

- new Hunt background SVG/component/assets
- replacement hero-book rig artwork/assets
- hero-book visual dimension constants required by new vertical proportion
- visual placement adjustments required to preserve existing spacing
- grounding/contact-shadow treatment
- ambient tuning needed for the new chamber world

Not allowed in this pass:

- changing swipe thresholds or directions
- changing scoring or content
- changing game progression
- redesigning Polly
- redesigning the HUD
- redesigning mask-card mechanics
- redesigning Vault/Home/Settings
- changing Boss mechanics
- unrelated refactors

## Acceptance Criteria

1. In a resting Hunt state, the book and cards appear to belong physically to the same environment.
2. The background clearly grounds/displays the book and cards without becoming the focal point.
3. The hero book is visibly taller top-to-bottom without becoming wider.
4. The bookmark ribbon is off-center, clearly fabric-like, and cannot be mistaken for a snake/forked tongue.
5. Book/card shadows and reflected light make them feel seated on the chamber surface.
6. During active swipes, the card remains legible and does not visually merge with the environment.
7. During the book intake/opening motion, the book silhouette remains readable.
8. Polly's bottom-left entrance, perch, reaction motion, and speech bubble remain visually clean.
9. No green environmental accents compete with Polly.
10. Normal Hunt and Boss states remain mechanically unchanged.
11. SVG assets pass the precision validator.
12. Rendered preview passes visual review before runtime integration.
13. iPhone portrait runtime test shows no clipping, collision, or ribbon loss.
14. Android/iPhone cover rendering remains compatible with the existing HeroBook animation safeguards.

## Verification Sequence

1. Produce fixed 390x844 scene spec.
2. Build background SVG and hero-book visual assets.
3. Validate SVG structure.
4. Render preview with representative book/card positions and Polly-lane overlay guides.
5. Review visual hierarchy at full size and thumbnail size.
6. Integrate approved assets into existing components.
7. Run TypeScript checks and repository validation.
8. Test on device through a normal Hunt round:
   - book entry
   - active card idle/lift/swipe
   - correct/wrong feedback
   - intake/opening motion
   - Polly visit in/out
   - Boss transition
9. Compare screenshots/recording against the acceptance criteria.

## Product Priority

Single highest-value next step: produce and review the dynamic-composition SVG preview before touching gameplay code.

Next three actions:

1. Build the 390x844 precision scene and taller book geometry.
2. Render/validate a visual preview including card positions and Polly-safe lane.
3. Integrate only after that preview is approved.

Do not work on other visual subsystems until this pass establishes a coherent Hunt world.
