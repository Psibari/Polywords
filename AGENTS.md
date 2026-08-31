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

## Product Locks

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
- The in-round book is the **Polybook**. The **Vault** is the player's archive and never
  Polly's cage, lair, or property.

## Polly and Visual Locks

- Polly is a smug opponent and trap-setter, not a friendly mascot or word owner.
- Live Polly uses transparent pose images with whole-image motion for most poses. Pete
  approved reviving the layered face rig on 2026-08-27; it is now live on Home, Daily, and
  Results while she's settled in her idle/smug pose (a fresh implementation cut from
  `sprite4.png`, not a reactivation of the old dead assets under `assets/images/polly/rig/`,
  which remain dormant and unapproved). The Hunt perch and every non-idle pose still render
  flat art. See CLAUDE.md's Presentation and Character section for the current detail.
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
- Canonical Daily authoring content is the 60-word locked workbook at
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
- After code/tooling changes: `npx.cmd tsc --noEmit`, relevant tests, `git diff --check`,
  and `git status --short`. Docs-only changes require the two Git checks plus a reference scan.
- Report device/native validation separately from static checks.
- Commit, push, merge, or alter stashes only with explicit approval.

## Key Owners

- Entry/navigation: `App.tsx`
- Screens: `app/screens/`
- Hunt: `app/game/huntGenerator.ts`, `app/game/polyRunEngine.ts`
- Daily: `app/game/dailyChallengeEngine.ts`, `app/game/dailyPool.ts`
- State: `app/store/useGameStore.ts`
- Gestures/presentation: `app/components/MaskBoard.tsx`, `app/components/SwipeMask.tsx`
- Theme/materials: `app/ui/`
