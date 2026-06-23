# POLYWORDS Workflow

POLYWORDS moves fastest when every task has one lane, one target, and one clean exit.

## Source of Truth

Daily work should use:

- CLAUDE.md
- CONTEXT.md
- docs/WORKFLOW.md
- docs/CHANGELOG.md

CLAUDE.md is for permanent game laws.
CONTEXT.md is for current build state.
WORKFLOW.md is for how we work.
CHANGELOG.md is for completed patch history.

## Current Hunt Law

POLYWORDS standard Hunts are 10 rounds.

- Rounds 1-9 are normal Hunt words.
- Round 10 is POLLY'S WORD / boss word.
- Mastery and haunt outcomes are boss-only.
- Returning Haunt slot is Round 8 / index 7 in a 10-round Hunt.
- Returning Haunt never replaces Round 10.
- Default GPS arc: 2 Confidence + 2 Flow + 3 Tension + 2 Panic + 1 Boss.

## Work Lanes

Every task must belong to exactly one lane.

### Lane A: Design Approval

Used for:

- Home screen layout
- Play screen layout
- Polly placement
- Vault layout
- Daily Challenge layout

Rules:

- No code until the visual map is approved.
- Define screen zones first.
- Define hierarchy first.
- Define what the player sees first.
- If the player-facing layout changes, approval comes before implementation.

### Lane B: Gameplay System

Used for:

- scoring
- feathers / lives
- haunt words
- ghost words
- mastery
- daily rules
- run logic

Rules:

- No visual redesign.
- No font changes.
- No layout polish.
- No unrelated cleanup.

### Lane C: Visual Polish

Used for:

- spacing
- colors
- card treatment
- fonts
- animation feel
- premium UI treatment

Rules:

- No scoring changes.
- No engine changes.
- No hunt data changes.
- No navigation changes unless explicitly approved.

### Lane D: Content

Used for:

- masks
- traps
- huntData
- word pools
- GPS tagging
- content audits

Rules:

- No app code changes.
- No gameplay system changes.
- No UI changes.

### Lane E: Bugfix

Used for:

- one broken behavior
- one runtime error
- one visual regression
- one TypeScript error

Rules:

- Smallest possible patch.
- No "while I am here" changes.
- If the fix needs extra files, stop and explain before editing.

### Lane F: Docs / Tooling

Used for:

- docs updates
- workflow rules
- CI
- repo hygiene
- changelog maintenance

Rules:

- No gameplay code.
- No UI code.
- No content rewrites.

## Visual Approval Gate

For visual work, the order is locked:

1. Create static layout map.
2. Get approval.
3. Code only the approved map.
4. Run typecheck.
5. Device sanity test.
6. Commit.

No screen layout code should be patched before the layout map is approved.

## Patch Request Template

Use this exact format when asking Codex or Claude Code for a patch:

```txt
POLYWORDS PATCH REQUEST

Lane:
Visual / Gameplay / Content / Bugfix / Docs

Goal:
[One sentence only]

Allowed files:
- path/file.tsx
- path/file.ts

Forbidden:
- Do not change scoring.
- Do not change swipe grammar.
- Do not touch huntData.json.
- Do not change navigation.
- Do not change Daily Challenge.

Source of truth:
- CLAUDE.md
- CONTEXT.md
- docs/WORKFLOW.md
- [specific approved mockup or doc]

Acceptance checklist:
- Visual behavior:
- Gameplay behavior:
- Edge case:
- Device sanity:

Required verification:
- Run: npx.cmd tsc --noEmit
- Report changed files.
- Report whether any forbidden files changed.

Stop condition:
If this requires touching files outside the allowed list, stop and explain before editing.
```

## Required Verification

After every code patch:

```bash
npx.cmd tsc --noEmit
```

Also check:

```bash
git diff --check
git status --short
```

## Commit Rule

Only commit after:

- TypeScript passes.
- Device sanity test is clean.
- Changed files match the allowed file list.
- No forbidden systems were touched.

## Scope Creep Rule

If a task starts growing tentacles, stop.

Split it into smaller patches.
