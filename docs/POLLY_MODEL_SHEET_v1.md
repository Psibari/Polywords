# POLLY Model Sheet v1

## Status
LOCKED working standard for the new POLYWORDS Polly animation system.

## Canonical source
- Source: `polly_master_v2..png`
- Canvas: **1038 × 1515px**
- Transparent RGBA
- This perched master is the visual authority for Polly's neutral/perched identity.

## Non-negotiable normalization rules
1. Every derived perched rig asset stays on the exact **1038 × 1515px** canvas.
2. Never trim transparent pixels.
3. Never auto-crop exports.
4. Never independently rescale individual parts.
5. Neutral reassembly must reproduce the master silhouette and apparent scale.
6. Feet/branch registration is a locked anchor.
7. Crown/head/beak/eye proportions are identity-critical and may not drift.
8. Flight and extreme-reaction art must be normalized against this model sheet before production use.

## Canonical landmarks
- Alpha bounds: x=0..985, y=10..1515
- Visual centerline: **x=519**
- Branch top: **y=1108**
- Branch centerline: **y=1172**
- Branch bottom: **y=1236**
- Branch horizontal working extent: x=55..929

## Reference boxes
These are normalization boxes, not crop boxes.

- Crown: x=242..714, y=10..386
- Head: x=247..882, y=271..713
- Torso: x=176..829, y=611..1107
- Feet: x=328..706, y=1044..1228
- Tail: x=91..521, y=1195..1515

## Perched-puppet scope
Build only the minimum articulation needed to prove life:
- head
- crown
- brow
- eye white
- pupil
- upper lid / blink
- upper beak
- lower beak
- near wing
- far wing only if needed
- tail
- body base
- feet/branch remain stable in the first proof

## First proof animation
The first proof is deliberately small:
1. Neutral hold
2. Blink
3. Tiny pupil glance
4. 2–4° head cock
5. Crown follows with slight delayed settle
6. Return to exact neutral

No whole-image rocking. No branch drift. No apparent rescaling.

## Pass / fail
PASS only if:
- a still frame is visually indistinguishable from the master,
- feet remain registered to the branch,
- head/crown motion exposes no seams,
- no part changes scale,
- the neutral pose returns exactly,
- the asset can be reused by both Hunt and Daily.

## Next production gate
After this perched proof passes:
- build the four normalized flight keys F1/F2/F3/F4,
- normalize them against this model sheet,
- reject any key with head/body/crown/beak identity drift.
