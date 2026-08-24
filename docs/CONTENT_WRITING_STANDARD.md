# POLYWORDS Content Writing Standard

This is the sole in-repo authority for Hunt meaning research, REALS, traps, hidden content,
and editorial approval. `docs/CONTENT_PHILOSOPHY.md` states the intended feeling.

## Data Boundary

- Live Hunt content: `assets/data/huntData.json`. It outranks workbook and tool output.
- Editorial staging: `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx`. Approval never changes
  runtime automatically.
- Runtime promotion is an explicit, verified, additive merge. Stable word/mask IDs are
  persistence contracts; never rewrite existing entries during an addition.
- `assets/data/huntData.v2.json` and `_deprecated/mask-rewriter` are retired.
- Daily's approved pool is separately governed; this Hunt standard does not govern it.

Never polish legacy wording into canon. Rebuild a word from a fresh American-English meaning
audit.

## Required Workflow

1. Research the full meaning ledger from named sources and URLs.
2. Classify senses as `core_real`, `cultural_handle`, `boss_bonus`, or `reject_hold`.
3. Merge duplicates and reject British-only, dusty, specialist, weak, or unfair senses.
4. Get human approval of the playable meanings and their memory surfaces.
5. Draft REALS from approved meanings only; preserve every line Pete locks.
6. After REALS stabilize, build one independent word-level trap pool.
7. Audit legality, ownership, angle variety, cross-contamination, and workbook originality.
8. Obtain explicit word approval. Conversation drafts are never approval.

If the canonical workbook is unavailable, label work `PROVISIONAL`; do not claim originality
or database comparison passed.

## Tile Law

- Contemporary American English; player-facing tile text is uppercase.
- No word-count cap. Use the shortest natural line that preserves recognition and fairness.
- Never include the headword, inflection, compound, derivative, or giveaway root.
- Create productive hesitation, not confusion. Sound like life, not a dictionary or writer.
- Each tile needs a distinct scene, subject, sentence shape, and recognition angle.
- REALS and traps need comparable tone, specificity, and polish so truth stays hidden.
- Do not reuse distinctive words, scenes, objects, or memory snaps between one word's REALS
  and traps. Check distinctive wording against the full workbook across headwords.
- Crossword-tight precision is welcome; obscurity, abbreviations, trivia, and wordplay are not.

## REALS

A REAL represents exactly one distinct, sourced, approved meaning. It must be true, familiar
after reveal, natural, and indirect enough to make the brain reach. Write from the strongest
ordinary-life memory: a scene, action, sound, saying, object, or ritual.

Reject definitions, synonyms, nearby objects, results, associations, combined senses, and
clever lines that point beside the meaning.

## Traps

A trap is tempting but legally wrong.

- Build one independent pool for the whole headword, not one mirror per REAL.
- Every trap must tempt the exact headword while having one clear true-owner word.
- Explain why it tempts and why it loses. If it is defensible as a real meaning, promote,
  hold, or remove it.
- Avoid random, ridiculous, mechanically opposite, or sound-alike bait unless the confusion
  is familiar and fair.

## Hidden Content and Placement

Hidden meanings are rare-but-fair boss/reward material, never a dumping ground. Strong
ordinary meanings stay visible. Approve content before assigning `gpsTag`, difficulty, phase,
or tile budget; placement describes content and never rewrites it.

## Approval Gate

A tile passes only when all are true:

- stable ID, uppercase, no headword leak;
- sourced, distinct, contemporary, natural, recognizable, and legally accurate;
- masks rather than defines; hesitation without confusion;
- unique recognition angle with no intra-word REAL/trap contamination;
- originality checked against the full workbook;
- trap has one convincing true owner and cannot be defended as a real sense;
- REAL/trap presentation preserves Hidden Truth;
- the word produces a meaningful context switch.

Fairness beats cleverness. The player should think “I should have known that,” never
“How was I supposed to know that?”
