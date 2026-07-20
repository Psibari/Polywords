# POLYWORDS Workflow

## Before Editing

1. Read `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, and the focused source doc.
2. Name the task lane: visual, gameplay, content, bugfix, or docs/tooling.
3. Define the smallest file scope and protect unrelated working-tree changes.

Visual layout changes need an approved direction before implementation. Gameplay and
content changes must not be smuggled into visual polish.

## Patch Rules

- One coherent goal per patch.
- Prefer the existing owner/choke point over new parallel abstractions.
- Do not change scoring, navigation, swipe grammar, or live content unless requested.
- If required work exceeds the agreed scope, stop and report why.
- Never expose credentials or commit `.env`, generated CSVs, workspaces, or `dist`.

## Verification

Code/tooling:

```powershell
npx.cmd tsc --noEmit
npm.cmd test                 # when game logic changes
git diff --check
git status --short
```

Docs-only work requires the two git checks. Report commands honestly; device-only
behavior is not verified until it is tested on device.

## Completion

- Confirm changed files match the requested scope.
- Summarize behavior, verification, and anything intentionally deferred.
- Commit or push only after explicit approval.
