# POLYWORDS Daily Challenge Content Writing Standard

## Authority and Scope

This document is the sole in-repository editorial authority for writing, reviewing, auditing,
importing, and selecting Daily Challenge content.

- `docs/DAILY_CHALLENGE_SPEC.md` governs Daily gameplay and presentation rules.
- `docs/CONTENT_WRITING_STANDARD.md` governs Hunt content only. Do not mix Hunt's disguise,
  REAL, trap, or hidden-pair rules into Daily.

## Source Discipline

- Canonical authoring workbook:
  `workbooks/POLYWORDS_Daily_Challenge_60_LOCKED_2026-08-28.xlsx`
- Runtime representation: `app/game/dailyPool.ts`
- The workbook is the authoring truth. Runtime is an exported representation.
- When memory, chat history, runtime, and the current locked workbook disagree about approved
  source wording or status, inspect the canonical workbook rather than guessing.

## Meaning Gate

1. Write for American English.
2. Audit authoritative dictionary definitions before drafting.
3. Merge duplicate or overlapping senses.
4. Separate true meanings from phrases, collocations, examples, associations, and grammatical
   restatements.
5. Require exactly three genuinely distinct, broadly recognizable meanings for every Daily
   target.
6. If only two strong meanings exist, reject the target rather than inventing or stretching a
   third.

`SENTENCE` is the controlling precedent for this rejection rule.

## Interactive Writing Order

For a new Daily target:

1. Complete the definitions and meaning audit.
2. Select the three meanings.
3. Identify the human handles and recognition surfaces.
4. Draft the three clues.
5. Work interactively and preserve every line Pete locks.
6. Order the clues hardest to easiest.
7. Once the clues are stable, build the nine-word source grid.
8. Audit the complete clue/grid set.
9. Lock only after explicit approval.
10. Update the canonical workbook only from approved wording.

## Clue Standard

- Daily clues are more direct than Hunt REAL writing, but still target recognition memory rather
  than dictionary prose.
- Use familiar situations, objects, actions, roles, sayings, and everyday knowledge.
- Use a different recognition surface for each clue.
- Order the clues hardest, middle, easiest.
- There is no hard word-count cap. Prefer brevity only when it is equally natural, fair, and
  precise.
- Do not make Daily clues artificially obscure merely to imitate Hunt disguise.

## Headword Rule

- The target may not appear inside a clue.
- Reject obvious revealing inflections, derivatives, compounds, and morphological variants.
- Any deliberate exception requires Pete's explicit approval. Record it narrowly; never weaken
  the general rule to accommodate one exception.

## Nine-Word Source Grid

Each approved source entry contains exactly nine unique candidate words: the target exactly once
and eight distractors. The runtime may deterministically present the target plus five distractors
in an actual round, but editorial approval applies to all nine source candidates.

Build distractors for the target and puzzle as a whole. Distractors:

- are not rigidly paired one-to-one with clues
- spread temptation across the three clue domains
- are plausible from at least one clue or semantic neighborhood
- fail the full three-clue convergence
- do not create a second defensible complete answer
- are recognizable American-English words
- do not need to be polysemous or come from the POLYWORDS master headword database
- do not rely on cheap morphology or spelling gimmicks

## Cross-Contamination

Audit the entire three-clue, nine-word set. Do not reuse distinctive clue wording, phrases,
subjects, scenes, objects, or memory snaps when reuse telegraphs the answer, copies a recognition
trigger, or makes a distractor mechanically obvious.

- Do not let one clue reuse another clue's recognition surface.
- A distractor may attack the same semantic neighborhood as a clue through different language.
- Ordinary connective or common language is not contamination.
- Cross-reference distinctive wording, scenes, subjects, and memory snaps against the current
  canonical Daily workbook and the wider locked POLYWORDS corpus when available.
- Avoid recognizable recycling whenever a natural alternative exists, but do not mechanically
  ban ordinary semantic overlap.

## Fairness Audit Before Lock

Verify:

1. Exactly three distinct meanings.
2. All three are recognizable enough for Daily.
3. Clues are ordered hardest to easiest.
4. Each clue sounds human.
5. Each clue represents a different meaning.
6. There is no target/headword leakage.
7. There are exactly nine unique candidates.
8. The target appears exactly once.
9. Every distractor has an honest temptation reason.
10. Every distractor fails the full clue set.
11. There is no second defensible answer.
12. There is no material clue/grid cross-contamination.
13. The canonical workbook cross-reference is complete.
14. Any exception is explicit, narrow, recorded, and improves gameplay.

## Locking

- Only explicit Pete approval locks content.
- “Lock it,” “lock it next,” and explicit batch approval preserve exactly the approved wording.
- Never silently rewrite locked clues or grid words.
- Intentional easier clues or gimmes are allowed when deliberately used for pacing or confidence.
