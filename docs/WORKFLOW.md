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
coverage separately.

Physical-iPhone iteration uses the dedicated **POLYWORDS DEV** development client, not Expo Go and
not the TestFlight/production app. Make sure the local checkout contains the commit being tested,
then run from Git Bash:

```bash
APP_VARIANT=development npx expo start --dev-client
```

Add `-c` only when Metro's cache needs clearing. Open POLYWORDS DEV on the phone or use its dev
QR/server entry. The production bundle ID remains separate. Rebuild the dev client only when native
dependencies, native config, or the Expo SDK changes; ordinary JS/TS/assets iterate through Metro.
Use TestFlight for release-candidate and production-native verification, not routine UI/gameplay
checks. The registered iPhone and iOS Developer Mode are one-time prerequisites for the internal
development build.

## Completion

Report changed files, checks, deferred risk, and any incomplete native validation. Commit, push,
merge, or touch stashes only after explicit approval.
