# POLYWORDS Agent Instructions

## Read Order

Before changing the repository, read:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. The focused source for the task:
   - Hunt/gameplay: `docs/GAME_REFERENCE.md`
   - pacing: `docs/GOLDEN_PACING_SYSTEM.md`
   - content: `docs/CONTENT_WRITING_STANDARD.md`
   - Daily: `docs/DAILY_CHALLENGE_SPEC.md`
   - Polly copy: `docs/POLLY_DIALOGUE_BANK.md`
   - workflow: `docs/WORKFLOW.md`

Authority is: current user request, this file, focused source, `CLAUDE.md`, then
`CONTEXT.md`. Report conflicts instead of blending them.

## Product Locks

- POLYWORDS is a recognition game: the desired reaction is “Wait… Oh. Right.”
- Home / Play / Vault / Settings are the main tabs. Active gameplay is nav-free.
- Hunt: UP claims a REAL; RIGHT rejects a trap. No left swipe or tap-submit.
- Daily is UP-only. Do not apply Hunt’s RIGHT gesture to Daily.
- Ordinary tiles must not reveal truth, rarity, or importance before commitment.
- Do not change scoring, swipe grammar, `SwipeMask`, boss rules, or persistence
  without an explicit request.
- Hunt has 10 rounds. Round 10 is Polly’s Word; a Returning Haunt uses Round 8.
- The Master Gate is removed. Do not restore its UI or logic.
- Vault is the player’s archive. Never present it as Polly’s cage or lair.

## Polly and Visual Locks

- Polly is a smug opponent and trap-setter, not a friendly mascot or word owner.
- Live Polly uses transparent pose images and whole-image motion. Do not revive the
  deleted rig, flipbook, or legacy animator.
- `BINGO BANGO ZZZZINGO!` is system text, never Polly dialogue.
- Palette: background `#1A1830`, deep dark `#0F0D2A`, gold `#F5C842`, purple
  `#7B2D8B`, rose `#9B2D6B`, Polly green `#4CAF50`, wrong flash `#CC2200`, white
  `#FFFFFF`.
- No orange UI, pink/magenta, green UI outside Polly, or red outside wrong feedback.
- Gold should remain a scarce focus color.

## Content and Tools

- `docs/CONTENT_WRITING_STANDARD.md` exclusively governs REALS, traps, masks, and
  editorial approval. Do not duplicate its rules elsewhere.
- `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` is the tracked editorial master; it is
  not imported by gameplay.
- `assets/data/huntData.v2.json` is dormant editorial data. Never wire it into the app
  without approval.
- `tools/content/mask-rewriter/` is local editorial tooling. Keep `.env`, generated
  CSVs, workspace data, and `dist` untracked. Never expose API keys.

## Workflow

- Keep patches scoped and preserve unrelated user changes.
- Do not run full content generation or `npm audit fix` unless asked.
- After code/tooling changes run `npx.cmd tsc --noEmit`, relevant tests,
  `git diff --check`, and `git status --short`.
- Docs-only work requires at least the two git checks.
- Commit or push only when explicitly asked.
- Never pop, drop, or clear stashes unless instructed by name.

## Build and Verification

- Use `npm.cmd install` once to restore dependencies.
- Use `npm.cmd run typecheck` or `npx.cmd tsc --noEmit` for TypeScript validation.
- Use `npm.cmd test` for gameplay and logic changes.
- Use `git diff --check` and `git status --short` before claiming completion.

## Key Files and Boundaries

- App entry: `App.tsx`
- Game screens: `app/screens/{Game,Home,Vault,Settings,DailyChallenge,Results}Screen.tsx`
- Hunt gameplay core: `app/game/{huntGenerator,polyRunEngine,dailyChallengeEngine}.ts`
- Persisted state: `app/store/useGameStore.ts`
- Live content: `assets/data/huntData.json`
- Editorial master: `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx`
- Polly assets: `assets/images/polly/poses/*.png`
- UI layout/animation key surfaces: `app/components/MaskBoard.tsx`, `app/components/SwipeMask.tsx`

## Project Notes

- Active branch: `play-screen-overhaul`; do not merge to `main` without approval.
- Navigation is Home / Play / Vault / Settings, plus Daily; active gameplay is nav-free.
- Hunt uses UP to claim a REAL and RIGHT to reject a trap; Daily is UP-only.
- Do not change swipe grammar, scoring, boss rules, or persistence without explicit request.
- Do not wire `assets/data/huntData.v2.json` into gameplay without approval.
- Preserve the live app palette and Polly treatment rules from `CLAUDE.md` and `AGENTS.md`.
