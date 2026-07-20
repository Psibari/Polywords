# POLYWORDS Golden Pacing System

This document governs Hunt placement and emotional rhythm. It does not govern tile writing;
that belongs exclusively to `docs/CONTENT_WRITING_STANDARD.md`.

## Core Rules

- Content first, placement second. Approve meanings, REALS, and traps before tagging phase.
- Hidden Truth: no ordinary tile may reveal REAL/trap, rarity, importance, or reward status
  before commitment.
- Semantic Snap: each Hunt should repeatedly shift the player between familiar contexts.
- One strong pivot per word is better than several weak obscurities.
- Difficulty rises through semantic distance and trap sharpness, not merely word count.
- Rotate trap families and semantic settings; avoid repeating the same trick.

## Live Hunt Arc

| Rounds | Phase | Job |
| --- | --- | --- |
| 1–2 | Confidence | quick, fair recognition |
| 3–4 | Flow | broader context switches |
| 5–7 | Tension | sharper traps and pivots |
| 8–9 | Panic | hard but defensible choices |
| 10 | Boss | maximum authored confrontation |

The implementation profile is `2 Confidence + 2 Flow + 3 Tension + 2 Panic + 1 Boss`.
Round 8 may become a Returning Haunt without receiving boss presentation. Round 10 always
remains Polly’s Word.

## Placement Metadata

Future/manual tagging may describe:

- familiarity and semantic distance;
- Snap strength;
- trap sharpness and family;
- phase eligibility;
- discovery/hidden suitability;
- prior exposure for replay rotation.

Metadata describes an already-approved bank. It must never make a writer flatten, inflate,
shorten, obscure, or otherwise rewrite a tile for a target round.

## Selection Priorities

1. semantic legality and fairness;
2. Hidden Truth parity;
3. phase eligibility;
4. context variety and Snap rhythm;
5. unseen or least-seen variants.

Boss-hidden material must be rare-but-fair and sourced. Returning Haunts take priority at
their reserved slot; mastered words remain out of the standard pool.

## Implementation Boundary

The arc table and phase plan are live in `app/game/huntGenerator.ts`. Do not add new pacing
schema, automated content generation, or production selection logic until a manually tagged
test set is approved through an explicit task.
