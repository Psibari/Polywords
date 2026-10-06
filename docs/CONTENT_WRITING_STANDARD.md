# POLYWORDS Content Writing Standard

Sole in-repo authority for Hunt meaning research, REALS, traps, hidden content and editorial
approval. `docs/CONTENT_PHILOSOPHY.md` states the intended feeling.

## Data Boundary

- Base live Hunt bank: `assets/data/huntData.json`.
- Runtime may apply explicit reviewed audit/metadata overrides in `huntGenerator.ts`; the
  effective runtime content is the base bank after those overrides and validation.
- Editorial workbooks are staging. Approval never changes runtime automatically.
- Runtime promotion is explicit and verified. Stable word/mask/hidden-pair IDs are persistence
  contracts; never casually renumber approved live content.
- Structural validation must catch malformed difficulty/gpsTag, IDs, REAL/trap flags and Boss
  hidden content. It does not replace human editorial approval.
- `assets/data/huntData.v2.json` and `_deprecated/mask-rewriter` are retired.
- Daily is separately governed; this standard does not apply to Daily clues/grids.

Never polish legacy wording into canon. Rebuild a word from a fresh American-English meaning
audit.

## Required Workflow

1. Research the full meaning ledger from named sources and URLs.
2. Classify senses as `core_real`, `cultural_handle`, `boss_bonus`, or `reject_hold`.
3. Merge duplicate senses; reject British-only, dusty, specialist, weak or unfair senses.
4. Get human approval of playable meanings and their memory surfaces.
5. Draft REALS from approved meanings only; preserve every line Pete locks.
6. After REALS stabilize, build one independent word-level trap pool.
7. Audit legality, ownership, angle variety, cross-contamination and workbook originality.
8. Obtain explicit word approval. Conversation drafts are never approval.
9. Assign difficulty/gpsTag only after content is approved, then promote to runtime with stable IDs
   and run the structural/runtime verification gate.

If the canonical workbook is unavailable, label work `PROVISIONAL`; do not claim originality or
database comparison passed.

## Tile Law

- Contemporary American English; player-facing tile text is uppercase.
- No word-count cap. Use the shortest natural line that preserves recognition and fairness.
- Never include the headword, inflection, compound, derivative or giveaway root.
- Create productive hesitation, not confusion. Sound like life, not a dictionary or writer.
- Each tile needs a distinct scene, subject, sentence shape and recognition angle.
- REALS and traps need comparable tone, specificity and polish so truth stays hidden.
- Do not reuse distinctive words, scenes, objects or memory snaps between one word's REALS and
  traps. Check distinctive wording against the full workbook across headwords.
- Crossword-tight precision is welcome; obscurity, abbreviations, trivia and wordplay are not.

## REALS

A REAL represents a genuine sourced approved meaning. It must be true, familiar after reveal,
natural, and indirect enough to make the brain reach. Write from the strongest ordinary-life
memory: scene, action, sound, saying, object or ritual.

Multiple approved REALS may represent the same distinct meaning when they are genuinely different,
strong recognition angles worth rotating. Do not manufacture separate meanings from mere phrases
or collocations.

Reject definitions, synonyms, nearby objects, results, associations, combined senses and clever
lines that point beside the meaning.

## Traps

A trap is tempting but legally wrong.

- Build one independent pool for the whole headword, not one mirror per REAL.
- Every trap must tempt the exact headword while having one clear true-owner word.
- Explain why it tempts and why it loses. If defensible as a real meaning, promote, hold or remove.
- Avoid random, ridiculous, mechanically opposite or sound-alike bait unless the confusion is
  familiar and fair.
- A strong trap may be removed without replacement when the remaining pool is sufficient. Do not
  keep weak bait merely to satisfy symmetry.

## Hidden Content and Placement

Hidden meanings are rare-but-fair Boss/reward material, never a dumping ground. Strong ordinary
meanings stay visible. Approve content before assigning `gpsTag`, difficulty, phase or tile budget;
placement describes content and never rewrites it.

Every runtime word must have a valid difficulty and GPS classification so approved content cannot
sit outside the generator's selectable pools. Boss classification also requires valid hidden
content. Runtime reachability is a data-integrity requirement, not an editorial preference.

## Approval Gate

A tile passes only when all are true:

- stable ID, uppercase, no headword leak;
- sourced, distinct, contemporary, natural, recognizable and legally accurate;
- masks rather than defines; hesitation without confusion;
- unique recognition angle with no intra-word REAL/trap contamination;
- originality checked against the full workbook;
- trap has one convincing true owner and cannot be defended as a real sense;
- REAL/trap presentation preserves Hidden Truth;
- the word produces a meaningful context switch;
- approved runtime package has valid difficulty/gpsTag and survives structural validation.

Fairness beats cleverness. The player should think “I should have known that,” never
“How was I supposed to know that?”
