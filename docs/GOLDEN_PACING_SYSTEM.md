# POLYWORDS Golden Pacing System

This file governs Hunt placement and emotional rhythm. Tile writing belongs only to
`docs/CONTENT_WRITING_STANDARD.md`.

## Rules

- Approve meanings, REALS, and traps before assigning phase.
- Difficulty rises through semantic distance and trap sharpness, not arbitrary word count.
- Preserve Hidden Truth: placement metadata never leaks truth or importance before a swipe.
- Rotate settings, trap families, and context shifts. One strong pivot beats several weak ones.

## Arc

| Arc | Confidence | Flow | Tension | Panic | Boss |
| --- | ---: | ---: | ---: | ---: | ---: |
| Standard (10) | 2 | 2 | 3 | 2 | 1 |
| Fledgling (8) | 2 | 2 | 2 | 1 | 1 |

Polly's Word is always final. A Returning Haunt uses round 5 standard / round 4 fledgling,
is forced to adrenaline/heavy feedback, and is followed by a Flow beat so two peaks do not
stack. It never receives boss presentation.

## Selection Priority

1. semantic legality and fairness;
2. neutral pre-commitment treatment;
3. phase eligibility;
4. context and trap-family variety;
5. unseen or least-recently-seen material.

Boss-hidden content must be rare-but-fair and sourced. Returning Haunts take their reserved
slot; mastered words remain out of the standard pool.

`app/game/huntGenerator.ts` owns the executable phase plan and fallbacks. Do not add pacing
schema or automated content rewriting without an approved task.
