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

Tests run on Node 24, as CI does (one suite fails on Node 22 with `ERR_REQUIRE_CYCLE_MODULE`).
Docs-only work requires both Git checks and a broken-reference scan.

Static checks and the browser preview do not prove native animation, audio, gestures, stacking
or layout; several bugs have shown only on the phone (`CLAUDE.md`, Native rules). Report device
coverage separately. To test on the phone, the machine serving Expo must `git pull` the branch
first, then run `npx expo start --clear`; the phone runs the local checkout, not GitHub.

## Completion

Report changed files, checks, deferred risk, and any incomplete native validation. Commit, push,
merge, or touch stashes only after explicit approval.
