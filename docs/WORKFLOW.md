# POLYWORDS Workflow

## Before Editing

1. Read `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, and the focused source. Run `npm run state`
   for live content counts and the content pickup marker; docs never carry those numbers.
2. Verify the branch, worktree, live owner, and any code/doc conflict.
3. Define one coherent goal and the smallest safe file scope.

Do not smuggle gameplay/content changes into visual work. Preserve unrelated changes, stashes,
credentials, and generated/local files.

## Verification

```powershell
npx.cmd tsc --noEmit
npm.cmd test                 # game logic or broad regression
git diff --check
git status --short
```

Docs-only work requires both Git checks and a broken-reference scan. Static checks do not prove
native animation, audio, gestures, or layout; report device coverage separately.

## Completion

Report changed files, checks, deferred risk, and any incomplete native validation. Commit, push,
merge, or touch stashes only after explicit approval.
