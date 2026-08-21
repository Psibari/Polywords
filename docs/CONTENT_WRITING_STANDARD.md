# POLYWORDS Content Writing Standard

This is the sole authority for meaning research, REAL masks, traps, hidden meanings, and
editorial approval. `docs/CONTENT_PHILOSOPHY.md` explains the intended feeling.

## Data Boundary

- `assets/data/huntData.json` is the real shipped content and the source of truth for
  what's live — not a placeholder/test corpus (superseded that status 2026-08-07). It is
  authoritative over the workbook and any build script wherever they differ.
- `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` is the tracked editorial staging ground —
  where new words get drafted and approved before they exist in the live game.
- `assets/data/huntData.v2.json` is retired (schema shell only, 0 words) — not an active
  export target.
- Workbook approval never changes live JSON automatically; bringing approved words into
  `huntData.json` is a separate, explicit, purely-additive merge task
  (`tools/content/merge-workbook-additions.mjs`) that never touches an existing word's
  masks or hidden pairs.
- Verify workbook status before selecting the next word to draft; verify live JSON before
  stating anything about what's currently shipped.

Never polish legacy masks as canon. Rebuild each word from a fresh American-English meaning
audit.

## Required Workflow

1. Research the full American-English meaning ledger from named sources and URLs.
2. Classify each sense as `core_real`, `cultural_handle`, `boss_bonus`, or `reject_hold`.
3. Reject British-only, dusty, specialist, duplicate, weak, and unfair senses.
4. Get human approval of the playable meaning inventory.
5. Present the human handle or memory surface for each approved meaning.
6. Draft recognition-first REALS only from the approved senses and strongest approved angles.
7. Work interactively, preserving every line Pete locks and redirecting only the line under discussion.
8. After the REAL set is stable, build one independent word-level trap pool.
9. Run headword, ownership, angle-diversity, REAL/trap cross-contamination, and full-workbook originality checks.
10. Run the complete audit and obtain word approval.

Definitions establish legality; human handles make the game playable. Work one headword at
a time, preserve locked wording, and never turn conversation drafts into approved content.
If the current canonical workbook is unavailable, label the writing `PROVISIONAL`; do not
claim the database comparison passed or lock the tiles.

## Tile Law

- Contemporary American English only.
- Uppercase player-facing text.
- There is no maximum word count for REAL masks or TRAP cards. Eight words is not a cap.
- Use as many words as the memory snap needs to remain natural, fair, specific, and recognizable. Shorten only when nothing important is lost.
- Borrow the precision of a well-made crossword clue: approach the memory indirectly, make every word earn its place, and make the connection feel exact after recognition.
- Do not import crossword obscurity, abbreviations, specialist trivia, or complicated wordplay.
- Never include the headword, an inflection, compound, derivative, or obvious giveaway root. This rule is constitutional and non-waivable.
- Create productive hesitation, not confusion.
- Sound like a person, memory, phrase, or recognizable moment—not a dictionary label.
- Avoid abstract, poetic, cute, writerly, or fake object-acting language.
- REALS and traps must have comparable tone, length, and specificity so truth stays hidden.
- Give every tile on one headword a meaningfully different recognition angle.
- Do not recycle one subject, scene, sentence frame, object, or memory snap across the card.
- Enforce zero intra-word REAL/trap cross-contamination for distinctive content words, phrasing, subjects, scenes, objects, and memory snaps. Ordinary connective words do not count.
- Cross-reference distinctive wording and recognition scenes against the full current canonical workbook; avoid recognizable recycling across headwords whenever a natural alternative exists.

## REALS

A REAL represents exactly one distinct, sourced, approved playable meaning. It must be
legally true, familiar after reveal, natural, and indirect enough to make the brain reach.
Write from the strongest memory snap—the scene, action, sound, saying, object, ritual, or
moment where that meaning lives in ordinary life.

Good handles:

- ADDRESS — `GPS DESTINATION`
- ARMS — `RIGHT TO BEAR THEM`
- BALL — `CINDERELLA'S MIDNIGHT DANCE`
- BELT — `ONE MORE NOTCH AFTER DINNER`

Too direct: `A SURFER RIDES IT`. Better: `SURFER'S PERFECT RIDE`.

Reject definitions, synonyms, nearby objects, results, associations, combined senses,
forced mini-scenes, and clever lines that point beside the meaning rather than at it.

## Traps

A trap is a guilty-close, legally wrong non-meaning. It should activate a semantic neighbor
without being defensible as a real sense.

- Draft one independent pool for the headword as a whole, not one mirrored trap per REAL.
- Do not dress traps in a REAL's scene or build a mechanical set of opposites or negations.
- Every trap must tempt the exact headword, be untrue of that headword, and have one clear true-owner word.
- The true owner must feel immediately correct when substituted or revealed.
- Explain why each trap tempts and why it is legally wrong.
- If a trap is a genuine meaning, promote, hold, or remove it.
- Avoid random bait and sound-alike bait unless it is a fair, recognized confusion.

Useful trap families: neighbor, scene, tool, result, phrase, almost-synonym, sequence,
category, family, and rare fair sound-confusion.

## Hidden Meanings and Placement

Hidden meanings are boss/reward material, not a dumping ground. They must be surprising,
fair, sourced, and recognizable after reveal. Strong ordinary meanings belong in the visible
REAL layer.

Write and approve content before assigning pacing. `gpsTag`, round, phase, and tile budgets
must never dictate wording. Placement metadata describes approved content; it does not create
it.

## Mandatory Audit

A tile fails if any answer below is no:

1. Uppercase with a stable ID?
2. No headword, inflection, compound, derivative, or giveaway root?
3. Natural contemporary American English?
4. Masks rather than defines?
5. Hesitation without confusion?
6. Human and recognizable rather than abstract or writerly?
7. No fake object acting?
8. Every REAL maps to one distinct sourced, approved playable meaning?
9. Does every tile use a meaningfully different recognition angle?
10. Is there zero distinctive REAL/trap cross-contamination?
11. Has wording and memory-snap originality been checked against the full current workbook?
12. Is the line crossword-tight without sacrificing naturalness or fairness?
13. Is its length justified by recognition rather than an arbitrary number?
14. Every trap is tempting but legally wrong?
15. Does every trap have one clear true owner that passes substitution?
16. Could no fair player defend the trap as a real meaning?
17. REAL/trap wording has Hidden Truth parity?
18. At least one meaning creates a meaningful context switch—the Semantic Snap?

Fairness beats cleverness. A player should think “I should have known that,” never “How was
I supposed to know that?”
