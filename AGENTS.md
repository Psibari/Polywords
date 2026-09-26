# POLYWORDS Agent Instructions

## Authority and Read Order

For repository changes, read `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, then the focused
source below. Runtime code and data outrank documentation when describing current behavior.

| Task | Focused source |
| --- | --- |
| Hunt/gameplay | `docs/GAME_REFERENCE.md` |
| pacing | `docs/GOLDEN_PACING_SYSTEM.md` |
| Hunt content | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily gameplay/rules | `docs/DAILY_CHALLENGE_SPEC.md` |
| Daily content/editorial writing | `docs/DAILY_CONTENT_WRITING_STANDARD.md` |
| Polly copy | `docs/POLLY_DIALOGUE_BANK.md` |
| workflow | `docs/WORKFLOW.md` |

Authority: current user request > this file > focused source > `CLAUDE.md` > `CONTEXT.md`.
Report conflicts; never blend them silently.

Branches: `play-screen-overhaul` is the main working branch. `daily-castle-test` exists only
to rebuild the Daily Challenge and merges back through a PR. `main` is stale. Details and
open work are in `CONTEXT.md`.

## Product Locks

Ruling: only two things are permanently locked — the swipe grammar (UP claims a real meaning,
RIGHT rejects a trap) and the premise (one word, many real meanings, convincing traps).
Everything else below, and everything any other doc calls "locked", is current best thinking
and reopenable with a request. Treat those as "do not change casually", not "never change".

- POLYWORDS creates recognition: “Wait… Oh. Right.”, not vocabulary instruction.
- Home / Play / Vault / Settings are the main surfaces; active gameplay is nav-free.
- Hunt: UP claims a REAL; RIGHT rejects a trap. No left swipe or tap-submit.
- Daily is UP-only. Never apply Hunt's RIGHT gesture to Daily.
- Ordinary choices never reveal truth, rarity, or value before commitment.
- Standard Hunts have 10 rounds; the first three fledgling runs have 8. Polly's Word is
  always the final round. A Returning Haunt occupies round 5 standard / round 4 fledgling.
- Boss outcome comes from the hidden gauntlet, not score. The Master Gate is removed.
- Do not change scoring, swipe grammar, boss rules, persistence, or `SwipeMask` without an
  explicit request. `MaskBoard.tsx` and `SwipeMask.tsx` require a focused war-room pass.
- The **Vault** route is the player's archive and never Polly's cage, lair, or property.
  CONFLICT for Pete: `docs/POLYBOOK.md` (2026-09-07) makes the Polybook Polly's diary, which the player reads; older locks call this screen the player's Polly-free archive. The in-round book's spine also reads POLYBOOK; that naming collision
  is open too.
- The Vault and the Polybook may never display a meaning, a trap or a hidden pair. Words
  recur — `huntGenerator.ts` mixes mastered words back into the tension and panic pools
  flagged `isMasteredReturn` — so any such display is an answer key for a game still in
  progress. Counts, status and titles only.

## Polly and Visual Locks

- Polly is a smug opponent and trap-setter, not a friendly mascot or word owner.
- Live Polly uses transparent pose images with whole-image motion. The layered face rig
  (cut from `sprite4.png`) is live on Home, Daily and Results while she is settled in her
  idle pose; everything else is flat art. The old `assets/images/polly/rig/` stays dead.
  Detail in `CLAUDE.md`'s Polly section.
- `BINGO BANGO ZZZZINGO!` is unassigned system text, never Polly dialogue.
- Locked palette: `#1A1830`, `#0F0D2A`, `#F5C842`, `#7B2D8B`, `#9B2D6B`, Polly green
  `#4CAF50`, wrong red `#CC2200`, and white. No orange UI, pink/magenta, green outside
  Polly, or red outside wrong feedback. Gold remains scarce.

## Content Boundaries

- `docs/CONTENT_WRITING_STANDARD.md` exclusively governs Hunt REALS, traps, hidden content,
  and editorial approval.
- `docs/DAILY_CONTENT_WRITING_STANDARD.md` exclusively governs writing and auditing Daily
  Challenge content. Do not apply Hunt-only editorial doctrine to Daily.
- Live Hunt content is `assets/data/huntData.json`; the tracked editorial workbook is
  `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx` and never updates runtime automatically.
- Canonical Daily authoring content is the locked workbook at
  `workbooks/POLYWORDS_Daily_Challenge_60_LOCKED_2026-08-28.xlsx`; `STAGE` is included and
  `SENTENCE` is excluded. `app/game/dailyPool.ts` is its approved runtime representation.
- `assets/data/huntData.v2.json` is dormant. Do not wire it into gameplay.
- `tools/content/_deprecated/mask-rewriter/` is retired and must not be revived.
- `.agents/skills/polywords-master-director/` is the version-controlled product skill.
  Do not create another copy of the content doctrine.

## Workflow

- Keep patches scoped; preserve unrelated changes and every stash.
- Do not run full content generation, destructive rebuilds, or `npm audit fix` unless asked.
- Use `apply_patch` for manual file edits. Never expose credentials or commit `.env`, caches,
  generated CSVs, workspaces, or `dist`.
- Never write a content count into a doc. `npm run state` prints them live; a written count
  rots the day content ships.
- After code/tooling changes: `npx.cmd tsc --noEmit`, relevant tests, `git diff --check`,
  and `git status --short`. Docs-only changes require the two Git checks plus a reference scan.
- Report device/native validation separately from static checks.
- Commit, push, merge, or alter stashes only with explicit approval.

## Key Owners

- Entry/navigation: `App.tsx`
- Screens: `app/screens/`
- Hunt: `app/game/huntGenerator.ts`, `app/game/polyRunEngine.ts`
- Daily rules/content: `app/game/dailyChallengeEngine.ts`, `app/game/dailyPool.ts`
- Daily castle: `app/components/DailyCastleStage.tsx`, `app/ui/dailyCastleScene.ts`,
  art scripts in `tools/art/`
- State: `app/store/useGameStore.ts`
- Gestures/presentation: `app/components/MaskBoard.tsx`, `app/components/SwipeMask.tsx`
- Theme/materials: `app/ui/`
