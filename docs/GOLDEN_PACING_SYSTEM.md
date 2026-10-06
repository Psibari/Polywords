# POLYWORDS Golden Pacing System

Governs Hunt placement and emotional rhythm. Tile writing belongs to
`docs/CONTENT_WRITING_STANDARD.md`; executable selection belongs to `app/game/huntGenerator.ts`.

## Rules

- Approve meanings, REALS and traps before assigning phase.
- Every runtime word needs a valid `gpsTag`: `confidence`, `flow`, `tension`, `panic`, or `boss`.
  Missing/invalid tags are structural failures, never permission to silently bypass content.
- Every runtime word also needs valid `easy | medium | hard` difficulty for adaptive ordering.
- Difficulty rises through semantic distance and trap sharpness, not arbitrary word count.
- Preserve Hidden Truth: placement metadata never leaks truth or importance before a swipe.
- Rotate settings, trap families and context shifts. One strong pivot beats several weak ones.

## Arc

| Arc | Confidence | Flow | Tension | Panic | Boss |
| --- | ---: | ---: | ---: | ---: | ---: |
| Standard (10) | 2 | 2 | 3 | 2 | 1 |
| Fledgling (8) | 2 | 2 | 2 | 1 | 1 |

Polly's Word is always final. A Returning Haunt uses round 5 standard / round 4 fledgling, is
forced to adrenaline/heavy feedback, and is followed by a Flow beat when possible so two peaks do
not stack. It never receives Boss presentation.

## Selection Priority

1. semantic legality and fairness;
2. neutral pre-commitment treatment;
3. valid phase eligibility;
4. context and trap-family variety;
5. unseen or least-recently-seen material.

The generator uses adjacent/cross-pool fallbacks when a preferred phase pool cannot fill a slot;
this prevents uneven editorial pool sizes or heavy mastery from crashing a Hunt. Fallbacks may
soften phase purity but must not make properly tagged content unreachable.

Boss-hidden content must be rare-but-fair and sourced. Returning Haunts take their reserved slot;
mastered words remain eligible only for ordinary tension/panic revisits, never Boss or Returning
Haunt placement. The generator marks those revisits so presentation can acknowledge them without
leaking their status before commitment.

Do not add pacing schema or automated content rewriting without an approved task.
