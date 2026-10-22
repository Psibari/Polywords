# POLYWORDS Daily Challenge Content Writing Standard

## Authority and Scope

This document is the sole in-repository editorial authority for writing, reviewing, auditing,
importing, and selecting Daily Challenge content.

- `docs/DAILY_CHALLENGE_SPEC.md` governs Daily gameplay and presentation rules.
- `docs/CONTENT_WRITING_STANDARD.md` governs Hunt content only. Do not mix Hunt's disguise,
  REAL, trap, or hidden-pair rules into Daily.

## Source Discipline

- Locked legacy workbook:
  `workbooks/POLYWORDS_Daily_Challenge_60_LOCKED_2026-08-28.xlsx`
- Runtime legacy pool: `app/game/dailyPool.ts`
- Approved six-card expansion: `app/game/dailyPoolExpansion.ts`
- The approved source wording is the authoring truth. Runtime files are playable representations.
- When memory, chat history, runtime, and locked source material disagree about approved wording
  or status, inspect the current locked source rather than guessing.

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
3. Draft three clear, natural clues, one for each meaning.
4. Build the actual six-card puzzle: the target exactly once plus five distractors.
5. Make the distractors do the difficulty work. Each clue should honestly tempt at least one
   wrong card whenever possible, while only the target survives all three clues.
6. Work interactively and preserve every line Pete locks.
7. Order the clues hardest to easiest when that improves the progression.
8. Audit the complete three-clue/six-card puzzle.
9. Lock only after explicit approval.
10. Update runtime/source material only from approved wording.

## Clue Standard

- Daily is a staged ambiguity and convergence game, not Hunt disguise writing.
- Daily clues should be straightforward, concise, natural descriptions of genuine meanings.
- The challenge should come primarily from the answer-card traps, not from making the clue
  unnecessarily clever or obscure.
- Use a different meaning for each clue.
- Prefer the shortest wording that remains natural, fair, and precise. Do not add modifiers that
  merely explain what the cards can make the player work out.
- Do not make Daily clues artificially obscure merely to imitate Hunt disguise.

## Universal No-Leakage Rule

- No answer-card word may appear in any clue for that puzzle. This applies to the target and all
  five distractors.
- Singular/plural changes do not excuse leakage.
- Reject obvious revealing inflections, derivatives, compounds, and morphological variants of
  the target when they give the answer away.
- Any deliberate exception requires Pete's explicit approval. Record it narrowly; never weaken
  the general rule to accommodate one exception.

## Six-Card Puzzle

Each newly approved Daily puzzle contains exactly six unique answer cards: the target exactly
once and five distractors. These are the actual six cards the player sees; do not author a larger
hidden distractor pool for new Daily content.

Legacy locked entries may still carry nine source candidates. The runtime supports those entries
for backward compatibility and deterministically presents six. New content uses the six-card
format.

Distractors:

- are the primary source of Daily difficulty
- should honestly tempt the player from one or more individual clues
- spread temptation across the three clue meanings
- fail the full three-clue convergence
- do not create a second defensible complete answer
- are recognizable American-English words
- do not need to be polysemous or come from the POLYWORDS master headword database
- do not rely on cheap morphology or spelling gimmicks

## Cross-Contamination

Audit the entire three-clue, six-card set.

- No card word may appear in any clue.
- Do not let one clue accidentally reveal another clue's answer relationship.
- Avoid distinctive wording, scenes, subjects, or recognition surfaces that mechanically expose
  the target or a distractor.
- A distractor may attack the same semantic neighborhood as a clue through different language.
- Ordinary connective or common language is not contamination.
- Cross-reference distinctive wording and scenes against the wider locked POLYWORDS corpus when
  available, but do not mechanically ban ordinary semantic overlap.

## Fairness Audit Before Lock

Verify:

1. Exactly three distinct meanings.
2. All three are recognizable enough for Daily.
3. Each clue sounds human and is no more elaborate than necessary.
4. Each clue represents a different meaning.
5. There is no target/headword leakage.
6. No distractor word appears in any clue.
7. There are exactly six unique answer cards for new content.
8. The target appears exactly once.
9. Every distractor has an honest temptation reason.
10. Every distractor fails the full clue set.
11. There is no second defensible answer.
12. There is no material clue/grid cross-contamination.
13. Locked wording has been preserved exactly.
14. Any exception is explicit, narrow, recorded, and improves gameplay.

## Locking

- Only explicit Pete approval locks content.
- “Lock it,” “lock it next,” “passes,” “agreed,” and explicit batch approval preserve exactly the
  approved wording in context.
- Never silently rewrite locked clues or grid words.
- Intentional easier clues or gimmes are allowed when deliberately used for pacing or confidence.
